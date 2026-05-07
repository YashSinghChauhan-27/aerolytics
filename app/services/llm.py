import google.generativeai as genai
from app.config import GEMINI_API_KEY

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """You are the precise, highly-intelligent Aerolytics Assistant. Your domain is exclusively air quality, pollution metrics, health advices based on NAQI, and location-centric AQI safety.
You MUST output your responses seamlessly using HTML tags instead of markdown (e.g. use <b>, <i>, <br/>, instead of **, *, \n) so it naturally formats in the Aerolytics Chatbot User Interface.
Keep your answers brief, actionable, and extremely user-friendly. Do not ramble.
Whenever a user asks a follow-up question, use the conversation history to implicitly understand which locality or pollutant they are referring to.
If they ask something completely unrelated to AQI, the environment, apps, or health, politely steer them back to air quality.
IMPORTANT: You do not need to wrap your entire response in <div> tags, just use the tags inline like typical text formatting."""

def generate_response(history_array, lang="en"):
    """
    history_array: List of dictionaries matching the Gemini format
    e.g. [{"role": "user", "parts": [{"text": "Hello"}]}, {"role": "model", "parts": [{"text": "Hi there!"}]}]
    """
    
    # Extract the user's latest message to send explicitly 
    latest_message = history_array[-1]["parts"][0]["text"]
    
    # Context window: Use all prior messages as the history
    context = history_array[:-1] 
    
    language_directive = "\n\nYou MUST reply exclusively in English."
    if lang == "hi":
        language_directive = "\n\nCRITICAL: You MUST output your entire conversational response exclusively in Hindi (Devanagari script), preserving all HTML formatting tags accurately."
    elif lang == "ta":
        language_directive = "\n\nCRITICAL: You MUST output your entire conversational response exclusively in Tamil (Tamil script), preserving all HTML formatting tags accurately."
    elif lang == "kn":
        language_directive = "\n\nCRITICAL: You MUST output your entire conversational response exclusively in Kannada (Kannada script), preserving all HTML formatting tags accurately."
        
    # Initialize the specific tuned model
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        system_instruction=SYSTEM_PROMPT + language_directive
    )
    
    chat = model.start_chat(history=context)
    
    response = chat.send_message(latest_message)
    return response.text
