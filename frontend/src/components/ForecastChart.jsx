import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ForecastChart = ({ data }) => {
    if (!data) return <div className="h-64 bg-slate-50/50 rounded-xl animate-pulse"></div>;

    if (data.length === 0) {
        return (
            <div className="h-full flex flex-col p-4 items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4"></div>
                <h3 className="text-slate-800 font-bold text-lg">Gathering Data</h3>
                <p className="text-slate-500 text-sm max-w-xs mt-1">
                    We need 24 hours of data to generate accurate AI predictions. Please check back later.
                </p>
            </div>
        );
    }

    // Filter to show next 24 hours
    const chartData = data.slice(0, 24);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                    <p className="font-bold text-slate-800">{new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-indigo-600 font-bold">AQI: {payload[0].value.toFixed(0)}</p>
                    <p className="text-xs text-slate-500">{payload[0].payload.Category}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        24-Hour Forecast
                    </h3>
                    <p className="text-slate-500 text-sm">Predicted Air Quality Index (AQI)</p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAQI" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="Datetime"
                            tickFormatter={(str) => new Date(str).getHours() + 'h'}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            minTickGap={30}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="AQI"
                            stroke="#6366f1"
                            fillOpacity={1}
                            fill="url(#colorAQI)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ForecastChart;
