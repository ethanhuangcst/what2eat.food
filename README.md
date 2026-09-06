# what2eat

Thin web + BFF for **what2eat.food** (restaurant recommend UX). Place/map calls go to **places-agent**.

This directory is **code and engineering only**. Product specs live in the umbrella repo:

- [`../specs/2eat-specs/`](../specs/2eat-specs/)
- Family architecture: [`../specs/2.architecture.md`](../specs/2.architecture.md)

## Quick start

```bash
cp .env.example .env.local   # fill secrets locally — do not commit
make up                      # Postgres on :5435
make db-migrate
make dev                     # Next on :3020
```

Useful targets: `make help`, `make test`, `make quality`, `make test-e2e-mvp1`.

## Docs

| Doc | Purpose |
| --- | --- |
| [`../specs/2eat-specs/2eat-stories.md`](../specs/2eat-specs/2eat-stories.md) | User stories / AC |
| [`../specs/2eat-specs/2eat-design.md`](../specs/2eat-specs/2eat-design.md) | Design + page contracts |
| [`../specs/2eat-specs/2eat-test-plan.md`](../specs/2eat-specs/2eat-test-plan.md) | Test plan |
| [`../specs/2eat-specs/2eat-deployment-plan.md`](../specs/2eat-specs/2eat-deployment-plan.md) | Deploy / local run |
