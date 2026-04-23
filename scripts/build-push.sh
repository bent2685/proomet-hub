#!/usr/bin/env bash
set -euo pipefail

# 用法：
#   IMAGE=yourname/proomet-hub VERSION=0.1.0 ./scripts/build-push.sh
# 或者直接：
#   ./scripts/build-push.sh yourname/proomet-hub 0.1.0

IMAGE="${1:-${IMAGE:-}}"
VERSION="${2:-${VERSION:-}}"

if [[ -z "$IMAGE" ]]; then
  echo "✖ 请传入镜像名，例如 yourname/proomet-hub" >&2
  exit 1
fi

if [[ -z "$VERSION" ]]; then
  VERSION="$(node -p "require('./package.json').version")"
fi

PLATFORMS="linux/amd64,linux/arm64"

# 确保有一个 docker-container 驱动的 builder
if ! docker buildx inspect multiarch >/dev/null 2>&1; then
  docker buildx create --name multiarch --driver docker-container --bootstrap
fi
docker buildx use multiarch

echo "▸ 构建并推送 ${IMAGE}:${VERSION} 与 :latest (${PLATFORMS})"
docker buildx build \
  --platform "$PLATFORMS" \
  --tag "${IMAGE}:${VERSION}" \
  --tag "${IMAGE}:latest" \
  --push \
  .

echo "✓ 完成：docker pull ${IMAGE}:${VERSION}"
