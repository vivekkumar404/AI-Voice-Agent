import os
from huggingface_hub import InferenceClient

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("HF_TOKEN not set!")

client = InferenceClient(token=HF_TOKEN)

def clean_answer(text):
    text = text.strip()
    text = text.replace("[/INST]", "").replace("[INST]", "").replace("<<SYS>>", "").replace("<</SYS>>", "")
    
    if "Assistant:" in text:
        parts = text.split("Assistant:")
        text = parts[-1].strip()
    if "User:" in text:
        parts = text.split("User:")
        if len(parts) > 1:
            text = parts[-1].strip()
    
    return text

def get_answer(user_input: str):
    messages = [
        {"role": "system", "content": "You are a helpful AI assistant. Provide clear, concise, and informative answers."},
        {"role": "user", "content": user_input}
    ]
    
    output = client.chat_completion(
        model="meta-llama/Llama-3.2-1B-Instruct",
        messages=messages,
        max_tokens=512,
        temperature=0.7,
        top_p=0.9
    )
    
    return clean_answer(output.choices[0].message.content)
