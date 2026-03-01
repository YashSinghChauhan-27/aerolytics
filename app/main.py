import os
from fastapi import FastAPI, HTTPException

from app.services.pollution import update_pollution_buffer
from app.services.weather import update_weather_buffer
from app.services.scheduler import start_pollution_ingestion
import pandas as pd
import math


app = FastAPI(title="Aerolytics Backend")

from fastapi.middleware.cors import CORSMiddleware

# Open CORS — allows any origin (safe since this is a read-only public API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)



# --------------------------------------------------
# Startup: begin live pollution ingestion
# --------------------------------------------------
@app.on_event("startup")
def startup_event():
    start_pollution_ingestion()
    print("🟢 Pollution ingestion scheduler started")


# --------------------------------------------------
# Health check
# --------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "Aerolytics backend is running successfully"
    }


# --------------------------------------------------
# Debug / testing endpoints
# --------------------------------------------------
@app.get("/test/pollution")
def test_pollution(city: str):
    df = update_pollution_buffer(city)
    return {
        "city": city,
        "records": len(df),
        "latest_pm25": float(df.iloc[-1]["PM2_5"])
    }


@app.get("/test/weather")
def test_weather(city: str = "Delhi"):
    df = update_weather_buffer(city)
    return {
        "city": city,
        "records": len(df),
        "latest_time": str(df.iloc[-1]["Datetime"])
    }


@app.get("/test/features")
def test_features(city: str = "Delhi"):
    from app.services.features import get_tft_input
    df = get_tft_input(city)
    return {
        "city": city,
        "rows": len(df),
        "columns": list(df.columns),
        "pm25_used": float(df.iloc[-1]["PM2_5"]),
        "start_time": str(df.iloc[0]["Datetime"]),
        "end_time": str(df.iloc[-1]["Datetime"])
    }


