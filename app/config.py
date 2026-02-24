import os
from pathlib import Path

# Base directory of backend
BASE_DIR = Path(__file__).resolve().parent

# Model paths
TFT_MODEL_PATH = BASE_DIR / "models" / "tft_model.ckpt"

# Data buffer directory
BUFFER_DIR = BASE_DIR / "data" / "buffers"
BUFFER_DIR.mkdir(parents=True, exist_ok=True)

# API key: reads from env var on Render, falls back to the key for local dev
OPENAQ_API_KEY = os.environ.get(
    "OPENAQ_API_KEY",
    "ba2848b20f917bf39f620703f7fd5b34eed51e5f77799f683e594ab3f60919c1"  # local dev fallback
)


# Single source of truth for cities
# Single source of truth for cities
CITY_CONFIG = {
    "ahmedabad": {
        "lat": 23.0215374,
        "lon": 72.5800568,
        "location_id": 5631,
        "sensors": {
            "PM2_5": 12235671,
            "PM10": 12235670,
            "NO2": 12235668,
            "CO": 12235666,
            "O3": 12235669,
        }
    },
    "aizawl": {
        "lat": 23.7277631,
        "lon": 92.7179947,
        "location_id": 7880,
        "sensors": {
            "PM2_5": 12236268,
            "PM10": 12236267,
            "NO2": 12236265,
            "CO": 12236263,
            "O3": 12236266,
        }
    },
    "amaravati": {
        "lat": 16.494222,
        "lon": 80.5105858,
        "location_id": 5408,
        "sensors": {
            "PM2_5": 12234948,
            "PM10": 12234947,
            "NO2": 12234945,
            "CO": 12234943,
            "O3": 12234946,
        }
    },
    "amritsar": {
        "lat": 31.6356659,
        "lon": 74.8787496,
        "location_id": 5551,
        "sensors": {
            "PM2_5": 12235443,
            "PM10": 12235442,
            "NO2": 12235440,
            "CO": 12235438,
            "O3": 12235441,
        }
    },
    "bengaluru": {
        "lat": 12.9767936,
        "lon": 77.590082,
        "location_id": 6974,
        "sensors": {
            "PM2_5": 12235240,
            "PM10": 12235239,
            "NO2": 12235237,
            "CO": 12235235,
            "O3": 12235238,
        }
    },
    "bhopal": {
        "lat": 23.2584857,
        "lon": 77.401989,
        "location_id": 10913,
        "sensors": {
            "PM2_5": 12236021,
            "PM10": 12236020,
            "NO2": 12236018,
            "CO": 12236016,
            "O3": 12236019,
        }
    },
    "chandigarh": {
        "lat": 30.7334421,
        "lon": 76.7797143,
        "location_id": 233415,
        "sensors": {
            "PM2_5": 12236806,
            "PM10": 12236805,
            "NO2": 12236803,
            "CO": 12236801,
            "O3": 12236804,
        }
    },
    "chennai": {
        "lat": 13.0836939,
        "lon": 80.270186,
        "location_id": 5655,
        "sensors": {
            "PM2_5": 12235531,
            "PM10": 12235530,
            "NO2": 12235528,
            "CO": 12235526,
            "O3": 12235529,
        }
    },
    "coimbatore": {
        "lat": 11.0018115,
        "lon": 76.9628425,
        "location_id": 8914,
        "sensors": {
            "PM2_5": 12235805,
            "PM10": 12235804,
            "NO2": 12235802,
            "CO": 12235800,
            "O3": 12235803,
        }
    },
    "delhi": {
        "lat": 28.6138954,
        "lon": 77.2090057,
        "location_id": 235,
        "sensors": {
            "PM2_5": 12235610,
            "PM10": 12235609,  
            "NO2": 12235607,
            "CO": 12235605,
            "O3": 12235608,
        }
    },
    "gurugram": {
        "lat": 28.4646148,
        "lon": 77.0299194,
        "location_id": 301,
        "sensors": {
            "PM2_5": 14258988,
            "PM10": 14258987,
            "NO2": 14258985,
            "CO": 14258983,
            "O3": 14258986,
        }
    },
    "guwahati": {
        "lat": 26.1805978,
        "lon": 91.753943,
        "location_id": 42240,
        "sensors": {
            "PM2_5": 12236490,
            "PM10": 12236489,
            "NO2": 12236487,
            "CO": 12236485,
            "O3": 12236488,
        }
    },
    "hyderabad": {
        "lat": 17.360589,
        "lon": 78.4740613,
        "location_id": 352465,
        "sensors": {
            "PM2_5": 12237089,
            "PM10": 12237088,
            "NO2": 12237086,
            "CO": 12237084,
            "O3": 12237087,
        }
    },
    "jaipur": {
        "lat": 26.9154576,
        "lon": 75.8189817,
        "location_id": 5633,
        "sensors": {
            "PM2_5": 12234805,
            "PM10": 12234804,
            "NO2": 12234802,
            "CO": 12234800,
            "O3": 12234803,
        }
    },
    "jorapokhar": {
        "lat": 23.7167069,
        "lon": 86.4110166,
        "location_id": 3409415,
        "sensors": {
            "PM2_5": 12243001,
            "PM10": 12243000,
            "NO2": 12242998,
            "CO": 12242996,
            "O3": 12242999,
        }
    },
    "kochi": {
        "lat": 9.9679032,
        "lon": 76.2444378,
        "location_id": 6966,
        "sensors": {
            "PM2_5": 12235842,
            "PM10": 12235841,
            "NO2": 12235839,
            "CO": 12235837,
            "O3": 12235840,
        }
    },
    "kolkata": {
        "lat": 22.5726459,
        "lon": 88.3638953,
        "location_id": 10851,
        "sensors": {
            "PM2_5": 12235994,
            "PM10": 12235993,
            "NO2": 12235991,
            "CO": 12235989,
            "O3": 12235992,
        }
    },
    "mumbai": {
        "lat": 19.054999,
        "lon": 72.8692035,
        "location_id": 6945,
        "sensors": {
            "PM2_5": 12235834,
            "PM10": 12235833,
            "NO2": 12235831,
            "CO": 12235829,
            "O3": 12235832,
        }
    },
    "patna": {
        "lat": 25.6093239,
        "lon": 85.1235252,
        "location_id": 10599,
        "sensors": {
            "PM2_5": 12236102,
            "PM10": 12236101,
            "NO2": 12236099,
            "CO": 12236097,
            "O3": 12236100,
        }
    },
    "shillong": {
        "lat": 25.5759931,
        "lon": 91.8827872,
        "location_id": 10895,
        "sensors": {
            "PM2_5": 12236003,
            "PM10": 12236002,
            "NO2": 12236000,
            "CO": 12235998,
            "O3": 12236001,
        }
    },
    "talcher": {
        "lat": 20.9322302,
        "lon": 85.2005822,
        "location_id": 5566,
        "sensors": {
            "PM2_5": 12234957,
            "PM10": 12234956,
            "NO2": 12234954,
            "CO": 12234952,
            "O3": 12234955,
        }
    },
    "thiruvananthapuram": {
        "lat": 8.4882267,
        "lon": 76.947551,
        "location_id": 5646,
        "sensors": {
            "PM2_5": 12235417,
            "PM10": 12242968,
            "NO2": 12235415,
            "CO": 12235413,
            "O3": 12235416,
        }
    },
    "visakhapatnam": {
        "lat": 17.6935526,
        "lon": 83.2921297,
        "location_id": 5628,
        "sensors": {
            "PM2_5": 12235460,
            "PM10": 12235459,
            "NO2": 12235457,
            "CO": 12235455,
            "O3": 12235458,
        }
    }
}

# =========================
# Pollution ingestion config
# =========================
# How often to fetch "latest" PM2.5 (seconds)
POLLUTION_FETCH_INTERVAL = 60 * 10  # every 10 minutes

# Max rows to keep in pollution CSV (soft window)
MAX_POLLUTION_ROWS = 200  # NOT strict 48h

# =========================
# Weather ingestion config
# =========================
WEATHER_LOOKBACK_HOURS = 48
WEATHER_BUFFER_ROWS = 48

# =========================
# TFT / ML config
# =========================
ENCODER_LENGTH = 24
PREDICTION_LENGTH = 1

MIN_ROWS_FOR_PREDICTION = 24
TIME_COL = "Datetime"
TARGET_COL = "PM2_5"

# =========================
# Logging
# =========================
ENABLE_VERBOSE_LOGS = True
