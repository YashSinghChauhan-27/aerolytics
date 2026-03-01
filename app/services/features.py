# app/services/features.py

import pandas as pd
from pathlib import Path
from app.config import ENCODER_LENGTH
BUFFER_DIR = Path("app/data/buffers")


def load_and_merge(city: str) -> pd.DataFrame:
    city_key = city.lower()

    pol_path = BUFFER_DIR / f"{city_key}_pollution.csv"
    wea_path = BUFFER_DIR / f"{city_key}_weather.csv"

    if not pol_path.exists() or not wea_path.exists():
        raise FileNotFoundError("Pollution or weather buffer missing")

    pol = pd.read_csv(pol_path, parse_dates=["Datetime"])
    wea = pd.read_csv(wea_path, parse_dates=["Datetime"])

    # -------------------------
    # Convert to IST safely
    # -------------------------
    if pol["Datetime"].dt.tz is None:
        pol["Datetime"] = pol["Datetime"].dt.tz_localize("UTC")
        
    pol["Datetime"] = (
        pol["Datetime"]
        .dt.tz_convert("Asia/Kolkata")
        .dt.tz_localize(None)
    )
    
    wea["Datetime"] = pd.to_datetime(wea["Datetime"])
    if wea["Datetime"].dt.tz is None:
        wea["Datetime"] = wea["Datetime"].dt.tz_localize("UTC")
        
    wea["Datetime"] = (
        wea["Datetime"]
        .dt.tz_convert("Asia/Kolkata")
        .dt.tz_localize(None)
    )

    pol = pol.sort_values("Datetime")
    wea = wea.sort_values("Datetime")

    # 🔥 STEP 1: Force HOURLY pollution grid
    pol = (
        pol
        .set_index("Datetime")
        .resample("1H")
        .mean()
    )

    # 🔥 STEP 2: Interpolate All Pollutants
    # We apply this to PM2.5 and any co-pollutants present
    pollutants = ["PM2_5", "PM10", "NO2", "CO", "O3"]
    
    for col in pollutants:
        if col in pol.columns:
            pol[col] = pol[col].interpolate(
                method="time",
                limit=6,          # allow up to 6h gaps
                limit_direction="both"
            )

    pol = pol.reset_index()

    # -------------------------
    # ASOF merge with weather
    # -------------------------
    df = pd.merge_asof(
        pol,
        wea,
        on="Datetime",
        direction="backward",
        tolerance=pd.Timedelta("4D")
    )

    # 🔥 STEP 3: Fill weather safely
    weather_cols = [
        "Temperature_2m_C",
        "Relative_Humidity_%",
        "Wind_Speed_10m",
        "Surface_Pressure_hPa",
        "Total_Precipitation_mm",
    ]
    df[weather_cols] = df[weather_cols].ffill().bfill()
    
    # Validation: specific fill for precipitation if verified empty
    if df["Total_Precipitation_mm"].isna().all():
        df["Total_Precipitation_mm"] = 0.0
    else:
        df["Total_Precipitation_mm"] = df["Total_Precipitation_mm"].fillna(0.0)

    # 🔥 FINAL: drop remaining gaps
    # df = df.dropna().reset_index(drop=True)

    return df




def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["hour"] = df["Datetime"].dt.hour
    df["dayofweek"] = df["Datetime"].dt.dayofweek
    df["month"] = df["Datetime"].dt.month
    df["is_weekend"] = df["dayofweek"].isin([5, 6]).astype(int)

    df["PM2_5_lag_1"] = df["PM2_5"].shift(1)
    df["PM2_5_lag_6"] = df["PM2_5"].shift(6)
    df["PM2_5_lag_24"] = df["PM2_5"].shift(24)

    df["PM2_5_roll_mean_6"] = df["PM2_5"].rolling(6, min_periods=3).mean()
    df["PM2_5_roll_mean_24"] = df["PM2_5"].rolling(24, min_periods=12).mean()
    df["PM2_5_roll_std_6"] = df["PM2_5"].rolling(6, min_periods=3).std()
    df["PM2_5_roll_std_24"] = df["PM2_5"].rolling(24, min_periods=12).std()



    df["Wind_U_10m"] = df["Wind_Speed_10m"]
    df["Wind_V_10m"] = 0.0

    # -------------------------
    # 🔥 MISSING CO-POLLUTANTS
    # -------------------------
    # -------------------------
    # 🔥 MISSING CO-POLLUTANTS
    # -------------------------
    for col in ["PM10", "NO2", "CO", "O3"]:
        if col not in df.columns:
            df[col] = 0.0
        else:
            df[col] = df[col].fillna(0.0)

    # -------------------------
    # 🩹 FIX: Handle Missing Lags (Don't drop recent rows!)
    # -------------------------
    # If there's a gap, Lag 24 might be NaN. 
    # If we dropna(), we lose the 'current' row which has valid PM2.5 but missing history.
    # We must fill lags to keep the row.
    
    # Fill lags with Lag 1 (Persistence) or 0 if even lag1 is missing (start of file)
    lag_cols = [
        "PM2_5_lag_1", "PM2_5_lag_6", "PM2_5_lag_24",
        "PM2_5_roll_mean_6", "PM2_5_roll_mean_24",
        "PM2_5_roll_std_6", "PM2_5_roll_std_24"
    ]
    
    # Simple fallback: ffill then fill with 0? 
    # Or strict: fill with current PM2.5?
    # shift(1) aligns with previous row.
    # If lag_24 is NaN, it means 24h ago is missing.
    # We can assume it was same as Lag 1.
    
    for col in lag_cols:
        if col in df.columns:
            # First try to fill with PM2.5 (current) - essentially assuming extensive persistence
            # But wait, Lag features are 'past' features.
            # Using current PM2_5 leaks target?
            # For INFERENCE, we know current PM2_5 (it's the last observed).
            # The model predicts t+1.
            # The 'df' here is the Encoder context.
            # So leaking current PM2.5 into Lag 24 of current row is fine (it just says "24h ago was like now").
            df[col] = df[col].fillna(df["PM2_5"])
            
    # Finally drop only if criticals are still missing (unlikely after fill)
    df = df.dropna().reset_index(drop=True)
    return df



def get_tft_input(city: str) -> pd.DataFrame:
    df = load_and_merge(city)
    df = engineer_features(df)

    if len(df) < ENCODER_LENGTH:
        raise ValueError(
            f"Insufficient data for TFT: need {ENCODER_LENGTH}, got {len(df)}"
        )

    # 🔑 EXACT encoder window only
    return df.tail(ENCODER_LENGTH).reset_index(drop=True)

