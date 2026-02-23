import os
import time
from typing import List, Dict, Tuple

import requests

# Whitelisted trusted domains for agricultural and government info
TRUSTED_SITES = [
    "site:krishi.maharashtra.gov.in",
    "site:mahadbt.maharashtra.gov.in",
    "site:agricoop.gov.in",
    "site:agmarknet.gov.in",
    "site:enam.gov.in",
    "site:skymetweather.com",
    "site:accuweather.com",
    "site:mausam.imd.gov.in",
    "site:soilhealth.dac.gov.in",
    "site:pmkisan.gov.in",
    "site:msp.gov.in",
    "site:mkisan.gov.in",
]


DEFAULT_SEARX_URLS = [
    "http://127.0.0.1:8888",
]

# Avoid retrying an unreachable URL on every request.
_SEARXNG_BACKOFF_UNTIL: Dict[str, float] = {}
_SEARXNG_BACKOFF_SECONDS = int(os.getenv("SEARXNG_BACKOFF_SECONDS", "60"))


def get_searxng_urls() -> List[str]:
    env_urls = os.getenv("SEARXNG_URLS", "").strip()
    if not env_urls:
        return DEFAULT_SEARX_URLS
    urls = [u.strip().rstrip("/") for u in env_urls.split(",") if u.strip()]
    return urls or DEFAULT_SEARX_URLS


def _normalize_results(results: List[dict], num_results: int) -> List[Dict[str, str]]:
    normalized_results = []
    for r in results[:num_results]:
        normalized_results.append({
            "url": r.get("url", ""),
            "title": r.get("title", ""),
            "content": r.get("content", ""),
        })
    return normalized_results


def _search(base_url: str, query: str, num_results: int) -> List[Dict[str, str]]:
    url = f"{base_url}/search"
    params = {
        "q": query,
        "format": "json",
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }
    # Keep strict timeouts to avoid blocking model response for too long.
    res = requests.get(url, params=params, headers=headers, timeout=(3, 7))
    res.raise_for_status()
    results = res.json().get("results", [])
    return _normalize_results(results, num_results)


def search_searxng(query: str, num_results: int = 5) -> List[Dict[str, str]]:
    # Create full query with domain filter
    trusted_filter = " OR ".join(TRUSTED_SITES)
    filtered_query = f"{query} ({trusted_filter})"
    urls = get_searxng_urls()

    now = time.time()
    for base_url in urls:
        backoff_until = _SEARXNG_BACKOFF_UNTIL.get(base_url, 0.0)
        if now < backoff_until:
            continue
        try:
            filtered_results = _search(base_url, filtered_query, num_results)
            if filtered_results:
                return filtered_results

            # Fallback: if strict trusted filter returns nothing, try plain query.
            plain_results = _search(base_url, query, num_results)
            if plain_results:
                return plain_results
        except Exception as e:
            _SEARXNG_BACKOFF_UNTIL[base_url] = now + _SEARXNG_BACKOFF_SECONDS
            print(f"Search error [{base_url}]: {e}")

    return []


def searxng_health() -> Tuple[bool, str]:
    urls = get_searxng_urls()
    for base_url in urls:
        if time.time() < _SEARXNG_BACKOFF_UNTIL.get(base_url, 0.0):
            continue
        try:
            url = f"{base_url}/search"
            res = requests.get(url, params={"q": "health", "format": "json"}, timeout=(2, 4))
            if res.status_code == 200:
                return True, base_url
        except Exception:
            _SEARXNG_BACKOFF_UNTIL[base_url] = time.time() + _SEARXNG_BACKOFF_SECONDS
            continue
    return False, ""

def format_context_for_llm(results):
    """
    Converts search results to clean paragraphs for LLM context,
    without leaking raw URLs or reference metadata.
    """
    formatted = []
    for r in results:
        title = r["title"].strip()
        content = r["content"].strip()
        if title or content:
            paragraph = f"{title}\n{content}".strip()
            formatted.append(paragraph)
    return "\n\n".join(formatted)
