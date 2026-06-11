# hoist-core: Remove jasypt (1.9.3, EOL) Replacement Report

**Status:** Diagnosis complete, fix proposal drafted, ready for an implementation agent to take to
hoist-core on its own branch.
**Discovered while:** Wiring Playwright test users into Toolbox's `BootStrap.groovy` —
`new User(...).save()` blew up at `beforeInsert` on JDK 21 under `./gradlew bootRun`.

---

## The bug

Toolbox's bootstrap fails at startup whenever any User domain object is saved with a non-null
password (or any AppConfig `pwd` value is created/updated). The stack:

```
org.jasypt.exceptions.EncryptionInitializationException: Could not perform a valid UNICODE normalization
    at org.jasypt.normalization.Normalizer.normalizeWithJavaNormalizer(Normalizer.java:185)
    at org.jasypt.normalization.Normalizer.normalizeToNfc(Normalizer.java:132)
    at org.jasypt.normalization.Normalizer.normalizeToNfc(Normalizer.java:71)
    at org.jasypt.digest.StandardStringDigester.digest(StandardStringDigester.java:911)
    at org.jasypt.util.password.BasicPasswordEncryptor.encryptPassword(BasicPasswordEncryptor.java:80)
    at io.xh.toolbox.user.User.encodePassword(User.groovy:64)
    at io.xh.toolbox.user.User.beforeInsert(User.groovy:54)
```

Spring's error reporter is suppressing the chained "Caused by:" line, but jasypt's source at
`Normalizer.java:181-187` shows that line 185 is a catch block wrapping a reflective call to
`java.text.Normalizer.normalize(CharSequence, Normalizer.Form)`. The reflective invoke is
throwing — most likely `InaccessibleObjectException` or `IllegalAccessException` under
Spring Boot's `LaunchedURLClassLoader` on JDK 21.

### Why this is a real bug, not a config issue

