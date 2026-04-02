import requests
import os

API_URL = "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2"

headers = {
    "Authorization": "Bearer hf_your_token_here"
}

def get_ai_response(text):
    try:
        payload = {
            "inputs": text,
            "parameters": {
                "max_new_tokens": 100
            }
        }

        response = requests.post(API_URL, headers=headers, json=payload)
        data = response.json()

        print("DEBUG:", data)

        if isinstance(data, list):
            return data[0]['generated_text']
        elif "error" in data:
            return "❌ API Error: " + data["error"]
        else:
            return "❌ Unknown response"

    except Exception as e:
        return "❌ Error: " + str(e)