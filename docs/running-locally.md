# Running Toolbox Locally

This guide covers running Toolbox on a development workstation. It describes the standard setup —
the desktop browser talking to a local server over `localhost`, which is what you will use the
majority of the time — and then the special case of binding the dev server to your machine's network
IP so you can load the app on a physical phone or tablet for on-device testing.

This document assumes you have already completed first-run setup. For the database, instance
configuration (`.env`), and authentication prerequisites, see the [Database](../README.md#database),
[Instance Configuration](../README.md#instance-configuration), and
[Authentication](../README.md#authentication) sections of the main README.

## Standard local development (localhost)

Toolbox runs as two processes: the Grails server (the backend API + static asset host in production)
and the Webpack dev server (which compiles and serves the client app and proxies API calls to the
backend during development). Run each in its own terminal.

* **Server** - from the project root:
  ```
  ./gradlew bootRun
  ```
  Starts the Grails server on port `8080`, running in your workstation's local timezone. If you ever
  need to pin the JVM timezone - to mirror the deployed (UTC) environment, or to match an
  `xhExpectedServerTimeZone` config set in your database - see [Server timezone](#server-timezone).

* **Client** - from the `client-app/` directory:
  ```
  yarn start
  ```
  Starts the Webpack dev server on `http://localhost:3000`. It compiles the client app, watches for
  changes with hot-reload, and proxies any request under `/api/` through to the Grails server at
  `localhost:8080`.

Once both are up, open the app in your browser:

| App | URL |
|-----|-----|
| Desktop app | `http://localhost:3000/app` |
| Admin console | `http://localhost:3000/admin` |
| Mobile app | `http://localhost:3000/mobile` |

Each file in `client-app/src/apps/` defines an entry point whose filename (minus extension) becomes
the URL path. The standalone example apps are reachable the same way: `/contact`, `/todo`,
`/portfolio`, `/news`, `/recalls`, `/fileManager`, `/weather`.

### Running against a local Hoist framework checkout

Toolbox is XH's primary development and testing vehicle for the Hoist framework itself, so it is
often run against local sibling checkouts of the framework libraries rather than the published
versions. Check out `hoist-react` and/or `hoist-core` as siblings of the `toolbox` directory, then:

* **Client against local `hoist-react`** - start the dev server with `yarn startWithHoist` instead
  of `yarn start`. This builds the client using the sibling `../../hoist-react` source inline.
  Only needed when you are changing or testing hoist-react code.

  This builds and *runs* against local hoist-react, but it does **not** change what `tsc`
  type-checks against. By default `client-app/tsconfig.json` resolves `@xh/hoist` from the installed
  `node_modules` version, so type-checking matches what CI and the release build see (and what the
  app ships). If your inline hoist-react work introduces new or changed **type signatures** that
  Toolbox code needs to reference (e.g. a new component prop), uncomment the `paths` block in
  `tsconfig.json` so `tsc` and your IDE resolve `@xh/hoist` against the local checkout too.
  **Re-comment it before committing** - leaving it on makes type-checking false-pass against the
  published library (code that uses unreleased APIs looks fine locally but breaks the release
  build), which is exactly the gap the commented-out default closes.

* **Server against local `hoist-core`** - there are two ways to enable inline mode, and which you
  want depends on whether you need IDE integration:
  * **Per run** - pass the property on the command line:
    ```
    ./gradlew bootRun -PrunHoistInline=true
    ```
    This affects only that invocation and edits no tracked files - ideal for a quick run or an
    agent-driven workflow.
  * **Persistently** - set `runHoistInline=true` in `gradle.properties` (or your global
    `~/.gradle/gradle.properties`). Do this when you want your **IDE** to resolve app code against
    the local hoist-core - cross-project navigation, inline compilation, and refactoring across the
    boundary - since the IDE's Gradle sync reads that file and includes `../hoist-core` as a
    composite build. The command-line `-P` flag is invisible to the IDE's sync.

  Either way the sibling `../hoist-core` is used and the pinned `hoistCoreVersion` is ignored. Only
  needed when you are changing or testing hoist-core code.

### Running multiple instances

To run a second, independent instance alongside the first (e.g. to exercise multi-instance
clustering behavior):

* Set `APP_TOOLBOX_MULTI_INSTANCE_ENABLED=true` in your `.env`.
* Start the first server and client as normal.
* Start a second server on a different port:
  ```
  ./gradlew bootRun -Dserver.port=8081
  ```
* Start a second client pointed at that server:
  ```
  yarn start --env devGrailsPort=8081 devWebpackPort=3001
  ```

## On-device mobile testing over a LAN IP

To load Toolbox on a physical device (e.g. to verify mobile-specific behavior, native inputs, or
touch interactions that a desktop browser's device emulation cannot fully reproduce), the dev server
must be reachable from that device. This means binding it to your workstation's network IP instead
of `localhost`. There are several caveats — work through all of them or the device will fail to load
the app or fail to log in.

> [!TIP]
> **Other options that keep you on `localhost`.** If you have the tooling, you can skip the
> network-IP setup below entirely — and keep using Auth0, since `localhost:3000` is already a
> registered callback (no need to switch to form-based login) — by reaching the standard
> `yarn start` dev server through `localhost`:
>
> * **iOS Simulator** (requires Xcode) — Mobile Safari in the simulator shares the host's network
>   stack, so it loads `http://localhost:3000/mobile` directly.
> * **Android via `adb reverse`** (requires Android platform-tools) — run
>   `adb reverse tcp:3000 tcp:3000` to map the device's `localhost:3000` onto the host, then open
>   `http://localhost:3000/mobile` in Chrome on the device. Works with a physical device over USB or
>   an emulator; only port 3000 needs forwarding, as the dev server proxies API calls host-side.
>
> Reach for the network-IP method below when these don't fit — most notably physical iOS hardware,
> or any device you want to test over Wi-Fi without a USB/Xcode toolchain.

1. **Put both devices on the same network.** The phone and your workstation must be on the same
   Wi-Fi / LAN, with no client isolation between them.

2. **Find your workstation's LAN IP.** On macOS over Wi-Fi:
   ```
   ipconfig getifaddr en0
   ```
   `en0` is the typical Wi-Fi interface on a Mac; a wired connection or a different OS will use a
   different interface. The result (e.g. `10.0.1.42`) is referred to as `<devHost>` below.

3. **Start the client bound to that IP.** Use the convenience script that resolves your Wi-Fi IP
   automatically — `startWithIp` for the published hoist-react, or `startWithHoistAndIp` when
   developing against a local sibling checkout:
   ```
   yarn startWithIp          # published @xh/hoist
   yarn startWithHoistAndIp  # local sibling hoist-react
   ```
   To target a specific address (or a non-Wi-Fi interface), pass it explicitly to the base script
   instead: `yarn start --env devHost=<devHost>` (or `yarn startWithHoist --env devHost=<devHost>`).
   Either way the dev server binds **only to the LAN IP, not to `localhost`** — so on the
   workstation itself you must also browse to `http://<devHost>:3000`, not `http://localhost:3000`.

4. **Make sure the backend is reachable at that IP.** The dev server proxies `/api/` to
   `<devHost>:8080`, so the Grails server must be answering there. `bootRun` binds all interfaces
   (`*:8080`) by default, so no extra flag is needed — just start it normally. If the client loads
   but data/login calls hang or return a gateway timeout, the backend is not running or not
   reachable — see [Troubleshooting](#troubleshooting).

5. **Switch to form-based login.** Toolbox defaults to Auth0 (OAuth), which redirects to a callback
   URL that must be pre-registered. A raw LAN IP is not a registered callback, so OAuth login cannot
   complete on the device. Disable OAuth and use a local username/password instead by setting these
   in your `.env`, then restarting the server:
   ```
   APP_TOOLBOX_OAUTH_PROVIDER=NONE
   APP_TOOLBOX_BOOTSTRAP_ADMIN_USER=you@xh.io
   APP_TOOLBOX_BOOTSTRAP_ADMIN_PASSWORD=<a-local-dev-password>
   ```
   With these set, Toolbox presents a form-based login and creates the bootstrap user (granted admin
   rights) in its user database. These properties are also documented in `.env.template`. Remember
   to revert this change when you return to normal desktop development.

6. **Open the app on the device** at `http://<devHost>:3000/mobile` (or `/app`, etc.).

**Prefer plain HTTP for device checks.** Loading over `http://<devHost>:3000` is the simplest path
and is fine for functional testing. The HTTPS setup described below requires a hostname, a
certificate, and a `hosts`-file entry, none of which are practical to configure on a phone — only
reach for it if you are specifically testing HTTPS/OAuth/cookie behavior.

## Developing with HTTPS on the `xh.io` domain

It can be useful to run Toolbox locally with HTTPS enabled and on a sub-domain of `xh.io`,
especially when testing OAuth, CORS, or cookie-dependent features. To run with HTTPS on the
`toolbox-local.xh.io:3000` domain:

1. Add this entry to your dev machine's `hosts` file: `127.0.0.1 toolbox-local.xh.io`
2. Start the Grails server with the additional VM options below. The referenced files are
   self-signed certs committed to the repo for local dev purposes.
   ```
   -Dserver.ssl.enabled=true
   -Dserver.ssl.certificate=classpath:local-dev/toolbox-local.xh.io-self-signed.crt
   -Dserver.ssl.certificate-private-key=classpath:local-dev/toolbox-local.xh.io-self-signed.key
   -Dserver.ssl.trust-certificate=classpath:local-dev/toolbox-local.xh.io-self-signed.ca.crt
   ```
3. Visit `https://toolbox-local.xh.io:8080/ping` in your browser to proceed past the SSL warning
   for API calls.
4. Start the GUI with the `startWithHoistSecure` yarn script. Go to
   `https://toolbox-local.xh.io:3000/app/` in your browser and proceed past the SSL warning.

## Troubleshooting

### Gateway timeout or `ECONNREFUSED` on `/api/` requests

The client loads but data and login calls hang, time out, or log a proxy error. The Webpack dev
server is up but the backend it proxies to is not answering. Check that:

* `bootRun` is actually running and has finished starting - hit `http://localhost:8080/ping`
  directly; a healthy server returns a small JSON payload with `"success":true`.
* For the LAN-IP flow, the backend is reachable at the proxy target `<devHost>:8080` (it binds all
  interfaces by default, so this normally just works once the server is up).

### Server timezone

By default the server runs in your workstation's local timezone - the simplest setup, and what the
commands in this guide use. Two things are worth knowing:

* **Mirroring production.** The deployed app runs in UTC. To reproduce timezone-sensitive behavior
  locally, pin the JVM to UTC by launching with `./gradlew bootRun -Duser.timezone=Etc/UTC`.

* **The `xhExpectedServerTimeZone` check.** Hoist Core validates at startup that the JVM's timezone
  matches the `xhExpectedServerTimeZone` application config, and throws a fatal exception on a
  mismatch:

  ```
  JVM TimeZone of 'Etc/UTC' does not match value of 'America/Los_Angeles' required by
  xhExpectedServerTimeZone config. Set JVM arg '-Duser.timezone=America/Los_Angeles' to change the
  JVM Zone, or update the config value in the database.
  ```

  The config defaults to `*`, which skips the check, so a fresh or in-memory (H2) database will not
  hit this. If your database has a specific zone configured and you see this error, either launch
  with the zone named in the message (`-Duser.timezone=<zone>`) or update the
  `xhExpectedServerTimeZone` config in the database to match your JVM.

------------------------------------------

info@xh.io | <https://xh.io/>
