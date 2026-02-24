from meteostat import Point, Hourly
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from app.config import CITY_CONFIG, BUFFER_DIR

def fetch_weather_df(city: str):
    city_key = city.lower()
    coords = CITY_CONFIG[city_key]

    location = Point(coords["lat"], coords["lon"])

    end = datetime.utcnow()
    start = end - timedelta(hours=72)  # wider window = safer merge

    df = Hourly(location, start, end).fetch()
    if df.empty:
        raise RuntimeError("No weather data returned")

    df = df.reset_index()

    df["Temperature_2m_C"] = df["temp"]
    df["Relative_Humidity_%"] = df["rhum"]
    df["Wind_Speed_10m"] = df["wspd"]
    df["Surface_Pressure_hPa"] = df["pres"]
    df["Total_Precipitation_mm"] = df["prcp"]

    return df.rename(columns={"time": "Datetime"})[
        [
            "Datetime",
            "Temperature_2m_C",
            "Relative_Humidity_%",
            "Wind_Speed_10m",
            "Surface_Pressure_hPa",
            "Total_Precipitation_mm",
        ]
    ]


def update_weather_buffer(city: str):
    buffer_path = BUFFER_DIR / f"{city.lower()}_weather.csv"
    new_df = fetch_weather_df(city)

    # 🔥 DO NOT keep very old weather
    # Replace buffer completely with recent window
    df = (
        new_df
        .sort_values("Datetime")
        .tail(120)  # from config (48)
        .reset_index(drop=True)
    )

    df.to_csv(buffer_path, index=False)
    return df

def get_latest_weather_from_buffer(city: str):
    """
    Reads the latest weather record from local CSV buffer.
    Returns None if missing.
    """
    buffer_path = BUFFER_DIR / f"{city.lower()}_weather.csv"
    if not buffer_path.exists():
        return None
        
    try:
        df = pd.read_csv(buffer_path)
        if df.empty:
            return None
            
        latest = df.iloc[-1].to_dict()
        
        cleaned = {}
        for k, v in latest.items():
            if pd.isna(v):
                if k == "Total_Precipitation_mm":
                    cleaned[k] = 0.0
                else:
                    cleaned[k] = None
            else:
                cleaned[k] = v
        return cleaned
    except Exception as e:
        print(f"⚠️ Error reading weather buffer for {city}: {e}")
        return None

