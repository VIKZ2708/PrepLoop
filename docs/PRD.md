# PrepLoop — Product Requirements (v1.0, Oct 2026)

Owner: Vikas Jakhar. Full visual PRD: `PrepLoop_PRD.pdf`.

## 1. Problem
Working engineers preparing for interviews have no daily plan, no feedback on what they learned, forget earlier topics, lose momentum, and pay ₹30–40k for courses that don't adapt to them.

## 2. Solution: one daily loop
| Time | Module | What it does |
|---|---|---|
| Morning (5 min) | **Recap** | Yesterday's summary: chapter, AI topic, project progress, quiz score, weak spots, 3 recall questions. Generated at 6 AM. |
| Afternoon (40–60 min) | **Study** | Today's system design chapter, markdown notes, Excalidraw whiteboard, teach-back box where AI critiques like a senior interviewer. |
| Evening (45–60 min) | **Build** | AI project tracker: tasks, milestones, daily build log (built / blockers / learnings). |
| Night (15–20 min) | **Quiz** | ~60% today's material + ~40% due/weak items via spaced repetition (SM-2). AI grades open answers. |

The loop closes nightly: quiz results feed the next morning's recap and the review schedule.

## 3. Users
- Primary: senior engineers (6–12 yrs) moving to top product companies; mid-level devs aiming for senior roles; engineers pivoting to AI engineering.
- Secondary (later): mentors who run live mock interviews; colleges/companies buying seats.

## 4. Syllabus (seed data)
- **System Design Vol 1:** scale from zero to millions, back-of-envelope estimation, interview framework, rate limiter, consistent hashing, key-value store, unique ID generator, URL shortener, web crawler, notification system, news feed, chat system, search autocomplete, YouTube, Google Drive.
- **System Design Vol 2:** proximity service, nearby friends, Google Maps, distributed message queue, metrics monitoring, ad click aggregation, hotel reservation, distributed email, S3-like storage, gaming leaderboard, payment system, digital wallet, stock exchange.
- **AI Engineering:** LLM basics (tokens, transformers, context), prompting, embeddings, RAG (chunking, vector DBs, retrieval), tool use & agents, MCP, evals, LLM serving (latency, caching, cost), guardrails, AI system design.
Only titles and short descriptions are stored. No book text.

## 5. MVP features
| Priority | Feature |
|---|---|
| P0 | Daily dashboard (4 module cards, streak, progress bar) |
| P0 | Syllabus engine (one unit per day per track, auto-advance) |
| P0 | Study workspace (notes, whiteboard, teach-back critique) |
| P0 | AI quiz generation from the learner's own notes (MCQ / short / design), strict JSON |
| P0 | AI grading with rubric: correctness, trade-offs, scale, failure modes |
| P0 | Spaced repetition (SM-2: 1 → 3 → 7 → 16 days; wrong → 1) |
| P1 | Morning recap job (6 AM) + email |
| P1 | Project tracker (kanban + daily log) |
| P1 | Progress analytics (score trend, weak-topic heatmap, streaks) |
| P2 | Ask-my-notes RAG with citations (pgvector) |

## 6. Post-MVP
- **Mentor marketplace:** profiles, ratings & reviews, mentor-set prices (₹999–4,999/session), booking, 20–25% commission, weekly group doubt sessions, AI prep pack sent to mentor before a session.
- **Community:** friends, streaks, leaderboards, group challenges, per-chapter discussion threads (WebSockets).
- **AI mock interviews:** full 45-min session with grading.

## 7. AI design
- Model routing: Sonnet → quiz generation (Batch API overnight), teach-back, mock interviews. Haiku → grading, recap, RAG.
- Prompt caching on all system prompts; per-user daily token caps enforced server-side.
- All LLM output validated with Pydantic; grader always gets a reference answer.
- Eval set of known Q&A pairs re-run on every prompt change.

## 8. Pricing (excl. GST)
- **Basic** ₹799/month (₹6,999/yr): full daily loop, AI quiz & grading, SRS, analytics.
- **Pro** ₹1,499/month (₹12,999/yr): + 4 AI mock interviews/month, ask-my-notes, higher limits.
- **Mentor Premium** ₹29,999 / 6 months: + 12 live 1:1 mocks, weekly group sessions.

## 9. Unit economics (planning estimates)
- AI cost ≈ ₹180/month per Basic learner, ≈ ₹320 per Pro learner (Sonnet $2/$10, Haiku $1/$5 per M tokens, ₹88/USD, 25 active days).
- 100 users (60 Basic / 30 Pro / 10 Premium): revenue ≈ ₹1.43L/month, costs ≈ ₹59k, gross margin ≈ 58%.
- Measure real token usage in beta and revise.

## 10. Success metrics
Day-30 retention ≥ 40% of trial users · ≥ 18 active days/month · trial → paid ≥ 8% · measurable quiz score improvement over 4 weeks · gross margin ≥ 55%.

## 11. Non-goals for MVP
Mobile app, marketplace, community, payments beyond a simple Razorpay subscription, multi-language UI.
