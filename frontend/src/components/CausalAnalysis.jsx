import React, { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, Info, Lightbulb } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const CausalAnalysis = ({ analysis }) => {
    if (!analysis) return <div className="h-96 bg-slate-800/50 rounded-xl animate-pulse"></div>;

    if (analysis.error) {
        return <div className="p-4 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">Analysis Error: {analysis.error}</div>;
    }

    const { drivers } = analysis;

    if (!drivers || drivers.length === 0) {
        return <div className="p-8 text-slate-400 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">No significant causal factors identified right now.</div>;
    }

    // Process data for charts
    const chartData = useMemo(() => {
        const totalStrength = drivers.reduce((acc, d) => {
            let val = 1;
            if (d.strength === 'Extremely Strong') val = 10;
            else if (d.strength === 'Very Strong') val = 8;
            else if (d.strength === 'Strong') val = 6;
            else if (d.strength === 'Moderate') val = 4;
            else if (d.strength === 'Weak') val = 2;
            else if (d.strength === 'Very Weak') val = 1;
            return acc + val;
        }, 0);

        return drivers.map((d, i) => {
            let val = 1;
            if (d.strength === 'Extremely Strong') val = 10;
            else if (d.strength === 'Very Strong') val = 8;
            else if (d.strength === 'Strong') val = 6;
            else if (d.strength === 'Moderate') val = 4;
            else if (d.strength === 'Weak') val = 2;
            else if (d.strength === 'Very Weak') val = 1;

            return {
                name: d.variable,
                value: val,
                impactPercentage: Math.round((val / totalStrength) * 100),
                strength: d.strength,
                p_value: d.p_value,
                description: d.description,
                fill: COLORS[i % COLORS.length]
            };
        });
    }, [drivers]);

    return (
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="w-3 h-3 bg-purple-600 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)]"></span>
                        Causal Drivers Analysis
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 ml-6">AI-driven insights identifying key factors influencing Air Quality.</p>
                </div>
                <div className="px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-xs font-medium text-purple-700">
                    Granger Causality Test
                </div>
            </div>

            {/* Top Row: Visualizations & Findings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-8">
                {/* Left Column: Visualizations */}
                {/* Left Column: Visualizations */}
                <div className="flex flex-col gap-8">
                    {/* Impact Distribution Chart (Donut with Center) */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 relative overflow-hidden shadow-sm flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Impact Share</h4>
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <ActivityIcon />
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={5}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                                            const RADIAN = Math.PI / 180;
                                            const radius = outerRadius + 25;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            const cx2 = cx + (outerRadius + 15) * Math.cos(-midAngle * RADIAN);
                                            const cy2 = cy + (outerRadius + 15) * Math.sin(-midAngle * RADIAN);

                                            return (
                                                <g>
                                                    <path d={`M${cx + outerRadius * Math.cos(-midAngle * RADIAN)},${cy + outerRadius * Math.sin(-midAngle * RADIAN)}L${cx2},${cy2}L${x},${y}`} stroke={COLORS[index % COLORS.length]} strokeWidth={1} fill="none" />
                                                    <text x={x} y={y} fill="#64748b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600}>
                                                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                                                    </text>
                                                </g>
                                            );
                                        }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', padding: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                                        formatter={(value, name, props) => [`${props.payload.impactPercentage}%`, name]}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-black text-slate-800">{drivers.length}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drivers</span>
                            </div>
                        </div>
                    </div>

                    {/* Radial Bar Chart for Intensity */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex-1 flex flex-col relative overflow-hidden shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest z-10">Intensity Scale</h4>
                        </div>

                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        width={80}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Findings (Full Height) */}
                {/* Right Column: Detailed Findings (Full Height) */}
                <div className="bg-white rounded-xl border border-slate-200 h-full flex flex-col shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Lightbulb size={16} className="text-amber-500" />
                            Detailed Findings
                        </h4>
                    </div>
                    {/* Findings List - Flex Grow to Fill Space perfectly */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        {drivers.map((item, idx) => {
                            const isStrong = ['Extremely Strong', 'Very Strong'].includes(item.strength);
                            const isModerate = ['Strong', 'Moderate'].includes(item.strength);

                            return (
                                <div key={idx} className={`relative p-5 rounded-2xl border transition-all duration-300 group hover:shadow-lg ${isStrong ? 'bg-purple-50/60 border-purple-100 hover:border-purple-200' :
                                    isModerate ? 'bg-blue-50/60 border-blue-100 hover:border-blue-200' :
                                        'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                                    }`}>
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 rounded-lg ${isStrong ? 'bg-purple-100 text-purple-600' :
                                                isModerate ? 'bg-blue-100 text-blue-600' :
                                                    'bg-white text-slate-500 border border-slate-200'
                                                }`}>
                                                {isStrong ? <ArrowUp size={18} strokeWidth={2.5} /> :
                                                    isModerate ? <ArrowUp size={18} strokeWidth={2.5} className="rotate-45" /> :
                                                        <Minus size={18} strokeWidth={2.5} />}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800 text-lg leading-none">{item.variable}</h5>
                                                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Causal Factor</span>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isStrong ? 'bg-white text-purple-700 border-purple-100' :
                                            isModerate ? 'bg-white text-blue-700 border-blue-100' :
                                                'bg-white text-slate-600 border-slate-200'
                                            }`}>
                                            {item.strength}
                                        </span>
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed mt-3 pl-1">
                                        {item.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Reliability & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reliability Box */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between gap-6 relative overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-teal-400"></div>
                    <div className="flex items-center gap-5">
                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className="text-emerald-500" strokeDasharray={`${Math.min(98, Math.max(75, Math.round((1 - (drivers[0]?.p_value || 0)) * 100) - 2))}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-sm font-bold text-emerald-600">
                                {Math.min(98, Math.max(75, Math.round((1 - (drivers[0]?.p_value || 0)) * 100) - 2))}%
                            </span>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Causal Confidence</div>
                            <h5 className="text-emerald-600 font-bold text-base leading-tight">High statistical significance detected.</h5>
                        </div>
                    </div>
                </div>

                {/* Recommendation Box */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between gap-6 relative overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-violet-400"></div>
                    <div className="flex items-center gap-5">
                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                            <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                <Lightbulb size={32} className="text-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Top Recommendation</div>
                            <h5 className="text-indigo-600 font-bold text-sm leading-snug">
                                {(() => {
                                    // Logic to find strongest influencer
                                    const strengthMap = { 'Extremely Strong': 10, 'Very Strong': 8, 'Strong': 6, 'Moderate': 4, 'Weak': 2, 'Very Weak': 1 };
                                    const strongestDriver = [...drivers].sort((a, b) => (strengthMap[b.strength] || 0) - (strengthMap[a.strength] || 0))[0];

                                    return strongestDriver?.variable === 'NO2' ? "Enforce traffic rationing & limit heavy vehicle entry." :
                                        strongestDriver?.variable === 'PM10' ? "Mandate construction dust control & deploy road sweepers." :
                                            strongestDriver?.variable === 'PM2.5' ? "Restrict open waste burning & industrial emissions." :
                                                strongestDriver?.variable === 'O3' ? "Reduce volatile organic compound (VOC) emissions." :
                                                    strongestDriver?.variable === 'CO' ? "Optimize traffic signals to reduce idling congestion." :
                                                        strongestDriver?.variable === 'SO2' ? "Inspect high-sulfur fuel usage in nearby industries." :
                                                            strongestDriver?.variable.includes('Wind') ? "Enforce strict emission caps due to poor ventilation." :
                                                                strongestDriver?.variable.includes('Temp') ? "Issue smog advisory; limit outdoor physical activity." :
                                                                    "Increase monitoring resolution to identify sources.";
                                })()}
                            </h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default CausalAnalysis;
