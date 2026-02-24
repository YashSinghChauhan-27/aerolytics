
import React from 'react';
import { Link } from 'react-router-dom';
import { Wind, Activity, Map, ArrowRight, Database, Brain, Heart, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';

const SmartNavbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Logo />
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works?</a>
                    <a href="#impact" className="hover:text-slate-900 transition-colors">Why it Matters?</a>
                    <Link to="/explore" className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100">
                        Explore Data <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </nav>
    );
};

const HomePage = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/30 font-sans">
            <SmartNavbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-200/40 rounded-full blur-[100px] mix-blend-multiply opacity-60 animate-pulse"></div>
                    <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px] mix-blend-multiply opacity-60 animate-pulse delay-700"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-emerald-700 mb-8 shadow-sm"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        AI-Powered Air Quality Forecasting
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight"
                    >
                        Breathe Smarter with <br />
                        <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Predictive Intelligence</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Don't just track pollution—anticipate it. Aerolytics leverages advanced Temporal Fusion Transformers to forecast air quality 24 hours in advance, empowering you to make healthier decisions.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/explore" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-lg">
                            Explore the Map <Map size={20} />
                        </Link>
                        <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-lg shadow-sm hover:shadow-md">
                            How it Works? <ChevronDown size={20} />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">From Data to Insight</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Our pipeline transforms raw sensor data into actionable health intelligence using state-of-the-art AI.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent z-0"></div>

                        <div className="relative z-10 bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center hover:border-blue-300 transition-colors group shadow-sm hover:shadow-md">
                            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                                <Database size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">1. Data Aggregation</h3>
                            <p className="text-slate-500 leading-relaxed">We ingest real-time pollutant data (PM2.5, NO₂, O₃) from thousands of OpenAQ sensors across 23 major cities.</p>
                        </div>

                        <div className="relative z-10 bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center hover:border-purple-300 transition-colors group shadow-sm hover:shadow-md">
                            <div className="w-16 h-16 mx-auto bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                                <Brain size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">2. AI Processing</h3>
                            <p className="text-slate-500 leading-relaxed">Our Temporal Fusion Transformer (TFT) model analyzes historical patterns and weather correlations to predict future trends.</p>
                        </div>

                        <div className="relative z-10 bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center hover:border-emerald-300 transition-colors group shadow-sm hover:shadow-md">
                            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                                <Activity size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Actionable Insights</h3>
                            <p className="text-slate-500 leading-relaxed">Receive precise 24-hour forecasts, causality explanations, and personalized health advisories.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="impact" className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-600 mb-6">
                            <Heart size={12} fill="currentColor" /> Why It Matters
                        </div>
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">Protecting What Matters Most</h2>
                        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                            Air pollution is a silent crisis affecting millions. Aerolytics equips you with the knowledge to protect vulnerable groups and advocate for cleaner air.
                        </p>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-emerald-600 font-bold">01</div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-900">For Parents</h4>
                                    <p className="text-slate-500">Know exactly when it's safe for your children to play outdoors.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-emerald-600 font-bold">02</div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-900">For Elderly</h4>
                                    <p className="text-slate-500">Receive alerts when PM2.5 levels pose respiratory risks.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 flex-shrink-0 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-emerald-600 font-bold">03</div>
                                <div>
                                    <h4 className="text-lg font-semibold text-slate-900">For Athletes</h4>
                                    <p className="text-slate-500">Optimize your training schedule around clean air windows.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200/50 to-blue-200/50 rounded-3xl blur-2xl opacity-70"></div>
                        <div className="relative bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
                            {/* Simplified Generic Dashboard UI Snippet */}
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Live Analysis</div>
                                    <div className="text-2xl font-bold text-slate-900">AQI 342 <span className="text-sm font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded ml-2 border border-red-100">Severe</span></div>
                                </div>
                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                    <Wind size={20} className="text-slate-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-32 bg-slate-50 rounded-xl relative overflow-hidden flex items-end px-4 pb-2 gap-1 border border-slate-100">
                                    {/* Mock Bars */}
                                    {[40, 60, 45, 70, 90, 100, 80, 60, 50, 40].map((h, i) => (
                                        <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-emerald-500/30 rounded-t-sm hover:bg-emerald-500/50 transition-colors"></div>
                                    ))}
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <h5 className="font-semibold text-blue-700 text-sm mb-1">Forecast Insight</h5>
                                    <p className="text-xs text-blue-600/80">Wind speed is expected to drop in 3 hours, likely causing a 15% spike in PM2.5 levels. Plan commute accordingly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <div className="mb-4 md:mb-0 transform scale-75 origin-left">
                        <Logo />
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-emerald-600 transition-colors">Data Methodology</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">API Documentation</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
                    </div>
                    <div className="mt-4 md:mt-0">
                        &copy; 2026 Aerolytics Project. Open Data.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
