# app/services/pipeline.py

import pandas as pd

from app.services.weather import update_weather_buffer
from app.services.features import get_tft_input
from app.services.tft_inference import predict_next_24h
from app.config import BUFFER_DIR


MIN_REQUIRED_ROWS = 30   # safe margin for lags + rolling stats


def run_prediction_pipeline(city: str):
    city_key = city.lower()

    # ----------------------------
    # 1️⃣ Check pollution buffer
    # ----------------------------
    pollution_path = BUFFER_DIR / f"{city_key}_pollution.csv"
    if not pollution_path.exists():
        raise RuntimeError("No pollution data collected yet")

    pol_df = pd.read_csv(pollution_path, parse_dates=["Datetime"])

    if len(pol_df) < MIN_REQUIRED_ROWS:
        raise RuntimeError(
            f"Insufficient pollution data: {len(pol_df)} rows "
            f"(need at least {MIN_REQUIRED_ROWS})"
        )

    # ----------------------------
    # 2️⃣ Update weather buffer (ON DEMAND)
    # ----------------------------
    update_weather_buffer(city)

    # ----------------------------
    # 3️⃣ Prepare TFT encoder input
    # ----------------------------
    encoder_df = get_tft_input(city)

    # ----------------------------
    # 4️⃣ Predict next 24 hours
    # ----------------------------
    forecast = predict_next_24h(encoder_df, city)

    return {
        "city": city,
        "last_observed_pm25": float(encoder_df["PM2_5"].iloc[-1]),
        "forecast": forecast.to_dict(orient="records")
    }
