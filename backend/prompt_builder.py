"""
Prompt builder for Krishi Mitra.
"""

import re


def is_greeting_or_ack(query: str) -> bool:
    """Detect if a query is a simple greeting/acknowledgement."""
    if not query:
        return False

    query = re.sub(r"[^\w\s]", "", query.lower().strip())
    short_words = query.split()

    common_ack_greetings = {
        "hello", "hi", "hey", "namaste", "greetings",
        "thanks", "thank", "thankyou", "thank-you",
        "ok", "okay", "bye", "goodbye", "sure", "fine", "cool", "great",
        "shukriya", "dhanyavad", "dhanyavaad", "morning", "good", "goodmorning",
    }
    return len(short_words) <= 4 and all(word in common_ack_greetings for word in short_words)


def contains_devanagari(text: str) -> bool:
    """Check if text includes Devanagari script."""
    return any("\u0900" <= ch <= "\u097F" for ch in text)


def get_quick_reply(query: str) -> str:
    """Return a quick, polite response in the user's language."""
    if contains_devanagari(query):
        return (
            "\u0906\u092a\u0915\u093e \u0927\u0928\u094d\u092f\u0935\u093e\u0926! "
            "\u0915\u0943\u092a\u092f\u093e \u092c\u0924\u093e\u090f\u0902 \u092e\u0948\u0902 \u0914\u0930 "
            "\u0915\u0948\u0938\u0947 \u092e\u0926\u0926 \u0915\u0930 \u0938\u0915\u0924\u093e \u0939\u0942\u0901\u0964"
        )
    return "Thank you! Let me know how else I can help."


def contains_distress(text: str) -> bool:
    """Detect distress-related keywords in user query."""
    if not text:
        return False
    distress_keywords = [
        "depress", "depressed", "suicide", "suicidal", "anxiety",
        "anxious", "sad", "hopeless", "stress", "lonely", "lost",
    ]
    text_lower = text.lower()
    return any(word in text_lower for word in distress_keywords)


def asks_for_helpline(text: str) -> bool:
    """Detect if user explicitly asks for contact/support lines."""
    if not text:
        return False
    t = text.lower()
    helpline_keywords = [
        "helpline",
        "hotline",
        "call center",
        "customer care",
        "contact number",
        "phone number",
        "support number",
        "toll free",
        "kisan call center",
    ]
    return any(word in t for word in helpline_keywords)


def build_prompt(user_query: str, search_results=None, conversation_history=None) -> str:
    """Build prompt for LLaMA using query, optional history, and optional search results."""
    if is_greeting_or_ack(user_query):
        return get_quick_reply(user_query)

    devanagari = contains_devanagari(user_query)
    language_instruction = (
        "Answer in the same language as the user's query "
        "(Marathi if the user asked in Marathi, otherwise Hindi)."
        if devanagari
        else "Answer in the same language as the user's query (English)."
    )

    crisis_instruction = ""
    helpline_instruction = ""
    if contains_distress(user_query):
        crisis_instruction = (
            "Important safety behavior for this response:\n"
            "- Start with empathy and emotional validation in one short paragraph.\n"
            "- If the user expresses self-harm thoughts, advise immediate support and include:\n"
            "  * National Mental Health Helpline (India): 1800-599-0019\n"
            "  * Emergency services: 112\n"
            "- Use calm, non-judgmental language. Do not shame or dismiss feelings.\n"
            "- After safety guidance, provide practical next farming steps in simple bullets.\n\n"
        )
    elif asks_for_helpline(user_query):
        helpline_instruction = (
            "Helpline behavior for this response:\n"
            "- Include only helplines relevant to the user's request.\n"
            "- For agriculture advisory/support, include Kisan Call Center: 1800-180-1551.\n"
            "- Do not include mental-health helplines unless the user shows emotional distress.\n\n"
        )

    system_instructions = (
        "You are Krishi Mitra, a trusted agricultural AI assistant for Indian farmers, with strong Maharashtra context. "
        "Give practical guidance on crops, pests/disease, irrigation, soil health, market trends, and government schemes.\n\n"
        "Response style:\n"
        "- Be concise, empathetic, and actionable.\n"
        "- Never say you are a language model, and never claim inability due to being an AI.\n"
        "- Do not use fixed prefixes like 'Quick answer:'. Start naturally.\n"
        "- Give a short direct answer first, then clear next steps in bullet points when useful.\n"
        "- If key details are missing, state assumptions and ask up to 3 targeted follow-up questions.\n"
        "- Prefer specific, field-ready actions (dosage, timing window, frequency, and safety precautions) when appropriate.\n"
        "- If giving scheme info, include: Purpose, Eligibility, Benefits, How to apply, Official link.\n"
        "- Use only provided search context for factual claims when available; if uncertain, say so.\n"
        "- Avoid repetition and avoid generic filler text.\n\n"
        f"{language_instruction}\n\n"
        f"{helpline_instruction}"
        f"{crisis_instruction}"
    )

    history_text = ""
    if conversation_history:
        recent_history = conversation_history[-6:]
        history_text += "Conversation so far:\n"
        for msg in recent_history:
            role = msg.get("role", "").lower() if isinstance(msg, dict) else getattr(msg, "role", "").lower()
            content = msg.get("content", "").strip() if isinstance(msg, dict) else getattr(msg, "content", "").strip()
            if role == "user":
                history_text += f"User: {content}\n"
            elif role == "assistant":
                history_text += f"Krishi Mitra: {content}\n"
        history_text += "\n"

    search_text = ""
    if search_results:
        snippets = []
        for i, result in enumerate(search_results[:5], start=1):
            title = result.get("title", "").strip()
            content = result.get("content", "").strip()
            if title or content:
                snippets.append(f"{i}. {title}: {content}")
        if snippets:
            search_text += "Relevant information from web search (for reference; use if needed):\n"
            search_text += "\n".join(snippets) + "\n\n"
    else:
        search_text += (
            "No live web search context is available right now.\n"
            "Use the conversation history as memory, provide best-effort practical guidance, "
            "and clearly mark uncertain facts.\n\n"
        )

    prompt = system_instructions + history_text + search_text
    prompt += f"User: {user_query}\nKrishi Mitra:"
    return prompt
