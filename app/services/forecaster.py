
import json
import logging
import pandas as pd
from pathlib import Path
from datetime import datetime
import traceback

from app.config import CITY_CONFIG, BUFFER_DIR
from app.services.pollution import update_pollution_buffer
from app.services.weather import update_weather_buffer
# NOTE: get_tft_input and predict_horizon are imported lazily inside update_all_forecasts()
# to avoid loading the TFT model at startup (which blocks uvicorn's HTTP event loop).

# Setup logging
logger = logging.getLogger(__name__)

FORECAST_DIR = BUFFER_DIR.parent / "forecasts"
FORECAST_DIR.mkdir(parents=True, exist_ok=True)

def get_forecast_path(city: str) -> Path:
    return FORECAST_DIR / f"{city.lower()}_forecast.json"

def update_forecast_cache(city: str):
    """
    Runs the full inference pipeline for a city and saves the result to disk.
    """
    try:
        # 1. Update underlying data buffers
        # We wrap these in try-except blocks to avoid failing the whole process if one data source fails
        try:
            update_pollution_buffer(city)
        except Exception as e:
            logger.error(f"Failed to update pollution for {city}: {e}")
            
        try:
            update_weather_buffer(city)
        except Exception as e:
             logger.error(f"Failed to update weather for {city}: {e}")

        # 2. Prepare Features
        # Lazy import: only load TFT model when the job actually runs (in background thread)
        from app.services.features import get_tft_input
        from app.services.tft_inference import predict_horizon
        df = get_tft_input(city)
        
        # 3. Run Inference
        # We predict 48 hours to be safe, though UI might use less
        forecast_df = predict_horizon(df, city, steps=48)
        
        # 4. Save to JSON
        # Convert Dataframe to list of dicts with ISO timestamps
        results = []
        for _, row in forecast_df.iterrows():
            results.append({
                "Datetime": row["Datetime"].isoformat(),
                "PM2_5_p10": row["PM2_5_p10"],
                "PM2_5_p50": row["PM2_5_p50"],
                "PM2_5_p90": row["PM2_5_p90"]
            })
            
        output_path = get_forecast_path(city)
        with open(output_path, "w") as f:
            json.dump({
                "city": city,
                "generated_at": datetime.utcnow().isoformat(),
                "forecast": results
            }, f, indent=2)
            
        print(f"✅ [FORECASTER] Cached forecast for {city}")
        return True

    except Exception as e:
        print(f"❌ [FORECASTER] Failed {city}: {e}")
        traceback.print_exc()
        return False

def update_all_forecasts():
    """
    Iterates through all cities and updates their forecast cache.
    """
    print("🚀 [FORECASTER] Starting background forecast update for all cities...")
    cities = sorted(list(CITY_CONFIG.keys()))
    
    success_count = 0
    for city in cities:
        if update_forecast_cache(city):
            success_count += 1
            
    print(f"🏁 [FORECASTER] Completed. Success: {success_count}/{len(cities)}")

