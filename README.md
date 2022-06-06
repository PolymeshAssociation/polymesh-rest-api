## Description

A REST API wrapper for the Polymesh blockchain.

This version is compatible with chain version 4.1.x

## Setup

### Requirements

- node.js version 14.x
- yarn version 1.x

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
```

### Signing Transactions

There are currently two configurations that the REST API maybe configured in to sign transactions. When Vault is configured it will override the local signers and those values will be ignored.

1. Local Signing:
   By using `LOCAL_SIGNERS` and `LOCAL_MNEMONICS` private keys will be initialized in memory. When making a transaction that requires a signer use the corresponding entry in `LOCAL_SIGNERS` (by array offset).
1. Vault Signing:
   By setting `VAULT_URL` and `VAULT_SECRET`an external [Vault](https://www.vaultproject.io/) instance will be used to sign transactions. The URL should point to a transit engine in Vault that has Ed25519 keys in it. To refer to a key when signing use the Vault name and version `${name}-${version}` e.g. `alice-1`

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
