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

* *Toolbox currently uses MySQL 5.x.* If you don't already have it installed and are on a Mac, we
  recommend installing via [Homebrew](https://brew.sh/) with `brew install mysql@5.7`.
* Create a new empty database named `toolbox`, being sure to use a UTF8 charset. Alternatively, use
  an export of the deployed toolbox DB with `CREATE DATABASE` included (Anselm can provide).
* For local development, use of the `root` account is fine, or you can create a local user and
  password dedicated to Toolbox. If using a non-root account, ensure that the user has DBO rights on
  the new database.
* If the server is started against an empty database, Grails will auto-create the required schemas
  on first run as long as a suitable value is provided for the `dbCreate` data source parameter. See
  `grails-app/conf/runtime.groovy` for where this is set - we leave toolbox on `update` to allow for
  automatic schema changes as needed.
* That said, Toolbox has a number of data-driven app configs and preferences which are not currently
  setup to be auto-created on first run. The _fastest_ and recommended way to get up and running is
  to restore a DB from an existing instance.

## Instance Configuration

Hoist applications can read low-level, instance-specific information from a YML configuration file
on the local machine where they run. This is used primarily to set database credentials, which we
don't wish to check in to source control but which are required to connect to the DB and read all
_other_ data-driven app configurations.

* Create a new instance config file - the default location is `/etc/hoist/conf/toolbox.yml`.
  * If you don't wish to create that directory structure under `/etc/`, you can place the same file
    elsewhere and point the server there with a JavaOpt - see the hoist-core provided
    [`InstanceConfigUtils.groovy`](https://github.com/xh/hoist-core/blob/develop/src/main/groovy/io/xh/hoist/util/InstanceConfigUtils.groovy)
    for details.
* The contents of this file (for Toolbox) will typically be as follows:

```
dbHost: localhost 
dbSchema: toolbox

# Provide either root or a dedicated local account, if using.
# Note, quoting strings is option in YAML, but a good idea if you have special chars in your password.
dbUser: root
dbPassword: "your database user password" 

# The following two entries will enable a local account for logging in, without use of Auth0.
# You can choose any username/password you would like.
adminUsername: admin@xh.io 
adminPassword: "a password of your choice"
```

* When running the Toolbox server, look for a message along the lines of "Loaded 6 instanceConfigs
  from /etc/hoist/conf/toolbox.yml" to be logged to the console early on in the startup process.
  This will indicate that Hoist has successfully read your config.

## Authentication

Note that Toolbox uses 'Auth0' as its authentication provider, and includes various client-side and
server side adaptors for that. Typical Hoist applications will use an enterprise-specific Single
Sign-On (SSO) such as JESPA/NTLM, kerberos, or another OAuth based solution.

When adding a new top-level entry-point for Toolbox (such as a new example application), the desired
URL must be registered with Auth0 as a valid OAuth callback URL. Either Lee or Anselm can update our
Auth0 config accordingly.


------------------------------------------

📫☎️🌎 info@xh.io | <https://xh.io/contact>

Copyright © 2021 Extremely Heavy Industries Inc.
