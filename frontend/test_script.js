    <script type="module" src="/src/main.jsx">

    <!-- Aerolytics Chatbot Widget -->
    <div id="cb-wrapper">
      <button id="cb-trig" aria-label="Open AQI chatbot" onclick="document.getElementById('cb-panel').classList.toggle('open');if(document.getElementById('cb-panel').classList.contains('open')&&typeof startChat==='function')startChat();">🌬️</button>

      <div id="cb-panel" role="dialog">
        <div class="cb-hdr">
          <div class="cb-hdr-icon">
          <svg style="width:24px;height:24px;color:var(--cb-link)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1M4 7l2 1M9 22h6a2 2 0 002-2V7.414A2 2 0 0016.414 6L12 1.586A2 2 0 007.586 6L4 9.414A2 2 0 004 12v8a2 2 0 002 2z"></path></svg>
        </div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:15px;color:var(--cb-text)">Aerolytics · Local AQI</div>
          <div style="font-size:11px;color:var(--cb-muted)">Chennai · Bengaluru · Delhi</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="cb-lang-sel" style="background:var(--cb-surface);border:1px solid var(--cb-border);color:var(--cb-text);padding:2px 4px;border-radius:4px;font-size:11px;cursor:pointer;outline:none">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
          <button id="cb-tts-btn" style="background:transparent;border:none;color:var(--cb-text);font-size:14px;cursor:pointer">🔇</button>
          <div style="font-size:11px;color:var(--cb-good);display:flex;align-items:center;gap:4px">
            <span style="width:6px;height:6px;background:var(--cb-good);border-radius:50%;display:inline-block"></span> Live
          </div>
        </div>
      </div>

        <!-- API key setup screen -->
        <div id="cb-setup" style="display:none">
          <div class="cb-setup-icon">🔑</div>
          <div class="cb-setup-title">Connect to Live Sensors</div>
          <div class="cb-setup-sub">This chatbot uses real OpenAQ sensor stations across Chennai. A <b style="color:var(--cb-text)">free API key</b> is needed to fetch live data.</div>
          <div class="cb-setup-steps">
            <div class="cb-setup-step"><span>1.</span> Go to <b style="color:var(--cb-sky)">openaq.org/register</b></div>
            <div class="cb-setup-step"><span>2.</span> Sign up free → "API Keys" → Create key</div>
            <div class="cb-setup-step"><span>3.</span> Paste it below — stored only in your browser</div>
          </div>
          <input id="cb-apikey-input" placeholder="Paste your OpenAQ API key here…" autocomplete="off"/>
          <button id="cb-apikey-btn">✓ Connect & Start</button>
          <div class="cb-setup-skip" id="cb-skip-btn">Skip — use offline knowledge only</div>
        </div>

        <!-- Chat view (hidden until key entered) -->
        <div id="cb-msgs" style="display:flex"></div>
        <div class="cb-ftr" id="cb-ftr">
          <textarea id="cb-inp" rows="1" placeholder="Ask about an area, health, or AQI…"></textarea>
          <button id="cb-snd" aria-label="Send">
            <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>

