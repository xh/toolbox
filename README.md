# Welcome to Toolbox

Toolbox is an application designed to showcase Hoist, Extremely Heavy's full-stack UI toolkit.

Toolbox consists of both a desktop and mobile app with examples of all Hoist Components, their
usage, and links to related Hoist and Toolbox source code. Toolbox also provides several application
examples which may be especially useful as a starting point for application developers new to the
framework.

Please refer to the [Hoist Core](https://github.com/xh/hoist-core)
and [Hoist React](https://github.com/xh/hoist-react) repos for detailed information and
documentation on Hoist, including more information on configuring a local development environment.

Toolbox is itself a Hoist Application, and we keep it updated with the latest versions of the Hoist
Framework. A [toolbox-dev instance](https://toolbox-dev.xh.io) is auto-deployed via GitHub Actions
on each commit to either the Toolbox or Hoist `develop` branches. We update a
distinct ["production" instance](https://toolbox.xh.io) manually with each new versioned Hoist
release. See [Build and Deploy](docs/build-and-deploy.md) for details on the CI/CD workflows.

## Database

Toolbox uses MySQL for its configuration database. Note this is _not_ a common choice for Hoist
applications, which typically use whatever enterprise database is already in place within a client's
infrastructure, but it provides a common and easy-to-run DB for local development and our AWS-based
deployments.

* For initial/test usage, Toolbox can run with a transient in-memory database (H2) that will be
  rebuilt at startup of the app. This is enabled via the `useH2` instance configuration (see below).
* For persistent deployments, Toolbox is designed to work with MySQL. Install a Long-Term Support
  (LTS) release - see [MySQL versions](#mysql-versions) below for the recommended command on each
  platform. Do not install the plain `mysql` Homebrew formula.
* Create a new empty database named `toolbox`, being sure to use a UTF8 charset (fortunately this is
  the default for newer versions of MySQL). Alternatively, use an export of the deployed toolbox DB
  with `CREATE DATABASE` included (Anselm can provide).
* For local development, use of the `root` account is fine, or (better) you can create a local user
  and password dedicated to Toolbox. If using a non-root account, ensure that the user has DBO
  rights on the new database. Database credentials are provided to the app via instance
  configuration (see below).
* If the server is started against an empty database, Grails will auto-create the required schemas
  on first run as long as a suitable value is provided for the `dbCreate` data source parameter. See
  the `DBConfig` class for where this is set - we leave toolbox on `update` to allow for automatic
  schema changes as needed.

### MySQL versions

MySQL publishes two release tracks, and picking the wrong one causes real pain later:

* **LTS** releases hold a stable feature set for years. This is what you want. The current LTS is
  the 9.7 series.
* **Innovation** releases ship roughly quarterly, and each one is superseded by the next. Starting
  with 26.7, they use calendar versioning (`YY.M.P`), so a high version number signals a recent
  Innovation release, not a more mature one.

Toolbox has no special database requirements beyond what Grails and Hibernate expect, so **always
install the LTS**.

**macOS** - install the versioned Homebrew formula, not the plain `mysql` one:

```bash
brew install mysql@9.7
brew link --force mysql@9.7    # keg-only, so link it or add its bin/ to your PATH
brew services start mysql@9.7
```

The plain `mysql` formula tracks whichever release is newest on *either* track, so `brew upgrade`
will silently walk you onto the Innovation train. Versioned formulae exist only for LTS releases
(`mysql@8.0`, `mysql@8.4`, `mysql@9.7`), which makes them a reliable way to stay put while still
receiving patch updates within the series.

**Windows** - use the MySQL Installer and select an LTS series when prompted for the server version.

**Linux** - use the MySQL APT or Yum repository and select the LTS series during repo configuration,
or install your distribution's MySQL package, which generally tracks an LTS.

> **Why this matters.** A MySQL data directory is upgraded when the *server starts*, not when the
> package is upgraded. MySQL only accepts an upgrade within the same lineage, or from the
> immediately preceding LTS. Upgrade the binary across two lineages without starting the server in
> between and the data directory is stranded - the new server refuses to open it. See
> [Troubleshooting](docs/running-locally.md#database-connection-fails-at-startup) for the recovery
> steps.

## Instance Configuration

Hoist applications require low-level "instance configuration" properties to provide settings such
as database credentials and other environment-specific settings that should not be checked into
source control. These properties can be set in one of two primary ways: a YAML file on the local
filesystem, or environment variables.

Toolbox is configured to source these properties from *environment variables*, and uses a Gradle
plugin to read them from a `.env` file in the project root. That file should never be pushed to git
(it's listed in .gitignore accordingly), but an `.env.template` file *is* checked-in to enumerate
required and optional properties.

Copy `.env.template` to `.env` and fill in the required values for your local database connection.

## Authentication

By default, Toolbox uses 'Auth0' as its authentication provider, and includes various client-side
and server side adaptors for that. Typical Hoist applications will use an enterprise-specific Single
Sign-On (SSO) such as JESPA/NTLM, kerberos, or another OAuth based solution. (Toolbox can also be
pointed at Azure Entra ID by setting the `oauthProvider` instance config to `ENTRA_ID`, exercising
Hoist's MSAL adaptor as an alternate OAuth provider.)

When adding a new top-level entry-point for Toolbox (such as a new example application), the desired
URL must be registered with Auth0 as a valid OAuth callback URL. Either Lee or Anselm can update our
Auth0 config accordingly.

### Running Locally Without OAuth (Form-Based Login)

OAuth is convenient in deployed environments but can be inconvenient for local development - for
example when working offline, or when loading the client on a private network IP (e.g. for on-device
mobile testing) that is not a registered Auth0 redirect URL. For these cases, Toolbox supports
disabling OAuth entirely and falling back to a simple username/password login form. This is atypical
of most Hoist apps and is implemented specifically as a development/testing convenience - see
`AuthenticationService.groovy` (server) and `AuthModel.ts` (client) for how the fallback is wired.

Two instance configs (set as environment variables in your local `.env` file) control this:

* `APP_TOOLBOX_OAUTH_PROVIDER=NONE` - disables the OAuth flow. The server reports `useOAuth: false`
  in its client config, and the client enables Hoist's built-in login form instead of redirecting
  to an OAuth provider.
* `APP_TOOLBOX_BOOTSTRAP_ADMIN_USER` / `APP_TOOLBOX_BOOTSTRAP_ADMIN_PASSWORD` - when both are set,
  `BootStrap.createLocalAdminUserIfNeeded()` seeds (or updates the password of) a password-enabled
  `User` in the Toolbox database on startup, granting admin rights. Use these credentials to log in
  via the form.

Setting `APP_TOOLBOX_BOOTSTRAP_ADMIN_USER` on its own (without a password, and while OAuth remains
enabled) is also supported - it grants admin rights to that OAuth-sourced user in local development
via Hoist Core's `DefaultRoleService`, without enabling form-based login.

See the comments in `.env.template` for the exact variable names and recommended pairings.

## Running Toolbox

To run Toolbox locally, start the Grails server and the Webpack dev server in separate terminals:

* **Server** - from the project root: `./gradlew bootRun` (serves the API on port `8080`).
* **Client** - from the `client-app/` directory: `pnpm start` (serves `http://localhost:3000`).

Then open `http://localhost:3000/app` (desktop app), `/admin` (admin console), or `/mobile`.

For the complete guide - running against local Hoist framework checkouts, running multiple
instances, on-device mobile testing over a network IP, HTTPS setup, and troubleshooting - see
[**Running Toolbox Locally**](docs/running-locally.md).

------------------------------------------

info@xh.io | <https://xh.io/>
