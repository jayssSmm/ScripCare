from dotenv import load_dotenv
from groq import Groq

import base64
import os
import json

load_dotenv()

#from app.prescription.get_Schedule import generate_medicine_schedule
from get_Schedule import generate_medicine_schedule

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_Prescription(image_path):
    prompt = os.getenv("prompt")
    base64_image = encode_image(image_path)

    completion = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                    }
                ]
            }
        ],
        reasoning_effort="none",   # Groq's documented switch to kill thinking mode on qwen3.6
        temperature=0.7,           # Groq's recommended non-thinking-mode value
        top_p=0.80,
        presence_penalty=1.5,      # Groq's recommended non-thinking-mode value — much stronger than before
        max_completion_tokens=1000,
        response_format={"type": "json_object"}
    )

    raw = completion.choices[0].message.content
    result = json.loads(raw)

    return result

if __name__=="__main__":
    image_path = "test/ocr2.jpg"
    result = get_Prescription(image_path=image_path)
    print(json.dumps(result, indent=2),end='\n')

    '''
    schedule = generate_medicine_schedule(json.dumps(result))
    print(json.dumps(schedule, indent=2, ensure_ascii=False))
    '''