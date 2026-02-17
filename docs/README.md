# Docs

This directory is reserved for durable, repo-local operational documentation for `scryai`.

Product app documentation lives with each product repository so quality gates stay coupled to app code.

Current stack baseline: Python 3.12+ with FastAPI, PostgreSQL (Dockerized), asyncpg + raw SQL (no ORM), dbmate migrations, Pydantic v2, Jinja2 + HTMX, PicoCSS, pytest, ruff, mypy, and uv.
