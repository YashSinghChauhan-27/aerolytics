# app/services/pollution.py

import requests
import pandas as pd
from pathlib import Path
from app.config import CITY_CONFIG, OPENAQ_API_KEY, BUFFER_DIR

HEADERS = {"X-API-Key": OPENAQ_API_KEY}



# Removed lru_cache to ensure fresh data on every call
def fetch_latest_pollutants(city: str):
    city = city.lower()
    if city not in CITY_CONFIG:
        raise ValueError(f"City not configured: {city}")

    cfg = CITY_CONFIG[city]
    location_id = cfg["location_id"]
    sensors = cfg.get("sensors", {})

    url = f"https://api.openaq.org/v3/locations/{location_id}/latest"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    results = resp.json()["results"]

    # Initialize with None
    data = {
        "PM2_5": None,
        "PM10": None,
        "NO2": None,
        "CO": None,
        "O3": None,
        "Datetime": None
    }
    
    # We need a common timestamp, ideally the latest one from any sensor
    latest_ts = None

    for item in results:
        sensor_id = item["sensorsId"]
        
        # Check which pollutant this sensor corresponds to
        for poll_name, cfg_id in sensors.items():
            if sensor_id == cfg_id:
                val = float(item["value"])
                
                # 🔄 Unit Conversions (Assumes source is PPB as per user)
                if poll_name == "NO2":
                    # ppb -> µg/m³ (approx factor 1.88)
                    val = round(val * 1.88, 3)
                elif poll_name == "CO":
                    # ppb -> µg/m³ (was mg/m³, corrected per user request)
                    # 1 ppb = 1.145 µg/m³
                    val = round(val * 1.145, 3)
                
                # 🛡️ SANITY CHECK: Pollution cannot be negative
                if val < 0:
                    val = 0.0

                data[poll_name] = val
                
                ts = pd.to_datetime(item["datetime"]["utc"])
                if latest_ts is None or ts > latest_ts:
                    latest_ts = ts
    
    if latest_ts is None:
        raise RuntimeError("No valid sensor data found")

    data["Datetime"] = latest_ts
    return data



def update_pollution_buffer(city: str, max_rows: int = 100):
    buffer_path = BUFFER_DIR / f"{city.lower()}_pollution.csv"

    new_data = fetch_latest_pollutants(city)
    
    # 🛡️ FAILOVER CHECK: If OpenAQ sensors freeze (e.g. data is >12h old), trigger Open-Meteo backfill
    now_utc = pd.Timestamp.now(tz="UTC")
    last_dt = pd.to_datetime(new_data["Datetime"])
    if last_dt.tz is None:
        last_dt = last_dt.tz_localize("UTC")
        
    if (now_utc - last_dt) > pd.Timedelta(hours=12):
        print(f"⚠️ [{city}] OpenAQ returned completely stale data ({last_dt}). Triggering Open-Meteo backfill...")
        try:
            from backfill_pollution import backfill_city
            from app.config import CITY_CONFIG
            df = backfill_city(city.lower(), CITY_CONFIG[city.lower()])
            return df
        except Exception as e:
            print(f"❌ [{city}] Open-Meteo fallback failed: {e}")

    new_row = pd.DataFrame([new_data])

    if buffer_path.exists():
        df = pd.read_csv(buffer_path, parse_dates=["Datetime"])
        
        # Ensure all columns exist in old buffer
        for col in ["PM2_5", "PM10", "NO2", "CO", "O3"]:
            if col not in df.columns:
                df[col] = None

        if new_data["Datetime"] in df["Datetime"].values:
            print(f"⚠️ [{city}] Duplicate timestamp: {new_data['Datetime']}. Skipping.")
            return df
        
        df = pd.concat([df, new_row])
    else:
        df = new_row

    df = (
        df.sort_values("Datetime")
          .drop_duplicates("Datetime")
          .tail(max_rows)
          .reset_index(drop=True)
    )

    # 🔄 Format & Rounding
    # Desired order: Datetime, PM2_5, PM10, NO2, CO, O3
    cols = ["Datetime", "PM2_5", "PM10", "NO2", "CO", "O3"]
    
    # Ensure all columns exist
    for c in cols:
        if c not in df.columns:
            df[c] = None

    df = df[cols]  # Reorder

    # Round numeric columns to 3 decimal places
    numeric_cols = ["PM2_5", "PM10", "NO2", "CO", "O3"]
    df[numeric_cols] = df[numeric_cols].round(3)

    df.to_csv(buffer_path, index=False)
    print(f"✅ [{city}] Updated buffer. Latest: {new_data['Datetime']}")
    return df

def get_latest_pollution_from_buffer(city: str):
    """
    Reads the latest pollution record from the local CSV buffer.
    Values are already converted and standardized.
    Returns None if buffer is missing or empty.
    """
    buffer_path = BUFFER_DIR / f"{city.lower()}_pollution.csv"
    if not buffer_path.exists():
        return None
        
    try:
        # Read only the last few rows to be fast
        # But pandas read_csv doesn't support 'tail' efficiently without reading header
        # For small files (100 rows), reading full is fine.
        df = pd.read_csv(buffer_path)
        if df.empty:
            return None
            
        # Get last row as dict
        latest = df.iloc[-1].to_dict()
        
        # Ensure NaNs are None or 0.0 for JSON serialization
        # (Though simplejson/fastapi handles NaN usually, clean is better)
        cleaned = {}
        for k, v in latest.items():
            if pd.isna(v):
                cleaned[k] = None
            else:
                cleaned[k] = v
                
        return cleaned
    except Exception as e:
        print(f"⚠️ Error reading pollution buffer for {city}: {e}")
        return None

def get_pollution_history(city: str):
    """
    Returns the full dataframe history from the buffer.
    """
    buffer_path = BUFFER_DIR / f"{city.lower()}_pollution.csv"
    if not buffer_path.exists():
        return None
        
    try:
        df = pd.read_csv(buffer_path, parse_dates=["Datetime"])
        return df
    except Exception as e:
        print(f"⚠️ Error reading pollution history for {city}: {e}")
        return None
