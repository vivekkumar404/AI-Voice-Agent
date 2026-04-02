from fastapi import FastAPI, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import uuid

from app.agent import get_answer
from app.speech import speech_to_text, text_to_speech
from app.database import (
    create_user, get_user_by_email, get_user_by_phone, 
    save_message, get_chat_history, delete_chat_history,
    get_all_users, get_user_chat_count, delete_user, get_user_by_id,
    update_user_activity
)
from app.auth import hash_password, verify_password, create_token, get_current_user, security

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("audio", exist_ok=True)

class RegisterRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class QuestionRequest(BaseModel):
    question: str

class ChatRequest(BaseModel):
    messages: list

@app.post("/api/ping")
async def ping(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user(credentials)
    update_user_activity(user_id)
    return {"status": "ok"}

@app.post("/api/register")
async def register(data: RegisterRequest):
    if not data.email and not data.phone:
        raise HTTPException(status_code=400, detail="Email or phone required")
    
    if data.email and data.phone:
        raise HTTPException(status_code=400, detail="Provide either email or phone, not both")
    
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    hashed_pw = hash_password(data.password)
    user_id = create_user(data.email, data.phone, hashed_pw)
    
    if user_id is None:
        raise HTTPException(status_code=400, detail="User already exists")
    
    token = create_token(user_id)
    return {"token": token, "user_id": user_id}

@app.post("/api/login")
async def login(data: LoginRequest):
    if not data.email and not data.phone:
        raise HTTPException(status_code=401, detail="Email or phone required")
    
    identifier = data.email if data.email else data.phone
    
    if data.email:
        user = get_user_by_email(data.email)
    else:
        user = get_user_by_phone(data.phone)
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not verify_password(data.password, user[3]):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    is_admin = user[4] if len(user) > 4 else 0
    update_user_activity(user[0])
    token = create_token(user[0])
    return {"token": token, "user_id": user[0], "is_admin": bool(is_admin)}

@app.post("/api/admin/login")
async def admin_login(data: LoginRequest):
    if data.email != "admin@ai.com":
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    user = get_user_by_email("admin@ai.com")
    if not user or not verify_password(data.password, user[3]):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    update_user_activity(user[0])
    token = create_token(user[0])
    return {"token": token, "user_id": user[0], "is_admin": True}

@app.get("/api/admin/users")
async def get_users(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user(credentials)
    admin = get_user_by_id(user_id)
    
    if not admin or not admin[4]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_user_activity(user_id)
    users = get_all_users()
    result = []
    for u in users:
        chat_count = get_user_chat_count(u[0])
        result.append({
            "id": u[0],
            "email": u[1],
            "phone": u[2],
            "is_admin": bool(u[3]) if len(u) > 3 else False,
            "last_seen": u[4] if len(u) > 4 else None,
            "created_at": u[5] if len(u) > 5 else None,
            "chat_count": chat_count
        })
    return {"users": result}

@app.delete("/api/admin/users/{user_id}")
async def remove_user(user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    current_user_id = get_current_user(credentials)
    admin = get_user_by_id(current_user_id)
    
    if not admin or not admin[4]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    delete_user(user_id)
    return {"message": "User deleted"}

@app.delete("/api/admin/chats/{user_id}")
async def clear_user_chats(user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    current_user_id = get_current_user(credentials)
    admin = get_user_by_id(current_user_id)
    
    if not admin or not admin[4]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    delete_chat_history(user_id)
    return {"message": "User chat history cleared"}

@app.get("/api/history")
async def get_history(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user(credentials)
    update_user_activity(user_id)
    messages = get_chat_history(user_id)
    return {"messages": messages}

@app.post("/api/chat")
async def chat(data: ChatRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user(credentials)
    update_user_activity(user_id)
    
    for msg in data.messages:
        save_message(user_id, msg["content"], msg["role"])
    
    last_question = None
    for msg in reversed(data.messages):
        if msg["role"] == "user":
            last_question = msg["content"]
            break
    
    if not last_question:
        raise HTTPException(status_code=400, detail="No question found")
    
    answer = get_answer(last_question)
    save_message(user_id, answer, "assistant")
    
    return {"answer": answer}

@app.delete("/api/history")
async def clear_history(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user(credentials)
    delete_chat_history(user_id)
    return {"message": "History cleared"}

@app.post("/api/voice-chat")
async def voice_chat(
    audio: UploadFile,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_id = get_current_user(credentials)
    update_user_activity(user_id)
    
    audio_id = str(uuid.uuid4())
    audio_path = f"audio/{audio_id}.webm"
    
    with open(audio_path, "wb") as f:
        content = await audio.read()
        f.write(content)
    
    try:
        user_text = speech_to_text(audio_path)
        answer = get_answer(user_text)
        
        audio_filename = f"audio/{audio_id}_response.mp3"
        text_to_speech(answer, audio_filename)
        
        save_message(user_id, user_text, "user")
        save_message(user_id, answer, "assistant")
        
        return {
            "text": answer,
            "user_text": user_text,
            "audio_url": f"/audio/{audio_id}_response.mp3"
        }
    except Exception as e:
        return {"error": str(e), "text": "", "audio_url": ""}
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    file_path = f"audio/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    return HTTPException(status_code=404, detail="Audio not found")

@app.post("/ask_text")
@app.post("/ask_text/")
async def ask_text(data: QuestionRequest):
    answer = get_answer(data.question)
    audio_file = text_to_speech(answer)
    return {"text": answer, "audio": audio_file}

@app.post("/ask_voice")
@app.post("/ask_voice/")
async def ask_voice(file: UploadFile):
    audio_path = f"temp_{file.filename}"
    with open(audio_path, "wb") as f:
        f.write(await file.read())
    user_input = speech_to_text(audio_path)
    answer = get_answer(user_input)
    audio_file = text_to_speech(answer)
    return {"text": answer, "audio": audio_file}
