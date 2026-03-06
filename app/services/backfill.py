import os
import sys
import pandas as pd
import requests

# Add root dir to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.config import CITY_CONFIG, BUFFER_DIR

def backfill_city(city_key: str, cfg: dict) -> pd.DataFrame:
    lat = cfg["lat"]
    lon = cfg["lon"]
    
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&past_days=2&forecast_days=1&timezone=GMT"
    
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    data = resp.json()["hourly"]
    
    df = pd.DataFrame(data)
    
    # Rename columns
    df = df.rename(columns={
        "time": "Datetime",
        "pm2_5": "PM2_5",
        "pm10": "PM10",
        "nitrogen_dioxide": "NO2",
        "carbon_monoxide": "CO",
        "ozone": "O3"
    })
    
    # Convert Datetime to UTC aware
    df["Datetime"] = pd.to_datetime(df["Datetime"]).dt.tz_localize("UTC")
    
    # Filter out future hours
    current_utc = pd.Timestamp.now(tz="UTC")
    df = df[df["Datetime"] <= current_utc]

    # Fill NaNs with 0
    df = df.fillna(0.0)
    
    # Reorder
    cols = ["Datetime", "PM2_5", "PM10", "NO2", "CO", "O3"]
    df = df[cols]
    
    buffer_path = BUFFER_DIR / f"{city_key}_pollution.csv"
    df.to_csv(buffer_path, index=False)
    print(f"✅ Backfilled {city_key} ({len(df)} rows)")
    return df

def backfill():
    print("🧹 Starting backfill of 48 hours of pollution data for all cities...")
    
    for city_key, cfg in CITY_CONFIG.items():
        try:
            backfill_city(city_key, cfg)
        except Exception as e:
            print(f"❌ Failed to backfill {city_key}: {e}")

if __name__ == "__main__":
    backfill()
