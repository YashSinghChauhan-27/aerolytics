
def calculate_sub_index(concentration, breakpoints):
    """
    Calculates the sub-index for a pollutant based on its concentration and breakpoints.
    Breakpoints structure: [(min, max, Imin, Imax), ...]
    """
    for (C_low, C_high, I_low, I_high) in breakpoints:
        if C_low <= concentration <= C_high:
            return I_low + (I_high - I_low) / (C_high - C_low) * (concentration - C_low)
    return 0  # Should not happen if breakpoints cover all ranges

def get_aqi_category(aqi):
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"

def calculate_aqi(pm25=None, pm10=None, no2=None, o3=None, co=None):
    """
    Calculates Indian National Air Quality Index (AQI).
    Inputs:
        pm25 (µg/m³)
        pm10 (µg/m³)
        no2  (µg/m³)
        o3   (µg/m³)
        co   (mg/m³)
    Returns:
        dict: { "aqi": int, "category": str, "dominant_pollutant": str, "sub_indices": dict }
    """
    
    # Breakpoints (C_low, C_high, I_low, I_high)
    # Source: CPCB, India
    
    # PM2.5 (avg 24h)
    bp_pm25 = [
        (0, 30, 0, 50), (30, 60, 51, 100), (60, 90, 101, 200),
        (90, 120, 201, 300), (120, 250, 301, 400), (250, 5000, 401, 500)
    ]
    
    # PM10 (avg 24h)
    bp_pm10 = [
        (0, 50, 0, 50), (50, 100, 51, 100), (100, 250, 101, 200),
        (250, 350, 201, 300), (350, 430, 301, 400), (430, 5000, 401, 500)
    ]
    
    # NO2 (avg 24h)
    bp_no2 = [
        (0, 40, 0, 50), (40, 80, 51, 100), (80, 180, 101, 200),
        (180, 280, 201, 300), (280, 400, 301, 400), (400, 5000, 401, 500)
    ]
    
    # O3 (avg 8h)
    bp_o3 = [
        (0, 50, 0, 50), (50, 100, 51, 100), (100, 168, 101, 200),
        (168, 208, 201, 300), (208, 748, 301, 400), (748, 5000, 401, 500)
    ]
    
    # CO (avg 8h) - mg/m3
    bp_co = [
        (0, 1.0, 0, 50), (1.0, 2.0, 51, 100), (2.0, 10.0, 101, 200),
        (10.0, 17.0, 201, 300), (17.0, 34.0, 301, 400), (34.0, 500, 401, 500)
    ]

    sub_indices = {}
    
    if pm25 is not None: sub_indices["PM2_5"] = calculate_sub_index(pm25, bp_pm25)
    if pm10 is not None: sub_indices["PM10"] = calculate_sub_index(pm10, bp_pm10)
    if no2 is not None: sub_indices["NO2"] = calculate_sub_index(no2, bp_no2)
    if o3 is not None: sub_indices["O3"] = calculate_sub_index(o3, bp_o3)
    if co is not None: sub_indices["CO"] = calculate_sub_index(co / 1000.0, bp_co)

    if not sub_indices:
        return {"aqi": 0, "category": "No Data", "dominant_pollutant": "None", "sub_indices": {}}

    final_aqi = max(sub_indices.values())
    dominant = max(sub_indices, key=sub_indices.get)
    
    return {
        "aqi": int(round(final_aqi)),
        "category": get_aqi_category(final_aqi),
        "dominant_pollutant": dominant,
        "sub_indices": {k: int(round(v)) for k, v in sub_indices.items()}
    }
