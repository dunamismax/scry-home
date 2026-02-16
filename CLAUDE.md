# CLAUDE.md

> **This is a living document.** It must be kept accurate and up to date at all times. Update this file whenever new conventions, tools, preferences, or instructions are established. Prune anything that becomes outdated. Short, explicit, actionable instructions outperform long vague ones -- keep it tight.

## First Things First

**Read `SOUL.md` before doing anything.** That file defines who Stephen is, who Claude is in this partnership, and the spirit of how we work. Keep it updated as you learn new things.

## Owner

- **Name:** Stephen
- **Environment:** Ubuntu VM (WSL2), terminal-first workflow
- **Home:** `/home/sawyer`
- **Projects Root:** `/home/sawyer/github/`

---

## Tech Stack (Mandatory -- No Exceptions)

### Infrastructure & Platform

| Layer | Tool | Notes |
|---|---|---|
| **Platform** | Ubuntu 24.04 LTS, Docker, Docker Compose | Production and development environments. |
| **Edge/SSL** | Caddy | Reverse proxying to the application port. Handles TLS automatically. |
| **CI/CD** | GitHub Actions | Builds, tests, deploys via SSH. |
| **Backups** | `pg_dump` | Nightly dumps to external object storage. |

### Application Layer

| Layer | Tool | Notes |
|---|---|---|
| **Language** | Python | Everything. Apps, scripts, automation, glue code, one-off tasks. Always `.py`. Use type hints liberally. |
| **Performance Language** | Rust | For anything that needs to be fast. CLI tools, data processing, hot paths. Use when Python isn't fast enough. |
| **Toolchain** | uv (by Astral) | Stephen's favorite tool. **Use `uv` for everything:** package management, virtual environments, Python version management, running scripts, running tools, creating projects. Never use pip/pipx/poetry/conda directly. Always latest version (`uv self update`). |
| **Linting & Formatting** | Ruff (by Astral) | All Python code is linted and formatted by Ruff. Run via `uvx ruff check` and `uvx ruff format`. Configure in `pyproject.toml`. Replaces Black, Flake8, isort, pyupgrade, and more. |
| **Web Framework** | FastAPI | Async-native, type-safe, auto-generates OpenAPI docs. The only web framework. Do not suggest Django, Flask, or anything else. |
| **Hypermedia** | HTMX | Server sends HTML fragments, HTMX swaps them into the DOM. No JSON APIs for UI. No SPA. Hypermedia-driven. |
| **Client Interactivity** | AlpineJS | Lightweight client-side reactivity when needed. Declarative, no build step. Use sparingly -- prefer server-rendered HTML. |
| **Templating** | Jinja2 | Server-side HTML templates. FastAPI + Jinja2 for all page rendering. |
| **Styling** | Vanilla CSS + HTML | Hand-crafted from scratch. No Tailwind, no CSS frameworks. Beautiful, home-brewed, semantic HTML with clean CSS. |
| **TUI Framework** | Textual (by Textualize) | All terminal UI applications. Rich widget set, CSS-like styling, async-native. The only TUI framework -- do not suggest curses, urwid, or blessed. |
| **CLI Output** | Rich (by Textualize) | All CLI programs use Rich for output -- tables, progress bars, syntax highlighting, markdown, tracebacks. Never plain `print()` in CLI tools. |
| **Auth** | To be decided | *(Will be configured per-project. Options: custom with FastAPI, or a library like `authlib`.)* |

### Data Layer

| Layer | Tool | Notes |
|---|---|---|
| **Database** | PostgreSQL 16 + `pgvector` | Primary data store with vector similarity search. |
| **ORM / Query Builder** | SQLAlchemy 2.0 or raw SQL | SQLAlchemy for complex apps, raw `asyncpg` for performance-critical paths. Decide per-project. |
| **Migrations** | Alembic | Database schema migrations, integrated with SQLAlchemy. |

### Monitoring

| Layer | Tool | Notes |
|---|---|---|
| **Observability** | OpenTelemetry + SigNoz | Full-stack tracing. |
| **System Monitoring** | Glances | Installed in `utilities/glances/`. Run via `./utilities/glances/run-glances.sh`. |

### Why This Stack

- Python is readable, powerful, and universal. One language, one mental model.
- uv is the Python toolchain done right -- Astral built what should have existed from day one. Fast, correct, comprehensive.
- Ruff is linting + formatting in one Rust binary. 10-100x faster than the tools it replaces. No reason to use anything else.
- FastAPI is the best Python web framework -- async, type-safe, and generates docs for free.
- HTMX respects the browser. Server renders HTML, browser renders the page. No 2MB JavaScript bundles.
- AlpineJS adds interactivity without a build step or framework overhead.
- Vanilla CSS because CSS is powerful enough. No utility classes, no framework. Just clean stylesheets.
- Rust when speed matters. Memory-safe, zero-cost abstractions, fearless concurrency.
- Textual makes terminal apps that look and feel like real applications -- CSS-like styling, widgets, async. The terminal is a first-class UI target.
- Rich makes every CLI beautiful. Tables, progress bars, tracebacks, markdown -- no excuse for ugly terminal output.
- PostgreSQL + pgvector keeps vector search in the database where it belongs.
- Caddy handles TLS automatically with zero config.
- OpenTelemetry is vendor-neutral. SigNoz today, anything else tomorrow.

