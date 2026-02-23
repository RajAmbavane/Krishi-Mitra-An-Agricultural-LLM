# Contributing

Thanks for contributing to Harit Krishi Mitra.

## Setup
1. Fork and clone the repo.
2. Install frontend deps: `npm install`
3. Setup backend:
   - `cd backend`
   - `python -m venv venv`
   - `venv\Scripts\activate`
   - `pip install -r requirements.txt`
4. Configure env files from `.env.example` and `backend/.env.example`.

## Development
- Frontend: `npm run dev`
- Backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Before Opening a PR
- Run `npm run lint`
- Run `npm run build`
- Keep changes focused and documented
- Include screenshots for UI changes

## Commit Style
Prefer clear, scoped messages, for example:
- `feat(chat): improve stale response handling`
- `fix(prompt): remove hardcoded quick answer prefix`
- `docs(readme): add backend setup`

## PR Expectations
- Explain what changed and why
- Note any breaking changes
- Link related issues
