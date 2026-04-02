import whisper
import sounddevice as sd
from scipy.io.wavfile import write

model = whisper.load_model("base")

def record_audio(filename="input.wav", duration=5, fs=44100):
    print("🎤 Listening...")
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()
    write(filename, fs, audio)
    return filename

def speech_to_text():
    file = record_audio()
    result = model.transcribe(file)
    print("You said:", result["text"])
    return result["text"]