import os
import json
from groq import Groq

from dotenv import load_dotenv

load_dotenv()

def generate_medicine_schedule(
    payload: dict,
    api_key: str | None = None,
    model: str = "qwen/qwen3.8-27b",
) -> dict:
    """
    Send a medicines payload to the Groq API and get back a structured
    daily schedule with reminders.

    Args:
        payload: dict matching the shape:
            {
              "medicines": [
                {
                  "raw_text": str,
                  "medicine_name": str,
                  "dosage": str | None,
                  "frequency": str | None,   # e.g. "1-0+1" (morning-afternoon-night)
                  "duration": str | None,
                  "confidence": str,
                  "alternative_guesses": list[str]
                },
                ...
              ]
            }
        api_key: Groq API key. Falls back to the GROQ_API_KEY env var.
        model: Groq model to use.

    Returns:
        dict: parsed JSON schedule, shaped like:
            {
              "schedule": [
                {
                  "medicine_name": str,
                  "dosage": str | None,
                  "confidence": str,
                  "reminders": [
                    {
                      "time_of_day": "morning" | "afternoon" | "evening" | "night",
                      "suggested_time": "HH:MM",
                      "relation_to_food": "before_food" | "after_food" | "unspecified",
                      "reminder_text": str
                    },
                    ...
                  ],
                  "notes": str | None
                },
                ...
              ]
            }

    Raises:
        ValueError: if no API key is available or the model's response
                    isn't valid JSON.
    """
    api_key = api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "No Groq API key provided. Pass api_key=... or set GROQ_API_KEY."
        )

    client = Groq(api_key=api_key)

    system_prompt = (os.getenv("schedule_prompt"))

    user_prompt = json.dumps(payload, ensure_ascii=False)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    raw_content = response.choices[0].message.content

    try:
        return json.loads(raw_content)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Groq response wasn't valid JSON: {e}\nRaw response:\n{raw_content}"
        ) from e


if __name__ == "__main__":
    example_payload = {
        "medicines": [
            {
                "raw_text": "tab. Mervan 500 1-0+1",
                "medicine_name": "Mervan 500",
                "dosage": "500",
                "frequency": "1-0+1",
                "duration": None,
                "confidence": "medium",
                "alternative_guesses": ["Mefanad 500", "Mervan 500"],
            },
            {
                "raw_text": "tab. Muxopo 20 1-0+1",
                "medicine_name": "Muxopo 20",
                "dosage": "20",
                "frequency": "1-0+1",
                "duration": None,
                "confidence": "medium",
                "alternative_guesses": ["Muxopo 20", "Muxopon 20"],
            },
            {
                "raw_text": "Vollmac gel",
                "medicine_name": "Vollmac gel",
                "dosage": None,
                "frequency": None,
                "duration": None,
                "confidence": "high",
                "alternative_guesses": [],
            },
        ]
    }

    schedule = generate_medicine_schedule(example_payload)
    print(json.dumps(schedule, indent=2, ensure_ascii=False))