# --------------------------------------------------
# 🔮 FINAL ONE-CLICK PREDICTION PIPELINE
# --------------------------------------------------
@app.get("/predict/pm25")
def predict_pm25(city: str = "Delhi"):
    try:
        from app.services.forecaster import get_forecast_path
        import json
        
        cache_path = get_forecast_path(city)
        if not cache_path.exists():
            return {
                "city": city,
                "status": "gathering_data",
                "message": "Generating initial forecast model. Please wait ~2 minutes.",
                "forecast": []
            }
            
        with open(cache_path, "r") as f:
            data = json.load(f)
            
        return {
            "city": city,
            "status": "ready",
            "last_observed_pm25": 0, # Placeholder
            "forecast_horizon_hours": len(data["forecast"]),
            "forecast": data["forecast"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------------
# 🆕 NEW ANALYTICS ENDPOINTS
# ------------------------------------------------------------------------
from app.services.aqi import calculate_aqi
from app.services.causal import analyze_causality
from app.services.pollution import fetch_latest_pollutants


@app.get("/aqi/current")
def get_current_aqi(city: str = "Delhi"):
    """
    Returns the current AQI for a city.
    
    Reads from the same rankings cache used by the Explore page to guarantee
    consistency — both pages always show the same number.
    The cache is refreshed every 5 minutes by the background scheduler.
    """
    try:
        from app.services.rankings import get_cached_rankings
        from app.services.smart_data import get_smart_pollution_data
        
        city_key = city.lower()
        
        # 1. Try to serve from rankings cache (same source as Explore/Map page)
        cache = get_cached_rankings()
        city_data = next(
            (c for c in cache.get("cities", []) if c["name"].lower() == city_key),
            None
        )
        
        if city_data and city_data.get("aqi", -1) != -1:
            # Return in the same shape as smart_data so the frontend doesn't break
            return {
                "city": city_data["name"],
                "data": city_data.get("data", {"PM2_5": city_data.get("pm25", 0)}),
                "aqi": {
                    "aqi": city_data["aqi"],
                    "category": city_data["category"],
                    "dominant_pollutant": city_data.get("dominant_pollutant", "PM2.5"),
                    "sub_indices": city_data.get("sub_indices")
                },
                "source": "cache",
                "lat": city_data.get("lat"),
                "lng": city_data.get("lng")
            }
        
        # 2. Fallback: city not in cache yet — compute live
        result = get_smart_pollution_data(city)
        if not result:
            raise HTTPException(status_code=404, detail="No pollution data available")
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/aqi/forecast")
def get_aqi_forecast(city: str = "Delhi"):
    try:
        from app.services.forecaster import get_forecast_path
        from app.services.smart_data import get_smart_pollution_data
        from app.services.aqi import calculate_aqi
        import json
        
        # 1. Get Current AQI from the SAME source as the current AQI card.
        # This ensures the forecast chart starts at exactly the value shown on the card.
        smart = get_smart_pollution_data(city)
        current_aqi_val = None
        current_cat = None
        if smart and smart["aqi"]["aqi"] != -1:
            current_aqi_val = smart["aqi"]["aqi"]
            current_cat = smart["aqi"]["category"]

        # 2. Get Forecast from JSON cache
        cache_path = get_forecast_path(city)
        if not cache_path.exists():
            return {
                "city": city,
                "status": "gathering_data",
                "message": "Generating initial forecast model. Please wait ~2 minutes.",
                "forecast": []
            }
            
        with open(cache_path, "r") as f:
            data = json.load(f)
            
        # 3. Stitch Data: [Anchor] + [Smoothed Forecast Future]
        results = []
        
        now_ist = pd.Timestamp.now(tz='Asia/Kolkata').tz_localize(None)
        current_hour = now_ist.replace(minute=0, second=0, microsecond=0)
        
        # Add Anchor Point (current hour = live AQI from card)
        if current_aqi_val is not None:
            results.append({
                "Datetime": current_hour.isoformat(),
                "PM2_5": smart["data"].get("PM2_5", 0),
                "AQI": current_aqi_val,
                "Category": current_cat
            })
            
        # Filter Forecast for FUTURE hours (> current_hour)
        forecast_rows = []
        for row in data["forecast"]:
            dt = pd.to_datetime(row["Datetime"])
            if dt.tz is not None:
                dt = dt.tz_convert("Asia/Kolkata").tz_localize(None)
            
            if dt > current_hour:
                forecast_rows.append({
                    "Datetime": row["Datetime"],
                    "PM2_5": row["PM2_5_p50"],
                    "dt_obj": dt
                })
        
        # 4. Smooth in AQI-space over 4 hours to bridge the anchor→model gap smoothly.
        #    The model was trained on 24h averages; current AQI uses 4h recency weighting
        #    so the first model step can be very different from the current AQI.
        #    We linearly interpolate: hour +1 = 80% anchor AQI + 20% model AQI, etc.
        if current_aqi_val is not None and forecast_rows:
            # Compute model AQIs for first 4 steps
            BLEND_HOURS = 4
            anchor_weights = [0.80, 0.60, 0.40, 0.20]
            
            for i, item in enumerate(forecast_rows):
                model_aqi = calculate_aqi(pm25=item["PM2_5"])["aqi"]
                
                if i < BLEND_HOURS:
                    w_a = anchor_weights[i]
                    w_m = 1.0 - w_a
                    blended_aqi = int(round(current_aqi_val * w_a + model_aqi * w_m))
                    cat = calculate_aqi(pm25=item["PM2_5"])["category"]  # use model category
                    results.append({
                        "Datetime": item["Datetime"],
                        "PM2_5": item["PM2_5"],
                        "AQI": blended_aqi,
                        "Category": cat
                    })
                else:
                    results.append({
                        "Datetime": item["Datetime"],
                        "PM2_5": item["PM2_5"],
                        "AQI": model_aqi,
                        "Category": calculate_aqi(pm25=item["PM2_5"])["category"]
                    })
        else:
            # No anchor: just serve raw model output
            for item in forecast_rows:
                aqi_val = calculate_aqi(pm25=item["PM2_5"])
                results.append({
                    "Datetime": item["Datetime"],
                    "PM2_5": item["PM2_5"],
                    "AQI": aqi_val["aqi"],
                    "Category": aqi_val["category"]
                })
                
        return {"city": city, "status": "ready", "forecast": results[:25]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze/causal")
def get_causal_analysis(city: str = "Delhi"):
    try:
        return analyze_causality(city)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/aqi/rankings")
def get_aqi_rankings():
    try:
        from app.services.rankings import get_cached_rankings
        
        # Returns cached or computes if missing (blocking first time)
        return get_cached_rankings()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
