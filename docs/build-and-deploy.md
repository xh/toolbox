# Build and Deploy

Toolbox uses [GitHub Actions](https://docs.github.com/en/actions) for continuous integration,
Docker image builds, and deployment to AWS ECS. All workflow definitions live in
`.github/workflows/`.

For general background on building and deploying full-stack Hoist applications — including the
Gradle WAR build, Webpack client build, Docker image structure, nginx configuration, and deployment
patterns — see the
[Build & Deploy Apps](https://github.com/xh/hoist-react/blob/develop/docs/build-and-deploy-app.md)
guide in the hoist-react documentation. This document covers the Toolbox-specific GitHub Actions
that automate that process.

## CI (`ci.yml`)

Runs automatically on pushes and pull requests to `develop`. Includes three independent jobs:

- **Build** — checks out the project, sets up Java and Gradle, and runs `./gradlew build` to
  validate the Grails server compiles successfully.
- **Lint** — sets up Node.js (version from `client-app/.nvmrc`), installs JS dependencies via
  `yarn install --frozen-lockfile`, and runs `yarn lint` to validate the client code.
- **Dependency Submission** — generates and submits a Gradle dependency graph to GitHub, enabling
  Dependabot vulnerability alerts for all server-side dependencies.

This workflow does not publish any artifacts. For Docker image builds, see Build Snapshot and
Build Release below.

## Build Snapshot (`buildSnapshot.yml`)

Builds snapshot Docker images on every push to `develop` and pushes them to Amazon ECR. Also
triggered by `repository_dispatch` events from hoist-core and hoist-react when those libraries
publish new snapshots, ensuring Toolbox stays current with framework changes. Can also be triggered
manually via `workflow_dispatch`.

Uses `concurrency` with `cancel-in-progress: true` to avoid redundant builds when multiple pushes
land in quick succession.

The workflow runs in three stages:

- **prepare** — uses the shared `xh/hoist-dev-utils` `build-snapshot-tag` composite action to derive
  two identifiers from a single snapped timestamp, exposed as job outputs. `app-build` is the
  readable value (`<ref>_<sha>_<timestamp>`, e.g. `develop_9fab876_2026-06-06T17:17Z`) baked into
  `appBuild` on both client and server and shown in-app. `image-tag` is the immutable ECR image tag
  (`snap_<ref>_<sha>_<ts>`). Both come from the one timestamp, so a run's two values correspond. The
  action makes `image-tag` a total function — a valid Docker/ECR tag for any ref (allowlist charset,
  bounded length, colon-free), so the build always proceeds — and those container-tag constraints
  apply only to `image-tag`, never to the displayed `appBuild`. `app-build` is consumed by both build
  jobs, so client and server always report the same build (what the version-skew check compares). The
  action (and its unit test) live in hoist-dev-utils, shared across XH app repos.
- **build-tomcat** / **build-nginx** (parallel) — build the Grails WAR (via `./gradlew war`, default
  SNAPSHOT version from `gradle.properties`) and the client assets (`yarn lint` + `yarn build`)
  respectively, and push each to the run's *immutable* `image-tag` in ECR — **not** `:snapshot`.
- **promote** — runs only after both build jobs succeed, and retags both images to `:snapshot` via a
  registry-side manifest copy. This is the only step that advances the mutable `:snapshot` pointer,
  so the deployed pair always comes from a single run. Re-running one build job in isolation can no
  longer leave the server and client on mismatched builds (the failure that previously flapped
  `toolbox-dev` with a perpetual update prompt).

Because the `snap_` images stay permanently tagged (rather than going untagged on supersession), an
ECR lifecycle policy on both repos retains only the most recent few `snap_`-prefixed images
(`imageCountMoreThan`) while still expiring untagged images after a day; release tags and the live
`:snapshot` are left untouched. That policy is applied directly to ECR via
`aws ecr put-lifecycle-policy` and is not tracked in this repo.

## Deploy Snapshot (`deploySnapshot.yml`)

Forces a new ECS deployment of the dev service using the current snapshot images in ECR. Runs
automatically after a successful Build Snapshot, or can be triggered manually via `workflow_dispatch`
to redeploy the latest images already in ECR (e.g. after an infrastructure change).

The deploy calls `aws ecs update-service` with `--force-new-deployment` against the `toolbox`
cluster / `toolbox-dev` service.

## Build Release (`buildRelease.yml`)

> **Orchestrating a release:** Don't run these release steps by hand. The `release-toolbox` skill
> (`/release-toolbox`) is the authoritative runbook - it swaps the Hoist libraries to their
> released versions, finalizes the `CHANGELOG`, manages the `develop` -> `master` ff-merge, triggers
> and watches the workflows below, and restores `develop` afterward, with a confirmation gate at
> every mutating step. The sections here document the underlying mechanics that skill relies on; if
> you change a workflow's inputs, branch rules, or the auto-deploy behavior, update the skill to
> match.

Builds a numbered release as Docker images and pushes them to ECR. **Manually triggered** from the
`master` branch via `workflow_dispatch`. Requires two inputs:

- **Release Version** — a semver string (e.g. `9.0.0`). Must be exactly one increment (major,
  minor, or patch) from the latest existing release tag.
- **Is Hotfix** — check when releasing a hotfix to a version other than the latest. Requires the
  workflow to be run from a branch other than `master` or `develop`.

The workflow proceeds through four jobs:

1. **validate** — guards against accidental release from `develop`. Validates the version strictly:
   semver format, no duplicate tags, correct increment relative to existing tags. Hotfix versions
   are validated against existing tags for their major version.
2. **build-tomcat** — builds the WAR with the release version (`-PxhAppVersion`), pushes a versioned
   image and a `latest` tag to ECR.
3. **build-nginx** — builds the client app, pushes a versioned image and a `latest` tag to ECR.
4. **release** — creates and pushes a `vX.Y.Z` git tag, then creates a GitHub Release with
   auto-generated notes. Hotfixes are marked as not-latest.

## Deploy Release (`deployRelease.yml`)

Forces a new ECS deployment of the production service using the current release images in ECR. Runs
automatically after a successful Build Release, or can be triggered manually via `workflow_dispatch`.

The deploy calls `aws ecs update-service` with `--force-new-deployment` against the `toolbox`
cluster / `toolbox-prod` service.

## Docker Images

Toolbox produces two Docker images per build, stored in Amazon ECR under the `xh/` namespace:

| Image | Base | Contents |
|-------|------|----------|
| `toolbox-tomcat` | `xhio/xh-tomcat` | Grails WAR deployed to Tomcat |
| `toolbox-nginx` | `xhio/xh-nginx` | Webpack-built client assets served by nginx |

The Dockerfiles and supporting configs (including the nginx `app.conf` and Tomcat `setenv.sh`) live
in the `/docker/` directory. See the
[hoist-react app build guide](https://github.com/xh/hoist-react/blob/develop/docs/build-and-deploy-app.md#docker-container-images)
for details on the base images and container structure.

## AWS Authentication (OIDC)

Every job that touches AWS (ECR push/pull, the `:snapshot` retag in `promote`, and the ECS
`update-service` deploys) authenticates with **GitHub OIDC** rather than long-lived access keys.
Each such job:

- declares `permissions: id-token: write` (alongside `contents: read`), which lets the runner mint
  a short-lived GitHub OIDC token, and
- passes `role-to-assume: arn:aws:iam::<account-id>:role/xh-github-actions-deploy` to
  `aws-actions/configure-aws-credentials`, which exchanges that token for temporary STS credentials.

The `xh-github-actions-deploy` IAM role trusts the `token.actions.githubusercontent.com` OIDC
provider for the `xh` GitHub org and grants only what these workflows need: ECR authorization plus
push/pull on `xh/*` repositories, and `ecs:UpdateService` / `ecs:DescribeServices` for the forced
deployments. No static AWS keys are stored as repo secrets, so there is nothing to rotate. Jobs that
do not touch AWS (e.g. `prepare`, `validate`, `release`) do not request `id-token` and keep a minimal
permission scope.

## Required Secrets

| Secret | Used By | Purpose |
|--------|---------|---------|
| `AWS_REGION` | Build + Deploy | AWS region for ECR and ECS |
| `AWS_ACCOUNT_ID` | Build + Deploy | Used to construct the ECR registry URL and the OIDC role ARN |
| `FONTAWESOME_PACKAGE_TOKEN` | CI, Build | Auth token for the Font Awesome Pro npm registry (`npm.fontawesome.com`) |
| `GITHUB_TOKEN` | Build Release | Provided automatically by GitHub Actions; used for `gh release create` |

------------------------------------------

info@xh.io | <https://xh.io/>
