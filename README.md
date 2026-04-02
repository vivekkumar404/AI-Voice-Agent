🚀 Features
🎤 Voice Input (Speech-to-Text)
Converts user speech into text using AI models
🧠 AI Reasoning with LangChain
Structured prompt handling and chaining for better responses
🤗 Hugging Face Models Integration
Uses open-source Mistral for generating intelligent replies
💬 Chat Support
Text-based interaction like ChatGPT
🔊 Text-to-Speech (TTS)
Converts responses into human-like voice output
⚡ FastAPI Backend
High-performance API for real-time interaction

📂 Project Structure
AI_VOICE_AGENT/
│
├── app/
│   ├── data/
│   │   └── data.txt
│   │
│   ├── agent.py          # Main AI agent logic (LangChain + HF)
│   ├── auth.py           # Authentication logic
│   ├── database.py       # Database handling (users.db)
│   ├── main.py           # Entry point (FastAPI / core app)
│   ├── speech.py         # Speech-to-text logic
│   │
│   └── users.db          # SQLite database
│
├── audio/                # Audio files storage (input/output)
├── frontend/             # Frontend UI (if implemented)
│
├── answer.mp3            # Generated voice output
├── temp_voice.webm       # Temporary recorded voice
│
├── run_server.py         # Server runner script
├── stt.py                # Speech-to-text helper
├── test_api.py           # API testing script
├── test.py               # General testing
│
├── requirements.txt      # Python dependencies
├── README.md             # Project documentation
├── .gitignore            # Ignored files (venv, etc.)

⚙️ Installation
1️⃣ Clone Repository
git clone https://github.com/vivekkumar404/AI-Voice-Agent.git
cd AI-Voice-Agent

2️⃣ Create Virtual Environment
python -m venv venv
venv\Scripts\activate   # Windows

3️⃣ Install Dependencies
pip install -r requirements.txt

4️⃣ Run Server
uvicorn main:app --reload

📡 API Endpoints
Endpoint	Method	Description
/voice	POST	Voice → AI → Voice response
/chat	POST	Text → AI response
