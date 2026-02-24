import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { CITIES, getAQIColor } from '../config/cities';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Trophy, AlertTriangle, BarChart2, MapPin, ArrowRight, X, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import 'leaflet/dist/leaflet.css';
import { fetchCityRankings } from '../api/client';

// Component to handle map interactions
const MapController = ({ selectedCity }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedCity) {
            map.setView([selectedCity.lat, selectedCity.lng], 10, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedCity, map]);
    return null;
};

// Extracted Marker Component 
const CityMarker = ({ city, selectedCity, onSelect, navigate }) => {
    const popupRef = useRef(null);
    const aqi = city.aqi; // Use real AQI from city object
    const isSelected = selectedCity?.name === city.name;
    const isNoData = aqi === -1;

    const handleClose = (e) => {
        e.stopPropagation();
        popupRef.current?.close();
    };

    // Fallback color for No Data
    const markerColor = isNoData ? '#cbd5e1' : getAQIColor(aqi);

    return (
        <CircleMarker
            center={[city.lat, city.lng]}
            radius={isSelected ? 12 : 6}
            fillColor={markerColor}
            color={isSelected ? "#ffffff" : "transparent"}
            weight={isSelected ? 3 : 0}
            opacity={1}
            fillOpacity={0.8}
            eventHandlers={{
                click: () => onSelect(city),
            }}
        >
            <Popup ref={popupRef} className="custom-popup" closeButton={false}>
                <div className="min-w-[200px] p-4 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl text-slate-900 relative">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X size={14} />
                    </button>

                    <div className="flex justify-between items-start mb-4 pr-6">
                        <div>
                            <h3 className="font-bold text-lg leading-none mb-1">{city.name}</h3>
                            <span className="text-xs text-slate-500">{city.state}</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-slate-100 text-xs font-mono text-slate-600 border border-slate-200">
                            IN
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                            <div className="text-xs text-slate-500 uppercase font-semibold mb-1">AQI Index</div>
                            <div className="text-3xl font-bold" style={{ color: markerColor }}>
                                {isNoData ? "--" : aqi}
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-200"></div>
                        <div className="flex-1">
                            <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Status</div>
                            <div className="text-sm font-medium text-slate-700">
                                {isNoData ? "No Data" : (aqi > 300 ? "Hazardous" : aqi > 200 ? "Very Poor" : aqi > 100 ? "Moderate" : "Good")}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate(`/city/${city.name}`)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        View Dashboard <ArrowRight size={14} />
                    </button>
                </div>
            </Popup>
        </CircleMarker>
    );
};

