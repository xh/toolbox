# Welcome to Toolbox

Toolbox is an application designed to showcase Hoist, Extremely Heavy's full-stack UI toolkit.

Toolbox consists of both a desktop and mobile app with examples of all Hoist Components, their
usage, and links to related Hoist and Toolbox source code. Toolbox also provides several application
examples which may be especially useful as a starting point for application developers new to the
framework.

Please refer to the [Hoist Core](https://github.com/xh/hoist-core) and
[Hoist React](https://github.com/xh/hoist-react) repos for detailed information and documentation on
Hoist, including more information on configuring a local development environment.

Toolbox is itself a Hoist Application, and we keep it updated with the latest versions of the Hoist
Framework. A [toolbox-dev instance](https://toolbox-dev.xh.io) is auto-deployed via Teamcity on each
commit to either the Toolbox or Hoist `develop` branches. We update a distinct
["production" instance](https://toolbox.xh.io) manually with each new versioned Hoist release.

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

## Wrapper project for Toolbox + Hoist development

A special project / directory structure can be useful for developing Toolbox alongside the Hoist
Core and React libraries, so that changes to the libraries themselves can be developed and tested
locally using Toolbox as a reference app. This is the recommended configuration for XH developers to
use when setting up Toolbox.

* Create a new directory within your homedir or another suitable location - name it something like
  `toolbox-wrapper`.
* Within this new parent directory, check out the `toolbox`, `hoist-react`, and `hoist-core`
  repositories as siblings.
* Create a new `settings.gradle` file within the top-level directory. The contents of this file will
  be a single line: `include "toolbox", "hoist-core"`. This tells Gradle to reference and combine
  the `build.gradle` targets of those two sub-projects into a single umbrella project.
* Create a new `build.gradle` file within the top-level directory. This is required to support the
  `co.uzzu.dotenv` plugin used by Toolbox to read environment variables - the plugin must be applied
  to the root project, which is the top-level wrapper directory in this mode. The Toolbox
  `build.gradle` file is where the plugin is actually applied, but for that to work in wrapper mode
  the plugin must be defined within the root (wrapper) project also, requiring a build file. Its
  contents should be:
    ```groovy
    buildscript {
        repositories {
            gradlePluginPortal()
        }
        dependencies {
            classpath "co.uzzu.dotenv:gradle:4.0.0" // keep in sync with version in Toolbox build.gradle
        }
    }
    ```
* From the checked-out `toolbox` sub-directory, copy the `gradle` directory and the `gradlew` (or
  `gradlew.bat` if on Windows) wrapper script and paste the copies into the top-level wrapper
  directory.
    * Your top-level directory should now contain four sub-directories, `settings.gradle`,
      `build.gradle`, and the `gradlew` script.
* From the top-level directory, run `./gradlew` to ensure that Gradle can properly configure the
  unified build.
* If using IntelliJ, create a new project by running through the "New project from existing
  sources..." workflow and pointing the IDE at the top-level `settings.gradle` file.
    * IntelliJ should detect that this is a Gradle/Grails project, download and index the
      server-side dependencies, and set up an appropriate "Run Configuration" to start the Toolbox
      server.

Having all three repos checked out in a single IntelliJ project can be useful to have the code
on-hand, but to actually run Toolbox using the local Hoist libraries some additional steps are
required.

* To run the server using the local `hoist-core`, edit the `toolbox/gradle.properties` file and set
  `runHoistInline=true`. Note this is _not_ required if you're not changing any hoist-core code -
  you can still have the project structure setup as described, and only flip this switch if/when
  testing a local change to the plugin.
* To run the client using the local `hoist-react`, start your local webpack-dev-server from the
  `toolbox/client-app` directory by running `yarn startWithHoist`.

------------------------------------------

📫☎️🌎 info@xh.io | <https://xh.io/contact>

Copyright © 2024 Extremely Heavy Industries Inc.
