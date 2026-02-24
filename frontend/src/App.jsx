
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import CityDashboard from './pages/CityDashboard';
import ComparisonPage from './pages/ComparisonPage';

import { RefreshProvider } from './context/RefreshContext';

import HealthAdvisoryPage from './pages/HealthAdvisoryPage';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data is never stale automatically (Load Once)
      refetchOnWindowFocus: false, // Don't refetch on tab switch
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RefreshProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/city/:cityName" element={<CityDashboard />} />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route path="/health-advisory" element={<HealthAdvisoryPage />} />
          </Routes>
        </Router>
      </RefreshProvider>
    </QueryClientProvider>
  );
}

export default App;
