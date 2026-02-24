
export const CITIES = [
    { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
    { name: "Aizawl", state: "Mizoram", lat: 23.7307, lng: 92.7176 },
    { name: "Amaravati", state: "Andhra Pradesh", lat: 16.5417, lng: 80.5158 },
    { name: "Amritsar", state: "Punjab", lat: 31.6340, lng: 74.8723 },
    { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
    { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
    { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
    { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
    { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
    { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
    { name: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266 },
    { name: "Guwahati", state: "Assam", lat: 26.1158, lng: 91.7086 },
    { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
    { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
    { name: "Jorapokhar", state: "Jharkhand", lat: 23.7000, lng: 86.4167 }, // Approx
    { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
    { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
    { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
    { name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376 },
    { name: "Shillong", state: "Meghalaya", lat: 25.5788, lng: 91.8933 },
    { name: "Talcher", state: "Odisha", lat: 20.9500, lng: 85.2167 },
    { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
    { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 }
];

export const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00b050'; // Good
    if (aqi <= 100) return '#92d050'; // Satisfactory
    if (aqi <= 200) return '#ffff00'; // Moderate
    if (aqi <= 300) return '#ff9900'; // Poor
    if (aqi <= 400) return '#ff0000'; // Very Poor
    return '#c00000'; // Severe
};
