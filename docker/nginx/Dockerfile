# Note Toolbox is deliberately using the next tag here, built off of xh/xh-nginx develop branch.
# Production apps are recommended to use the most recent versioned (vX.Y.Z) build, to ensure the
# source image remains stable and predictable across builds of the same app codebase.
FROM xhio/xh-nginx:next
COPY app.conf $XH_NGINX_CONFIG_PATH/
COPY build/ $XH_NGINX_CONTENT_PATH/
