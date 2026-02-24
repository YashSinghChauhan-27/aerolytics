from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.pollution import update_pollution_buffer
from app.config import (
    CITY_CONFIG,
    POLLUTION_FETCH_INTERVAL,
    ENABLE_VERBOSE_LOGS
)
from app.services.forecaster import update_all_forecasts

scheduler = BackgroundScheduler()


def start_pollution_ingestion():
    """
    1. Starts background pollution ingestion (staggered).
    2. Starts forecast generation service (hourly).
    """

    # --- 1. Basic Ingestion (Staggered) ---
    cities = sorted(list(CITY_CONFIG.keys()))
    
    for i, city in enumerate(cities):
        # Stagger start by 5 seconds
        run_time = datetime.now() + timedelta(seconds=i * 5)
        
        scheduler.add_job(
            func=update_pollution_buffer,
            trigger="interval",
            seconds=POLLUTION_FETCH_INTERVAL,
            args=[city],
            id=f"pollution_job_{city}",
            next_run_time=run_time,
            replace_existing=True,
            max_instances=1,
            coalesce=True,
            misfire_grace_time=300
        )
        if ENABLE_VERBOSE_LOGS:
             print(f"🟢 Scheduled pollution ingestion for {city}")

    # --- 2. Heavy ML Forecasting (Hourly) ---
    # We schedule it to run 2 minutes from now to give initial ingestion a head start
    # Then repeat every 1 hour
    forecast_start_time = datetime.now() + timedelta(minutes=3)
    
    scheduler.add_job(
        func=update_all_forecasts,
        trigger="interval",
        minutes=60,
        id="forecast_service_all_cities",
        next_run_time=forecast_start_time,
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600
    )
    print(f"🧠 Scheduled ML Forecaster Service (Start in 3 mins)")

    # --- 3. Rankings Cache (Every 5 mins) ---
    # Starts 30 seconds after boot (after initial ingestion fires).
    # With reload=False + APScheduler BackgroundScheduler, this runs in a true
    # background thread and does NOT block uvicorn's HTTP worker.
    from app.services.rankings import update_rankings_cache
    rankings_start_time = datetime.now() + timedelta(seconds=30)
    
    scheduler.add_job(
        func=update_rankings_cache,
        trigger="interval",
        minutes=5,
        id="rankings_cache_service",
        next_run_time=rankings_start_time,
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300
    )
    print(f"🏅 Scheduled Rankings Cache Service (Every 5 mins, first run in 30s)")

    scheduler.start()
