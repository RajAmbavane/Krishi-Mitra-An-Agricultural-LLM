import re
from typing import Any, Dict, Optional, Tuple

import requests


WEATHER_KEYWORDS = {
    "weather",
    "met",
    "meteorology",
    "temperature",
    "rain",
    "rainfall",
    "humidity",
    "forecast",
    "wind",
    "climate",
}


def is_weather_query(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in WEATHER_KEYWORDS)


def _extract_location(query: str) -> str:
    q = query.strip()
    match = re.search(r"\b(?:in|at|for)\s+(.+)$", q, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip(" .?!")
    return q.strip(" .?!")


def _geocode(location: str) -> Optional[Tuple[float, float, str]]:
    url = "https://geocoding-api.open-meteo.com/v1/search"
    res = requests.get(
        url,
        params={"name": location, "count": 1, "language": "en", "format": "json"},
        timeout=(3, 7),
    )
    res.raise_for_status()
    data = res.json()
    results = data.get("results") or []
    if not results:
        return None
    r = results[0]
    name_parts = [r.get("name"), r.get("admin1"), r.get("country")]
    label = ", ".join([p for p in name_parts if p])
    return float(r["latitude"]), float(r["longitude"]), label


def _forecast(lat: float, lon: float) -> Dict[str, Any]:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "timezone": "auto",
        "forecast_days": 1,
    }
    res = requests.get(url, params=params, timeout=(3, 7))
    res.raise_for_status()
    return res.json()


def _code_to_desc(code: int) -> str:
    mapping = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        80: "Rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        95: "Thunderstorm",
    }
    return mapping.get(code, "Variable conditions")


def get_weather_answer(query: str) -> Optional[Tuple[str, list]]:
    if not is_weather_query(query):
        return None

    try:
        location = _extract_location(query)
        geo = _geocode(location)
    except Exception:
        return None

    if not geo:
        return None

    try:
        lat, lon, label = geo
        data = _forecast(lat, lon)
    except Exception:
        return None

    current = data.get("current", {})
    daily = data.get("daily", {})

    temp = current.get("temperature_2m")
    hum = current.get("relative_humidity_2m")
    wind = current.get("wind_speed_10m")
    code = int(current.get("weather_code", 0))
    desc = _code_to_desc(code)

    tmax = (daily.get("temperature_2m_max") or [None])[0]
    tmin = (daily.get("temperature_2m_min") or [None])[0]
    rain_prob = (daily.get("precipitation_probability_max") or [None])[0]

    answer = (
        f"Current weather in {label}: {desc.lower()}, around {temp} deg C.\n\n"
        "What to do now:\n"
        f"- Temperature today: {tmin} deg C to {tmax} deg C.\n"
        f"- Humidity: {hum}%.\n"
        f"- Wind: {wind} km/h.\n"
        f"- Rain probability today: {rain_prob}%.\n"
        "- If rain probability is high, avoid spraying and secure harvested produce.\n"
        "- For crop-specific advice, tell me your crop and growth stage."
    )

    sources = [
        {"title": "Open-Meteo Forecast API", "url": "https://api.open-meteo.com"},
        {"title": "Open-Meteo Geocoding API", "url": "https://geocoding-api.open-meteo.com"},
    ]
    return answer, sources
