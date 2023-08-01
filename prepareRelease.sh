#!/bin/bash

set -exu -o pipefail

declare nextVersion=$1

# This needs to be set to and SDK compatible value
CHAIN_TAG='6.0.0-develop-debian'

# This lets it work on arm64, like Mac Books
ARCHITECTURE=$(uname -m)
CHAIN_REPO=polymeshassociation/polymesh
if [ "$ARCHITECTURE" = "arm64" ]; then
    CHAIN_REPO="polymeshassociation/polymesh-arm64"
fi

sed -i.bak -e "s/.setVersion('.*')/.setVersion('$nextVersion')/g" src/main.ts
rm src/main.ts.bak

export CHAIN_IMAGE="$CHAIN_REPO:$CHAIN_TAG"

docker compose up -d chain

SWAGGER_VERSION=$nextVersion POLYMESH_NODE_URL='ws://localhost:9944' yarn generate:swagger > /dev/null 2>&1

docker compose down chain