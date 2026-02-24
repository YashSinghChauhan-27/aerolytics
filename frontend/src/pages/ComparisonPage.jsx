
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, BarChart2, TrendingUp } from 'lucide-react';
import { CITIES, getAQIColor } from '../config/cities';
import { fetchCurrentAQI, fetchAQIForecast } from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
import { useRefresh } from '../context/RefreshContext';
import { useQuery } from '@tanstack/react-query';

const ComparisonPage = () => {
    const navigate = useNavigate();
    const refreshTrigger = useRefresh();
    const [selectedCities, setSelectedCities] = useState(['Delhi', 'Mumbai']); // Default comparison

    // Generate dynamic insight
    // Generate dynamic insight
    const generateInsight = () => {
        if (!comparisonData.length) return "Select cities to view insights.";

        // 1. Ranking & General Stats
        const sortedByAQI = [...comparisonData].sort((a, b) => (b.aqi?.aqi || 0) - (a.aqi?.aqi || 0));
        const worstCity = sortedByAQI[0];
        const bestCity = sortedByAQI[sortedByAQI.length - 1];
        const avgAQI = Math.round(comparisonData.reduce((acc, curr) => acc + (curr.aqi?.aqi || 0), 0) / comparisonData.length);

        // 2. Pollutant Analysis
        const worstPM10 = [...comparisonData].sort((a, b) => (b.data?.PM10 || 0) - (a.data?.PM10 || 0))[0];
        const worstNO2 = [...comparisonData].sort((a, b) => (b.data?.NO2 || 0) - (a.data?.NO2 || 0))[0];

        // 3. Forecast Trends
        let trends = [];
        if (forecastData.length > 0) {
            const firstPoint = forecastData[0];
            const lastPoint = forecastData[forecastData.length - 1];

            comparisonData.forEach(c => {
                const diff = lastPoint[c.city] - firstPoint[c.city];
                if (Math.abs(diff) > 5) { // Threshold for significant change
                    trends.push({ city: c.city, diff });
                }
            });
        }
        const risingCities = trends.filter(t => t.diff > 0).map(t => t.city);
        const improvingCities = trends.filter(t => t.diff < 0).map(t => t.city);

        return (
            <ul className="space-y-3 text-slate-600 text-sm list-disc pl-5 leading-relaxed">
                <li>
                    <strong>Ranking:</strong> <span className="text-red-400 font-semibold">{worstCity.city}</span> is currently the most polluted (AQI {worstCity.aqi?.aqi}), followed by {sortedByAQI.slice(1, 3).map(c => c.city).join(", ")}. <span className="text-emerald-400 font-semibold">{bestCity.city}</span> has the cleanest air (AQI {bestCity.aqi?.aqi}).
                </li>
                <li>
                    <strong>Group Overview:</strong> The average AQI across selected cities is <strong>{avgAQI}</strong>. {worstCity.city} is {worstCity.aqi?.aqi - avgAQI} points above the group average.
                </li>
                <li>
                    <strong>Pollutant Breakdown:</strong> {worstPM10.city} has the highest PM10 levels ({worstPM10.data?.PM10}), suggesting potential dust or particulate issues. {worstNO2.city} leads in NO₂ ({worstNO2.data?.NO2}), likely due to traffic emissions.
                </li>
                {risingCities.length > 0 && (
                    <li>
                        <strong>⚠️ Forecast Warning:</strong> Optimization models predict air quality will <strong>worsen</strong> in <span className="text-orange-400">{risingCities.join(", ")}</span> over the next 24 hours.
                    </li>
                )}
                {improvingCities.length > 0 && (
                    <li>
                        <strong>✅ Improvement Expected:</strong> Conditions in <span className="text-emerald-400">{improvingCities.join(", ")}</span> are projected to improve by tomorrow.
                    </li>
                )}
                <li>
                    <strong>Health Advisory:</strong> Residents in {worstCity.city} should avoid outdoor exertion. {worstCity.aqi?.dominant_pollutant ? `Primary concern is ${worstCity.aqi?.dominant_pollutant}.` : ''} {bestCity.city} remains relatively safer for outdoor activities.
                </li>
            </ul>
        );
    };

    // React Query for fetching data
    const { data, isLoading: loading } = useQuery({
        queryKey: ['comparison', selectedCities],
        queryFn: async () => {
            if (selectedCities.length === 0) return { comparison: [], forecast: [] };

            // Fetch Current Data
            const currentPromises = selectedCities.map(city => fetchCurrentAQI(city).then(data => ({ city, ...data })));
            const currentResults = await Promise.all(currentPromises);

            // Fetch Forecast Data
            const forecastPromises = selectedCities.map(city => fetchAQIForecast(city));
            const forecastResults = await Promise.all(forecastPromises);

            // Transform Forecast Data
            let mergedForecast = [];
            if (forecastResults.length > 0 && forecastResults[0].forecast) {
                mergedForecast = forecastResults[0].forecast.map((point, index) => {
                    const timePoint = {
                        time: format(new Date(point.Datetime), 'HH:mm'),
                        timestamp: point.Datetime
                    };
                    forecastResults.forEach(res => {
                        if (res.forecast[index]) {
                            timePoint[res.city] = res.forecast[index].AQI;
                        }
                    });
                    return timePoint;
                });
            }

            return { comparison: currentResults, forecast: mergedForecast };
        },
        enabled: selectedCities.length > 0, // Only run if cities are selected
        staleTime: Infinity, // Keep data until invalidation
    });

    const comparisonData = data?.comparison || [];
    const forecastData = data?.forecast || [];

    const addCity = (e) => {
        const city = e.target.value;
        if (city && !selectedCities.includes(city)) {
            if (selectedCities.length >= 5) {
                alert("You can compare up to 5 cities.");
                return;
            }
            setSelectedCities([...selectedCities, city]);
        }
        e.target.value = ''; // Reset select
    };

    const removeCity = (city) => {
        setSelectedCities(selectedCities.filter(c => c !== city));
    };

    // Prepare chart data for Bar Charts
    const chartData = comparisonData.map(d => ({
        name: d.city,
        AQI: d.aqi?.aqi || 0,
        PM25: d.data?.PM2_5 || 0,
        PM10: d.data?.PM10 || 0,
        NO2: d.data?.NO2 || 0
    }));

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/explore')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                        <BarChart2 className="text-emerald-600" /> City Comparison Tool
                    </h1>
                </div>

                {/* Controls */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Select Cities to Compare (Max 5)</h3>
                        <div className="relative group">
                            <button className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm transition-colors ${selectedCities.length >= 5 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                                <Plus size={14} /> Add City
                            </button>
                            <select
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={addCity}
                                value=""
                                disabled={selectedCities.length >= 5}
                            >
                                <option value="" disabled>Select City</option>
                                {CITIES.filter(c => !selectedCities.includes(c.name)).map(c => (
                                    <option key={c.name} value={c.name} className="bg-white text-slate-900">
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 min-h-[40px]">
                        {selectedCities.length === 0 && <span className="text-sm text-slate-400 italic">No cities selected. Add a city to start comparing.</span>}
                        {selectedCities.map((city, index) => (
                            <div key={city} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 text-sm text-slate-700">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span>{city}</span>
                                <button onClick={() => removeCity(city)} className="hover:text-red-500 text-slate-400"><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visualizations */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Loading comparison data...</div>
                ) : selectedCities.length > 0 && (
                    <div className="space-y-8">

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* AQI Comparison */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold mb-6 text-slate-800">Current AQI Comparison</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', color: '#0f172a' }}
                                                itemStyle={{ color: '#334155' }}
                                                cursor={{ fill: '#f1f5f9' }}
                                            />
                                            <Bar dataKey="AQI" radius={[4, 4, 0, 0]} barSize={50}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getAQIColor(entry.AQI)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pollutant Breakdown */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold mb-6 text-slate-800">Pollutant Levels (µg/m³)</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', color: '#0f172a' }}
                                                itemStyle={{ color: '#334155' }}
                                                cursor={{ fill: '#f1f5f9' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '10px', color: '#475569' }} />
                                            <Bar dataKey="PM25" name="PM2.5" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="PM10" name="PM10" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="NO2" name="NO₂" fill="#a855f7" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Forecast Chart */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="text-blue-600" size={20} />
                                <h3 className="text-lg font-semibold text-slate-800">24-Hour Comparison Forecast</h3>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={forecastData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="time"
                                            stroke="#64748b"
                                            interval={0}
                                            tick={{ fontSize: 10 }}
                                            dy={10}
                                        />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', color: '#0f172a' }}
                                            itemStyle={{ color: '#334155' }}
                                        />
                                        <Legend wrapperStyle={{ color: '#475569' }} />
                                        {selectedCities.map((city, index) => (
                                            <Line
                                                key={city}
                                                type="monotone"
                                                dataKey={city}
                                                stroke={COLORS[index % COLORS.length]}
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Insight Card (Moved to Bottom) */}
                        <div className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-semibold mb-2 text-emerald-600">Key Insight</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {generateInsight()}
                            </p>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ComparisonPage;
