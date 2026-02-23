# Harit Krishi Mitra

AI-powered agriculture assistant for Indian farmers with:
- React + Vite frontend
- FastAPI backend with local Llama (GGUF via `llama-cpp-python`)
- Supabase auth and chat persistence
- Optional SearXNG retrieval and weather enrichment

## Features
- Conversational crop guidance (pest, disease, irrigation, soil, market, schemes)
- Response hardening for stale/late backend replies
- Conditional helpline behavior (only when relevant)
- Conversation history with Supabase

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind, shadcn/ui
- Backend: FastAPI, llama-cpp-python, requests
- Data/Auth: Supabase
- Retrieval: SearXNG (optional but recommended)

## Repository Structure
```text
.
|-- backend/
|   |-- main.py
|   |-- prompt_builder.py
|   |-- search_engine.py
|   |-- weather_service.py
|   `-- llama_runner.py
|-- src/
|-- finetuning/
|-- supabase/
`-- README.md
```

## Prerequisites
- Node.js 18+
- Python 3.10+
- A GGUF model file compatible with `llama-cpp-python`
- Supabase project (URL + anon key)
- Optional: local SearXNG instance

## Environment Variables

### Frontend (`.env.local`)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:8000
```

### Backend (`backend/.env`)
```bash
# Optional if model is at workspace root with this filename:
# Llama-3.2-3B-Instruct-Q4_K_M.gguf
LLAMA_MODEL_PATH=d:/Desktop/LLAMA3.2/Llama-3.2-3B-Instruct-Q4_K_M.gguf

# Optional: comma-separated SearXNG endpoints
SEARXNG_URLS=http://127.0.0.1:8888
SEARXNG_BACKOFF_SECONDS=60
```

## RAG Setup (SearXNG)

RAG is enabled through `backend/search_engine.py` and used by `POST /ask`.

### Option A: Use your local `searxng` folder
If you already have a local SearXNG setup (as in this workspace), start it and ensure it serves on `http://127.0.0.1:8888`.

### Option B: Run SearXNG via Docker
```bash
docker run --rm -d --name searxng -p 8888:8080 searxng/searxng
```

Then set:
```bash
SEARXNG_URLS=http://127.0.0.1:8888
```

Validate:
- Open `http://127.0.0.1:8888/search?q=health&format=json`
- API health endpoint: `GET http://localhost:8000/health/rag`

If SearXNG is down, app still answers using non-RAG path.

## Model Setup (Llama 3.2 3B and Fine-tuned Models)

Backend loads model from:
1. `LLAMA_MODEL_PATH` (preferred), or
2. workspace default file: `Llama-3.2-3B-Instruct-Q4_K_M.gguf`

### Base model setup
1. Download your GGUF model file.
2. Put it on disk (any path).
3. Set `LLAMA_MODEL_PATH` in `backend/.env` to that full path.

Example:
```bash
LLAMA_MODEL_PATH=D:/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf
```

### Fine-tuned model setup
This backend expects a GGUF model path. So for fine-tuning artifacts:
1. Merge/apply your fine-tuned adapter into a final model checkpoint.
2. Convert/quantize to GGUF (if needed).
3. Point `LLAMA_MODEL_PATH` to that final GGUF.

Example:
```bash
LLAMA_MODEL_PATH=D:/models/krishi-mitra-finetuned-q4_k_m.gguf
```

Note: raw LoRA/adapter files are not loaded directly by current `llama_runner.py`; it loads a single GGUF file.

For reproducible training workflow, see:
- `finetuning/README.md`
- `finetuning/data/DATASET_SCHEMA.md`
- `finetuning/scripts/*`

## Local Development

### 1. Frontend
```bash
npm install
npm run dev
```
Frontend runs on Vite default (`http://localhost:5173` unless changed).

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Quick end-to-end check
1. Confirm backend is up: `http://localhost:8000/health/rag`
2. Start frontend: `npm run dev`
3. Ask a query in UI and verify:
   - direct answer is returned
   - `sources` appear when SearXNG is reachable

## API Endpoints
- `POST /ask` : main chat endpoint
- `GET /health/rag` : retrieval health check

## Quality Checks
```bash
npm run lint
npm run build
```

## Deploy Notes
- Lock down CORS origins in `backend/main.py` for production.
- Store secrets in environment variables, never in source.
- Use HTTPS and authenticated Supabase project keys.

## License
MIT (see `LICENSE`).
