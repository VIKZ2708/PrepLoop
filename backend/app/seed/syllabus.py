"""Seed syllabus data from PRD Section 4.

Run with: cd backend && uv run python -m app.seed.syllabus
"""
import asyncio
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings
from app.models.models import SyllabusItem

SYLLABUS: list[tuple[str, int, str, str]] = [
    # (track, day_no, title, description)

    # ── System Design Vol 1 ──────────────────────────────────────────────
    ("sd1", 1,  "Scale from zero to millions",
     "Evolve a single-server system through vertical scaling, load balancers, caching, CDN, and database sharding to handle millions of users."),
    ("sd1", 2,  "Back-of-envelope estimation",
     "Quick capacity estimation techniques: QPS, storage, bandwidth, and memory calculations used in system design interviews."),
    ("sd1", 3,  "Interview framework",
     "A structured approach to system design interviews: clarify requirements, estimate scale, design high-level components, then drill into detail."),
    ("sd1", 4,  "Rate limiter",
     "Token bucket, leaky bucket, and sliding window algorithms. Distributed rate limiting with Redis to protect APIs from abuse."),
    ("sd1", 5,  "Consistent hashing",
     "Ring-based hashing that minimises key remapping when servers are added or removed, used in distributed caches and storage."),
    ("sd1", 6,  "Key-value store",
     "Distributed KV store with get/put/delete, partitioning, replication, and consistency models (eventual vs. strong)."),
    ("sd1", 7,  "Unique ID generator",
     "Globally unique, roughly sortable IDs via UUIDs, Snowflake IDs, and ticket servers—trade-offs in ordering and coordination."),
    ("sd1", 8,  "URL shortener",
     "Hashing strategies, redirect mechanics, analytics, custom aliases, and expiration at scale (bit.ly style)."),
    ("sd1", 9,  "Web crawler",
     "Distributed crawler architecture: URL frontier, politeness delays, deduplication via Bloom filter, storage, and trap handling."),
    ("sd1", 10, "Notification system",
     "Fan-out on write vs. read, push/pull delivery, iOS/Android/web push, email pipelines, and rate-limiting notifications."),
    ("sd1", 11, "News feed",
     "Timeline generation using push/pull hybrid models, ranking algorithms, and caching strategies for a social feed."),
    ("sd1", 12, "Chat system",
     "Real-time messaging with WebSockets, message storage, delivery guarantees, group chat fan-out, and online presence."),
    ("sd1", 13, "Search autocomplete",
     "Trie-based and index-based approaches, candidate aggregation, ranking by frequency, and serving sub-100ms suggestions."),
    ("sd1", 14, "YouTube",
     "Video upload pipeline (chunking, transcoding), CDN delivery, adaptive bitrate streaming, and recommendation feed."),
    ("sd1", 15, "Google Drive",
     "Distributed file storage: block chunking, deduplication, metadata service, sync protocol, and conflict resolution."),

    # ── System Design Vol 2 ──────────────────────────────────────────────
    ("sd2", 1,  "Proximity service",
     "Finding nearby points of interest using geohashing or quadtrees, with read-heavy caching and location indexing."),
    ("sd2", 2,  "Nearby friends",
     "Real-time location sharing: pub/sub updates, fan-out to friends' clients, and privacy controls at scale."),
    ("sd2", 3,  "Google Maps",
     "Map tile serving, routing with Dijkstra/A*, ETA prediction, live traffic integration, and geocoding pipelines."),
    ("sd2", 4,  "Distributed message queue",
     "Kafka-style design: partitions, replication, consumer groups, at-least-once vs. exactly-once delivery, and retention."),
    ("sd2", 5,  "Metrics monitoring",
     "Time-series ingestion pipeline, downsampling, alerting, and dashboards modelled on Prometheus/Grafana."),
    ("sd2", 6,  "Ad click aggregation",
     "High-throughput event ingestion, deduplication, real-time vs. batch aggregation, and fraud detection hooks."),
    ("sd2", 7,  "Hotel reservation",
     "Inventory management, race conditions in booking, idempotent payments, and distributed locking strategies."),
    ("sd2", 8,  "Distributed email",
     "Large-scale email delivery: SMTP pipeline, spam filtering, inbox storage (IMAP), attachment handling, and deliverability."),
    ("sd2", 9,  "S3-like storage",
     "Object storage internals: bucket/key addressing, multipart upload, erasure coding, replication, and access control."),
    ("sd2", 10, "Gaming leaderboard",
     "Real-time rank computation with Redis sorted sets, windowed leaderboards (daily/weekly), and at-scale score ingestion."),
    ("sd2", 11, "Payment system",
     "Double-entry ledger, idempotency keys, retry logic, PSP integration, reconciliation, and fraud checks."),
    ("sd2", 12, "Digital wallet",
     "Balance management, peer-to-peer transfers, transaction history, currency conversion, and regulatory compliance."),
    ("sd2", 13, "Stock exchange",
     "Order book design, matching engine, market/limit orders, trade settlement, and market data feed distribution."),

    # ── AI Engineering ───────────────────────────────────────────────────
    ("ai",  1,  "LLM basics",
     "How transformers work: tokenization, attention mechanisms, context windows, and the fundamentals of next-token prediction."),
    ("ai",  2,  "Prompting",
     "Prompt engineering patterns: zero-shot, few-shot, chain-of-thought, system prompts, and structured output techniques."),
    ("ai",  3,  "Embeddings",
     "Dense vector representations of text, how embedding models work, similarity search, and use cases beyond retrieval."),
    ("ai",  4,  "RAG",
     "Retrieval-augmented generation: document chunking strategies, vector database indexing, hybrid retrieval, and citation grounding."),
    ("ai",  5,  "Tool use & agents",
     "Giving LLMs tools via function calling, building ReAct-style agents, multi-step planning, and error recovery loops."),
    ("ai",  6,  "MCP",
     "Model Context Protocol: how MCP servers expose resources and tools to AI assistants, building and connecting MCP servers."),
    ("ai",  7,  "Evals",
     "Evaluating LLM outputs: human vs. automated evals, LLM-as-judge, regression test suites, and benchmark design."),
    ("ai",  8,  "LLM serving",
     "Inference optimisation: batching, KV cache, quantisation, speculative decoding, and cost/latency trade-offs at scale."),
    ("ai",  9,  "Guardrails",
     "Input/output validation, prompt injection defence, content moderation, structured output enforcement, and safety layers."),
    ("ai",  10, "AI system design",
     "End-to-end design of AI-powered products: model selection, latency budget, cost modelling, observability, and graceful degradation."),
]


async def seed() -> None:
    engine = create_async_engine(settings.DATABASE_URL)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        result = await session.execute(select(func.count(SyllabusItem.id)))
        count = result.scalar()
        if count and count > 0:
            print(f"Syllabus already seeded ({count} items). Skipping.")
            await engine.dispose()
            return

        items = [
            SyllabusItem(track=t, day_no=d, title=title, description=desc)
            for t, d, title, desc in SYLLABUS
        ]
        session.add_all(items)
        await session.commit()
        print(f"Seeded {len(items)} syllabus items.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
