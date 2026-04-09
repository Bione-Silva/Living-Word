---
name: No streaming for pastoral/study generation
description: Streaming disabled — breaks word-count audit + retry mechanism
type: constraint
---
Never implement SSE/streaming for generate-pastoral-material or generate-biblical-study.
Reason: the backend validates minimum word counts and retries; streaming would show text that might be discarded on retry failure.
Decision date: 2026-04-05.