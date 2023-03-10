#!/bin/bash

declare nextVersion=$1

sed -i.bak -e "s/.setVersion('.*')/.setVersion('$nextVersion')/g" src/main.ts
rm src/main.ts.bak

SWAGGER_VERSION=$nextVersion POLYMESH_NODE_URL='wss://testnet-rpc.polymesh.live' yarn generate:swagger > /dev/null 2>&1