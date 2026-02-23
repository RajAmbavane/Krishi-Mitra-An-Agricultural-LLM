# llama_runner.py
import os
from pathlib import Path
from multiprocessing import cpu_count
from llama_cpp import Llama


def _resolve_model_path() -> str:
    env_path = os.getenv("LLAMA_MODEL_PATH")
    if env_path:
        return env_path
    # backend/ -> project/ -> workspace/
    return str(Path(__file__).resolve().parents[2] / "Llama-3.2-3B-Instruct-Q4_K_M.gguf")


llm = Llama(
    model_path=_resolve_model_path(),
    n_ctx=3072,
    n_threads=max(2, min(8, cpu_count() - 1)),
)

def query_llama(prompt, max_tokens=320):
    output = llm(
        prompt,
        max_tokens=max_tokens,
        temperature=0.3,
        top_p=0.9,
        repeat_penalty=1.1,
        stop=["Q:", "User:", "###"],
    )
    return output["choices"][0]["text"].strip()
