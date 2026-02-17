# Performance CI

This repo enforces Lighthouse quality gates for `apps/bedrock-template` in both **mobile** and **desktop** modes.

## Metrics gated

- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- TBT (Total Blocking Time)
- Category scores: Performance, Accessibility, Best Practices, SEO

## Local run

From repo root:

```bash
# Build + run Lighthouse mobile + desktop (3 runs each)
bun run perf:lighthouse

# Assert absolute thresholds
bun run perf:lighthouse:assert -- --report artifacts/lighthouse/current.json

# Assert thresholds and deltas vs baseline report
bun run perf:lighthouse:assert -- --report artifacts/lighthouse/head.json --baseline artifacts/lighthouse/base.json
```

Threshold config: `docs/performance/lighthouse-thresholds.json`
