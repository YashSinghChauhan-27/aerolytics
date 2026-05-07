# Aerolytics: 3-Minute Demo Script

*This script is designed for a relaxed, unhurried 2-3 minute screen-recorded presentation. Pace yourself and speak clearly.*

---

## 1. Introduction (30 seconds)

**🎥 VISUAL:** Open the main Aerolytics Dashboard. Slowly scroll through the main widgets so the UI is visible.

**🗣️ SCRIPT:**
"Hello everyone. Welcome to **Aerolytics**, an Urban Air Quality Intelligence Platform for India. 

Most air quality apps have a simple flaw: they show you a static number, but they never explain *why* the air is bad. I built Aerolytics to solve this. It doesn't just show data; it predicts the future and mathematically proves the exact causes of pollution."

---

## 2. Instant Data Backend (30 seconds)

**🎥 VISUAL:** Click over to the 'Explore' Map. Hover over a few cities to show the instant tooltips.

**🗣️ SCRIPT:**
"First, notice how instantly this map loads. 

Instead of freezing the app by fetching data from external servers, I built an asynchronous **FastAPI** backend. It uses silent background workers that fetch data 24/7 and store it locally. This means when a user opens the map, the data loads with zero latency."

---

## 3. The Novelty: Causality Engine (60 seconds)

**🎥 VISUAL:** Click into a city (like Delhi) and scroll down to the "What's Driving Pollution?" section. Hover over the insights.

**🗣️ SCRIPT:**
"Now for the most unique feature of the project: The **Causality Engine**. 

Normally, apps try to guess what causes pollution based on coincidence—if traffic and dust go up together, they assume traffic caused it. 

We moved past this. I implemented a strict mathematical engine using **Granger Causality**. Our system looks back in time to mathematically *prove* that a spike in traffic fumes is directly driving the dust today. Then, our engine translates those complex math equations into simple English, like telling the user: *'Extremely Strong Link: Traffic emissions are the key contributor.'*"

---

## 4. Smart Forecasting (30 seconds)

**🎥 VISUAL:** Scroll slightly up to the Forecast Chart. Point out the shaded area on the graph.

**🗣️ SCRIPT:**
"We also look at the future using advanced AI called a **Temporal Fusion Transformer**. 

Instead of just guessing a single number for tomorrow, our AI uses *Quantile Regression* to generate a shaded 'Confidence Band'. This visually shows the user exactly how certain or uncertain the AI is about the upcoming forecast."

---

## 5. Future: AI Chatbot & Wrap-up (30 seconds)

**🎥 VISUAL:** Click the floating Chatbot button to open the widget. 

**🗣️ SCRIPT:**
"Finally, to make this math accessible to everyone, our major future enhancement is this **Multilingual AI Chatbot**. 

We are developing it to take our data and offer personalized health advice based on a user's local neighborhood. To bridge the language gap in India, it will even speak out loud in regional languages like Hindi and Tamil.

Aerolytics is a complete, intelligent ecosystem. Thank you for watching."
