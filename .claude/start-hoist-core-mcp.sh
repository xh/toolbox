#!/usr/bin/env bash
# Start the hoist-core MCP server, preferring a local checkout over a downloaded version.
#
# - If ../hoist-core exists: starts in local mode (builds from source)
# - Otherwise: downloads bootstrap.sh from GitHub and starts in version mode

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROPS="$PROJECT_DIR/gradle.properties"
CACHE_DIR="$HOME/.cache/hoist-core-mcp"

if [ ! -f "$PROPS" ]; then
    echo "[hoist-core-mcp] ERROR: gradle.properties not found at $PROPS" >&2
    exit 1
fi

HOIST_VERSION=$(grep '^hoistCoreVersion=' "$PROPS" | cut -d= -f2 | tr -d '[:space:]')

LOCAL_BOOTSTRAP="$PROJECT_DIR/../hoist-core/mcp/bootstrap.sh"
if [ -f "$LOCAL_BOOTSTRAP" ]; then
    echo "[hoist-core-mcp] Local hoist-core checkout detected — starting in local mode" >&2
    exec bash "$LOCAL_BOOTSTRAP"
fi

# No local checkout — download bootstrap.sh and run in version mode.
if [ -z "$HOIST_VERSION" ]; then
    echo "[hoist-core-mcp] ERROR: hoistCoreVersion not found in gradle.properties" >&2
    exit 1
fi

if [[ "$HOIST_VERSION" == *-SNAPSHOT ]]; then
    GH_REF="develop"
else
    GH_REF="v$HOIST_VERSION"
fi

mkdir -p "$CACHE_DIR"
BOOTSTRAP="$CACHE_DIR/bootstrap-$GH_REF.sh"
if [ ! -f "$BOOTSTRAP" ] || [[ "$GH_REF" == "develop" ]]; then
    GH_URL="https://raw.githubusercontent.com/xh/hoist-core/$GH_REF/mcp/bootstrap.sh"
    echo "[hoist-core-mcp] Downloading bootstrap.sh from $GH_REF..." >&2
    curl -sfL "$GH_URL" -o "$BOOTSTRAP" || {
        echo "[hoist-core-mcp] ERROR: Failed to download bootstrap.sh from $GH_URL" >&2
        rm -f "$BOOTSTRAP"
        exit 1
    }
fi

exec bash "$BOOTSTRAP" --version "$HOIST_VERSION"