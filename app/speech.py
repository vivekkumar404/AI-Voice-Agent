import whisper
from gtts import gTTS

# 1️⃣ Speech-to-Text
def speech_to_text(audio_file: str):
    model = whisper.load_model("base")
    result = model.transcribe(audio_file)
    return result["text"]

# 2️⃣ Text-to-Speech
def text_to_speech(text: str, filename="answer.mp3"):
    tts = gTTS(text)
    tts.save(filename)
    return filename