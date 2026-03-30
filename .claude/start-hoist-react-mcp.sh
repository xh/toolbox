#!/usr/bin/env bash
# Wrapper to start the hoist-react MCP server, preferring a local checkout over node_modules.
#
# - If ../hoist-react/mcp/server.ts exists: runs from local repo (local mode)
# - Otherwise: runs from client-app/node_modules/@xh/hoist (installed mode)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

LOCAL_SERVER="$PROJECT_DIR/../hoist-react/bin/hoist-mcp.mjs"
LOCAL_SIGNAL="$PROJECT_DIR/../hoist-react/mcp/server.ts"
INSTALLED_SERVER="$PROJECT_DIR/client-app/node_modules/@xh/hoist/bin/hoist-mcp.mjs"

if [ -f "$LOCAL_SIGNAL" ]; then
    echo "[hoist-react-mcp] Local hoist-react checkout detected — starting in local mode" >&2
    exec node "$LOCAL_SERVER"
else
    echo "[hoist-react-mcp] No local checkout — starting from node_modules" >&2
    exec node "$INSTALLED_SERVER"
fi
