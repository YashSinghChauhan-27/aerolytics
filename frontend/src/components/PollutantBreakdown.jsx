import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info } from 'lucide-react';

const PollutantBreakdown = ({ data }) => {
    if (!data) return <div className="h-64 bg-slate-50/50 rounded-xl animate-pulse"></div>;

    // Transform data for chart
    // We filter out non-pollutant keys like "Datetime", "Wind_Speed_10m", etc. if they exist in the same object,
    // although assuming 'data' passed here is the cleaned pollutant list or we pick specific keys.
    // Based on API response: PM2_5, PM10, NO2, CO, O3.

    const chartData = [
        { name: 'PM2.5', value: data.PM2_5, unit: 'µg/m³', color: '#ef4444', full: 'Fine Particulate Matter' },
        { name: 'PM10', value: data.PM10, unit: 'µg/m³', color: '#f97316', full: 'Coarse Particulate Matter' },
        { name: 'NO2', value: data.NO2, unit: 'µg/m³', color: '#3b82f6', full: 'Nitrogen Dioxide' },
        { name: 'O3', value: data.O3, unit: 'µg/m³', color: '#8b5cf6', full: 'Ozone' },
        { name: 'CO', value: data.CO, unit: 'µg/m³', color: '#10b981', full: 'Carbon Monoxide' },
    ].filter(d => d.value !== undefined && d.value !== null);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                    <p className="font-bold text-slate-800">{data.full} ({label})</p>
                    <p className="text-sm font-medium" style={{ color: data.color }}>
                        {data.value} {data.unit}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        Pollutant Breakdown
                    </h3>
                    <p className="text-slate-500 text-sm">Concentration levels of key pollutants.</p>
                </div>
                <div className="group relative">
                    <Info size={18} className="text-slate-400 cursor-help" />
                    <div className="absolute right-0 top-6 w-72 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                        Values are in µg/m³. Note: The "Dominant Pollutant" is based on the highest AQI (Health Risk), which may not be the pollutant with the highest raw concentration.
                    </div>
                </div>
            </div>

            {/* Explicit height container to ensure chart renders */}
            <div style={{ width: '100%', height: 300 }} className="flex items-center justify-center">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            barSize={40}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-slate-400">
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No granular pollutant data available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PollutantBreakdown;
