#!/bin/bash

DEV_ENV_DIR="/tmp/polymesh-dev-env"
INTEGRATION_DIR="$DEV_ENV_DIR/tests"
LOG_FILE="/tmp/polymesh-rest-api-$(date +%Y%m%d-%H%M%S).log"

echo "cloning the repository"
git clone https://github.com/PolymeshAssociation/polymesh-dev-env.git "$DEV_ENV_DIR"

pushd "$INTEGRATION_DIR"

yarn
echo "starting up environment"
yarn test:start
echo "env is set up"

export SERVICE_PORT="2000"
export VAULT_URL="http://localhost:8200/v1/transit"
export VAULT_TOKEN="$(../scripts/get-vault-token.sh)"
export POLYMESH_NODE_URL="ws://localhost:9944"
export REST_API_URL="http://localhost:${SERVICE_PORT}/"
export POLYMESH_MIDDLEWARE_V2_URL="http://localhost:3000"

# register cleanup to stop the background service
function cleanup() {
    echo "cleaning up test environment"
    if [ -n "${SERVICE_PID}" ]; then
        echo "Cleaning up service with PID: ${SERVICE_PID}"
        kill "${SERVICE_PID}"
    fi

    yarn test:stop

    rm -rf $DEV_ENV_DIR
}
trap cleanup EXIT INT TERM

echo "starting REST API to test"
popd

# Build and run directly to capture the PID for later cleanup
yarn build
DEVELOPER_UTILS='true' PORT="${SERVICE_PORT}" node dist/main.js > "$LOG_FILE" 2>&1 &
SERVICE_PID=$!

echo "waiting for service to be ready..."
curl --silent --output /dev/null --retry-all-errors --retry-delay 3 --retry 10 "http://localhost:2000/network"
echo "service is ready! Logs will be written to ${LOG_FILE}"

cd "$INTEGRATION_DIR"

yarn test:run rest