219:     
220:     (function(){
      // ── REAL CHENNAI MONITORING STATIONS (OpenAQ v3 verified) ─────────────────────
      const STATIONS = {
        arumbakkam: {
          loc: 11581, label: "Arumbakkam", authority: "TNPCB",
          zone: "Residential (North-West Chennai)",
          sensors: { PM2_5:12236274, PM10:12236273, NO2:39337, SO2:39521 },
          units:   { PM2_5:"µg/m³",   PM10:"µg/m³",  NO2:"µg/m³", SO2:"µg/m³" },
          ppb:     [], 
          note: "Standard residential area. Air quality influenced by Koyambedu market traffic and the Western arterial road."
        },
        alandur: {
          loc: 3409319, label: "Alandur Bus Depot", authority: "CPCB",
          zone: "Major Transport Hub (South-West Chennai)",
          sensors: { PM2_5:12235549, PM10:12235548, NO2:12235546, CO:12235544, O3:12235547 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],  
          note: "Next to a major bus terminus. Diesel exhaust from buses keeps NO₂ and CO elevated, especially 6–10 AM & 5–9 PM."
        },
        velachery: {
          loc: 5655, label: "Velachery", authority: "CPCB",
          zone: "Dense Residential / IT Corridor (South Chennai)",
          sensors: { PM2_5:12235531, PM10:12235530, NO2:12235528, CO:12235526, O3:12235529 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: "Busy residential+IT area. OMR tech-park traffic and Velachery main road create PM2.5 spikes in peak hours."
        },
        royapuram: {
          loc: 11578, label: "Royapuram", authority: "TNPCB",
          zone: "Coastal Industrial (North Chennai — near Chennai Port)",
          sensors: { PM2_5:12236299, PM10:12236298, NO2:39323, CO:39325, O3:39389 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: [],
          note: "Coastal area adjacent to the port and fishing harbour. Shipping emissions + sea salt aerosols make PM10 the dominant pollutant here."
        },
        bengaluru: {
          loc: 6974, label: "Bengaluru Central", authority: "KSPCB",
          zone: "Mixed IT & Residential",
          sensors: { PM2_5: 12235240, PM10: 12235239, NO2: 12235237, CO: 12235235, O3: 12235238 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: "IT hub and dense traffic zones. Affected by construction and vehicular emissions."
        },
        delhi: {
          loc: 235, label: "Anand Vihar (East Delhi)", authority: "DPCC",
          zone: "High Traffic & Urban",
          sensors: { PM2_5: 12235610, PM10: 12235609, NO2: 12235607, CO: 12235605, O3: 12235608 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: "Severe winter pollution due to stubble burning, thermal plants, and dense urban traffic."
        },
        dtu: {
          loc: 13, label: "Delhi Technological Univ", authority: "CPCB",
          zone: "University / Residential",
          sensors: { PM2_5: 13864, PM10: null, NO2: 13866, CO: null, O3: 24 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: ""
        },
        rkpuram: {
          loc: 17, label: "R K Puram", authority: "DPCC",
          zone: "South Delhi Residential",
          sensors: { PM2_5: 12234787, PM10: 12234786, NO2: 12234784, CO: 12234782, O3: 12234785 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: ""
        },
        punjabi_bagh: {
          loc: 50, label: "Punjabi Bagh", authority: "DPCC",
          zone: "West Delhi Residential",
          sensors: { PM2_5: 12234796, PM10: 12234795, NO2: 12234793, CO: 12234791, O3: 12234794 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: ""
        },
        ito: {
          loc: 103, label: "ITO", authority: "CPCB",
          zone: "Central Traffic Hub",
          sensors: { PM2_5: 13861, PM10: 13862, NO2: 13863, CO: 169, O3: 168 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: ""
        },
        mandir_marg: {
          loc: 236, label: "Mandir Marg", authority: "DPCC",
          zone: "Central / NDMC",
          sensors: { PM2_5: 388, PM10: 391, NO2: 389, CO: 386, O3: 390 },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: ""
        },
        ihbas: {
          loc: 431, label: "IHBAS Dilshad Garden", authority: "CPCB",
          zone: "East Delhi Medical Hub",
          sensors: { PM2_5: 13868, PM10: null, NO2: 747, CO: 5361, O3: null },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: ""
        },
        peenya: {
          loc: 412, label: "Peenya", authority: "KSPCB",
          zone: "Industrial Zone",
          sensors: { PM2_5: 13852, PM10: null, NO2: 1518, CO: 722, O3: null },
          units:   { PM2_5:"µg/m³",  PM10:"µg/m³",  NO2:"µg/m³", CO:"µg/m³",  O3:"µg/m³" },
          ppb: ["NO2","CO"],
          note: ""
        }
      };

      // Area → nearest monitoring station
      const AREA_MAP = {
        "arumbakkam":"arumbakkam","koyambedu":"arumbakkam","anna nagar":"arumbakkam",
        "mogappair":"arumbakkam","aminjikarai":"arumbakkam","shenoy nagar":"arumbakkam",
        "kilpauk":"arumbakkam","padi":"arumbakkam","thirumangalam":"arumbakkam",
        "cmbt":"arumbakkam","vadapalani":"arumbakkam","ashok nagar":"arumbakkam","virugambakkam":"arumbakkam",
        "alandur":"alandur","guindy":"alandur","st thomas mount":"alandur",
        "meenambakkam":"alandur","airport":"alandur","pallavaram":"alandur","chrompet":"alandur",
        "chromepet":"alandur","tambaram":"alandur","vandalur":"alandur","perungalathur":"alandur",
        "ullagaram":"alandur","nanganallur":"alandur","rajakilpakkam":"alandur",
        "velachery":"velachery","adyar":"velachery","iit madras":"velachery","iit":"velachery",
        "anna university":"velachery","kotturpuram":"velachery","thiruvanmiyur":"velachery",
        "thoraipakkam":"velachery","sholinganallur":"velachery","perungudi":"velachery",
        "omr":"velachery","medavakkam":"velachery","madipakkam":"velachery","taramani":"velachery",
        "besant nagar":"velachery","tidel park":"velachery","t.nagar":"velachery","t nagar":"velachery",
        "nungambakkam":"velachery","egmore":"velachery","chengalpattu":"velachery",
        "kattankulathur":"velachery","srm":"velachery","mahabalipuram":"velachery","vit":"velachery","tambaram sanatorium":"velachery",
        "royapuram":"royapuram","manali":"royapuram","ennore":"royapuram","kodungaiyur":"royapuram",
        "basin bridge":"royapuram","tondiarpet":"royapuram","washermanpet":"royapuram",
        "parrys":"royapuram","george town":"royapuram","harbour":"royapuram",
        "perambur":"royapuram","kolathur":"royapuram","madhavaram":"royapuram","redhills":"royapuram",
        "peenya":"peenya","iisc":"peenya","ramaiah":"peenya","msrt":"peenya",
        "yeshwanthpur":"peenya","mathikere":"peenya",
        "dtu":"dtu","delhi technological university":"dtu","dce":"dtu","rohini":"dtu",
        "rk puram":"rkpuram","r k puram":"rkpuram","iit delhi":"rkpuram","jnu":"rkpuram",
        "south campus":"rkpuram","vasant vihar":"rkpuram",
        "punjabi bagh":"punjabi_bagh","shivaji college":"punjabi_bagh",
        "ito":"ito","maulana azad":"ito","spa":"ito","pragati maidan":"ito",
        "mandir marg":"mandir_marg","connaught place":"mandir_marg","cp":"mandir_marg",
        "gole market":"mandir_marg","lady hardinge":"mandir_marg","st columba":"mandir_marg",
        "ihbas":"ihbas","dilshad garden":"ihbas","ucms":"ihbas","shahdara":"ihbas",
        "anand vihar":"delhi","delhi":"delhi","new delhi":"delhi"
      };

      const AREA_EXTRA = {};

      const BP = {
        PM2_5:[[0,30,0,50],[30,60,51,100],[60,90,101,200],[90,120,201,300],[120,250,301,400],[250,9999,401,500]],
        PM10: [[0,50,0,50],[50,100,51,100],[100,250,101,200],[250,350,201,300],[350,430,301,400],[430,9999,401,500]],
        NO2:  [[0,40,0,50],[40,80,51,100],[80,180,101,200],[180,280,201,300],[280,400,301,400],[400,9999,401,500]],
        O3:   [[0,50,0,50],[50,100,51,100],[100,168,101,200],[168,208,201,300],[208,748,301,400],[748,9999,401,500]],
        CO:   [[0,1000,0,50],[1000,2000,51,100],[2000,10000,101,200],[10000,17000,201,300],[17000,34000,301,400],[34000,999999,401,500]],
      };
      function subIndex(c,bp){
        for(const [cl,ch,il,ih] of bp) if(c>=cl&&c<=ch) return il+(ih-il)/(ch-cl)*(c-cl); return 0;
      }
      function naqi(d){
        const si={};
        for(const [k,v] of Object.entries(d)) if(v!=null&&BP[k]) si[k]=subIndex(v,BP[k]);
        if(!Object.keys(si).length) return null;
        const score=Math.max(...Object.values(si));
        const dom=Object.keys(si).reduce((a,b)=>si[a]>si[b]?a:b);
        return {score:Math.round(score),si,dom};
      }
      function cat(n){
        if(n<=50)  return {name:"Good",        em:"🟢",cc:"var(--cb-good)",  bg:"rgba(34,197,94,.14)"};
        if(n<=100) return {name:"Satisfactory",em:"🟡",cc:"var(--cb-sat)",   bg:"rgba(132,204,22,.14)"};
        if(n<=200) return {name:"Moderate",    em:"🟠",cc:"var(--cb-mod)",   bg:"rgba(245,158,11,.14)"};
        if(n<=300) return {name:"Poor",        em:"🔴",cc:"var(--cb-poor)",  bg:"rgba(249,115,22,.14)"};
        if(n<=400) return {name:"Very Poor",   em:"🔴",cc:"var(--cb-vpoor)", bg:"rgba(239,68,68,.14)"};
        return            {name:"Severe",      em:"🟣",cc:"var(--cb-severe)",bg:"rgba(168,85,247,.14)"};
      }
      const PLAIN = {
        Good:"Clean, fresh air. Safe for everyone — go outside freely.",
        Satisfactory:"Air is acceptable. Most people are fine outdoors.",
        Moderate:"Slightly polluted — like a mildly dusty room. Sensitive people may feel irritation.",
        Poor:"Clearly degraded air. Reduce outdoor exposure. Wear a mask if you must go out.",
        "Very Poor":"Heavily polluted. Avoid outdoor activity. Close windows; use air purifier indoors.",
        Severe:"Hazardous — like breathing near a burning site. Stay indoors all day, seal windows."
      };
      const DRIVER = {
        PM2_5:{ic:"💨",txt:"Fine PM2.5 particles are the main pollutant — sourced from vehicle exhausts, construction dust, and road traffic.",tip:"Wear an N95 mask. Tiny enough to enter your bloodstream."},
        PM10: {ic:"🏗️",txt:"Coarse dust (PM10) is dominant — from unpaved roads, construction activity, and sand transport.",tip:"Dust worsens in dry afternoons. Rinse nasal passages after outdoor exposure."},
        NO2:  {ic:"🚌",txt:"Nitrogen dioxide from vehicle and bus exhaust is a key driver. Peak hours: 7–10 AM and 5–9 PM.",tip:"Irritates airways and worsens asthma. Avoid roadside exposure during rush hours."},
        CO:   {ic:"🔥",txt:"Carbon monoxide from combustion (vehicles, generators, diesel buses) is elevated.",tip:"Reduces oxygen delivery in blood. Avoid idling traffic zones."},
        O3:   {ic:"☀️",txt:"Ground-level ozone peaks in the afternoon when sunlight reacts with exhaust fumes.",tip:"Afternoon ozone is highest 12–4 PM. Exercise early morning instead."},
        SO2:  {ic:"🏭",txt:"Sulphur dioxide suggests nearby industrial or shipping fuel combustion — common near port areas.",tip:"SO₂ is a strong respiratory irritant. Keep inhalers handy if you have respiratory disease."},
      };
      const HEALTH = {
        asthma:{ name:"Asthma",icon:"🫁",limits:{Good:4,Satisfactory:3,Moderate:2,Poor:1,"Very Poor":0,Severe:0},advice:{Good:["✅ Safe to go outside without medication adjustment"],Satisfactory:["✅ Generally safe; carry rescue inhaler as precaution"],Moderate:["⚠️ Take preventive inhaler dose before going out","❌ Avoid outdoor exercise"],Poor:["❌ Stay indoors as much as possible","✅ Use nebulizer/bronchodilator if prescribed"],"Very Poor":["🚨 High trigger risk. Do not go out without medical necessity","✅ HEPA purifier on max indoors"],Severe:["🚨 Emergency risk for asthmatics. Stay indoors all day"]} },
        child:{ name:"Children",icon:"👶",limits:{Good:5,Satisfactory:4,Moderate:3,Poor:1,"Very Poor":0,Severe:0},advice:{Good:["✅ Safe for outdoor play and sports"],Satisfactory:["✅ Outdoor play is fine"],Moderate:["⚠️ Limit outdoor sports to under 1 hour"],Poor:["❌ Keep children indoors"],"Very Poor":["🚨 Children's lungs are vulnerable. Indoor only."],Severe:["🚨 Severe risk. Full isolation indoors."]} },
        healthy:{ name:"Healthy Adult",icon:"💪",limits:{Good:5,Satisfactory:5,Moderate:4,Poor:3,"Very Poor":2,Severe:1},advice:{Good:["✅ Perfect for any outdoor activity"],Satisfactory:["✅ All outdoor activities are fine"],Moderate:["✅ Short outdoor walks okay"],Poor:["⚠️ Wear N95 mask for any outdoor exposure","❌ Avoid outdoor exercise"],"Very Poor":["❌ No outdoor exercise","✅ Limit going out to essential trips only"],Severe:["❌ Stay indoors completely"]} }
      };
      const ACTIONS = {
        Good:        {do:["Open windows for fresh air","Exercise outdoors freely"],avoid:[]},
        Satisfactory:{do:["Normal outdoor activities OK","Light exercise outdoors"],avoid:["Sensitive groups: avoid very long outdoor exertion"]},
        Moderate:    {do:["Wear N95 if outdoors >1 hr","Hydrate often"],avoid:["Outdoor exercise during noon–4 PM"]},
        Poor:        {do:["N95 mask mandatory outdoors","Stay indoors 11 AM–4 PM","Run HEPA air purifier"],avoid:["All outdoor exercise","Opening windows in peak hours"]},
        "Very Poor": {do:["N95/N99 mask — no exception","Seal window gaps","HEPA purifier on max"],avoid:["Any outdoor exercise"]},
        Severe:      {do:["Stay indoors 100% of the day","HEPA purifier on max"],avoid:["Stepping outside for any reason"]}
      };
      const POLLUTANT_EXPLAIN = {
        "pm2.5":"<b>PM2.5 — Fine Dust Particles</b><br/><br/>These are tiny particles 2.5 microns wide. You can't see them, but they travel deep into your lungs and enter your bloodstream.<br/><span style='color:var(--cb-muted);font-size:12px'>🏭 Sources: vehicle exhaust, cooking fires, construction.</span>",
        "pm10":"<b>PM10 — Coarse Dust</b><br/><br/>Larger particles (up to 10 microns). You can sometimes see them as haze. They cause sneezing, coughing, and worsening allergies.<br/><span style='color:var(--cb-muted);font-size:12px'>🏗️ Sources: unpaved roads, construction sites, sand.</span>",
        "no2":"<b>NO₂ — Nitrogen Dioxide</b><br/><br/>A sharp-smelling gas produced mainly by diesel vehicles and buses. Irritates airways.<br/><span style='color:var(--cb-muted);font-size:12px'>🚌 Sources: diesel buses, trucks, power plants.</span>",
        "co":"<b>CO — Carbon Monoxide</b><br/><br/>A colourless, odourless gas from incomplete burning of fuels. At high concentrations it starves your organs of oxygen.<br/><span style='color:var(--cb-muted);font-size:12px'>🔥 Sources: vehicle exhausts, generators, combustion.</span>",
        "o3":"<b>O₃ — Ground-Level Ozone</b><br/><br/>Formed when sunlight bakes vehicle fumes. It irritates your lungs; it peaks in the afternoon.<br/><span style='color:var(--cb-muted);font-size:12px'>☀️ Forms from vehicle fumes + sunlight.</span>",
        "so2":"<b>SO₂ — Sulphur Dioxide</b><br/><br/>A sharp, acidic gas produced by burning fuel and coal. It irritates the respiratory tract.<br/><span style='color:var(--cb-muted);font-size:12px'>🏭 Sources: thermal plants, shipping fuel.</span>",
      };

      const LAYMAN_FAQ = {
        en: {
          "aqi_def": "<b>What is AQI?</b><br/><br/>AQI (Air Quality Index) is a thermometer for the air, running from 0 to 500. Under 50 is fresh and safe, but over 300 is hazardous to breathe. It helps you quickly know if you need to wear a mask today.",
          "mask": "<b>Which mask should you wear?</b><br/><br/>Cloth or surgical masks <b>do not</b> stop pollution! Because fine dust (PM2.5) is microscopic, you must wear an <b>N95, N99, or FFP2</b> mask. Ensure it seals tightly around your nose and cheeks.",
433:           "winter": "<b>Why does pollution spike in winter?</b><br/><br/>In winter, cold air sinks to the ground. This creates a 'dome' over the city that traps vehicle exhaust, farm fires, and industrial smoke instead of letting it blow away. We call this 'winter inversion'.",
434:           "health": "<b>Can bad air make me sick?</b><br/><br/>Yes. Extremely poor air causes immediate coughing, sneezing, and watery eyes. Long-term exposure to PM2.5 increases the risk of asthma, lung infections, and serious heart conditions. Protecting yourself is crucial.",
435:           "protect": "<b>Basic Tips to Protect Yourself:</b><br/>1. Wear an N95 mask outdoors.<br/>2. Stay indoors with windows closed during peak hours (10 AM - 4 PM).<br/>3. Run a HEPA Air Purifier.<br/>4. Do not run or exercise outdoors when AQI is over 200.",
436:           "safe_today": "<b>Is it safe today?</b><br/><br/>It completely depends on where you are! Please ask me about a specific area, for example: <i>'What is the air like in Punjabi Bagh?'</i> or <i>'Is it safe in IIT Delhi?'</i>"
437:         },
438:         hi: {
439:           "aqi_def": "<b>AQI क्या है?</b><br/><br/>AQI (वायु गुणवत्ता सूचकांक) हवा के लिए एक थर्मामीटर की तरह है, जो 0 से 500 तक होता है। 50 से कम हवा ताज़ा और सुरक्षित होती है, लेकिन 300 से अधिक सांस लेने के लिए खतरनाक है।",
440:           "mask": "<b>कौन सा मास्क पहनना चाहिए?</b><br/><br/>कपड़े या सर्जिकल मास्क प्रदूषण को <b>नहीं</b> रोकते! महीन धूल (PM2.5) से बचने के लिए <b>N95, N99, या FFP2</b> मास्क ही पहनें।",
441:           "winter": "<b>सर्दियों में प्रदूषण क्यों बढ़ता है?</b><br/><br/>सर्दियों में ठंडी हवा नीचे बैठ जाती है, जो एक 'डोम' बनाती है, जिससे वाहनों का धुआं और औद्योगिक गैसें ऊपर नहीं उड़ पातीं। इसे 'विंटर इन्वर्जन' कहते हैं।",
442:           "health": "<b>क्या खराब हवा मुझे बीमार कर सकती है?</b><br/><br/>हाँ। PM2.5 के लगातार प्रभाव से अस्थमा, फेफड़ों के संक्रमण और हृदय रोगों का खतरा काफी बढ़ जाता है। बचाव आवश्यक है।",
443:           "protect": "<b>खुद को बचाने के टिप्स:</b><br/>1. बाहर जाते समय N95 मास्क पहनें।<br/>2. पीक आवर्स (सुबह 10 - शाम 4) में घर के अंदर रहें।<br/>3. HEPA एयर प्यूरीफायर चलाएं।<br/>4. AQI 200 के पार होने पर बाहर व्यायाम न करें।",
444:           "safe_today": "<b>क्या आज बाहर जाना सुरक्षित है?</b><br/><br/>यह आपके क्षेत्र पर निर्भर करता है! कृपया किसी विशेष क्षेत्र के बारे में पूछें, जैसे: <i>'कनॉट प्लेस में हवा कैसी है?'</i>"
445:         },
446:         ta: {
447:           "aqi_def": "<b>AQI என்றால் என்ன?</b><br/><br/>AQI (காற்றுத் தரக் குறியீடு) என்பது காற்றின் தரம் 0 முதல் 500 வரை அளவிடப்படும் ஒரு அளவுகோலாகும். 50-க்குக் குறைவாக இருந்தால் காற்று சுத்தமானது, ஆனால் 300-க்கு மேல் இருந்தால் சுவாசிப்பது ஆபத்தானது.",
448:           "mask": "<b>எந்த முகக்கவசம் அணிய வேண்டும்?</b><br/><br/>துணி அல்லது அறுவை சிகிச்சை முகக்கவசங்கள் மாசுபாட்டைத் தடுக்காது! நுண்ணிய துகள்களிலிருந்து (PM2.5) தற்காத்துக் கொள்ள <b>N95, N99 அல்லது FFP2</b> முகக்கவசங்களை மட்டுமே அணியுங்கள்.",
449:           "winter": "<b>குளிர்காலத்தில் மாசுபாடு ஏன் அதிகரிக்கிறது?</b><br/><br/>குளிர்காலத்தில் குளிர்ந்த காற்று தரை மட்டத்தில் தங்கிவிடும், இது வாகனப் புகை மற்றும் தூசியைச் சிதற விடாமல் தடுத்து ஒரு 'குடை' போன்று மூடிவிடுகிறது.",
          "protect": "<b>உங்களைப் பாதுகாத்துக் கொள்ள சில குறிப்புகள்:</b><br/>1. வெளியே செல்லும்போது N95 முகக்கவசம் அணியுங்கள்.<br/>2. ஜன்னல்களை மூடி வைக்கவும்.<br/>3. HEPA காற்று சுத்திகரிப்பானைப் பயன்படுத்தவும்.",
          "health": "<b>காற்று மாசுபாடு என்னை பாதிக்குமா?</b><br/><br/>ஆம். நீண்ட கால வெளிப்பாடு ஆஸ்துமா மற்றும் நுரையீரல் தொற்று அபாயத்தை அதிகரிக்கிறது.",
          "safe_today": "<b>இன்று வெளியே செல்வது பாதுகாப்பானதா?</b><br/><br/>இது உங்கள் பகுதியைப் பொறுத்தது! ஒரு குறிப்பிட்ட பகுதியைப் பற்றி என்னிடம் கேளுங்கள்."
        },
        kn: {
          "aqi_def": "<b>AQI ಎಂದರೇನು?</b><br/><br/>AQI (ವಾಯು ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ) ಎನ್ನುವುದು 0 ರಿಂದ 500 ರವರೆಗೆ ವಾಯು ಗುಣಮಟ್ಟವನ್ನು ಅಳೆಯುವ ಮಾಪನವಾಗಿದೆ. 50 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಗಾಳಿ ಶುದ್ಧವಾಗಿದೆ ಎಂದರ್ಥ.",
          "mask": "<b>ಯಾವ ಮಾಸ್ಕ್ ಧರಿಸಬೇಕು?</b><br/><br/>ಕೇವಲ ಬಟ್ಟೆಯ ಮಾಸ್ಕ್‌ಗಳು ಮಾಲಿನ್ಯವನ್ನು ತಡೆಯುವುದಿಲ್ಲ! ಸೂಕ್ಷ್ಮ ಕಣಗಳಿಂದ (PM2.5) ರಕ್ಷಣೆ ಪಡೆಯಲು <b>N95, N99 ಅಥವಾ FFP2</b> ಮಾಸ್ಕ್ ಬಳಸಿ.",
          "winter": "<b>ಚಳಿಗಾಲದಲ್ಲಿ ಮಾಲಿನ್ಯ ಏಕೆ ಹೆಚ್ಚಾಗುತ್ತದೆ?</b><br/><br/>ಚಳಿಗಾಲದಲ್ಲಿ ತಂಪಾದ ಗಾಳಿಯು ಭೂಮಿಯ ಹತ್ತಿರವೇ ಉಳಿಯುತ್ತದೆ, ಇದರಿಂದಾಗಿ ಧೂಳು ಮತ್ತು ಹೊಗೆ ಮೇಲೆ ಹೋಗಲು ಸಾಧ್ಯವಾಗದೆ ಮಾಲಿನ್ಯ ಹೆಚ್ಚುತ್ತದೆ.",
          "protect": "<b>ರಕ್ಷಣೆಗಾಗಿ ಸಲಹೆಗಳು:</b><br/>1. ಹೊರಗೆ ಹೋಗುವಾಗ N95 ಮಾಸ್ಕ್ ಧರಿಸಿ.<br/>2. ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿಡಿ.<br/>3. HEPA ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಬಳಸಿ.",
          "health": "<b>ಕಳಪೆ ಗಾಳಿಯು ನನ್ನ ಆರೋಗ್ಯದ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆಯೇ?</b><br/><br/>ಹೌದು. ದೀರ್ಘಕಾಲದ ಮಾಲಿನ್ಯದ ಸಂಪರ್ಕವು ಶ್ವಾಸಕೋಶದ ಕಾಯಿಲೆಗಳ ಅಪಾಯವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.",
          "safe_today": "<b>ಇಂದು ಹೊರಗೆ ಹೋಗುವುದು ಸುರಕ್ಷಿತವೇ?</b><br/><br/>ಇದು ನಿಮ್ಮ ಪ್ರದೇಶದ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ! ಒಂದು ನಿರ್ದಿಷ್ಟ ಪ್ರದೇಶದ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಿ."
        }
      };

      let API_KEY = "backend_proxy_active";
      let CURR_LANG = "en";
      let TTS_ENABLED = false;
      let CHAT_HISTORY = [];

      function speak(htmlContent) {
        if (!TTS_ENABLED) return;
        window.speechSynthesis.cancel();
        const text = htmlContent.replace(/<[^>]*>?/gm, '');
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Advanced Voice Selection
        const voices = window.speechSynthesis.getVoices();
        if (CURR_LANG === "hi") {
          utterance.lang = 'hi-IN';
          const hiVoice = voices.find(v => v.lang === 'hi-IN');
          if (hiVoice) utterance.voice = hiVoice;
        } else if (CURR_LANG === "ta") {
          utterance.lang = 'ta-IN';
          const taVoice = voices.find(v => v.lang === 'ta-IN');
          if (taVoice) utterance.voice = taVoice;
        } else if (CURR_LANG === "kn") {
          utterance.lang = 'kn-IN';
          const knVoice = voices.find(v => v.lang === 'kn-IN');
          if (knVoice) utterance.voice = knVoice;
        } else {
          utterance.lang = 'en-US';
          const enVoice = voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
      const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000" : "";
      async function liveData(stKey){
        const st=STATIONS[stKey];
        const smap={};
        for(const [poll,sid] of Object.entries(st.sensors)) smap[sid]=poll;
        const res=await fetch(`${API_BASE}/api/sensor/${st.loc}`,{
          headers:{"accept":"application/json"},
          signal:AbortSignal.timeout(12000)
        });
        if(res.status===401) throw new Error("auth");
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const json=await res.json();
        const out={PM2_5:null,PM10:null,NO2:null,CO:null,O3:null,SO2:null};
        for(const item of (json.results||[])){
          const poll=smap[item.sensorsId];
          if(!poll) continue;
           let v=parseFloat(item.value);
          if(isNaN(v)||v<0) continue;
          if(st.ppb.includes(poll)){
            if(poll==="NO2") v=+(v*1.88).toFixed(3);
            else if(poll==="CO") v=+(v*1.145).toFixed(3);
            else v=+(v*1.88).toFixed(3);
          }
           out[poll]=v;
        }
        return out;
      }

      function detectArea(txt){
        const t=txt.toLowerCase();
        for(const k of Object.keys(AREA_MAP).sort((a,b)=>b.length-a.length)) if(t.includes(k)) return {area:k,station:AREA_MAP[k]};
        for(const sk of Object.keys(STATIONS).sort((a,b)=>b.length-a.length)) if(t.includes(sk)) return {area:sk,station:sk};
        return null;
      }
      function detectHealth(txt){
        const t=txt.toLowerCase();
        if(/asthma|inhaler|wheez/i.test(t)) return "asthma";
        if(/child|kid|baby|toddler|school/i.test(t)) return "child";
        return "healthy";
      }
      function detectFAQ(txt) {
        const t = txt.toLowerCase();
        if(/what is aqi|how does aqi work|explain aqi|meaning of aqi/i.test(t)) return "aqi_def";
        if(/mask|what mask|n95|surgical mask|protect/i.test(t)) return "mask";
        if(/winter|december|november|cold|why.*bad/i.test(t)) return "winter";
        if(/sick|health|disease|lungs|affect me|kill/i.test(t)) return "health";
        if(/protect|tips|survival|what should i do/i.test(t)) return "protect";
        if(/safe today|safe outside|go outside|should i/i.test(t)) return "safe_today";
        return null;
      }

      function isReloc(txt){ return /moving|shifting|relocat|college|hostel|admission|studying/i.test(txt); }
      function isPollQ(txt){ return /what is|explain|mean|pm2|pm10|no2|ozone|co\b|so2/i.test(txt); }

      function chips(arr){ return `<div class="cb-chips">${arr.map(t=>`<button class="cb-chip">${t}</button>`).join("")}</div>`; }
      function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

      function buildAQIBlock(d,aqi,station,area,healthKey){
        const c=cat(aqi.score);
        const drv=DRIVER[aqi.dom]||DRIVER.PM2_5;
        const hp=HEALTH[healthKey]||HEALTH.healthy;
        const hadvice=hp.advice[c.name]||[];
        const actions=ACTIONS[c.name]||ACTIONS.Moderate;
        const polls=Object.entries(d).filter(([,v])=>v!=null).map(([k,v])=>`<div class="cb-pc"><div class="cb-lbl">${k.replace("_",".")}</div><div class="cb-val">${v} <span class="cb-unt">µg/m³</span></div></div>`).join("");
        const areaNote=AREA_EXTRA[area]||"";
        const doItems=actions.do.map(t=>`<div class="cb-ac do"><span>✅</span><span>${t}</span></div>`).join("");
        const noItems=actions.avoid.map(t=>`<div class="cb-ac no"><span>❌</span><span>${t}</span></div>`).join("");

        return `
          <div style="font-size:12.5px;color:var(--cb-muted);margin-bottom:3px">📍 <b style="color:var(--cb-text)">${STATIONS[station].label}</b> Station</div>
          <div class="cb-aqi-badge" style="background:${c.bg};color:${c.cc}">${c.em} AQI ${aqi.score} — ${c.name}</div>
          <div style="font-size:13px;color:#cbd5e1;margin:5px 0 8px">${PLAIN[c.name]}</div>
          ${polls?`<div class="cb-grid2">${polls}</div>`:""}
          <div class="cb-info-card">
            <div class="cb-ic-title">🔬 What's Driving Pollution?</div>
            <div class="cb-ic-row">${drv.ic} <span>${drv.txt}</span></div>
            <div class="cb-ic-row" style="color:#fde68a;margin-top:4px">💡 ${drv.tip}</div>
          </div>
          ${hadvice.length?`<div class="cb-health-card"><div class="cb-hc-title">${hp.icon} Advice for ${hp.name}</div>${hadvice.map(t=>`<div class="cb-hc-row">${t}</div>`).join("")}</div>`:""}
          <div class="cb-ac-sec">
            <div class="cb-ac-list">${doItems}</div>
            ${actions.avoid.length?`<div class="cb-ac-list" style="margin-top:4px">${noItems}</div>`:""}
          </div>`;
      }

      function buildRelocBlock(station,healthKey,area){
        const st=STATIONS[station];
        const hp=HEALTH[healthKey]||HEALTH.healthy;
        return `<div style="font-size:14px;font-weight:700;margin-bottom:8px">🎓 Moving to <b>${area||st.label}</b>?</div>
          <div style="font-size:12px;color:var(--cb-muted);margin-bottom:8px">Nearest station: <b style="color:var(--cb-text)">${st.label}</b></div>
          <div class="cb-info-card">
            <div class="cb-ic-title">📅 Seasonal Air Quality</div>
            <div class="cb-ic-row" style="color:#cbd5e1">Chennai experiences its worst air quality in <b>November–February</b>.</div>
          </div>
          <div class="cb-health-card">
            <div class="cb-hc-title">${hp.icon} Smart Survival for ${hp.name}</div>
            <div class="cb-hc-row">✅ Get an N95 mask — essential for AQI > 150 days</div>
            <div class="cb-hc-row">✅ Add a HEPA air purifier to your room</div>
            <div class="cb-hc-row" style="color:#fca5a5">❌ Don't jog near main roads during rush hours</div>
          </div>`;
      }

      const msgs=document.getElementById("cb-msgs");
      const ftr=document.getElementById("cb-ftr");
      const setup=document.getElementById("cb-setup");
      const panel=document.getElementById("cb-panel");

      function userMsg(t){
        const el=document.createElement("div");el.className="cb-msg usr";
        el.innerHTML=`<div class="cb-bub">${esc(t)}</div>`;
        msgs.appendChild(el);msgs.scrollTop=msgs.scrollHeight;
      }
      function botMsg(html, autoSpeak=true, bypassHistory=false){
        const el=document.createElement("div");el.className="cb-msg bot";
        el.innerHTML=`<div class="cb-ava">🛰️</div><div class="cb-bub">${html}</div>`;
        msgs.appendChild(el);
        el.querySelectorAll(".cb-chip").forEach(c=>c.addEventListener("click",()=>handle(c.textContent)));
        msgs.scrollTop=msgs.scrollHeight;
        if(autoSpeak) speak(html);
        if(!bypassHistory) {
           const cleanText = html.replace(/<[^>]*>?/gm, ''); // strip HTML to save tokens
           CHAT_HISTORY.push({ role: "model", parts: [{ text: cleanText }] });
        }
      }
      function typOn(){
        const el=document.createElement("div");el.className="cb-msg bot";el.id="cb-typ";
        el.innerHTML=`<div class="cb-ava">🛰️</div><div class="cb-bub"><div class="cb-typ"><span></span><span></span><span></span></div></div>`;
        msgs.appendChild(el);msgs.scrollTop=msgs.scrollHeight;
      }
      function typOff(){const t=document.getElementById("cb-typ");if(t)t.remove();}

      async function handle(txt){
        userMsg(txt);
        CHAT_HISTORY.push({ role: "user", parts: [{ text: txt }] });
        const healthKey=detectHealth(txt);
        const areaHit=detectArea(txt);

        if(areaHit){
          const {area,station}=areaHit;
          if(isReloc(txt)){
            typOn(); let d=null,aq=null; if(API_KEY){ try{ d=await liveData(station);aq=naqi(d); }catch(_){} } typOff();
            const r=buildRelocBlock(station,healthKey,area);
            const live=aq?`<div style="margin-top:10px"><div class="cb-aqi-badge">Today's AQI: ${aq.score}</div></div>`:"";
            botMsg(r+live+chips(["What is PM2.5?","Asthma tips for this area"]));
            return;
          }
          typOn();
          if(!API_KEY){
            typOff();
            botMsg(`<div class="cb-info-card"><div class="cb-ic-title">🔑 API Key Required</div><div class="cb-ic-row">Add your free OpenAQ API key to see live data. <span class="cb-link" onclick="document.getElementById('cb-msgs').style.display='none';document.getElementById('cb-ftr').style.display='none';document.getElementById('cb-setup').style.display='flex';">Set up now</span></div></div>`+chips(["What is PM2.5?","Moving to Adyar for college"]));
            return;
          }
           let d,aq;
           try{ d=await liveData(station);aq=naqi(d); }catch(e){
            typOff();
            if(e.message==="auth") botMsg(`🔑 API key was rejected. <span class="cb-link" onclick="document.getElementById('cb-msgs').style.display='none';document.getElementById('cb-ftr').style.display='none';document.getElementById('cb-setup').style.display='flex';">Update key</span>`);
            else botMsg(`⚠️ Couldn't reach the station right now. Try again later.`);
            return;
          }
          typOff();
          if(!aq){ botMsg(`No sensor readings available right now.`+chips(["Try Velachery","What is PM2.5?"])); return; }
          botMsg(buildAQIBlock(d,aq,station,area,healthKey)+chips(["Moving here for college","What is PM2.5?"]));
          return;
        }

        typOn();
        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ history: CHAT_HISTORY, lang: CURR_LANG })
          });
          if(!res.ok) throw new Error();
          const json = await res.json();
          typOff();
          botMsg(json.response);
        } catch(e) {
          typOff();
          botMsg("⚠️ Ah, I'm having trouble reaching my AI brain right now.", true, true);
        }
      }

      window.startChat = function startChat(sysBoot=false){
        setup.style.display="none";msgs.style.display="flex";ftr.style.display="flex";
        if(msgs.children.length===0 || sysBoot){
          msgs.innerHTML = "";
          let welcome = `👋 Hi! I'm your <b>sensor-level AQI Assistant</b>.<br/><br/>
            To ensure complete accuracy, I only provide data for areas physically covered by our data supply. <b>Currently covered station zones are:</b><br/><br/>
            🟢 <b>Chennai:</b> Velachery, Arumbakkam, Alandur, Royapuram<br/>
            🟢 <b>Bengaluru:</b> Bengaluru Central, Peenya (IISc, MSRT)<br/>
            🟢 <b>Delhi:</b> Anand Vihar, DTU, RK Puram (IIT-D), Punjabi Bagh, ITO, Mandir Marg, IHBAS<br/>`+
            chips(["Mandir Marg AQI","I have asthma — Velachery","What is PM2.5?"]);
          
          if(CURR_LANG === "hi") {
            welcome = `👋 नमस्ते! मैं आपका <b>सेंसर-आधारित AQI सहायक</b> हूँ।<br/><br/>
              पूर्ण सटीकता के लिए, मैं केवल सीधे सेंसर आपूर्ति वाले क्षेत्रों का डेटा देता हूँ। <b>कवर किए गए स्टेशन क्षेत्र हैं:</b><br/><br/>
              🟢 <b>दिल्ली:</b> आनंद विहार, DTU, आर के पुरम, पंजाबी बाग, ITO, मंदिर मार्ग, IHBAS<br/>
              🟢 <b>बेंगलुरु:</b> बेंगलुरु सेंट्रल, पीण्या<br/>
              🟢 <b>चेन्नई:</b> वेलाचेरी, अरुम्बक्कम, आलंदूर, रोयापुरम<br/>`+
              chips(["दिल्ली में प्रदूषण", "PM2.5 क्या है?", "अस्थमा के लिए सुझाव"]);
          } else if(CURR_LANG === "ta") {
            welcome = `👋 வணக்கம்! நான் உங்கள் <b>காற்று தர உதவியாளர்</b>.<br/><br/>
              தற்போது கீழ்க்கண்ட பகுதிகளில் உள்ள நேரடி தரவுகளை நான் வழங்குகிறேன்:<br/><br/>
              🟢 <b>சென்னை:</b> வேளச்சேரி, அரும்பாக்கம், ஆலந்தூர், ராயபுரம்<br/>
              🟢 <b>பெங்களூரு:</b> பெங்களூரு சென்ட்ரல், பீண்யா<br/>
              🟢 <b>டெல்லி:</b> ஆனந்த் விஹார், DTU, ஆர் கே புரம், ITO, மந்திர் மார்க்<br/>`+
              chips(["வேளச்சேரி காற்று தரம்", "ஆஸ்துமா பாதுகாப்பு", "PM2.5 என்றால் என்ன?"]);
          } else if(CURR_LANG === "kn") {
            welcome = `👋 ನಮಸ್ತೆ! ನಾನು ನಿಮ್ಮ <b>ವಾಯು ಗುಣಮಟ್ಟ ಸಹಾಯಕ</b>.<br/><br/>
              ಕೆಳಗಿನ ನಗರಗಳ ನೇರ ಸೆನ್ಸಾರ್ ಡೇಟಾವನ್ನು ನಾನು ನೀಡುತ್ತೇನೆ:<br/><br/>
              🟢 <b>ಬೆಂಗಳೂರು:</b> ಬೆಂಗಳೂರು ಸೆಂಟ್ರಲ್, ಪೀಣ್ಯ (IISc, MSRT)<br/>
              🟢 <b>ಚೆನ್ನೈ:</b> ವೆಲಚೇರಿ, ಅರುಂಬಾಕ್ಕಮ್, ಆಲಂದೂರ್, ರಾಯಪುರಂ<br/>
              🟢 <b>ದೆಹಲಿ:</b> ಆನಂದ್ ವಿಹಾರ್, DTU, ಆರ್ ಕೆ ಪುರಂ, ITO, ಮಂದಿರ್ ಮಾರ್ಗ್<br/>`+
              chips(["ಬೆಂಗಳೂರು ಮಾಲಿನ್ಯ", "ಆರೋಗ್ಯ ಸಲಹೆಗಳು", "AQI ಎಂದರೇನು?"]);
          }
          // Do not autospeak the very first enormous welcome message unless explicitly requested
          botMsg(welcome, false); 
        }
      }

      document.getElementById("cb-lang-sel").addEventListener("change", function(){
        CURR_LANG = this.value;
        startChat(true); // reload chat
      });

      document.getElementById("cb-tts-btn").addEventListener("click", function(){
        TTS_ENABLED = !TTS_ENABLED;
        this.textContent = TTS_ENABLED ? "🔊" : "🔇";
        if(!TTS_ENABLED) window.speechSynthesis.cancel();
        else speak(CURR_LANG==="hi" ? "आवाज़ चालू है।" : "Voice enabled.");
      });

      document.getElementById("cb-trig").addEventListener("click",()=>{
        panel.classList.toggle("open");
        if(panel.classList.contains("open") && API_KEY) startChat();
      });

      document.getElementById("cb-apikey-btn").addEventListener("click",()=>{
        const k=document.getElementById("cb-apikey-input").value.trim();
        if(k.length<10){document.getElementById("cb-apikey-input").style.borderColor="var(--cb-vpoor)";return;}
        API_KEY=k;localStorage.setItem("oaq_key",k); startChat();
      });
      document.getElementById("cb-apikey-input").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("cb-apikey-btn").click();});
      document.getElementById("cb-skip-btn").addEventListener("click",()=>{API_KEY="";startChat();});

      document.getElementById("cb-snd").addEventListener("click",()=>{
        const v=document.getElementById("cb-inp").value.trim(); if(!v)return;
        document.getElementById("cb-inp").value="";document.getElementById("cb-inp").style.height="auto"; handle(v);
      });
      document.getElementById("cb-inp").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.getElementById("cb-snd").click();}});
      document.getElementById("cb-inp").addEventListener("input",function(){this.style.height="auto";this.style.height=this.scrollHeight+"px";});

749:       if(API_KEY){ setup.style.display="none"; }
750:       
751:       // Initialize chat unconditionally if API_KEY is set (which bypasses setup)
752:       if(API_KEY && typeof window.startChat === 'function') {
753:         window.startChat(true);
754:       }
755:     })();
756:     
  </body>
</html>
