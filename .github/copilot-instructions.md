# Copilot Instructions for Toolbox

## Overview

Toolbox is a showcase application for the Hoist framework - a full-stack UI toolkit by Extremely Heavy Industries. It demonstrates Hoist components and provides examples for both desktop and mobile applications.

## Tech Stack

### Backend
- **Grails 7.0.5** - Server-side framework (Groovy/Java)
- **Hoist Core 36.0-SNAPSHOT** - Backend framework
- **MySQL** - Production database (H2 for local development)
- **Java 17+** - Required JVM version
- **Spring Boot** - Underlying application framework
- **Auth0** - Authentication provider

### Frontend
- **React 18.2** - UI framework
- **TypeScript 5.9** - Primary language for client code
- **Hoist React 80.0-SNAPSHOT** - Frontend framework
- **Webpack** - Module bundler
- **Node 18+** - Required (see `.nvmrc`)
- **Yarn 1.22** - Package manager
- **AG Grid 34.2** - Data grid component
- **Highcharts 12.x** - Charting library

### Development Tools
- **ESLint 9.x** - Code linting
- **Prettier 3.x** - Code formatting
- **Stylelint 17.x** - CSS linting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

## Common Commands

### Server (from project root)
```bash
# Start the Grails server
./gradlew bootRun -Duser.timezone=Etc/UTC

# Start with local hoist-core (requires sibling directory and runHoistInline=true in gradle.properties)
./gradlew bootRun -Duser.timezone=Etc/UTC

# Run console
./gradlew console

# Build WAR file
./gradlew war
```

### Client (from client-app directory)
```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Start with local hoist-react (requires sibling directory)
yarn startWithHoist

# Build for production
yarn build

# Lint code
yarn lint

# Lint JavaScript/TypeScript only
yarn lint:code

# Lint styles only
yarn lint:styles
```

## Project Structure

- `/grails-app/` - Grails backend code (controllers, services, domain, config)
- `/src/main/groovy/` - Additional Groovy source code
- `/client-app/src/` - React frontend source code
  - `desktop/` - Desktop application code
  - `mobile/` - Mobile application code
- `/client-app/public/` - Static assets
- `.env` - Local environment configuration (not committed, use `.env.template`)

## Development Guidelines

### Code Style
- **Backend**: Follow Groovy conventions; use 4 spaces for indentation
- **Frontend**: TypeScript is preferred; use Prettier and ESLint configurations
- **Pre-commit hooks**: Code is automatically formatted and linted via Husky
- **Do not add comments** unless they match existing style or explain complex logic

### Testing
- This repository does not have extensive test infrastructure
- Manual testing via running the application is the primary validation method
- Always test changes by running both server and client locally

### Git Workflow
- Never commit `.env` file (contains credentials)
- Use semantic commit messages
- Husky hooks will run linting before commits

### Dependencies
- **Backend**: Dependencies managed via Gradle (see `build.gradle`)
- **Frontend**: Dependencies managed via Yarn (see `client-app/package.json`)
- Hoist framework versions are coordinated between client and server
- Always check for security vulnerabilities before adding dependencies

## Configuration

### Instance Configuration
- Environment variables are loaded from `.env` file via Gradle plugin
- Copy `.env.template` to `.env` and configure for your environment
- Required variables must be set (validation runs at startup)

### Database
- **Local dev**: H2 (in-memory) or MySQL
- **Production**: MySQL with UTF8 charset
- Schema auto-created/updated via `dbCreate` setting

### Multiple Instances
- Enable via `APP_TOOLBOX_MULTI_INSTANCE_ENABLED=true` in `.env`
- Run additional server instances on different ports (e.g., 8081)
- Run additional client instances on different webpack ports (e.g., 3001)

## Important Notes

### What to Modify
- Application code in `grails-app/` and `client-app/src/`
- Configuration files when adding new features
- Documentation when making significant changes

### What NOT to Modify
- `.env` file (this is local and gitignored)
- Self-signed certificates in `src/main/resources/local-dev/`
- Build configuration files unless absolutely necessary
- Hoist framework code (modify in sibling repos: `hoist-core`, `hoist-react`)
- Dependencies without checking security advisories first

### Security
- Never commit secrets, API keys, or credentials
- Auth0 configuration must be updated by authorized team members only
- Database credentials go in `.env`, not in code
- Always run security scanning on code changes

## Related Resources

- [Hoist Core](https://github.com/xh/hoist-core)
- [Hoist React](https://github.com/xh/hoist-react)
- [Toolbox Dev Instance](https://toolbox-dev.xh.io)
- [Toolbox Production](https://toolbox.xh.io)

## Development Environment Setup

1. Install Java 17+ and MySQL (or plan to use H2)
2. Install Node.js (version from `.nvmrc`) and Yarn
3. Clone `toolbox`, `hoist-core`, and `hoist-react` as sibling directories
4. Copy `.env.template` to `.env` and configure
5. For server: `./gradlew bootRun -Duser.timezone=Etc/UTC`
6. For client: `cd client-app && yarn start`
7. Access application at `http://localhost:3000`

## Deployment

- Toolbox-dev auto-deploys via TeamCity on commits to `develop`
- Production instance updated manually with versioned Hoist releases
- Uses AWS infrastructure with MySQL database
