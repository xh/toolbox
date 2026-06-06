#!/usr/bin/env bash
#
# Unit tests for build-tag.sh — emits the two build identifiers for a snapshot run.
#
# Two modes, both derived from one snapped timestamp (the caller passes BUILD_TS so
# the values for a run correspond):
#   app   — the human-facing identifier baked into `appBuild` on client + server and
#           shown in-app. Readable: branch_commit_timestamp, colon preserved, no prefix.
#           Its ONLY hard constraint is that client and server agree (the skew check).
#   image — the immutable ECR image tag. A TOTAL function: for ANY ref it yields a
#           valid Docker/ECR tag (^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$). The container
#           grammar lives here ONLY — it never touches the displayed appBuild value.
#
# Run locally or in CI:  bash .github/scripts/build-tag.test.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_TAG="$SCRIPT_DIR/build-tag.sh"

TAG_GRAMMAR='^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$'

pass=0
fail=0

# run_tag <mode> <sha> <ref> <ts>
run_tag() {
    local mode="$1" sha="$2" ref="$3" ts="$4"
    GITHUB_SHA="$sha" GITHUB_REF_NAME="$ref" BUILD_TS="$ts" bash "$BUILD_TAG" "$mode"
}

expect_eq() {
    local desc="$1" expected="$2" actual="$3"
    if [[ "$actual" == "$expected" ]]; then
        pass=$((pass + 1))
    else
        fail=$((fail + 1))
        echo "FAIL: $desc"
        echo "      expected: '$expected'"
        echo "      actual:   '$actual'"
    fi
}

expect_valid() {
    local desc="$1" actual="$2"
    if [[ "$actual" =~ $TAG_GRAMMAR ]]; then
        pass=$((pass + 1))
    else
        fail=$((fail + 1))
        echo "FAIL: $desc — output is not a valid image tag"
        echo "      actual: '$actual' (len ${#actual})"
    fi
}

expect_true() {
    local desc="$1" expr="$2"
    if eval "$expr"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL: $desc"; fi
}

SHA="9fab8764d5bd03c3e72ef4e32d62e3d47ce4fbda"   # full 40-char SHA, like GITHUB_SHA
TS="2026-06-05T18:19Z"                            # colon form, snapped by the caller

# ---- app mode: human-facing, NOT compromised by container constraints ----

out=$(run_tag app "$SHA" "develop" "$TS")
expect_eq "app: branch_commit_timestamp, colon preserved, no prefix" \
    "develop_9fab876_2026-06-05T18:19Z" "$out"
expect_true "app: keeps the readable colon"        '[[ "$out" == *:* ]]'
expect_true "app: has NO snap_ container prefix"    '[[ "$out" != snap_* ]]'

# app deliberately preserves the raw ref (display value, not a container tag).
out=$(run_tag app "$SHA" "feature/foo" "$TS")
expect_eq "app: raw ref preserved verbatim" \
    "feature/foo_9fab876_2026-06-05T18:19Z" "$out"

# ---- image mode: total function, container grammar lives here only ----

out=$(run_tag image "$SHA" "develop" "$TS")
expect_eq "image: snap_ prefix, sanitized colon-free timestamp" \
    "snap_develop_9fab876_2026-06-05T18-19Z" "$out"
expect_valid "image: develop is a valid tag" "$out"

out=$(run_tag image "$SHA" "feature/foo" "$TS")
expect_eq "image: slash in ref sanitized to dash" \
    "snap_feature-foo_9fab876_2026-06-05T18-19Z" "$out"
expect_valid "image: slash-branch is a valid tag" "$out"

out=$(run_tag image "$SHA" "feature/foo:bar baz" "$TS")
expect_eq "image: colon and space sanitized to dash" \
    "snap_feature-foo-bar-baz_9fab876_2026-06-05T18-19Z" "$out"
expect_valid "image: messy-branch is a valid tag" "$out"

out=$(run_tag image "$SHA" "release_2.0-rc.1" "$TS")
expect_eq "image: underscore/dot/dash preserved" \
    "snap_release_2.0-rc.1_9fab876_2026-06-05T18-19Z" "$out"

long_ref=$(printf 'x%.0s' $(seq 1 300))
out=$(run_tag image "$SHA" "$long_ref" "$TS")
expect_valid "image: 300-char branch is a valid tag" "$out"
expect_true "image: 300-char branch clamped to <=128" '[[ ${#out} -le 128 ]]'

out=$(run_tag image "$SHA" $'caf\xc3\xa9/\tbranch' "$TS")
expect_valid "image: unicode+tab branch is a valid tag" "$out"

out=$(run_tag image "$SHA" "" "$TS")
expect_valid "image: empty ref is a valid tag" "$out"

# ---- correspondence + determinism ----

app=$(run_tag app "$SHA" "develop" "$TS")
img=$(run_tag image "$SHA" "develop" "$TS")
expect_true "app + image share the same short sha" '[[ "$app" == *9fab876* && "$img" == *9fab876* ]]'

a=$(run_tag image "$SHA" "develop" "$TS"); b=$(run_tag image "$SHA" "develop" "$TS")
expect_eq "image: deterministic for identical inputs" "$a" "$b"

echo "-----"
echo "build-tag.sh: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
