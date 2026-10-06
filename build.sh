#!/bin/sh
# Build + push the app image.
#
#   ./build.sh [env] [tag]
#
#   ./build.sh              # uses .env            -> :latest
#   ./build.sh prod         # uses .env.production
#   ./build.sh prod 26_07_26_1
#
# The VITE_* URLs are compiled INTO the bundle, so the image is specific to the
# environment it was built for. That is why the env name is an argument: the same
# image cannot be promoted from staging to prod. Pull the env file first with
#   yarn secrets -e <env>
set -eu

ENV_NAME="${1:-dev}"
TAG="${2:-latest}"
REGISTRY="${REGISTRY:-registry.example.com/qotm-web}"
IMAGE="${IMAGE:-web}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

case "$ENV_NAME" in
	dev) ENV_FILE=".env" ;;
	test) ENV_FILE=".env.test" ;;
	staging) ENV_FILE=".env.staging" ;;
	prod | production) ENV_FILE=".env.production" ;;
	*) echo "unknown env '$ENV_NAME' (dev|test|staging|prod)" >&2; exit 1 ;;
esac

[ -f "$ENV_FILE" ] || {
	echo "missing $ENV_FILE — run: yarn secrets -e $ENV_NAME" >&2
	exit 1
}

# Read a var out of the env file, tolerating the quoted style these files use.
read_var() {
	sed -n "s/^$1=['\"]\{0,1\}\([^'\"]*\)['\"]\{0,1\}$/\1/p" "$ENV_FILE" | tail -1
}

BUILD_ARGS=""
VARS="VITE_APP_API_URL VITE_APP_SITE_URL VITE_APP_SUPPORT_EMAIL"
VARS="$VARS VITE_OPENOBSERVE_URL VITE_OPENOBSERVE_ORG VITE_OPENOBSERVE_CLIENT_TOKEN"
for VAR in $VARS; do
	VALUE="$(read_var "$VAR")"
	[ -n "$VALUE" ] && BUILD_ARGS="$BUILD_ARGS --build-arg $VAR=$VALUE"
done

echo "Building for '$ENV_NAME' -> $REGISTRY/$IMAGE:$TAG"
echo "  (URLs baked in from $ENV_FILE)"

# shellcheck disable=SC2086
docker buildx build --push --platform "$PLATFORMS" \
	$BUILD_ARGS \
	-t "$REGISTRY/$IMAGE:$TAG" \
	.
