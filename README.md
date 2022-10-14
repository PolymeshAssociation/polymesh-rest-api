## Description

A REST API wrapper for the Polymesh blockchain.

This version is compatible with chain versions 5.0.x

## Setup

### Requirements

- node.js version 14.x
- yarn version 1.x

Note, if running with node v16+ the env `NODE_OPTIONS` should be set to `--unhandled-rejections=warn`

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
AUTH_STRATEGY=## list of comma separated auth strategies to use e.g. (`apiKey,open`) ##
```

### Signing Transactions

There are currently two [signing managers](https://github.com/PolymeshAssociation/signing-managers#projects) the REST API can be configured with, the local, in memory, signer or the [Hashicorp Vault](https://www.vaultproject.io/) signer. If args for both are given, Vault takes precedence

For any method that modifies chain state, the key to sign with can be controlled with the "signer" field.

1. Local Signing:
   By using `LOCAL_SIGNERS` and `LOCAL_MNEMONICS` private keys will be initialized in memory. When making a transaction that requires a signer use the corresponding `LOCAL_SIGNERS` (by array offset).
1. Vault Signing:
   By setting `VAULT_URL` and `VAULT_SECRET`an external [Vault](https://www.vaultproject.io/) instance will be used to sign transactions. The URL should point to a transit engine in Vault that has Ed25519 keys in it. To refer to a key when signing use the Vault name and version `${name}-${version}` e.g. `alice-1`

### Authentication

The API uses [passport.js](https://www.passportjs.org/) for authentication. This allows the REST API to be configured with different strategies, depending on the use case.

Currently there are two strategies available:

1. Api Key:
   By setting `apiKey` in the strategy any request that provides the header `x-api-key` that will server as the authentication mechanism. The env `API_KEYS` can be used to provide initial keys
1. Open:
   By setting `open` this strategy will authenticate all requests with a default user entity. Primarily intended for development, but can be useful to provide a "read only" API. It should never be used when in combination with a signing manager that holds valuable keys. This is the default strategy, although it must be explicitly passed in a production environment

More can be added in. There are many [pre-made strategies](https://www.passportjs.org/packages/) that are available, or a custom one can be written.

To implement a new strategy, create a new file in `~/auth/strategies/` and update the `strategies.consts` file with an appropriate name

## Webhooks (alpha)

Normally the endpoints that create transactions wait for block finalization before returning a response, which normally takes around 15 seconds. Alternatively `webhookUrl` can be given in any state modifying endpoint. When given, the server will respond after submitting the transaction to the mempool with 202 (Accepted) status code instead of the usual 201 (Created).

Before sending any information to the endpoint the service will first make a request with the header `x-hook-secret` set to a value. The endpoint should return a `200` response with this header copied into the response headers.

If you are a developer you can toggle an endpoint to aid with testing by setting the env `DEVELOPER_UTILS=true` which will enabled a endpoint at `/developer-testing/webhook` which can then be supplied as the `webhookUrl`. Note, the IsUrl validator doesn't recognize `localhost` as a valid URL, either use the IP `127.0.0.1` or create an entry in `/etc/hosts` like `127.0.0.1 rest.local` and use that instead.

### Warning - Not mainnet ready

Webhooks are still being developed and should not be used against mainnet. However the API for them should be stable to develop against for testing and demo purposes

As the REST API is currently stateless (Look, no database!). As such the subscription status is not persisted and the service can not guarantee delivery in the face of ordinary compting faults.

In its current state the transactions would have to be reconciled with chain events as there is a chance for notifications to not be delivered.

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
