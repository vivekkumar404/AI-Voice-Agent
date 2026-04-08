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
