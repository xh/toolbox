#!/usr/bin/env bash
# Wrapper to start the hoist-core MCP server in the correct mode based on gradle.properties.
#
# - If runHoistInline=true: starts in local mode (builds from source in ../hoist-core)
# - Otherwise: starts in version mode using hoistCoreVersion from gradle.properties

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROPS="$PROJECT_DIR/gradle.properties"

if [ ! -f "$PROPS" ]; then
    echo "[hoist-core-mcp] ERROR: gradle.properties not found at $PROPS" >&2
    exit 1
fi

BOOTSTRAP="$PROJECT_DIR/../hoist-core/mcp/bootstrap.sh"
if [ ! -f "$BOOTSTRAP" ]; then
    echo "[hoist-core-mcp] ERROR: bootstrap.sh not found at $BOOTSTRAP" >&2
    exit 1
fi

RUN_INLINE=$(grep '^runHoistInline=' "$PROPS" | cut -d= -f2 | tr -d '[:space:]')
HOIST_VERSION=$(grep '^hoistCoreVersion=' "$PROPS" | cut -d= -f2 | tr -d '[:space:]')

if [ "$RUN_INLINE" = "true" ]; then
    exec bash "$BOOTSTRAP"
else
    if [ -z "$HOIST_VERSION" ]; then
        echo "[hoist-core-mcp] ERROR: hoistCoreVersion not found in gradle.properties" >&2
        exit 1
    fi
    exec bash "$BOOTSTRAP" --version "$HOIST_VERSION"
fi
