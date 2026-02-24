import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';

const PollutantRiskRadar = ({ data }) => {
    if (!data) return <div className="h-64 bg-slate-50/50 rounded-xl animate-pulse"></div>;

    // Transform sub-indices object to array for Recharts
    // data is expected to be the 'sub_indices' object: { "PM2_5": 120, "NO2": 45, ... }
    const chartData = Object.keys(data).map(key => ({
        subject: key,
        A: data[key],
        fullMark: 500, // Max AQI
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                    <p className="font-bold text-slate-800">{label}</p>
                    <p className="text-sm font-medium text-slate-600">
                        Risk Index: <span className="font-bold text-indigo-600">{payload[0].value}</span>
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
                        Pollutant Risk Radar
                    </h3>
                    <p className="text-slate-500 text-sm">Normalized health impact (AQI Sub-Index).</p>
                </div>
                <div className="group relative">
                    <Info size={18} className="text-slate-400 cursor-help" />
                    <div className="absolute right-0 top-6 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                        This chart shows the relative danger of each pollutant on a scale of 0-500. A larger shape toward a pollutant means it is a higher health risk.
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', height: 300 }} className="flex items-center justify-center">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 500]} tick={false} axisLine={false} />
                            <Radar
                                name="Risk Index"
                                dataKey="A"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="#8b5cf6"
                                fillOpacity={0.4}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-slate-400">
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">No risk data available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PollutantRiskRadar;
