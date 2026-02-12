# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Toolbox is a full-stack Hoist application by Extremely Heavy Industries (XH) that serves as the
primary demo, test, and reference implementation for the **Hoist UI framework**. It includes
desktop, mobile, and admin apps plus several standalone example applications (contact, todo,
portfolio, news, recalls, filemanager).

Because Toolbox is the development and testing vehicle for Hoist itself, two framework plugins are
central to work in this repo:

- **`@xh/hoist`** (hoist-react) — the client-side React/MobX framework
- **`hoist-core`** — the server-side Grails/Spring Boot framework

Understanding these frameworks is essential to writing correct, idiomatic code in this application.

## Hoist Framework Documentation — READ THIS FIRST

### hoist-react (client-side)

hoist-react ships as an uncompiled library, so its full source *and documentation* are available
locally. A symlink at **[`docs/hoist-react/`](./docs/hoist-react/)** points into the installed
`@xh/hoist` package for easy access. **Before writing or modifying any client-side code, consult
the hoist-react documentation:**

> **[`docs/hoist-react/README.md`](./docs/hoist-react/README.md)**

This is the primary documentation index — an AI-agent-optimized catalog of all package READMEs,
cross-cutting concept docs, and DevOps guides. A **Quick Reference by Task** table is also
inlined in [`CLAUDE.md`](./CLAUDE.md) for immediate lookup.

Use this index as your first stop when you need to understand how a Hoist feature works, what
patterns to follow, or what APIs are available. The docs are the authoritative reference for how
Hoist packages work and how they are intended to be used — **skipping them risks producing code
that conflicts with established patterns or misses built-in functionality.**

Additional package-level READMEs are co-located with their source code throughout the hoist-react
tree (e.g. `docs/hoist-react/../cmp/grid/README.md`). The docs index links to all of them.

The hoist-react package also contains its own `AGENTS.md` at
`docs/hoist-react/../AGENTS.md` with architecture patterns, coding conventions, and
code style guidance specific to the framework.

### hoist-core (server-side)

Comprehensive agent-facing documentation for hoist-core is not yet available. For server-side work,
refer to the existing source code in `grails-app/` and the public hoist-core repository on GitHub
at https://github.com/xh/hoist-core. A local checkout may exist as a sibling directory
(`../hoist-core`) — this is common for XH developers but is not required and may be out of date.
**Prefer the GitHub repository as the authoritative source for hoist-core reference material
unless asked not to or the context suggests the local version is more relevant.**

## Tech Stack

- **Frontend**: TypeScript, React 18, MobX, AG Grid, Highcharts, `@xh/hoist` framework
- **Backend**: Grails 7 (Groovy/Spring Boot), `hoist-core` framework
- **Database**: MySQL (or H2 in-memory for quick local dev via `APP_TOOLBOX_USE_H2=true`)
- **Package Manager**: Yarn 1.22 (frontend), Gradle via wrapper (backend)

## Common Commands

### Frontend (run from `client-app/`)
```bash
yarn install              # Install dependencies
yarn start                # Dev server on port 3000
yarn build                # Production build
yarn lint                 # Run ESLint + Stylelint
yarn lint:code            # ESLint only
yarn lint:styles          # Stylelint only
yarn startWithHoist       # Dev server using local sibling hoist-react
```

### Backend (run from project root)
```bash
./gradlew bootRun     # Start Grails server on port 8080
./gradlew console     # Grails interactive console
```

### Local Development
Run both simultaneously:
- Terminal 1: `./gradlew bootRun`
- Terminal 2: `cd client-app && yarn start`

### Pre-commit Hooks
Husky runs automatically on commit: `lint-staged` (prettier + eslint on staged files) and conditionally the TypeScript compiler if TS/JS/package files are staged.

## Code Style

- **Prettier**: 100 char width, single quotes, no trailing commas, 4-space indent (JS/TS), 2-space (SCSS/JSON)
- **No bracket spacing**: `{foo}` not `{ foo }`
- **Arrow parens**: avoid when possible (`x => x` not `(x) => x`)
- **Semicolons**: always
- **Trailing commas**: none

## Architecture

### Frontend (`client-app/src/`)
- **`apps/`** — Entry points for each app (app.ts, admin.ts, contact.ts, etc.). Each calls `XH.renderApp()`.
- **`desktop/`** — Main desktop app: `AppModel.ts` (state) + `AppComponent.tsx` (UI), organized into `tabs/` (home, forms, grids, charts, layout, panels, other, examples).
- **`mobile/`** — Mobile app variant.
- **`admin/`** — Admin console.
- **`examples/`** — Standalone example applications (contact, todo, portfolio, news, recalls, filemanager).
- **`core/`** — Shared services (`svc/`), auth (`AuthModel.ts`), column definitions.
- **`Bootstrap.ts`** — AG Grid & Highcharts license/module registration.

**Key pattern**: Apps follow Model + Component pairing. Models hold state (MobX observables), Components render UI. Services are singleton classes for data fetching and business logic. See the hoist-react docs (referenced above) for detailed coverage of this architecture.

### Backend (`grails-app/`)
- **`controllers/`** — REST controllers extending `BaseController` (from hoist-core). Package: `io.xh.toolbox.*`
- **`services/`** — Business logic extending `BaseService`. Support `CachedValue`, `clearCachesConfigs`.
- **`domain/`** — GORM domain classes.
- **`conf/`** — `application.groovy` and `runtime.groovy` configuration.
- **`init/`** — Bootstrap, security, logging setup.

### Instance Configuration
Environment variables loaded from `.env` file (copy `.env.template` to `.env`). Required: `APP_TOOLBOX_ENVIRONMENT`, `APP_TOOLBOX_DB_HOST`, `APP_TOOLBOX_DB_SCHEMA`, `APP_TOOLBOX_DB_USER`, `APP_TOOLBOX_DB_PASSWORD`.

## Related Repositories

XH / Hoist framework developers can optionally check out the framework libraries as sibling
directories for inline development of the libraries. This is not required for app development.
- **`../hoist-core`** — Groovy/Java backend framework. Enable with `runHoistInline=true` in `gradle.properties`.
- **`../hoist-react`** — React frontend library. Enable with `yarn startWithHoist` from `client-app/`.

## Testing & Validation

This repository does not have extensive automated test infrastructure. Manual testing is the primary
validation method:

- **Run locally**: Start both server (`./gradlew bootRun`) and client (`yarn start`) to test changes
- **Exercise in browser**: Verify UI/API functionality works correctly
- **Pre-commit checks**: Husky automatically runs linters and (conditionally) TypeScript compiler

## Security & Boundaries

### What to Modify
- Application code in `grails-app/` and `client-app/src/`
- Configuration files when adding new features
- Documentation when making significant changes

### What NOT to Modify
- **`.env` file** — Local environment config (gitignored, contains credentials)
- **Framework code** — `hoist-core` and `hoist-react` are dependencies, not part of this repo
- **Build configs** — Only modify if absolutely necessary for the task
- **Certificates** — Self-signed certs in `src/main/resources/local-dev/` are for local HTTPS
- **Auth0 config** — Must be updated by authorized team members only

### Security Guidelines
- **Never commit secrets** — All credentials belong in `.env` file (gitignored)
- **Check dependencies** — Run security scanning before adding new packages
- **Database credentials** — Must be in `.env`, never in code
- **Always scan code changes** — Run security checks on any code modifications
