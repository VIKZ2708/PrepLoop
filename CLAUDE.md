# PrepLoop — Claude Code instructions

PrepLoop is a daily AI coach for tech interviews. Every day the learner goes through one loop:
**Morning Recap → Afternoon System Design Study → Evening AI Project → Night Quiz.**
Full product context: `docs/PRD.md`. Build order and phase prompts: `docs/ROADMAP.md`.

## Working rules
- Work one roadmap phase at a time. Before coding a phase, show a short plan and wait for approval.
- Keep changes small and reviewable. Run tests and lint before saying a phase is done.
- Never print, log or commit secrets. All keys come from `.env` (see `.env.example`). `.env` is git-ignored.
- Reuse what already exists in the owner's existing AI project (Postgres instance, Anthropic key setup, LLM client wrapper) instead of rebuilding it. Ask if unsure where something lives.
- Every LLM output the app stores must be validated with a Pydantic schema. Retry once on invalid JSON, then fail cleanly.
- Learners study from their own notes. Never ingest copyrighted book text.
- After finishing a phase, tick it in the "Status" section at the bottom of this file and in `docs/ROADMAP.md`.

## Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, pytest, uv for dependencies
- **DB:** PostgreSQL 16 + pgvector (separate database `preploop`; may share the existing Postgres server)
- **AI:** Anthropic Python SDK. Sonnet for quiz generation, teach-back critique and mock interviews; Haiku for grading, recap and RAG answers. Prompt caching on system prompts. Model names live in config, not in code.
- **Jobs:** APScheduler (MVP)
- **Frontend:** React + Vite + TypeScript, TanStack Query, React Router, Tailwind + shadcn/ui, Excalidraw, Recharts
- **Local dev:** Docker Compose (db, backend, frontend)

## Structure
```
backend/
  app/
    api/          # routers: recap, study, project, quiz, progress, ask
    core/         # config, db session, security
    models/       # SQLAlchemy models
    schemas/      # Pydantic schemas
    services/     # llm, quiz_generator, grader, recap_builder, spaced_repetition, rag
    jobs/         # scheduler + scheduled jobs
    prompts/      # prompt templates as files
    seed/         # syllabus seed data
  alembic/
  tests/
frontend/
  src/
    pages/        # Dashboard, Recap, Study, Project, Quiz, Progress
    components/
    api/          # typed API client
docs/
docker-compose.yml
.env.example
```

## Commands (keep this list accurate as they are created)
- Start everything: `docker compose up`
- Backend tests: `cd backend && uv run pytest`
- Migrations: `cd backend && uv run alembic upgrade head`
- Frontend dev: `cd frontend && pnpm dev`

## Core data model
users · syllabus_items(track, day_no, title, description) · study_sessions(date, notes, diagram_json, teach_back, ai_feedback) ·
project_tasks(title, status, milestone) · project_logs(date, built, blockers, learnings) ·
questions(syllabus_item_id, type, prompt, options, answer, explanation, difficulty) ·
quiz_attempts(date, score) · answers(user_answer, is_correct, ai_score, ai_feedback) ·
review_schedule(question_id, ease, interval_days, next_review_date) · daily_recaps(date, content, weak_topics) ·
note_chunks(session_id, text, embedding vector)

## Status
- [ ] Phase 1 — Foundation
- [ ] Phase 2 — Study & project modules
- [ ] Phase 3 — Quiz engine
- [ ] Phase 4 — AI grading & teach-back
- [ ] Phase 5 — Scheduler & recap
- [ ] Phase 6 — Spaced repetition & progress
- [ ] Phase 7 — RAG & evals
- [ ] Phase 8 — Auth, payments & deploy
