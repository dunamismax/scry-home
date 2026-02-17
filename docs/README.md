# Docs

This directory is reserved for durable, repo-local operational documentation for `scryai`.

Product app documentation lives with each product repository so quality gates stay coupled to app code.

Current stack baseline: Ruby 3.2+ with Rails 8, SQLite, ActiveRecord, ActiveJob `:async`, cache via `:memory_store` (or `:file_store`), Devise + Pundit, Hotwire + Tailwind CSS, Minitest, RuboCop, Bundler, and Ubuntu self-hosting behind Caddy.
