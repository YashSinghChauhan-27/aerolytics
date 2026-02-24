
import React from 'react';
import { Wind, Droplets, Thermometer, CloudRain } from 'lucide-react';
import clsx from 'clsx';

const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-aqi-good border-aqi-good';
    if (aqi <= 100) return 'text-aqi-satisfactory border-aqi-satisfactory';
    if (aqi <= 200) return 'text-aqi-moderate border-aqi-moderate';
    if (aqi <= 300) return 'text-aqi-poor border-aqi-poor';
    if (aqi <= 400) return 'text-aqi-very-poor border-aqi-very-poor';
    return 'text-aqi-severe border-aqi-severe';
};

const getAQIBg = (aqi) => {
    if (aqi <= 50) return 'bg-emerald-50 test-emerald-900 border-emerald-100';
    if (aqi <= 100) return 'bg-lime-50 text-lime-900 border-lime-100';
    if (aqi <= 200) return 'bg-yellow-50 text-yellow-900 border-yellow-100';
    if (aqi <= 300) return 'bg-orange-50 text-orange-900 border-orange-100';
    if (aqi <= 400) return 'bg-red-50 text-red-900 border-red-100';
    return 'bg-rose-50 text-rose-900 border-rose-100';
};

const AQICard = ({ data, aqi, className }) => {
    if (!data || !aqi) return <div className={clsx("animate-pulse h-64 bg-slate-200 rounded-xl", className)}></div>;

    const colorClass = getAQIColor(aqi.aqi);
    const bgClass = getAQIBg(aqi.aqi);

    // Override text colors for specific stats to be darker
    const statLabelClass = "text-xs text-slate-500 font-medium";
    const statValueClass = "font-mono font-semibold text-slate-700";

    return (
        <div className={clsx("p-6 rounded-2xl border transition-all flex flex-col justify-between shadow-sm", bgClass, className)}>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-slate-500 text-sm font-bold tracking-wider opacity-80">CURRENT AQI</h2>
                    <div className={clsx("text-6xl font-bold mt-2", colorClass)}>
                        {aqi.aqi}
                    </div>
                    <div className={clsx("text-xl font-medium mt-1 uppercase tracking-wide opacity-90", colorClass)}>
                        {aqi.category}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-slate-500 text-xs font-medium opacity-80">Dominant Pollutant</div>
                    <div className="text-xl font-bold">{aqi.dominant_pollutant}</div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/60 p-3 rounded-lg flex items-center gap-3 shadow-sm border border-black/5">
                    <Wind className="w-5 h-5 text-blue-500" />
                    <div>
                        <div className={statLabelClass}>Wind Speed</div>
                        <div className={statValueClass}>{data.Wind_Speed_10m} km/h</div>
                    </div>
                </div>
                <div className="bg-white/60 p-3 rounded-lg flex items-center gap-3 shadow-sm border border-black/5">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <div>
                        <div className={statLabelClass}>Temp</div>
                        <div className={statValueClass}>{data.Temperature_2m_C}°C</div>
                    </div>
                </div>
                <div className="bg-white/60 p-3 rounded-lg flex items-center gap-3 shadow-sm border border-black/5">
                    <Droplets className="w-5 h-5 text-cyan-500" />
                    <div>
                        <div className={statLabelClass}>Humidity</div>
                        <div className={statValueClass}>{data['Relative_Humidity_%']}%</div>
                    </div>
                </div>
                <div className="bg-white/60 p-3 rounded-lg flex items-center gap-3 shadow-sm border border-black/5">
                    <CloudRain className="w-5 h-5 text-indigo-500" />
                    <div>
                        <div className={statLabelClass}>Precip</div>
                        <div className={statValueClass}>{data.Total_Precipitation_mm} mm</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AQICard;
