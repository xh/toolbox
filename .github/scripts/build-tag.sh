#!/usr/bin/env bash
#
# Emit a build identifier for a snapshot run, in one of two modes:
#
#   app    The human-facing identifier baked into `appBuild` on the client and server
#          and shown in-app. Form: <ref>_<sha>_<timestamp>, e.g.
#          develop_9fab876_2026-06-06T17:17Z — readable, colon preserved, no prefix.
#          Its only hard requirement is that client and server carry the SAME value
#          (that is what EnvironmentService's version poll compares).
#
#   image  The immutable ECR image tag for the build. Form: snap_<ref>_<sha>_<ts>,
#          e.g. snap_develop_9fab876_2026-06-06T17-17Z. This is a TOTAL function: for
#          ANY git ref it yields a valid Docker/ECR image tag
#          (^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$). The container-tag grammar lives here
#          ONLY — it never constrains the displayed `appBuild` value above:
#            - charset : an allowlist maps every byte outside the tag set to '-'.
#            - leading : the literal `snap` prefix guarantees a valid first char.
#            - length  : the ref (the only variable-length part) is clamped using a
#                        budget from the real lengths of the fixed parts.
#          The `snap_` prefix is also the key the ECR lifecycle policy matches on.
#
# Both modes read the SAME timestamp when the caller passes BUILD_TS (the `prepare`
# job snaps it once and invokes both modes), so a run's app and image values agree.
#
# Inputs (env): GITHUB_SHA, GITHUB_REF_NAME (from GitHub Actions),
#               BUILD_TS (optional; defaults to now — pass it to share one moment).
#
# Tests: .github/scripts/build-tag.test.sh

set -euo pipefail

mode="${1:-}"
sha="${GITHUB_SHA:0:7}"
ref="${GITHUB_REF_NAME:-}"
ts="${BUILD_TS:-$(date -u +'%Y-%m-%dT%H:%MZ')}"

sanitize() { printf '%s' "$1" | LC_ALL=C sed -E 's/[^A-Za-z0-9_.-]/-/g'; }

case "$mode" in
    app)
        # Display value — ref kept verbatim (git refs can't contain whitespace, and
        # this is never used as a container tag), colon preserved for readability.
        printf '%s\n' "${ref}_${sha}_${ts}"
        ;;
    image)
        prefix="snap"
        ref_safe=$(sanitize "$ref")
        ts_safe=$(sanitize "$ts")
        # Clamp the ref so the assembled tag is always <= 128 chars. Budget = 128
        # minus the fixed parts (prefix + 3 '_' separators + sha + sanitized ts).
        overhead=$(( ${#prefix} + 3 + ${#sha} + ${#ts_safe} ))
        budget=$(( 128 - overhead ))
        (( budget < 0 )) && budget=0
        ref_safe="${ref_safe:0:budget}"
        printf '%s\n' "${prefix}_${ref_safe}_${sha}_${ts_safe}"
        ;;
    *)
        echo "usage: build-tag.sh {app|image}" >&2
        exit 2
        ;;
esac
