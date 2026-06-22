# PR568 Verification — Result

**PR under test:** [xh/hoist-core#568 "Remove jasypt 1.9.3 dependency (v41 breaking change)"](https://github.com/xh/hoist-core/pull/568)
**Test bed:** Toolbox `atm/playwright-setup` booted with `runHoistInline=true` against hoist-core `atm/remove-jasypt`, JDK 21 Temurin.

## Outcome

**PR passes all three Test Plan items end-to-end against a real running Toolbox.**
See the PR description's "Verification" table for the per-item evidence (DB-row before/after for the AES-format promotion, fail-closed `IllegalStateException` text, BCrypt hash prefix on new users, legacy-jasypt-hash login success).

## Toolbox-side fix landed alongside the verification

Verification surfaced a **separate Toolbox `build.gradle` bug** unrelated to the PR: the `execTasks` block was passing the daemon's full `System.properties` (including `java.home`) to the forked bootRun JVM. With sdkman defaulting to a JDK-17 daemon and the Toolbox toolchain requiring JDK 21, the forked Temurin 21 JVM ran with `java.home` pointing at the Zulu 17 install — and JDK 21's internal `java.text.Normalizer` could not load its own ICU NFC data when looking in the wrong install. This poisoned `JceSecurity.<clinit>` and surfaced as the original "jasypt breaks under JDK 21" symptom.

Reproduced standalone: same JDK 21 binary + `-Djava.home=<Zulu 17 dir>` reproduces the exact `NormalizerBase$NFCModeImpl` failure with no Spring Boot, no Hazelcast, no PR code involved.

Fix in `build.gradle` filters JVM-installation properties (`java.*`, `sun.*`, `jdk.*`, `os.*`, `user.*`, `path.*`, `file.*`, `line.*`, `native.*`) out of the system-property forward to the forked JVM. Subsequent verification ran clean against both `develop` (with jasypt still on the classpath) and `atm/remove-jasypt`, confirming the build.gradle fix is the actual remedy for the JDK 21 symptom.

## Implication for the PR

PR568 is not the JDK 21 compatibility fix that its proximate trigger suggested. The PR's value rests on its own merits: dropping an EOL transitive dep, replacing source-visible obfuscation with operator-supplied AES keys for `pwd` configs, and replacing MD5+salt user-password hashing with BCrypt. The PR description has been updated to reflect that framing.

## Verification setup, for local reproduction

```bash
# In /Users/amcclain/dev/toolbox/.env:
APP_TOOLBOX_OAUTH_PROVIDER=NONE
APP_TOOLBOX_TEST_USER_PASSWORD=playwright-test
APP_TOOLBOX_BOOTSTRAP_ADMIN_USER=test-admin@xh.io
APP_TOOLBOX_APP_CONFIG_CRYPTO_KEY=local-dev-toolbox-key-CHANGE-ME-IN-PROD

# In /Users/amcclain/dev/toolbox/gradle.properties:
runHoistInline=true

# Then:
cd /Users/amcclain/dev/toolbox
./gradlew :bootRun

# Login + verify:
curl -s -c /tmp/auth.txt -X POST 'http://localhost:8080/xh/login' \
    -d 'username=test-admin@xh.io&password=playwright-test'
curl -s -b /tmp/auth.txt 'http://localhost:8080/configAdmin/read' | head -c 400
```

To verify legacy-user authentication, seed a row with the spec-pinned fixture:

```sql
INSERT INTO tb_user (version, email, name, password, enabled)
VALUES (0, 'test-legacy@xh.io', 'Test Legacy', '3hrIc7ebBL/NxnkkVk0OWUAMyxRVld3U', 1);
```

Then `curl POST /xh/login` with `username=test-legacy@xh.io&password=playwright-test` — expect `success: true`.
