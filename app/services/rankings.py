
import json
import logging
from pathlib import Path
from datetime import datetime
from app.config import CITY_CONFIG, BUFFER_DIR
from app.services.smart_data import get_smart_pollution_data

# Setup logging
logger = logging.getLogger(__name__)

RANKINGS_CACHE_FILE = BUFFER_DIR.parent / "rankings.json"

def update_rankings_cache():
    """
    Iterates through all configured cities, fetches their smart pollution data,
    and caches the sorted rankings to a JSON file.
    """
    logger.info("🚀 Starting rankings cache update...")
    rankings = []
    
    for city_key in CITY_CONFIG.keys():
        try:
            # Use Smart Data (handles staleness, missing PM2.5, capitalization, 24h avg)
            data = get_smart_pollution_data(city_key)
            
            if data:
                # Add check for Insufficient Data (-1) to keep list clean?
                # User might still want to see them on map as grey.
                # Let's keep them but maybe sort them to bottom or top?
                # Frontend handles sorting.
                
                # Sanitize data dict — remove Timestamps and non-numeric keys before JSON storage
                raw_data = data.get("data", {})
                clean_data = {
                    k: float(v) if hasattr(v, '__float__') else v
                    for k, v in raw_data.items()
                    if isinstance(v, (int, float)) or (isinstance(v, str))
                }
                
                rankings.append({
                    "name": data["city"],
                    "aqi": data["aqi"]["aqi"],
                    "category": data["aqi"]["category"],
                    "dominant_pollutant": data["aqi"].get("dominant_pollutant", "PM2.5"),
                    "sub_indices": data["aqi"].get("sub_indices"),
                    "data": clean_data,   # Full pollutant + weather dict (JSON-safe)
                    "pm25": raw_data.get("PM2_5", 0),  # top-level shortcut for map tooltip
                    "lat": data["lat"],
                    "lng": data["lng"],
                    "state": "India",
                    "updated_at": datetime.utcnow().isoformat()
                })
        except Exception as e:
            logger.error(f"Failed to fetch data for {city_key}: {e}")

    # Sort by AQI descending (highest first)
    # Handle -1 (Insufficient Data): Push to bottom
    # Sort key: (is_valid_data, aqi_value)
    # Valid data (aqi != -1) comes first (True > False? No, False < True)
    # We want -1 at bottom.
    # So key: (x['aqi'] == -1, x['aqi'])
    # If aqi != -1: (False, 200)
    # If aqi == -1: (True, -1)
    # Sorting descending: (True, -1) > (False, 200)? True > False is 1 > 0.
    # So -1s will be at TOP if we sort desc on first tuple element.
    # We want -1 at BOTTOM.
    # Let's simple sort by AQI desc, then move -1s to end.
    
    rankings.sort(key=lambda x: x["aqi"], reverse=True)
    
    # Move -1s to end
    valid = [r for r in rankings if r["aqi"] != -1]
    invalid = [r for r in rankings if r["aqi"] == -1]
    
    final_rankings = valid + invalid
    
    output = {
        "generated_at": datetime.utcnow().isoformat(),
        "cities": final_rankings
    }
    
    try:
        with open(RANKINGS_CACHE_FILE, "w") as f:
            json.dump(output, f, indent=2)
        logger.info(f"✅ Cached rankings for {len(final_rankings)} cities.")
        print(f"✅ [RANKINGS] Updated cache with {len(final_rankings)} cities.")
        return True
    except Exception as e:
        logger.error(f"Failed to write rankings cache: {e}")
        return False

def get_cached_rankings():
    """
    Returns cached rankings. If cache is missing, triggers an update (blocking).
    """
    if not RANKINGS_CACHE_FILE.exists():
        update_rankings_cache()
        
    try:
        with open(RANKINGS_CACHE_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to read rankings cache: {e}")
        # Fallback to empty
        return {"cities": []}
