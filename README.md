## Description

A REST API wrapper for the Polymesh blockchain.

This version is compatible with chain version 4.1.x

## Setup

### Requirements

- node.js version 14.x
- yarn version 1.x

Note, if running with node v16+ the env `NODE_OPTIONS` should be set to `--unhandled-rejections=warn` to correctly handle errors

### Installing Dependencies

```bash
$ yarn
```

### Environment Variables

```bash
PORT=## port in which the server will listen. Defaults to 3000 ##
POLYMESH_NODE_URL=## websocket URL for a Polymesh node ##
POLYMESH_MIDDLEWARE_URL=## URL for an instance of the Polymesh GraphQL Middleware service ##
POLYMESH_MIDDLEWARE_API_KEY=## API key for the Middleware GraphQL service ##
LOCAL_SIGNERS=## list of comma separated IDs to refer to the corresponding mnemonic ##
LOCAL_MNEMONICS=## list of comma separated mnemonics for the signer service (each mnemonic corresponds to a signer in LOCAL_SIGNERS) ##
VAULT_URL=## The URL of a Vault transit engine##
VAULT_SECRET=## The access token for authorization with the Vault instance ##
SUBSCRIPTIONS_TTL=## Amount of milliseconds before a subscription is considered expired ##
SUBSCRIPTIONS_MAX_HANDSHAKE_TRIES=## Amount of attempts to activate a subscription via handshake before it is considered rejected ##
SUBSCRIPTIONS_HANDSHAKE_RETRY_INTERVAL=## Amount of milliseconds between subscription handshake attempts ##
NOTIFICATIONS_MAX_TRIES=## Amount of attempts to deliver a notification before it is considered failed ##
NOTIFICATIONS_RETRY_INTERVAL=## Amount of milliseconds between notification delivery attempts ##
NOTIFICATIONS_LEGITIMACY_SECRET=## A secret used to create HMAC signatures ##
```

### Signing Transactions

There are currently two configurations that the REST API maybe configured in to sign transactions. When Vault is configured it will override the local signers and those values will be ignored.

Each signer in the API is referenced by an alias specified depending on which signing manager is being used. This is used in the `signer` field in non GET requests.

1. Local Signing:
   By using `LOCAL_SIGNERS` and `LOCAL_MNEMONICS` private keys will be initialized in memory. When making a transaction that requires a signer use the corresponding `LOCAL_SIGNERS` (by array offset).
1. Vault Signing:
   By setting `VAULT_URL` and `VAULT_SECRET`an external [Vault](https://www.vaultproject.io/) instance will be used to sign transactions. The URL should point to a transit engine in Vault that has Ed25519 keys in it. To refer to a key when signing use the Vault name and version `${name}-${version}` e.g. `alice-1`

## Webhooks (alpha)

Normally the endpoints that create transactions wait for block finalization before returning a response, which normally takes around 15 seconds. As an alternative a field `webhookUrl` can be passed in each non GET request. When given the http request will return after validation. A 202 status code will be returned.

Before sending any information to the endpoint the service will first make a request with the header `x-hook-secret` set to a value. The endpoint should return a `200` response with the value echoed back in the headers.

If you are a developer you can toggle an endpoint to aid with testing by setting the env `DEVELOPER_UTILs=true` which will enabled a endpoint at `/developer-testing/webhook` which can then be supplied as the `webhookUrl`

### Warning

Webhooks are not ready for production use yet. The REST API is currently stateless. As such the subscription status is not persisted and can not guarantee delivery of the events.

In its current state the transactions should be reconciled with chain events directly to ensure your system stays properly synced.

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

### With docker

To pass in the env variables you can use `-e` to pass them individually, or use a file with `--env-file`.
For documentation you will need to expose a port that maps to `:3000` (or its `$PORT` if set) in the container.

```bash
docker build . -t $image_name
docker run -it --env-file .pme.env -p $HOST_PORT:3000 $image_name
```

Accessing `http://localhost:<PORT>` will take you to the swagger playground UI where all endpoints are documented and can be tested

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## License

Nest is [MIT licensed](LICENSE).