- **Standalone repro works.** I compiled and ran `new BasicPasswordEncryptor().encryptPassword("playwright-test")` with `/Users/amcclain/Library/Java/JavaVirtualMachines/temurin-21.0.11/bin/java` plus the same `--add-opens` flags Toolbox uses in `build.gradle`. **Returns a valid hash, no error.** The bug only triggers under Spring Boot's launcher classloader.
- **Adding more `--add-opens` flags is a footgun.** Every consuming app would need to maintain JVM-arg lists; new flags would need to land in each app's `build.gradle` independently. Not viable.
- **jasypt 1.9.3 is the latest release.** Released 2014. No 1.10, no 2.x. `jasypt-spring-boot` is a separately maintained shim (3.x exists) but it uses the same underlying `jasypt-1.9.3` artifact for its core hashing/encryption. Effectively EOL.
- **The same library is the dep for `AppConfig` pwd encryption.** Anything in the framework that touches `pwd`-typed configs (`configService.getPwd()`, the admin UI's password-config differ, `BootStrap.ensureRequiredConfigsCreated` creating a `pwd` config in a fresh DB) is on the same broken codepath.

This is a hoist-core problem (it's the library that pulls the dep in `api` scope and uses it),
not a Toolbox problem.

---

## Where jasypt lives in our world

### In hoist-core

1. **`build.gradle:93`** — `api "org.jasypt:jasypt:1.9.3"`. Transitively exposed to every
   consuming app via the `api` scope.

2. **`grails-app/domain/io/xh/hoist/config/AppConfig.groovy`** — the only file in hoist-core
   that uses jasypt. Two distinct uses:

   - **Symmetric text encryption** (`org.jasypt.util.text.BasicTextEncryptor`) — encrypts and
     decrypts `pwd`-typed `AppConfig.value` at rest in the DB. Fixed encryption password
     hard-coded at line 109: `"dsd899s_*)jsk9dsl2fd223hpdj32))I@333"`. Read path:
     `ConfigService.getPwd(name)` → `AppConfig.externalValue([decryptPassword: true])` →
     `parseValue` → `decryptPassword` → `encryptor.decrypt(value)`. Used by hoist-core itself
     (`LdapService:275` reads `xhLdapPassword`), and by every consuming app that defines a
     `pwd` config.
   - **One-way password digest** (`org.jasypt.util.password.ConfigurablePasswordEncryptor`) —
     `digestEncryptor.encryptPassword(...)` produces a stable, non-reversible digest of a `pwd`
     config value for the admin UI's config-differ display. **Not** used for authentication;
     purely for "did this value change?" comparison in the admin UI. The digester is
     configured with `setPlainDigest(true)` at line 115 — same SHA-256 + salt pattern
     internally.

### In consuming apps (transitive via hoist-core's `api` dep)

Every consuming app that wants password-based user login imports jasypt's
`BasicPasswordEncryptor` directly in its User domain class:

- `/Users/amcclain/dev/toolbox/grails-app/domain/io/xh/toolbox/user/User.groovy:4` and `:9`
- `/Users/amcclain/dev/jobsite/grails-app/domain/io/xh/jobsite/user/AppUser.groovy:4` and `:9`

Pattern in both: `static encryptor = new BasicPasswordEncryptor()`; `encryptor.encryptPassword(...)`
in `beforeInsert/beforeUpdate`; `encryptor.checkPassword(plain, stored)` in `checkPassword(...)`.

Other XH apps that authenticate exclusively via OAuth do not exhibit this pattern.

---

## Proposed fix

### Replacements

| Current jasypt API | Replacement |
|---|---|
| `BasicTextEncryptor` (symmetric text en/decrypt) | `javax.crypto.Cipher` with AES-256-GCM, key derived from the configured password via `PBKDF2WithHmacSHA256`. JDK-standard, no new dependency. |
| `ConfigurablePasswordEncryptor` (one-way digest for admin UI) | `MessageDigest.getInstance("SHA-256")` over a salted input + Base64. JDK-standard. |
| `BasicPasswordEncryptor` (consuming apps' User.password hashing) | **Spring Security's `BCryptPasswordEncoder`** — well-supported, slow-by-design, salts built-in, the de-facto Java standard. Available via `spring-security-crypto` (just the crypto module, not the full framework). |

Why BCrypt for user passwords instead of JDK-only SHA? SHA is fast — fast hashing is bad for
password storage. BCrypt has adaptive cost. It's the industry-standard answer; Argon2 would also
work but adds a non-Spring dep.

`spring-security-crypto` (just `org.springframework.security:spring-security-crypto`) brings in
no controllers, no filter chains — purely the `PasswordEncoder` interface and its
implementations. Adds ~120KB. Lots of projects use it as a standalone.

### Public API for consuming apps

Introduce one new utility in hoist-core under `io.xh.hoist.security` (or `io.xh.hoist.util.crypto`):

```groovy
package io.xh.hoist.security

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

/**
 * Centralized password hashing for consuming apps' local user accounts. Wraps Spring Security's
 * BCrypt encoder so app-level User domain classes don't need to take a direct dependency.
 *
 * Replaces the historical pattern of importing jasypt's BasicPasswordEncryptor directly in each
 * app's User domain class.
 */
class HoistPasswordEncoder {
    private static final PasswordEncoder encoder = new BCryptPasswordEncoder()

    static String encode(String rawPassword) {
        return rawPassword ? encoder.encode(rawPassword) : null
    }

    static boolean matches(String rawPassword, String encodedPassword) {
        return rawPassword && encodedPassword && encoder.matches(rawPassword, encodedPassword)
    }
}
```

Apps then change `User.groovy` from:

```groovy
import org.jasypt.util.password.BasicPasswordEncryptor
private static encryptor = new BasicPasswordEncryptor()
// ...
boolean checkPassword(String plain) {
    password ? encryptor.checkPassword(plain, password) : false
}
private encodePassword() {
    password = password ? encryptor.encryptPassword(password) : null
}
```

…to:

```groovy
import io.xh.hoist.security.HoistPasswordEncoder
// ...
boolean checkPassword(String plain) {
    HoistPasswordEncoder.matches(plain, password)
}
private encodePassword() {
    password = HoistPasswordEncoder.encode(password)
}
```

### `AppConfig` internal replacement

Two private static encryptors in `AppConfig.groovy`. Today they use jasypt; replace with internal
helpers (still hoist-core-private):

```groovy
import io.xh.hoist.security.crypto.AesTextCipher
import io.xh.hoist.security.crypto.SaltedSha256Digester

private static final AesTextCipher encryptor = AesTextCipher.withFixedKey(
    'dsd899s_*)jsk9dsl2fd223hpdj32))I@333'  // PRESERVED for legacy DB compat — see migration below
)
private static final SaltedSha256Digester digestEncryptor = new SaltedSha256Digester()
```

Where:
- `AesTextCipher` uses AES-256-GCM with PBKDF2-derived key. New ciphertext format is prefixed
  with a marker (e.g. `"v2:<base64>"` or `"$hoist-aes$<base64>"`) so decrypt can tell new from
  legacy values.
- `SaltedSha256Digester` is straightforward — random per-instance salt + SHA-256. The output is
  only used for UI display, never authentication, so any one-way function is fine.

### Migration plan (THE HARD PART)

Existing databases contain encrypted values that were produced by jasypt. Removing jasypt without
a migration path would brick every deployed app on first startup after the hoist-core upgrade.

Two cohorts of legacy values:

**A. `AppConfig.value` (`valueType='pwd'`) — symmetric encryption.**

Strategy: dual-decrypt during a single transition release.

- `AesTextCipher.decrypt(stored)` inspects the stored value's format.
- New format (`"v2:..."`) → decrypt with AES.
- Legacy format (no marker, base64 looks like jasypt's output) → fall back to a still-bundled
  `LegacyJasyptDecrypter` that ONLY decrypts (never encrypts new values).
- All writes use the new format.
- After one release cycle, drop `LegacyJasyptDecrypter`; document that pwd configs must be
  re-saved before the upgrade. Provide a one-line admin-console action ("Re-encrypt all pwd
  configs") to do it bulk.

The `LegacyJasyptDecrypter` is tiny — it needs to reproduce jasypt's
`BasicTextEncryptor("password").decrypt(value)` output. Two paths:

  1. **Keep jasypt as a `runtimeOnly` dep for one release** strictly for `LegacyJasyptDecrypter`,
     pinned to a use that doesn't trigger the broken codepath. We've already established that
     `encryptPassword` (which triggers the Normalizer) breaks — but `decrypt` of an existing
     ciphertext goes through a different path. Verify before relying on it. If `decrypt` also
     hits Normalizer, this path is out.
  2. **Reimplement `BasicTextEncryptor`'s algorithm directly** (PBE with MD5+DES per jasypt
     defaults, applied with the hardcoded password and salt-from-ciphertext). Doable in ~30 LoC
     against `javax.crypto.Cipher`, with tests against known-good ciphertexts captured from a
     working environment. Strongly preferred if feasible — completely cuts jasypt out.

**B. `User.password` (consuming apps) — one-way hash.**

Strategy: migrate-on-successful-login.

- `HoistUser.checkPassword(plain)` first checks BCrypt format (`$2a$...`).
- If it doesn't match BCrypt format, falls back to the legacy jasypt-style verification.
- On successful legacy verification, **re-encode** the password with BCrypt and `save(flush:true)`
  the user. Next login uses BCrypt.
- After one release cycle, the legacy path is removed; users whose passwords haven't migrated by
  then must reset. Real-world impact: small (most local-password users in Hoist apps log in
  weekly or more often).

The legacy verification needs to reproduce jasypt's `BasicPasswordEncryptor.checkPassword` — SHA-256
with a salt prefixed onto the digest output, 1000 iterations by default. ~20 LoC of pure JDK.

### Files changed in hoist-core (planned)

```
build.gradle                                                     # drop api jasypt; add api spring-security-crypto
grails-app/domain/io/xh/hoist/config/AppConfig.groovy             # swap to new encryptor + digester
src/main/groovy/io/xh/hoist/security/HoistPasswordEncoder.groovy  # NEW — BCrypt wrapper for apps
src/main/groovy/io/xh/hoist/security/crypto/AesTextCipher.groovy  # NEW — AES-GCM + PBKDF2
src/main/groovy/io/xh/hoist/security/crypto/SaltedSha256Digester.groovy  # NEW — for UI digest
src/main/groovy/io/xh/hoist/security/crypto/LegacyJasyptDecrypter.groovy # NEW — for migration
docs/upgrade-notes/v41-upgrade-notes.md                           # APPEND — call out the change
CHANGELOG.md                                                      # entry under 41.0-SNAPSHOT
src/test/groovy/io/xh/hoist/security/crypto/*Spec.groovy          # NEW tests
```

### Consuming-app changes (separate PRs in Toolbox + JobSite after hoist-core lands)

- `User.groovy` / `AppUser.groovy`: swap jasypt import for `HoistPasswordEncoder`.
- No DB migration needed — the migrate-on-login path in `HoistPasswordEncoder.matches` handles
  it transparently.

---

## Verification plan

1. Implementation agent works on a branch in `/Users/amcclain/dev/hoist-core` (e.g.
   `atm/remove-jasypt`).
2. Includes Spock specs (`SpockHelper`-style, matching hoist-core's existing test pattern) for
   each new class:
   - `AesTextCipher` — round-trip new format; decrypt fixed-key legacy fixture; reject corrupt
     input.
   - `SaltedSha256Digester` — stable output across instances when same salt provided; differs
     between distinct salts.
   - `LegacyJasyptDecrypter` — decrypt of fixed-key ciphertext known to have been produced by
     `BasicTextEncryptor("dsd899s_*)jsk9dsl2fd223hpdj32))I@333")`.
   - `HoistPasswordEncoder` — encode/match round-trip; legacy-hash detection + verification path.
   - `AppConfig` insert/update of a `pwd` config: write produces new format, read returns plain.
3. Toolbox build flipped to `runHoistInline=true` and `./gradlew bootRun` started — must boot
   cleanly with the new bootstrap that creates `test-admin@xh.io` / `test-user@xh.io`.
4. Playwright suite (`cd playwright && npm test`) — `auth.setup.ts` logs both users in.

If any of those steps fail, agent reports back. If the migration shim for legacy AppConfig
ciphertexts can't be cleanly implemented (e.g. `LegacyJasyptDecrypter` can't reproduce jasypt's
output without jasypt), agent should flag it and we'll decide whether to ship without legacy
support and require a config re-save before upgrade.

---

## Open questions

1. **Spring Security version compatibility with Grails 7.1.1 / Spring Boot 3.5.14.** Should be
   trivial (BCrypt has been stable for ~10 years), but the agent should verify the artifact
   coordinate and version against the Spring BOM that Grails 7 pulls in.
2. **Should the `digestEncryptor` (one-way digest for admin UI) be moved off SHA-256 to also
   use BCrypt?** Tempting, but pointless — that surface is purely for visual diff in the admin
   console and would be needlessly slow. SHA-256 is fine for that use.
3. **The hardcoded encryption password in `AppConfig.groovy:109`.** It's a hardcoded string in
   open-source code, so it's not actually a secret. New code should preserve it for legacy
   compatibility but document the limitation. A proper fix would source the key from instance
   config — but that's a separate enhancement, out of scope here.
4. **JobSite + Toolbox need follow-up PRs** to swap their User domain classes to
   `HoistPasswordEncoder`. Should hoist-core's PR include guidance / a one-line snippet in the
   upgrade notes? Yes — agent should include it.

---

## Why this is the right scope of fix

- **Removes the EOL dependency.** Jasypt 1.9.3 + JDK 21 + Spring Boot's classloader is a
  combination that will increasingly break in subtle ways. We don't want it on hoist-core's
  promoted API surface.
- **No JVM-arg gymnastics.** Apps don't need to maintain `--add-opens` lists.
- **Single hoist-core release covers both internal use and the consuming-app pattern.** Apps
  upgrade hoist-core, drop the jasypt import from their User domain, and the migrate-on-login
  path handles in-place transition.
- **No DB schema change required.** Same column types; only the contents of the encrypted/hashed
  strings change format.
- **Spring Security crypto is well-trodden ground.** BCrypt has been the answer to "how do I
  hash passwords in Java?" for over a decade.
