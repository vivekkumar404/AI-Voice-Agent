✨ Features
🎤 Voice Input (Speech-to-Text)

Convert your voice into text using advanced AI models for accurate recognition.

🧠 AI Reasoning (LangChain)

Smart prompt handling and chaining for contextual, intelligent responses.

🤗 Hugging Face Integration

Leverages open-source models like Mistral for generating high-quality responses.

💬 Chat Support

Interact with the AI just like ChatGPT via text-based conversations.

🔊 Text-to-Speech (TTS)

Get AI responses in natural human-like voice output.

⚡ FastAPI Backend

High-performance backend for real-time communication and fast responses.

📂 Project Structure
AI_VOICE_AGENT/
│
├── app/
│   ├── data/
│   │   └── data.txt
│   │
│   ├── agent.py          # AI logic (LangChain + Hugging Face)
│   ├── auth.py           # Authentication system
│   ├── database.py       # Database (SQLite)
│   ├── main.py           # FastAPI entry point
│   ├── speech.py         # Speech-to-text logic
│   │
│   └── users.db          # Database file
│
├── audio/                # Audio storage (input/output)
├── frontend/             # Frontend UI (optional)
│
├── answer.mp3            # Generated voice output
├── temp_voice.webm       # Temporary voice input
│
├── run_server.py         # Server runner
├── stt.py                # STT helper
├── test_api.py           # API testing
├── test.py               # General testing
│
├── requirements.txt      # Dependencies
├── README.md             # Documentation
├── .gitignore            # Ignored files
⚙️ Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/vivekkumar404/AI-Voice-Agent.git
cd AI-Voice-Agent
2️⃣ Create Virtual Environment
python -m venv venv
venv\Scripts\activate   # For Windows
3️⃣ Install Dependencies
pip install -r requirements.txt
4️⃣ Run Server
uvicorn main:app --reload
📡 API Endpoints
Endpoint	Method	Description
/voice	POST	Voice → AI → Voice response
/chat	POST	Text → AI response
🛠️ Tech Stack
Backend: FastAPI
AI Framework: LangChain
Models: Hugging Face (Mistral)
Speech Processing: STT + TTS
Database: SQLite