---

## uv Usage (Mandatory)

**uv is the only Python tool.** Never use pip, pipx, poetry, conda, or virtualenv directly.

### Common Patterns

```bash
# Run a Python script
uv run script.py

# Run a script with ad-hoc dependencies
uv run --with requests --with rich script.py

# Create a new project
uv init my-project
cd my-project

# Add dependencies to a project
uv add fastapi uvicorn jinja2

# Add dev dependencies
uv add --dev ruff pytest

# Remove a dependency
uv remove some-package

# Sync environment (install all deps from lockfile)
uv sync

# Run a command in the project environment
uv run python -m pytest

# Run a tool without installing it
uvx ruff check .
uvx ruff format .

# Install a tool globally
uv tool install ruff

# Manage Python versions
uv python install 3.13
uv python pin 3.13

# Lock dependencies
uv lock

# Upgrade a specific package
uv lock --upgrade-package fastapi
```

### Script Inline Dependencies

For standalone scripts, use inline metadata instead of requirements.txt:

```python
# /// script
# requires-python = ">=3.13"
# dependencies = [
#   "requests",
#   "rich",
# ]
# ///

import requests
from rich import print
# ...
```

Run with `uv run script.py` -- uv handles the environment automatically.

### Shebang Scripts

For scripts that should be directly executable:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = ["requests"]
# ///

import requests
# ...
```

Then `chmod +x script.py` and run as `./script.py`.

---

## Ruff Configuration

Standard `pyproject.toml` Ruff config for all projects:

```toml
[tool.ruff]
target-version = "py313"
line-length = 100

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "SIM",  # flake8-simplify
    "RUF",  # ruff-specific rules
]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

Run Ruff on every file before committing:

```bash
uvx ruff check --fix .
uvx ruff format .
```

---

## Workflow: Explore, Plan, Code, Commit

Follow this order for any non-trivial task:

1. **Explore** -- Read relevant files. Understand existing code before touching it. Never propose changes to code you haven't read.
2. **Plan** -- Formulate a strategy. For anything beyond a small fix, discuss the approach before writing code.
3. **Code** -- Implement. Keep changes minimal and focused.
4. **Verify** -- Run tests (`uv run -m pytest`), lint (`uvx ruff check .`), format (`uvx ruff format .`). Never ship unverified code.
5. **Commit** -- Atomic commits with clear "why" messages.

---

## Git & GitHub Rules

- **Never push directly to main/master.** Always work on feature branches and create pull requests.
- **Never force push.** No `--force`, no `reset --hard` on shared branches.
- **Never skip hooks.** No `--no-verify`.
- Commit messages describe the *why*, not the *what*. The diff shows what changed.
- Keep commits atomic -- one logical change per commit.
- Branch naming: `feature/description`, `fix/description`, `chore/description`.

---

## Permissions & Safety

### Do Without Asking

- Read any file
- Search the codebase
- Run linting (`uvx ruff check .`)
- Run formatting (`uvx ruff format .`)
- Run tests (`uv run -m pytest`)
- Create feature branches
- Write or edit code files as part of an agreed-upon task

### Ask Before Doing

- Installing or removing packages/dependencies
- Deleting files or directories
- Modifying CI/CD configuration
- Changing project structure significantly
- Any operation that affects systems outside the local repo
- Running database migrations
- Creating new projects/repos

---

## Code Standards

### Do

- Write clean, readable Python with type hints. Use `str`, `int`, `list[str]`, `dict[str, Any]`, `Optional`, etc.
- Use `pathlib.Path` over `os.path`.
- Use `async`/`await` for I/O-bound operations.
- Use f-strings for string formatting.
- Use dataclasses or Pydantic models for structured data.
- Use FastAPI's dependency injection for shared resources.
- Handle errors at system boundaries (user input, API responses, external data).
- Name things clearly. A good name eliminates the need for a comment.
- Prefer early returns over deep nesting.
- Prefer flat over nested. Prefer simple over clever.
- Use `uv run` to execute everything.

### Don't

- Don't use `Any` as a crutch. If you're reaching for `Any`, the types are wrong -- fix them.
- Don't use pip/pipx/poetry/conda. That's what uv is for.
- Don't use JavaScript frameworks for web UIs. That's what HTMX + AlpineJS is for.
- Don't hardcode values that could change (URLs, keys, magic numbers). Use config/env.
- Don't add comments to code you didn't write or change.
- Don't create abstractions for things used only once. Three similar lines > premature abstraction.
- Don't add error handling for impossible states. Trust internal code.
- Don't over-engineer. Solve today's problem, not next year's hypothetical.
- Don't leave `print()` in production code. Use proper logging (`import logging`).
- Don't use `requirements.txt` for projects. Use `pyproject.toml` + `uv.lock`.
- Don't use `setup.py` or `setup.cfg`. Use `pyproject.toml`.

