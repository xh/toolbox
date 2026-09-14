# Note Toolbox is deliberately using the next tag here, built off of xh/xh-nginx develop branch.
# Production apps are recommended to use the most recent versioned (vX.Y.Z) build, to ensure the
# source image remains stable and predictable across builds of the same app codebase.
#
# The -brotli variant is required to serve the pre-compressed `.br` files emitted by
# hoist-dev-utils - the standard image has no brotli module, and would fall back to the `.gz`
# copies. Both variants build from the same commit and share the same config.
FROM xhio/xh-nginx:next-brotli
COPY app.conf $XH_NGINX_CONFIG_PATH/
COPY build/ $XH_NGINX_CONTENT_PATH/
