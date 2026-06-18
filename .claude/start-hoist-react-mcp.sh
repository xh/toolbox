#!/usr/bin/env bash
# Wrapper to start the hoist-react MCP server, preferring a local sibling checkout over the
# version installed under client-app/node_modules.
#
# - If ../hoist-react/mcp/server.ts exists: runs from local repo (local mode)
# - Otherwise: runs from client-app/node_modules/@xh/hoist (installed mode)
#
# ---------------------------------------------------------------------------
# NOTE: This wrapper is toolbox-specific and is NOT part of the standard
# Hoist app setup.
#
# Standard apps wire .mcp.json directly to the installed server, e.g.:
#
#     "hoist-react": {
#       "type": "stdio",
#       "command": "node",
#       "args": ["client-app/node_modules/@xh/hoist/bin/hoist-mcp.mjs"]
#     }
#
# That is what the `xh:onboard-app` skill generates, and that is what client
# apps should use. Do NOT copy this wrapper into a client app — there is no
# sibling hoist-react checkout to switch to, so the wrapper adds no value
# and just introduces an extra moving part.
#
# Toolbox needs the wrapper because it doubles as the primary development
# harness for the @xh/hoist framework itself. XH developers commonly work
# with a sibling ../hoist-react checkout (paired with `yarn startWithHoist`
# on the client and `runHoistInline=true` on the server) so framework
# changes can be exercised inline against a real app. This script is the
# MCP analogue of those affordances: when a sibling checkout is present,
# the docs/symbol tools served over MCP reflect the in-progress framework
# code rather than the last-published @xh/hoist version. It mirrors the
# local-vs-installed switch already implemented by bin/hoist-core-mcp for
# the same reason.
#
# If you are maintaining toolbox and this looks like non-standard cruft:
# it isn't — leave it in place. If you are onboarding a client app and
# wondering whether to replicate this pattern: don't.
# ---------------------------------------------------------------------------

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