const ExplorePage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [rankedCities, setRankedCities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Real Rankings
    useEffect(() => {
        const loadRankings = async () => {
            try {
                const data = await fetchCityRankings();
                if (data && data.cities) {
                    setRankedCities(data.cities);
                }
            } catch (err) {
                console.error("Failed to fetch rankings:", err);
                // Fallback to config CITIES with mock 0s if fail, but prefer real data
            } finally {
                setLoading(false);
            }
        };
        loadRankings();
    }, []);

    // Helper to find real data for a city from search
    const getCityData = (cityName) => {
        return rankedCities.find(c => c.name === cityName) ||
            CITIES.find(c => c.name === cityName); // Fallback to config if not in ranked yet (rare)
    };

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSuggestions([]);
        } else {
            // Search in the RANKED list first to get real data, or fallback
            // Actually CITIES config is source of truth for *existence*, rankedCities is source for *data*
            const matches = rankedCities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
            setSuggestions(matches);
        }
    }, [searchTerm, rankedCities]);

    const handleSelectCity = (city) => {
        // City object already has real AQI from rankedCities
        setSelectedCity(city);
        setSearchTerm('');
        setSuggestions([]);
    };

    // Derived Lists from Real Data
    // Filter out No Data (-1) for rankings
    const validCities = rankedCities.filter(c => c.aqi !== -1);
    const cleanest = validCities.slice().sort((a, b) => a.aqi - b.aqi).slice(0, 5);
    const mostPolluted = validCities.slice().sort((a, b) => b.aqi - a.aqi).slice(0, 5);

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden relative">

            {/* Sidebar */}
            <div className="w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl">
                {/* ... (Header & Search remain similar, just use new handleSelectCity) ... */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all" title="Back to Home">
                            <ArrowLeft size={20} />
                        </Link>
                        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                            <Logo />
                        </Link>
                    </div>

                    {/* Search with Suggestions */}
                    <div className="relative z-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search city..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && suggestions.length > 0) {
                                        handleSelectCity(suggestions[0]);
                                    }
                                }}
                            />
                        </div>
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                {suggestions.map(city => (
                                    <button
                                        key={city.name}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                        onClick={() => handleSelectCity(city)}
                                    >
                                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{city.name}</span>
                                        <span className="text-xs text-slate-400 group-hover:text-slate-500">{city.state}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Stats Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Live Insights</h3>

                        {loading ? (
                            <div className="text-center py-4 text-slate-400 text-sm">Loading Rankings...</div>
                        ) : (
                            <div className="space-y-6">
                                {/* Top Performers */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3 text-emerald-600">
                                        <Trophy size={16} /> <span className="font-medium text-sm">Cleanest Cities</span>
                                    </div>
                                    <div className="space-y-2">
                                        {cleanest.map((c, i) => (
                                            <div key={c.name} className="flex justify-between text-sm group cursor-pointer hover:bg-slate-200/50 p-1 rounded" onClick={() => handleSelectCity(c)}>
                                                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{i + 1}. {c.name}</span>
                                                <span className="font-mono font-bold text-emerald-600">{c.aqi}</span>
                                            </div>
                                        ))}
                                        {cleanest.length === 0 && <div className="text-xs text-slate-400">No data available</div>}
                                    </div>
                                </div>

                                {/* Worst Performers */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3 text-red-500">
                                        <AlertTriangle size={16} /> <span className="font-medium text-sm">Most Polluted</span>
                                    </div>
                                    <div className="space-y-2">
                                        {mostPolluted.map((c, i) => (
                                            <div key={c.name} className="flex justify-between text-sm group cursor-pointer hover:bg-slate-200/50 p-1 rounded" onClick={() => handleSelectCity(c)}>
                                                <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{i + 1}. {c.name}</span>
                                                <span className="font-mono font-bold text-red-500">{c.aqi}</span>
                                            </div>
                                        ))}
                                        {mostPolluted.length === 0 && <div className="text-xs text-slate-400">No data available</div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compare CTA */}
                    <div className="mt-auto pt-6">
                        <Link to="/compare" className="block bg-gradient-to-br from-indigo-500 to-blue-500 p-[1px] rounded-xl group hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
                            {/* ... same content ... */}
                            <div className="bg-white rounded-[11px] p-4 h-full relative overflow-hidden group-hover:bg-opacity-90 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10 flex items-start gap-4">
                                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                        <BarChart2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">Compare Cities</h4>
                                        <p className="text-xs text-slate-500 mb-3 block">Analyze trends side-by-side to understand regional patterns.</p>
                                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mt-2">
                                            Launch Tool <ArrowRight size={12} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-slate-100">
                <MapContainer center={[22.5937, 78.9629]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', background: '#d6e9f8' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    <MapController selectedCity={selectedCity} />

                    {rankedCities.map((city) => (
                        <CityMarker
                            key={city.name}
                            city={city}
                            selectedCity={selectedCity}
                            onSelect={handleSelectCity}
                            navigate={navigate}
                        />
                    ))}
                </MapContainer>

                {/* AQI Legend Overlay (Same) */}
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">AQI Scale</h4>
                    <div className="space-y-2 text-xs font-medium">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#00b050] shadow-[0_0_8px_rgba(0,176,80,0.4)]"></span> <span className="text-slate-700">Good (0-50)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#92d050]"></span> <span className="text-slate-700">Satisfactory (51-100)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ffff00]"></span> <span className="text-slate-700">Moderate (101-200)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ff9900]"></span> <span className="text-slate-700">Poor (201-300)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ff0000]"></span> <span className="text-slate-700">Very Poor (301-400)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#c00000] shadow-[0_0_8px_rgba(192,0,0,0.4)]"></span> <span className="text-slate-700">Severe (401+)</span></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExplorePage;
