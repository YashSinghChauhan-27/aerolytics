
import axios from 'axios';

// In development: uses VITE_API_BASE_URL from frontend/.env.development (http://localhost:8000)
// In production:  uses VITE_API_BASE_URL from frontend/.env.production  (your Render URL)
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});


export const fetchCurrentAQI = async (city = 'Delhi') => {
  const response = await client.get(`/aqi/current?city=${city}`);
  return response.data;
};

export const fetchAQIForecast = async (city = 'Delhi') => {
  const response = await client.get(`/aqi/forecast?city=${city}`);
  return response.data;
};

export const fetchCausalAnalysis = async (city = 'Delhi') => {
  const response = await client.get(`/analyze/causal?city=${city}`);
  return response.data;
};

export const fetchCityRankings = async () => {
  const response = await client.get(`/aqi/rankings`);
  return response.data;
};

export default client;