---

## File-Scoped Commands

Use these to verify changes:

```bash
# Lint a single file
uvx ruff check path/to/file.py

# Format a single file
uvx ruff format path/to/file.py

# Run a single test file
uv run -m pytest path/to/test_file.py

# Run a script
uv run path/to/script.py

# Type-check (when mypy or pyright is configured)
uv run -m mypy path/to/file.py
```

---

## Testing Strategy

Defaults until otherwise specified:

- Test runner: pytest (via `uv run -m pytest`)
- Focus on integration tests over unit tests where practical
- Test behavior, not implementation details
- Every bug fix should include a regression test
- Use `pytest-asyncio` for async test support
- Use `httpx` with `TestClient` for FastAPI endpoint tests

---

## Project Structure Conventions

Standard FastAPI + HTMX project layout:

```
src/
  app/
    main.py            # FastAPI app factory
    config.py          # Settings via pydantic-settings
    routes/            # Route modules (each returns an APIRouter)
    templates/         # Jinja2 HTML templates
    static/            # CSS, images, AlpineJS (if needed)
      css/
        style.css      # Hand-crafted vanilla CSS
    models/            # SQLAlchemy / Pydantic models
    db/                # Database connection, migrations
    auth/              # Authentication logic
    services/          # Business logic layer
tests/
  conftest.py
  test_routes/
  test_services/
pyproject.toml         # Project metadata, dependencies, Ruff config
uv.lock                # Locked dependencies (committed to git)
.python-version        # Python version pin
alembic.ini            # Alembic migration config
alembic/               # Migration scripts
Dockerfile
docker-compose.yml
```

---

## Repo-Level Directories

| Directory | Purpose |
|---|---|
| `scrybase/` | Scrybase project (legacy TanStack Start app -- will be rebuilt in Python) |
| `utilities/` | Third-party tools, scripts, and programs. Cloned repos, Python tools, downloaded utilities. |

---

## Active Projects

| Project | Path | Status | Description |
|---|---|---|---|
| Claude | `/home/sawyer/github/Claude` | Active | Meta-repo: Claude's identity, config, and documentation. The One Repo to Rule Them All. |
| Scrybase | `/home/sawyer/github/Claude/scrybase` | Paused | RAG-as-a-Service platform. Currently TypeScript/TanStack -- will be rebuilt in Python. Domain: `scrybase.app` (Cloudflare DNS). |

*(Add projects here as they are created.)*

### Utilities / Tools

| Tool | Path | Run | Description |
|---|---|---|---|
| Glances | `utilities/glances/` | `./utilities/glances/run-glances.sh` | System monitoring (CPU, RAM, disk, network, containers). **Setup:** `./utilities/setup-glances.sh`. Cloned from `nicolargo/glances`. Python 3.13 venv with `glances[all]`. |

*(Add tools here as they are installed.)*

---

## Lessons Learned

*(Log non-obvious discoveries, gotchas, and hard-won knowledge here. Future sessions benefit from past pain.)*

| Date | Lesson |
|---|---|
| 2026-02-16 | Initial setup. AGENTS.md renamed to CLAUDE.md per Claude Code conventions. |
| 2026-02-16 | `utilities/` folder established for non-TypeScript tools. Cloned repos go here with their own venvs. Each tool gets a `run-*.sh` launcher and a `setup-*.sh` installer. |
| 2026-02-16 | **PARADIGM SHIFT:** Dropped TypeScript/Bun/TanStack entirely. Adopted Python/uv/Ruff/FastAPI/HTMX/AlpineJS/Rust. uv is the only package/project/script tool. Ruff is the only linter/formatter. |
| 2026-02-16 | uv 0.10.3 installed at `~/.local/bin/uv`. Python 3.13.12 available system-wide via deadsnakes PPA. Ruff 0.15.1 available via `uvx ruff`. |
| 2026-02-16 | uv inline script metadata (`# /// script`) is the preferred way to declare dependencies for standalone scripts. No requirements.txt needed. |
| 2026-02-16 | uv automatically manages venvs, lockfiles, and Python versions per-project. Just use `uv init`, `uv add`, `uv run`. |

---

## Notes

*(Running notes, reminders, and context.)*

- **Domain:** `scrybase.app` -- owned by Stephen, DNS managed on Cloudflare with full control.
- **Version philosophy:** Always latest. Python, uv, Ruff, FastAPI, and all dependencies should be the newest stable. No pinning to old versions "for safety." Bleeding edge is the default.
- **uv is king.** If uv can do it, use uv. No pip, no pipx, no poetry, no conda. Ever.
- **Ruff is law.** All Python code is linted and formatted by Ruff before commit. No exceptions.
