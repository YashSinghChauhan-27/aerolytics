
import json
import logging
import pandas as pd
from datetime import datetime
from app.config import CITY_CONFIG, BUFFER_DIR
from app.services.pollution import get_latest_pollution_from_buffer, update_pollution_buffer
from app.services.weather import get_latest_weather_from_buffer, update_weather_buffer
from app.services.aqi import calculate_aqi

# To avoid circular import, we redefine/import logic for path if simple, 
# or import at function level if necessary. 
# But importing forecaster module is unsafe if it imports pollution module?
# forecaster -> pollution. 
# smart_data -> forecaster -> pollution. 
# smart_data -> pollution.
# This is fine. Cycle is if pollution -> smart_data.
from app.services.forecaster import get_forecast_path

logger = logging.getLogger(__name__)

def get_smart_pollution_data(city: str):
    """
    Retrieves the most accurate available pollution data for a city.
    
    Logic:
    1. Try getting real-time sensor data from buffer.
    2. Check if data is stale (> 2 hours) OR critical pollutants (PM2.5) are missing/zero.
    3. If stale/missing, try to patch with Forecast Model.
    4. Calculate AQI based on the final patched data.
    
    Returns:
        dict: {
            "city": str,
            "data": dict (pollution parameters),
            "aqi": dict (aqi, category, etc.),
            "source": str ("live" or "forecast_patched"),
            "lat": float,
            "lng": float
        }
    """
    city_key = city.lower()
    config = CITY_CONFIG.get(city_key)
    if not config:
        return None

    # 1. Get Buffer Data (History for Averaging)
    from app.services.pollution import get_pollution_history
    
    # Use a SHORT window (4h) for "current AQI" to reflect actual current conditions.
    # The 24h average was inflating readings due to overnight spikes persisting into daytime.
    # CPCB uses 24h for health indices, but "current" should mean recent.
    SHORT_WINDOW_HRS = 4
    start_time = pd.Timestamp.now(tz='UTC') - pd.Timedelta(hours=SHORT_WINDOW_HRS)
    history_df = get_pollution_history(city_key)
    
    # Defaults
    latest = {
        "Datetime": pd.Timestamp.now(tz='UTC').isoformat(),
        "PM2_5": 0, "PM10": 0, "NO2": 0, "CO": 0, "O3": 0
    }
    
    use_forecast = False
    source = "live_4h_avg"
    
    if history_df is not None and not history_df.empty:
        # Ensure Datetime is timezone-aware
        if history_df["Datetime"].dt.tz is None:
             history_df["Datetime"] = history_df["Datetime"].dt.tz_localize("UTC")
            
        # Try short window first (4h)
        recent_df = history_df[history_df["Datetime"] >= start_time]
        
        # Only fall back if the 4h window is completely empty.
        # A single reading IS valid — it's the most recent data point.
        # The old `< 2` condition was wrong: it forced a 12h fallback that pulled in
        # old overnight spikes (e.g. 4:30 AM PM2.5=222) even when we had a clean
        # recent reading like PM2.5=56 at 10:45.
        if recent_df.empty:
            fallback_start = pd.Timestamp.now(tz='UTC') - pd.Timedelta(hours=12)
            recent_df = history_df[history_df["Datetime"] >= fallback_start]
            source = "live_12h_avg"

        
        if not recent_df.empty:
            # Recency-weighted PM averaging:
            # With sparse readings (≤3 points), heavily weight the latest reading (70%)
            # since older points may reflect conditions hours ago.
            # With more readings, use EWM which naturally decays older values.
            recent_df = recent_df.sort_values("Datetime").reset_index(drop=True)
            
            n = len(recent_df)
            if n == 1:
                # Only one point — use it directly
                ewm_pm25 = recent_df["PM2_5"].iloc[0]
                ewm_pm10 = recent_df["PM10"].iloc[0]
            elif n <= 3:
                # Check the time gap between readings.
                # If readings are spread >90 min apart, they reflect very different
                # conditions — treat the latest as authoritative (as Google does).
                time_gap = (recent_df["Datetime"].iloc[-1] - recent_df["Datetime"].iloc[-2]).total_seconds() / 60
                if time_gap > 90:
                    # Readings too far apart: use latest directly
                    ewm_pm25 = recent_df["PM2_5"].iloc[-1]
                    ewm_pm10 = recent_df["PM10"].iloc[-1]
                else:
                    # Close readings: blend 70% latest / 30% older
                    ewm_pm25 = 0.7 * recent_df["PM2_5"].iloc[-1] + 0.3 * recent_df["PM2_5"].iloc[:-1].mean()
                    ewm_pm10 = 0.7 * recent_df["PM10"].iloc[-1] + 0.3 * recent_df["PM10"].iloc[:-1].mean()
            else:
                # Dense readings: use EWM for smooth recency weighting
                ewm_pm25 = recent_df["PM2_5"].ewm(halflife=n // 2, adjust=True).mean().iloc[-1]
                ewm_pm10 = recent_df["PM10"].ewm(halflife=n // 2, adjust=True).mean().iloc[-1]
            
            # Use latest row for gas readings (they are instantaneous)
            latest_row = recent_df.iloc[-1].to_dict()
            latest = latest_row.copy()
            
            # Override PM with recency-weighted values
            if pd.notna(ewm_pm25):
                latest["PM2_5"] = round(ewm_pm25, 2)
            if pd.notna(ewm_pm10):
                latest["PM10"] = round(ewm_pm10, 2)
                
            # Check staleness of the latest point
            last_dt = pd.to_datetime(latest["Datetime"])
            if last_dt.tz is not None:
                last_dt = last_dt.tz_convert("UTC")
            else:
                last_dt = last_dt.tz_localize("UTC")
            is_stale = (pd.Timestamp.now(tz='UTC') - last_dt) > pd.Timedelta(hours=3)
            
            if is_stale:
                use_forecast = True
        else:
             use_forecast = True
    else:
        use_forecast = True

    # Check Quality (Missing PM2.5) after averaging
    pm25 = latest.get("PM2_5")
    if (pm25 is None or pm25 <= 0.0) and not use_forecast:
        use_forecast = True

    # 3. Patch with Forecast if needed
    if use_forecast:
        cache_path = get_forecast_path(city_key)
        if cache_path.exists():
            try:
                with open(cache_path, "r") as f:
                    fcast_data = json.load(f)
                
                # Find current hour forecast
                now_ist = pd.Timestamp.now(tz='Asia/Kolkata').tz_localize(None)
                target_hour = now_ist.replace(minute=0, second=0, microsecond=0)
                prediction = None
                
                for row in fcast_data["forecast"]:
                    row_dt = pd.to_datetime(row["Datetime"])
                    if row_dt.tz is not None:
                         row_dt = row_dt.tz_convert("Asia/Kolkata").tz_localize(None)
                    
                    if row_dt >= target_hour:
                        prediction = row
                        break
                
                if prediction:
                    # Patch Data
                    # CLAMP to 0 to avoid negative forecast artifacts
                    pred_pm25 = max(0.0, prediction["PM2_5_p50"])
                    latest["PM2_5"] = pred_pm25
                    
                    # If we have PM2.5 from forecast, we can estimate PM10 roughly if missing
                    if latest.get("PM10", 0) <= 0:
                        latest["PM10"] = round(pred_pm25 * 2.0, 2)
                        
                    # We update the time to current to show it's relevant "now"
                    latest["Datetime"] = prediction["Datetime"]
                    latest["is_predicted"] = True
                    source = "forecast_patched"
            except Exception as e:
                logger.error(f"Failed to patch with forecast for {city}: {e}")

    # 4. Inject Weather
    weather = get_latest_weather_from_buffer(city_key)
    if weather:
         for k, v in weather.items():
            if k != "Datetime":
                latest[k] = v

    # 5. Calculate AQI
    # SAFETY CHECK: If PM2.5 is still negligible (e.g. < 1.0), the data is likely invalid for Indian cities.
    # We return "Insufficient Data" (-1) to avoid misleading "Good" ratings.
    final_pm25 = latest.get("PM2_5", 0)
    if final_pm25 < 1.0:
        aqi_result = {"aqi": -1, "category": "Insufficient Data", "dominant_pollutant": "NA"}
    else:
        aqi_result = calculate_aqi(
            pm25=latest.get("PM2_5"),
            pm10=latest.get("PM10"),
            no2=latest.get("NO2"),
            co=latest.get("CO"),
            o3=latest.get("O3")
        )
    
    return {
        "city": city_key.title(), # capitalization fix
        "data": latest,
        "aqi": aqi_result,
        "source": source,
        "lat": config["lat"],
        "lng": config["lon"]
    }
