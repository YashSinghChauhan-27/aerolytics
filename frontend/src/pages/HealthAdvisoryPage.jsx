import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Activity, Heart, Wind, Shield, Users,
    AlertTriangle, Baby, UserPlus, ArrowLeft, CheckCircle2, Home, TreePine,
    Calendar, Info, MapPin
} from 'lucide-react';
import Logo from '../components/Logo';
import { fetchCurrentAQI } from '../api/client';

const HealthAdvisoryPage = () => {
    const [searchParams] = useSearchParams();
    const city = searchParams.get('city') || 'Delhi';

    const [aqiData, setAqiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTipTab, setActiveTipTab] = useState('indoor');

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const data = await fetchCurrentAQI(city);
                setAqiData(data);
            } catch (err) {
                console.error("Failed to load AQI data", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [city]);

    // Helper to determine risk based on AQI
    const getRiskLevel = (aqi, baseRisk) => {
        if (!aqi) return baseRisk;
        if (aqi > 300) return 'Critical';
        if (aqi > 200) return 'High';
        if (aqi > 100) return 'Medium';
        return 'Low';
    };

    const currentAQI = aqiData?.aqi?.aqi || 0;
    const currentCategory = aqiData?.aqi?.category || 'Unknown';

    const healthImpacts = [
        {
            title: "Asthma & Respiratory Infections",
            description: "Aggravation of asthma, increased susceptibility to respiratory infections.",
            pollutants: ["PM2.5", "PM10", "NO2", "O3"],
            baseRisk: "High",
            icon: <Wind className="w-6 h-6 text-blue-400" />
        },
        {
            title: "Chronic Obstructive Pulmonary Disease (COPD)",
            description: "Worsening of lung function and increased difficulty in breathing.",
            pollutants: ["PM2.5", "PM10", "NO2"],
            baseRisk: "High",
            icon: <Activity className="w-6 h-6 text-red-400" />
        },
        {
            title: "Cardiovascular Diseases",
            description: "Increased risk of heart attacks, arrhythmias, and strokes.",
            pollutants: ["PM2.5", "CO", "PM10"],
            baseRisk: "High",
            icon: <Heart className="w-6 h-6 text-rose-500" />
        },
        {
            title: "Reduced Lung Function",
            description: "Long-term exposure can lead to permanent reduction in lung capacity.",
            pollutants: ["PM2.5", "O3", "NO2"],
            baseRisk: "Medium",
            icon: <Activity className="w-6 h-6 text-orange-400" />
        },
        {
            title: "Premature Mortality",
            description: "Shortened life expectancy due to chronic exposure to high pollution.",
            pollutants: ["PM2.5", "PM10", "CO", "NO2", "SO2"],
            baseRisk: "High",
            icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />
        }
    ];

    // Dynamic Recommendations
    const getRecommendation = (group) => {
        if (currentAQI > 300) return "🚨 STRICTLY AVOID OUTDOORS. Use air purifiers immediately.";
        if (currentAQI > 200) return "⚠️ Avoid outdoor activities. Wear N95 masks if stepping out.";
        if (currentAQI > 100) return "✋ Limit prolonged outdoor exertion.";
        return "✅ Safe to enjoy normal outdoor activities.";
    };

    const vulnerableGroups = [
        {
            title: "Children (0-14 years)",
            riskFactors: "Developing lungs, higher breathing rate.",
            icon: <Baby className="w-8 h-8 text-indigo-400" />
        },
        {
            title: "Elderly (65+ years)",
            riskFactors: "Weaker immune systems, reduced lung capacity.",
            icon: <UserPlus className="w-8 h-8 text-emerald-400" />
        },
        {
            title: "Pregnant Women",
            riskFactors: "Increased risk of developmental issues.",
            icon: <Users className="w-8 h-8 text-pink-400" />
        },
        {
            title: "Pre-existing Conditions",
            riskFactors: "Asthma, COPD, Heart Disease.",
            icon: <Heart className="w-8 h-8 text-red-400" />
        }
    ];

    const safetyTips = {
        indoor: [
            "Use HEPA air purifiers in bedrooms and living areas.",
            "Keep windows closed during early morning and late evening.",
            "Wet mop floors daily to trap dust; avoid broom sweeping.",
            "Introduce indoor plants like Snake Plant or Spider Plant."
        ],
        outdoor: [
            "Wear an N95 or N99 mask if AQI is above 200.",
            "Avoid outdoor exercise when AQI is Poor or worse.",
            "Travel during off-peak hours to avoid traffic emissions.",
            "Shower after returning home to remove particulate matter."
        ],
        longterm: [
            "Advocate for cleaner energy and strict emission norms.",
            "Plant trees around your community to create a buffer.",
            "Switch to electric vehicles or use public transport.",
            "Regularly service your vehicle to minimize emissions."
        ]
    };

    const getRowStyle = (min, max) => {
        if (currentAQI >= min && currentAQI <= max) {
            return "bg-slate-100 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.01] transition-transform";
        }
        return "border-b border-slate-200 opacity-60 hover:opacity-100 transition-opacity";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/30 pb-20">
            {/* Navbar */}
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to={`/city/${city}`} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <Logo />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                        <MapPin size={14} className="text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">{city}</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

                {/* Header with Dynamic Context */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 mb-4 shadow-sm">
                        <span className="text-slate-500 text-sm">Real-time Analysis for</span>
                        <span className="font-bold text-slate-900">{city}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-slate-500 text-sm">AQI: </span>
                        <span className={`font-bold ${currentAQI > 200 ? 'text-red-500' : 'text-emerald-600'}`}>{currentAQI}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent py-2 leading-tight">
                        Health Impact & Advisory
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        Current air quality in <span className="text-slate-900 font-medium">{city}</span> is
                        <span className={`font-bold ${currentAQI > 200 ? 'text-red-600' : currentAQI > 100 ? 'text-orange-500' : 'text-emerald-600'}`}> {currentCategory}</span>.
                        See specific health risks below.
                    </p>
                </div>

                {/* Section 1: Health Impacts (Dynamic Risk) */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Heart className="text-rose-500" size={28} />
                        <h2 className="text-2xl font-bold text-slate-800">Health Impacts Now</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {healthImpacts.map((impact, idx) => {
                            const risk = getRiskLevel(currentAQI, impact.baseRisk);
                            const isHigh = risk === 'High' || risk === 'Critical';

                            return (
                                <div key={idx} className={`bg-white border p-6 rounded-2xl transition-all group shadow-sm ${isHigh ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors border border-slate-100">
                                            {impact.icon}
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${risk === 'Critical' ? 'bg-red-600 text-white animate-pulse' :
                                            risk === 'High' ? 'bg-red-100 text-red-600' :
                                                risk === 'Medium' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-emerald-100 text-emerald-600'
                                            }`}>
                                            Risk: {risk}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-slate-800 group-hover:text-emerald-600 transition-colors">{impact.title}</h3>
                                    <p className="text-slate-500 text-sm mb-4 leading-relaxed">{impact.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Section 2: Vulnerable Groups (Dynamic Recs) */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Users className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-bold text-slate-800">Vulnerable Groups Advisory</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vulnerableGroups.map((group, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 p-8 rounded-2xl flex gap-6 items-start shadow-sm">
                                <div className="p-4 bg-white rounded-xl shrink-0 border border-slate-100 shadow-sm">
                                    {group.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-800">{group.title}</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Risk Factors</span>
                                            <p className="text-slate-600 text-sm mt-1">{group.riskFactors}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Current Recommendation</span>
                                            <p className={`text-sm mt-1 font-bold ${currentAQI > 200 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                {getRecommendation(group)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 3: AQI Guide (Fixed Layout) */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Info className="text-purple-500" size={28} />
                        <h2 className="text-2xl font-bold text-slate-800">AQI Impact Guide</h2>
                    </div>
                    {/* Removed overflow-x-auto to force fit, added break-words to handle text wrapping */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-200">
                                    <th className="p-4 font-semibold w-1/4">Category</th>
                                    <th className="p-4 font-semibold w-1/6">AQI</th>
                                    <th className="p-4 font-semibold w-1/3">Health Impacts</th>
                                    <th className="p-4 font-semibold w-1/4">Precautions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className={getRowStyle(0, 50)}>
                                    <td className="p-4 font-bold text-emerald-700 break-words">Good</td>
                                    <td className="p-4 text-slate-700">0-50</td>
                                    <td className="p-4 text-slate-700 break-words">Minimal impact.</td>
                                    <td className="p-4 text-emerald-700 font-medium break-words">Enjoy outdoor activities.</td>
                                </tr>
                                <tr className={getRowStyle(51, 100)}>
                                    <td className="p-4 font-bold text-lime-700 break-words">Satisfactory</td>
                                    <td className="p-4 text-slate-700">51-100</td>
                                    <td className="p-4 text-slate-700 break-words">Minor breathing discomfort to sensitive people.</td>
                                    <td className="p-4 text-lime-700 font-medium break-words">Sensitive groups should limit exertion.</td>
                                </tr>
                                <tr className={getRowStyle(101, 200)}>
                                    <td className="p-4 font-bold text-yellow-700 break-words">Moderate</td>
                                    <td className="p-4 text-slate-700">101-200</td>
                                    <td className="p-4 text-slate-700 break-words">Breathing discomfort to people with lung disease.</td>
                                    <td className="p-4 text-yellow-700 font-medium break-words">Reduce heavy exertion outdoors.</td>
                                </tr>
                                <tr className={getRowStyle(201, 300)}>
                                    <td className="p-4 font-bold text-orange-700 break-words">Poor</td>
                                    <td className="p-4 text-slate-700">201-300</td>
                                    <td className="p-4 text-slate-700 break-words">Breathing discomfort to most people.</td>
                                    <td className="p-4 text-orange-700 font-medium break-words">Wear masks (N95).</td>
                                </tr>
                                <tr className={getRowStyle(301, 400)}>
                                    <td className="p-4 font-bold text-red-700 break-words">Very Poor</td>
                                    <td className="p-4 text-slate-700">301-400</td>
                                    <td className="p-4 text-slate-700 break-words">Respiratory illness on prolonged exposure.</td>
                                    <td className="p-4 text-red-700 font-medium break-words">Stay indoors. Use air purifiers.</td>
                                </tr>
                                <tr className={getRowStyle(401, 999)}>
                                    <td className="p-4 font-bold text-red-800 break-words">Severe</td>
                                    <td className="p-4 text-slate-700">400+</td>
                                    <td className="p-4 text-slate-700 break-words">Affects healthy people seriously.</td>
                                    <td className="p-4 text-red-800 font-bold break-words">Health Emergency. Avoid outdoors.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Section 4: Safety Tips (Dynamic) */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="text-emerald-500" size={28} />
                        <h2 className="text-2xl font-bold text-slate-800">Safety Tips for {currentAQI > 200 ? 'High Pollution' : 'Current Conditions'}</h2>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex border-b border-slate-200">
                            {['indoor', 'outdoor', 'longterm'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTipTab(tab)}
                                    className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-all ${activeTipTab === tab
                                        ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab === 'indoor' && <span className="flex items-center justify-center gap-2"><Home size={16} /> Indoor</span>}
                                    {tab === 'outdoor' && <span className="flex items-center justify-center gap-2"><TreePine size={16} /> Outdoor</span>}
                                    {tab === 'longterm' && <span className="flex items-center justify-center gap-2"><Calendar size={16} /> Long Term</span>}
                                </button>
                            ))}
                        </div>
                        <div className="p-8">
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(currentAQI > 200 ?
                                    // High Pollution Tips
                                    {
                                        indoor: [
                                            "🚨 Run air purifiers on high mode 24/7.",
                                            "🔒 SEAL all windows/doors with draft stoppers.",
                                            "🧹 Wet mop only—DO NOT sweep (it raises dust).",
                                            "🕯️ Avoid burning candles or incense."
                                        ],
                                        outdoor: [
                                            "😷 N95/N99 Mask is MANDATORY if stepping out.",
                                            "🚫 CANCEL all outdoor cardio/running.",
                                            "🚗 Travel with car windows rolled up + AC on recirculation mode.",
                                            "👀 Wash eyes with cold water immediately after returning."
                                        ],
                                        longterm: [
                                            "🏢 Advocate for office 'Work From Home' policies during smog.",
                                            "🌿 Create a 'green wall' of vertical indoor gardens.",
                                            "🌬️ Invest in a high-quality HEPA filter for your HVAC system."
                                        ]
                                    } :
                                    // Low/Moderate Pollution Tips
                                    {
                                        indoor: [
                                            "🍃 Ventilate home (open windows) between 12 PM - 4 PM.",
                                            "🧹 Regular dusting is sufficient.",
                                            "🪴 Maintain indoor plants for oxygenation.",
                                            "🌬️ Use exhaust fans while cooking."
                                        ],
                                        outdoor: [
                                            "🏃‍♂️ Enjoy outdoor activities, but stay hydrated.",
                                            "😷 Sensitive groups can carry a mask just in case.",
                                            "🚲 Cycle or walk for short commutes.",
                                            "🌳 Spend time in parks with dense green cover."
                                        ],
                                        longterm: [
                                            "🌲 Plant native trees in your neighborhood.",
                                            "⚡ Transition to solar power if possible.",
                                            "♻️ Practice waste segregation to prevent landfill fires."
                                        ]
                                    }
                                )[activeTipTab].map((tip, idx) => (
                                    <li key={idx} className={`flex items-start gap-3 p-4 rounded-xl border ${currentAQI > 200 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                        <CheckCircle2 className={`${currentAQI > 200 ? 'text-red-500' : 'text-emerald-500'} shrink-0 mt-0.5`} size={20} />
                                        <span className="text-slate-700 text-sm leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default HealthAdvisoryPage;
