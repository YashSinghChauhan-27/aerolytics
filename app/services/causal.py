
import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import grangercausalitytests
from app.services.features import load_and_merge

CANDIDATE_CAUSES = [
    "Temperature_2m_C",
    "Relative_Humidity_%",
    "Wind_Speed_10m",
    "Total_Precipitation_mm",
    "NO2",
    "PM10",
    "CO",
    "O3"
]

TARGET = "PM2_5"
MAX_LAG = 6

def granger_min_pvalue(data, target, cause, max_lag=6):
    # Ensure data is stationary-ish or just run raw for quick insights (Granger technically needs stationarity)
    # We drop NaNs to ensure statsmodels doesn't inconsistent
    df_clean = data[[target, cause]].dropna()

    # Rule of thumb: need enough data for lags
    if len(df_clean) < max_lag * 5:
        return np.nan 

    try:
        # verbose=False to suppress stdout
        test = grangercausalitytests(
            df_clean[[target, cause]],
            maxlag=max_lag,
            verbose=False
        )

        # Extract p-values for ssr_ftest (index 0 inside the tuple)
        # test result is a dict: {lag: ({tests}, [objs])}
        pvals = [
            test[i + 1][0]["ssr_ftest"][1]
            for i in range(max_lag)
        ]

        return np.min(pvals)

    except Exception:
        return np.nan

def get_causal_strength(p):
    if pd.isna(p):
        return "Insufficient Data"
    elif p < 1e-50:
        return "Extremely Strong"
    elif p < 1e-20:
        return "Very Strong"
    elif p < 1e-10:
        return "Strong"
    elif p < 1e-5:
        return "Moderate"
    elif p < 1e-3:
        return "Weak"
    elif p < 0.05:
        return "Very Weak"
    else:
        return "Insignificant"

from functools import lru_cache

@lru_cache(maxsize=4) # Standard sync cache
def analyze_causality(city: str):
    try:
        df = load_and_merge(city)
    except Exception as e:
        return {"error": str(e)}

    # Ensure we sort by time
    df = df.sort_values("Datetime")
    
    results = []
    
    for cause in CANDIDATE_CAUSES:
        if cause not in df.columns:
            continue
            
        pval = granger_min_pvalue(df, TARGET, cause, MAX_LAG)
        strength = get_causal_strength(pval)
        
        # We only return statistically significant or meaningful results to the frontend
        if strength in ["Extremely Strong", "Very Strong", "Strong", "Moderate", "Weak", "Very Weak"]:
            results.append({
                "variable": cause,
                "p_value": float(pval), # convert np.float to float for JSON
                "strength": strength,
                "description": _get_description(cause, strength)
            })
            
    # Sort by p-value (ascending) -> most significant first
    results.sort(key=lambda x: x["p_value"])
    
    return {"city": city, "drivers": results}

def _get_description(variable, strength):
    # Simple rule-based explanations
    descriptions = {
        "Wind_Speed_10m": "Wind dispersion is likely affecting pollution levels.",
        "Temperature_2m_C": "Temperature changes are influencing smog formation.",
        "Relative_Humidity_%": "Humidity may be trapping pollutants.",
        "Total_Precipitation_mm": "Rainfall acts as a natural scrubber.",
        "NO2": "Traffic emissions (NO2) are a key contributor.",
        "PM10": "Dust and coarse particles are tracking with PM2.5.",
        "CO": "Combustion emissions are correlated with PM2.5.",
        "O3": "Ozone formation is linked to particulate trends."
    }
    base = descriptions.get(variable, "This factor shows a statistical link.")
    return f"{strength} Link: {base}"
