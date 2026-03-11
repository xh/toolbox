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

- **Build** — checks out the project, sets up JDK 17 and Gradle, and runs `./gradlew build` to
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

Two jobs run in parallel:

- **build-tomcat** — builds the Grails WAR via `./gradlew war` (using the default SNAPSHOT version
  from `gradle.properties`), copies it into the `docker/tomcat` context, and pushes a
  `toolbox-tomcat:snapshot` image to ECR.
- **build-nginx** — installs JS dependencies, runs `yarn lint` and `yarn build`, copies the built
  client assets into the `docker/nginx` context, and pushes a `toolbox-nginx:snapshot` image to ECR.

## Deploy Snapshot (`deploySnapshot.yml`)

Forces a new ECS deployment of the dev service using the current snapshot images in ECR. Runs
automatically after a successful Build Snapshot, or can be triggered manually via `workflow_dispatch`
to redeploy the latest images already in ECR (e.g. after an infrastructure change).

The deploy calls `aws ecs update-service` with `--force-new-deployment` against the `toolbox`
cluster / `toolbox-dev` service.

## Build Release (`buildRelease.yml`)

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

## Required Secrets

| Secret | Used By | Purpose |
|--------|---------|---------|
| `AWS_ACCESS_KEY_ID` | Build + Deploy | AWS credentials for ECR and ECS access |
| `AWS_SECRET_ACCESS_KEY` | Build + Deploy | AWS credentials for ECR and ECS access |
| `AWS_REGION` | Build + Deploy | AWS region for ECR and ECS |
| `AWS_ACCOUNT_ID` | Build | Used to construct the ECR registry URL |
| `FONTAWESOME_PACKAGE_TOKEN` | CI, Build | Auth token for the Font Awesome Pro npm registry (`npm.fontawesome.com`) |
| `GITHUB_TOKEN` | Build Release | Provided automatically by GitHub Actions; used for `gh release create` |
