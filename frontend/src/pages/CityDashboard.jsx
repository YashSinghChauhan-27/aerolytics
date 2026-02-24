
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCurrentAQI, fetchAQIForecast, fetchCausalAnalysis } from '../api/client';
import { useQuery } from '@tanstack/react-query';
import AQICard from '../components/AQICard';
import ForecastChart from '../components/ForecastChart';
import CausalAnalysis from '../components/CausalAnalysis';
import PollutantBreakdown from '../components/PollutantBreakdown';
import PollutantRiskRadar from '../components/PollutantRiskRadar';
import Logo from '../components/Logo';
import { MapPin, ArrowLeft, Download, FileText, Activity } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useRefresh } from '../context/RefreshContext';

const CityDashboard = () => {
    const { cityName } = useParams();
    const refreshTrigger = useRefresh();
    // Decode URL parameter if needed, or use directly. 
    // e.g. /city/New%20Delhi -> New Delhi
    const city = decodeURIComponent(cityName || 'Delhi');


    const { data: dashboardData, isLoading: loading, isError, error } = useQuery({
        queryKey: ['dashboard', city, refreshTrigger],
        queryFn: async () => {
            try {
                console.log(`Fetching dashboard data for ${city}...`);
                const [aqiData, forecastData, causalData] = await Promise.all([
                    fetchCurrentAQI(city),
                    fetchAQIForecast(city),
                    fetchCausalAnalysis(city)
                ]);
                return {
                    currentAQI: aqiData,
                    forecast: forecastData.forecast,
                    causal: causalData
                };
            } catch (err) {
                console.error("Dashboard Data Fetch Error:", err);
                throw err;
            }
        },
        retry: 1,
        staleTime: 60000 // Cache for 1 minute
    });

    const currentAQI = dashboardData?.currentAQI;
    const forecast = dashboardData?.forecast;
    const causal = dashboardData?.causal;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-slate-800">Loading Dashboard...</h2>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Data</h2>
                    <p className="text-slate-500 mb-6">
                        We couldn't fetch the latest air quality data for {city}. Is the backend server running?
                    </p>
                    <div className="text-xs text-left bg-slate-50 p-4 rounded border border-slate-200 mb-6 font-mono overflow-auto max-h-32">
                        {error?.message || "Unknown Error"}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                    <Link to="/explore" className="block mt-4 text-indigo-600 hover:underline text-sm">
                        Go to Explore Map
                    </Link>
                </div>
            </div>
        );
    }

    const handleDownloadPDF = async () => {
        const element = document.getElementById('dashboard-content');
        if (!element) return;

        try {
            document.body.style.cursor = 'wait';

            // Wait for animations
            await new Promise(resolve => setTimeout(resolve, 1000));

            // html-to-image is more robust with modern CSS (oklch)
            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff', // white
                width: element.scrollWidth,
                height: element.scrollHeight,
                style: {
                    overflow: 'visible',
                    height: 'auto',
                    margin: '0', // Reset margins to avoid centering issues during capture
                    maxWidth: 'none', // Allow full width capture
                    width: '100%' // Ensure full width usage
                }
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pageHeight = 297;

            const img = new Image();
            img.src = dataUrl;

            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const imgHeight = (img.height * pdfWidth) / img.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const date = new Date().toLocaleString();
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Generated on: ${date}`, 10, pageHeight - 10);

            pdf.save(`Aerolytics_Report_${city}_${Date.now()}.pdf`);

        } catch (error) {
            console.error("PDF generation failed:", error);
            alert(`Failed to generate report: ${error.message || error}`);
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 text-slate-900 selection:bg-emerald-500/30 pb-20">
            {/* Navbar */}
            <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/explore" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <Logo />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                        >
                            <Download size={16} />
                            <span>Download Report</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main id="dashboard-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header: City Name + Health Advisory */}
                <div className="flex items-end justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 ring-1 ring-slate-900/5">
                            <MapPin size={32} className="text-slate-900" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-5xl font-bold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 bg-clip-text text-transparent">{city}</h1>
                            <p className="text-slate-500 text-lg mt-1 font-medium">Real-time Air Quality & Forecast</p>
                        </div>
                    </div>

                    <Link to={`/health-advisory?city=${encodeURIComponent(city)}`} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-sm font-medium rounded-lg transition-all border border-slate-200 hover:border-emerald-200 shadow-sm mb-1">
                        <Activity size={16} />
                        <span> Health Advisory</span>
                    </Link>
                </div>

                {/* Top Grid: AQI + Forecast */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left: Forecast Chart */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        <div className="flex-1 h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-1">
                            <ForecastChart data={forecast} />
                        </div>
                    </div>

                    {/* Right: Current Status */}
                    <div className="lg:col-span-4 flex flex-col h-full">
                        <div className="flex-1 h-full">
                            <AQICard data={currentAQI?.data} aqi={currentAQI?.aqi} className="h-full" />
                        </div>
                    </div>
                </div>

                {/* Middle Section: Detailed Breakdown & Risk Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    <PollutantBreakdown data={currentAQI?.data} />
                    <PollutantRiskRadar data={currentAQI?.aqi?.sub_indices} />
                </div>

                {/* Bottom Grid: Analysis (Full Width) */}
                <div className="w-full">
                    <CausalAnalysis analysis={causal} />
                </div>

            </main>
        </div>
    );
};

export default CityDashboard;
