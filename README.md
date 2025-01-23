# Welcome to Toolbox

Toolbox is an application designed to showcase Hoist, Extremely Heavy's full-stack UI toolkit.

Toolbox consists of both a desktop and mobile app with examples of all Hoist Components, their
usage, and links to related Hoist and Toolbox source code. Toolbox also provides several application
examples which may be especially useful as a starting point for application developers new to the
framework.

Please refer to the [Hoist Core](https://github.com/xh/hoist-core) and [Hoist React](https://github.com/xh/hoist-react) repos for detailed information and
documentation on Hoist, including more information on configuring a local development environment.

Toolbox is itself a Hoist Application, and we keep it updated with the latest versions of the Hoist
Framework. A [toolbox-dev instance](https://toolbox-dev.xh.io) is auto-deployed via Teamcity on each commit to either the
Toolbox or Hoist `develop` branches. We update a distinct ["production" instance](https://toolbox.xh.io) manually with
each new versioned Hoist release.

## Database

Toolbox uses MySQL for its configuration database. Note this is _not_ a common choice for Hoist
applications, which typically use whatever enterprise database is already in place within a client's
infrastructure, but it provides a common and easy-to-run DB for local development and our AWS-based
deployments.

* For initial/test usage, Toolbox is can run with a transient in-memory database (H2) that will be
  rebuilt at startup of the app. This is enabled via the `useH2` instance configuration (see below).
* For persistent deployments, Toolbox is designed to work with MySQL. If you don't already have it
  installed and are on a Mac, we recommend installing via [Homebrew](https://brew.sh/) with
  `brew install mysql`.
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

Note that Toolbox uses 'Auth0' as its authentication provider, and includes various client-side and
server side adaptors for that. Typical Hoist applications will use an enterprise-specific Single
Sign-On (SSO) such as JESPA/NTLM, kerberos, or another OAuth based solution.

When adding a new top-level entry-point for Toolbox (such as a new example application), the desired
URL must be registered with Auth0 as a valid OAuth callback URL. Either Lee or Anselm can update our
Auth0 config accordingly.

## Toolbox + Hoist development

Toolbox is often developed alongside the Hoist Core and React libraries, so that changes to the
libraries themselves can be developed and tested locally using Toolbox as a reference app. This is
the recommended configuration for XH developers to use when setting up Toolbox.

* Create or find a suitable directory for multiple project repositories, like homedir or (if using
  IntelliJ) `~/IdeaProjects/`.
* Within this directory, check out the `toolbox`, `hoist-react`, and `hoist-core` repositories as
  siblings.

### Editing multiple projects together

For editing Hoist Core and React alongside Toolbox, it is recommended to open the `hoist-react` and
`hoist-core` projects as modules in your editor. Having all three repos in a single IntelliJ project
can be useful to have the code on-hand.

* Open up the `toolbox` project in IntelliJ.
* Import `hoist-react` and `hoist-core` as modules:
  File -> Project Structure -> Modules -> Add (+) -> Import Module
* Using the Gradle tool window, "Link Gradle Project" (+) both `toolbox` and `hoist-core`.

### Running Toolbox using local Hoist

* To run the server using the local `hoist-core`, you need `hoist-core` to exist as sibling of the
  `toolbox` package, and do one of the following:
  * Edit the `toolbox/gradle.properties` file and set `runHoistInline=true`.
  * Run the command `./gradlew bootRun -PrunHoistInline=true` from the `toolbox` directory.
  * If using IntelliJ, run the `BootrunWithHoist` saved run configuration.

  Note this is _only_ required if you're changing hoist-core code.

* To run the client using the local `hoist-react`, start your local webpack-dev-server from the
  `toolbox/client-app` directory by running `yarn startWithHoist`.

  Note this is _only_ required if you're changing hoist-react code.

### Running multiple instances of Toolbox

* Make sure that the `APP_TOOLBOX_MULTI_INSTANCE_ENABLED` property in `.env` is set to `true`.
* Run the first instance of the server and client as normal.
* To run a second instance of the server, you can either:
  * Run the command `./gradlew bootRun -Dserver.port=8082` from the `toolbox` directory.
  * If using IntelliJ, run the `Bootrun2` saved run configuration.
* To run a second instance of the client connected to the second server, start another local
  webpack-dev-server from the `toolbox/client-app` directory by running `yarn start2` or
  `yarn start --env devGrailsPort=8082 devWebpackPort=3002`.

## Developing with HTTPS on `xh.io` domain

It can be useful to run Toolbox locally with HTTPS enabled and on a sub-domain of `xh.io`,
especially when testing OAuth, CORS, or cookie dependent features. Follow these steps to run with
HTTPS on the `toolbox-local.xh.io:3000` domain:

1. Add this entry to your dev machine's `hosts` file: `127.0.0.1 toolbox-local.xh.io`
2. Start the Grails server with the additional VM options below. The referenced files are
   self-signed certs commited to the repo for local dev purposes.
    ```
    -Dserver.ssl.enabled=true
    -Dserver.ssl.certificate=classpath:local-dev/toolbox-local.xh.io-self-signed.crt
    -Dserver.ssl.certificate-private-key=classpath:local-dev/toolbox-local.xh.io-self-signed.key
    -Dserver.ssl.trust-certificate=classpath:local-dev/toolbox-local.xh.io-self-signed.ca.crt
    ```
3. Visit `https://toolbox-local.xh.io:8080/ping` in your browser to proceed past the SSL warning
   for API calls.
4. Start the GUI with the `startWithHoistSecure` npm script. Go to
   `https://toolbox-local.xh.io:3000/app/` in your browser and proceed past the SSL warning.

------------------------------------------

📫☎️🌎 info@xh.io | <https://xh.io/contact>

Copyright © 2024 Extremely Heavy Industries Inc.
