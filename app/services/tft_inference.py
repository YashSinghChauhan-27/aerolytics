import pandas as pd
from pytorch_forecasting import TimeSeriesDataSet
from pytorch_forecasting.data import GroupNormalizer
from app.models.tft_loader import tft_model

ENCODER_LENGTH = 24
PREDICTION_LENGTH = 1


from functools import lru_cache
from app.services.features import get_tft_input

@lru_cache(maxsize=8)
def get_cached_forecast(city: str, steps: int = 24):
    df = get_tft_input(city)
    return predict_horizon(df, city, steps)

def predict_horizon(df: pd.DataFrame, city: str, steps: int = 24):
    """
    df MUST contain at least 25 rows (24 encoder + 1 prediction)
    Predicts 'steps' hours into the future.
    """

    df = df.copy()
    df["City"] = city

    # 🔑 EXACTLY as training
    df["time_idx"] = df.groupby("City").cumcount()

    # ----------------------------
    # 🩹 FIX: Append dummy row for prediction step
    # ----------------------------
    # TFT requires (encoder_length + prediction_length) context at inference time
    # We have 24 rows (encoder), we need 25 (encoder + 1 prediction)
    if len(df) == ENCODER_LENGTH:
        last_row = df.iloc[-1].copy()
        last_row["Datetime"] = last_row["Datetime"] + pd.Timedelta(hours=1)
        last_row["time_idx"] += 1
        
        # Update time-varying knowns
        last_row["hour"] = last_row["Datetime"].hour
        last_row["dayofweek"] = last_row["Datetime"].dayofweek
        last_row["month"] = last_row["Datetime"].month
        last_row["is_weekend"] = 1 if last_row["dayofweek"] >= 5 else 0
        
        # Append safely
        df = pd.concat([df, last_row.to_frame().T], ignore_index=True)

    df["time_idx"] = df["time_idx"].astype(int)

    # 🔎 DEBUG
    # df.to_csv("debug_tft_input.csv", index=False)
    # print("DEBUG INPUT ROWS:", len(df))
    # print("DEBUG time_idx range:", df["time_idx"].min(), "-", df["time_idx"].max())

    # ----------------------------
    # 1️⃣ Create BASE dataset
    # ----------------------------
    base_dataset = TimeSeriesDataSet(
        df,
        time_idx="time_idx",
        target="PM2_5",
        group_ids=["City"],
        max_encoder_length=ENCODER_LENGTH,
        max_prediction_length=PREDICTION_LENGTH,

        time_varying_known_reals=[
            "time_idx",
            "hour",
            "dayofweek",
            "month",
            "is_weekend",
        ],

        time_varying_unknown_reals=[
            "PM2_5",
            # Pollution memory
            "PM2_5_lag_1",
            "PM2_5_lag_6",
            "PM2_5_lag_24",
            "PM2_5_roll_mean_6",
            "PM2_5_roll_mean_24",
            "PM2_5_roll_std_6",
            "PM2_5_roll_std_24",

            # Co-pollutants
            "PM10",
            "NO2",
            "CO",
            "O3",

            # Climate
            "Temperature_2m_C",
            "Relative_Humidity_%",
            "Wind_U_10m",
            "Wind_V_10m",
            "Wind_Speed_10m",
            "Surface_Pressure_hPa",
            "Total_Precipitation_mm",
        ],

        target_normalizer=GroupNormalizer(groups=["City"]),
        add_relative_time_idx=True,
        add_target_scales=True,
        add_encoder_length=True,
    )

    # ----------------------------
    # 2️⃣ Recursive Prediction Loop (24 Hours)
    # ----------------------------
    forecast_rows = []
    
    # We need to predict 24 steps into the future
    # In each step, we use the prediction from the previous step as "truth" for autoregression
    
    current_df = df.copy()
    
    for i in range(steps):
        # --- A. Prepare Input for Step i ---
        # Ensure we have the dummy row at the end (for the target we are about to predict)
        # If this is the first iteration, we already added it above (maybe).
        # Actually, let's just make sure the last row represents the "unknown" future step.
        
        # Determine the timestamp of the row we want to predict
        last_known_idx = len(current_df) - 1
        target_time = current_df.iloc[last_known_idx]["Datetime"]
        
        # --- B. Create Dataset ---
        # We only need the last sequence to predict ONE step
        # But TimeSeriesDataSet logic requires the full context
        
        # Create dataset from current history
        predict_dataset = TimeSeriesDataSet.from_dataset(
            base_dataset,
            current_df,
            predict=True,
            stop_randomization=True
        )
        
        loader = predict_dataset.to_dataloader(
            train=False,
            # We only care about the very last sequence which generates the next prediction
            batch_size=1, 
            num_workers=0
        )
        
        # --- C. Predict ---
        # preds shape: [batch=1, prediction_length=1, quantiles=3]
        preds = tft_model.predict(loader, mode="quantiles")
        
        p10 = preds[0, 0, 0].item()
        p50 = preds[0, 0, 1].item()
        p90 = preds[0, 0, 2].item()
        
        # --- D. Store Result ---
        forecast_rows.append({
            "Datetime": target_time,
            "PM2_5_p10": p10,
            "PM2_5_p50": p50,
            "PM2_5_p90": p90
        })
        
        # --- E. Update DataFrame for Next Step ---
        # We fill the "current" target row with the P50 prediction so it becomes history
        current_df.at[last_known_idx, "PM2_5"] = p50
        
        # Now append a NEW dummy row for the NEXT hour
        next_time = target_time + pd.Timedelta(hours=1)
        next_row = current_df.iloc[last_known_idx].copy()
        
        next_row["Datetime"] = next_time
        next_row["time_idx"] += 1
        
        # Update time features
        next_row["hour"] = next_time.hour
        next_row["dayofweek"] = next_time.dayofweek
        next_row["month"] = next_time.month
        next_row["is_weekend"] = 1 if next_row["dayofweek"] >= 5 else 0
        
        # ----------------------------
        # 🩹 CRITICAL FIX: Smart Lag Lookup
        # ----------------------------
        # Instead of getting iloc[-6] or iloc[-24] which might be days ago if there are gaps,
        # we try to find the EXACT timestamp needed.
        
        # Helper to find value at timestamp
        def get_val_at(dt, fallback):
            # Check if dt exists in current_df
            # We can use the last few rows to search
            # Convert series to generic lookup if needed, but linear scan on small DF is fine
            rows = current_df[current_df["Datetime"] == dt]
            if not rows.empty:
                return rows.iloc[0]["PM2_5"]
            return fallback

        # Lag 1 (Always available as just calculated/observed)
        lag1_val = current_df.iloc[-1]["PM2_5"]
        next_row["PM2_5_lag_1"] = lag1_val
        
        # Lag 6
        target_lag6 = next_time - pd.Timedelta(hours=6)
        next_row["PM2_5_lag_6"] = get_val_at(target_lag6, fallback=lag1_val)

        # Lag 24
        target_lag24 = next_time - pd.Timedelta(hours=24)
        next_row["PM2_5_lag_24"] = get_val_at(target_lag24, fallback=lag1_val)

        # Rolling Stats
        # For rolling means, we ideally want the last N hours. 
        # If there are gaps, 'tail(6)' might return a mix of today and 2 days ago.
        # Ideally we filter for time window.
        
        cutoff_6 = next_time - pd.Timedelta(hours=6)
        cutoff_24 = next_time - pd.Timedelta(hours=24)
        
        # Get strictly recent data
        valid_history = current_df[current_df["Datetime"] > cutoff_24] # optimization
        
        # Roll 6
        # We need values in (next_time - 6h, next_time]
        # Since next_row is t+1, we want window ending at t.
        # i.e. (next_time - 7h, next_time - 1h]? 
        # Actually standard rolling is 'window ending at index'.
        # So for t+1, we want window of size 6 ending at t.
        # Window: [t-5, t]
        # Timestamps: [next_time-6h, next_time-1h] (approximated)
        
        # Let's simple-slice by time
        recent_6_df = current_df[current_df["Datetime"] >= cutoff_6]
        if not recent_6_df.empty:
             next_row["PM2_5_roll_mean_6"] = recent_6_df["PM2_5"].mean()
             next_row["PM2_5_roll_std_6"] = recent_6_df["PM2_5"].std() if len(recent_6_df) > 1 else 0.0
        else:
             next_row["PM2_5_roll_mean_6"] = lag1_val
             next_row["PM2_5_roll_std_6"] = 0.0

        # Roll 24
        recent_24_df = current_df[current_df["Datetime"] >= cutoff_24]
        if not recent_24_df.empty:
             next_row["PM2_5_roll_mean_24"] = recent_24_df["PM2_5"].mean()
             next_row["PM2_5_roll_std_24"] = recent_24_df["PM2_5"].std() if len(recent_24_df) > 1 else 0.0
        else:
             next_row["PM2_5_roll_mean_24"] = lag1_val
             next_row["PM2_5_roll_std_24"] = 0.0

        # Set Target to 0.0 (Unknown)
        next_row["PM2_5"] = 0.0 
        
        current_df = pd.concat([current_df, next_row.to_frame().T], ignore_index=True)
        current_df["time_idx"] = current_df["time_idx"].astype(int)

    # ----------------------------
    # 4️⃣ Output
    # ----------------------------
    forecast = pd.DataFrame(forecast_rows)
    return forecast
