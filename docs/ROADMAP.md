# PrepLoop — Build roadmap

Paste one phase prompt at a time into Claude Code. Each phase ends with working code, passing tests, and a git commit.

---

## Phase 1 — Foundation
- [ ] Done

```
Read CLAUDE.md and docs/PRD.md. We're starting Phase 1 — Foundation.

First, inspect my existing AI project at <PATH_TO_EXISTING_PROJECT> (read-only) and tell me:
how Postgres is run, whether pgvector is available, how the Anthropic key is loaded, and any LLM
client code worth reusing. Then propose a plan for:
1. Monorepo skeleton matching the structure in CLAUDE.md (backend with uv + FastAPI, frontend with Vite + React + TS + Tailwind).
2. docker-compose.yml: Postgres 16 + pgvector (or reuse my existing server with a new `preploop` database), backend, frontend.
3. Config via pydantic-settings and .env.example (DATABASE_URL, ANTHROPIC_API_KEY, model names).
4. SQLAlchemy models for every table in CLAUDE.md + first Alembic migration.
5. Seed script loading the syllabus from docs/PRD.md section 4 (titles + short descriptions only).
6. GET /health and GET /syllabus/today endpoints, with pytest tests.
7. A bare React dashboard calling /syllabus/today.
Wait for my approval before writing code.
```

## Phase 2 — Study & project modules (no AI yet)
- [ ] Done

```
Phase 2: build study sessions (notes markdown editor, Excalidraw diagram saved as JSON) and the
project tracker (tasks kanban + daily log). CRUD APIs with tests, React pages Study and Project,
and the dashboard showing the 4 time-slot cards. Plan first.
```

## Phase 3 — Quiz engine
- [ ] Done

```
Phase 3: services/llm.py wrapping the Anthropic SDK (model names from config, prompt caching,
retry on invalid JSON). quiz_generator creates 5 questions from a study session's notes as strict
JSON validated by Pydantic. Quiz API: POST /quiz/start, POST /quiz/{id}/answer, POST /quiz/{id}/finish.
MCQ graded in code. Quiz page in React, one question at a time with instant feedback. Mock the LLM in tests.
```

## Phase 4 — AI grading & teach-back
- [ ] Done

```
Phase 4: grader service scoring open/design answers against a reference answer with the rubric
(correctness, trade-offs, scale, failure modes) → score 0–10 + feedback. Teach-back endpoint where
Claude critiques my explanation like a senior interviewer and asks 2 follow-up questions. Prompts
live in app/prompts/. Plan first.
```

## Phase 5 — Scheduler & recap
- [ ] Done

```
Phase 5: APScheduler jobs (Asia/Kolkata): 06:00 build daily recap from yesterday's sessions, logs and
quiz results (Haiku); 21:00 prepare tonight's quiz. Recap page in React with 3 inline recall questions.
Optional email via a pluggable sender. Plan first.
```

## Phase 6 — Spaced repetition & progress
- [ ] Done

```
Phase 6: SM-2 in services/spaced_repetition.py with unit tests. Nightly quiz = ~60% today + ~40% due
items, weakest topics first. Progress page: score trend, weak-topic heatmap, streak (Recharts). Plan first.
```

## Phase 7 — RAG & evals
- [ ] Done

```
Phase 7: chunk + embed notes into pgvector (note_chunks), POST /ask answers from my notes with
citations. Add an eval suite (backend/evals/) of known Q&A pairs that checks grader consistency;
runnable with one command. Plan first.
```

## Phase 8 — Auth, payments & deploy
- [ ] Done

```
Phase 8: simple JWT auth, per-user token budget enforcement, Razorpay subscription stub, production
Dockerfiles, deploy plan (frontend on Vercel, API + Postgres on Render/Railway), Sentry. Plan first.
```

---

## Later
- Mentor marketplace (profiles, ratings, mentor-set prices, booking, payouts)
- Community (friends, leaderboards, group challenges, discussion threads)
- AI mock interviews (Pro)
