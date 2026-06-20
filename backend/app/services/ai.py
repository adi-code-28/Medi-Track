import json
from datetime import datetime

from app.config import settings
from app.schemas import ChatResponse, InsightResponse


async def generate_insights(context: dict) -> InsightResponse:
    prompt = f"""You are MediTrack's health summary assistant. Analyze this patient data and respond in JSON:
{{"summary": "3-4 sentence plain-English summary", "action_items": ["item1", "item2"]}}

Rules:
- Never diagnose. Use "may indicate" or "worth discussing with your doctor".
- Reference specific numbers and dates from the data.
- If data is sparse, say so honestly.

Patient data:
{json.dumps(context, indent=2)}"""

    text = await _call_llm(prompt)
    try:
        data = json.loads(text)
        return InsightResponse(
            summary=data.get("summary", text),
            action_items=data.get("action_items", []),
            generated_at=datetime.utcnow(),
        )
    except json.JSONDecodeError:
        return InsightResponse(
            summary=text,
            action_items=["Continue logging vitals daily", "Discuss trends with your doctor"],
            generated_at=datetime.utcnow(),
        )


async def chat_with_context(message: str, context: dict, history: list[dict]) -> ChatResponse:
    system = """You are MediTrack, a doctor-visit preparation assistant.
Answer based ONLY on the patient's logged data. Never diagnose.
Help the patient prepare questions and talking points for their doctor visit.
Cite specific dates and values when available."""

    history_text = "\n".join(f"{h['role']}: {h['content']}" for h in history[-6:])
    prompt = f"""{system}

Patient context:
{json.dumps(context, indent=2)}

Recent conversation:
{history_text}

User: {message}

Respond helpfully in 2-4 short paragraphs."""

    reply = await _call_llm(prompt)
    sources = []
    if context.get("vitals"):
        sources.append(f"{len(context['vitals'])} vital readings (last 7 days)")
    if context.get("symptoms"):
        sources.append(f"{len(context['symptoms'])} symptom entries")
    if context.get("medicines"):
        sources.append(f"{len(context['medicines'])} active medications")
    return ChatResponse(reply=reply, sources=sources)


async def _call_llm(prompt: str) -> str:
    if settings.gemini_api_key:
        return await _gemini(prompt)
    if settings.openai_api_key:
        return await _openai(prompt)
    return _demo_response(prompt)


def _demo_response(prompt: str) -> str:
    if "action_items" in prompt:
        return json.dumps(
            {
                "summary": "Based on your logged data, your vitals appear mostly stable this week. "
                "Medication adherence is good. Continue monitoring blood pressure daily and note any new symptoms.",
                "action_items": [
                    "Log blood pressure at the same time each morning",
                    "Bring your medication list to your next doctor visit",
                ],
            }
        )
    return (
        "Based on your recent health logs, here are talking points for your doctor:\n\n"
        "1. Review your blood pressure trend over the past week and ask if any adjustment is needed.\n"
        "2. Mention your current medications and confirm dosages are still appropriate.\n"
        "3. Discuss any symptoms you've logged, including severity patterns.\n\n"
        "Add a GEMINI_API_KEY to enable live AI responses grounded in your data."
    )


async def _gemini(prompt: str) -> str:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text or ""


async def _openai(prompt: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content or ""
