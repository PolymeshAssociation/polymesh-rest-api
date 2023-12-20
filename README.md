[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)
[![Github Actions Workflow](https://github.com/PolymeshAssociation/polymesh-rest-api/actions/workflows/main.yml/badge.svg)](https://github.com/PolymeshAssociation/polymesh-rest-api/actions)
[![Sonar Status](https://sonarcloud.io/api/project_badges/measure?project=PolymeshAssociation_polymesh-rest-api&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=PolymeshAssociation_polymesh-rest-api)
[![Issues](https://img.shields.io/github/issues/PolymeshAssociation/polymesh-rest-api)](https://github.com/PolymeshAssociation/polymesh-rest-api/issues)

## Description

A REST API wrapper for the Polymesh blockchain.

This version is compatible with chain versions 5.4.x - 6.0.x

## Setup

### Requirements

- node.js version 14.x
- yarn version 1.x

Note, if running with node v16+ the env `NODE_OPTIONS` should be set to `--unhandled-rejections=warn`

### Installing Dependencies

```bash
$ yarn
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# REPL (interactive command line)
$ yarn start:repl

# production mode
$ yarn start:prod
```

Documentation for REPL mode can be found [here](https://docs.nestjs.com/recipes/repl)

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

### Environment Variables

```bash
PORT=## port in which the server will listen. Defaults to 3000 ##
POLYMESH_NODE_URL=## websocket URL for a Polymesh node ##
POLYMESH_MIDDLEWARE_V2_URL=## URL for an instance of the Polymesh GraphQL Middleware Native SubQuery service ##
POLYMESH_MIDDLEWARE_URL=## URL for an instance of the Polymesh GraphQL Middleware service @deprecated in favour of POLYMESH_MIDDLEWARE_V2_URL##
POLYMESH_MIDDLEWARE_API_KEY=## API key for the Middleware GraphQL service ##
LOCAL_SIGNERS=## list of comma separated IDs to refer to the corresponding mnemonic ##
LOCAL_MNEMONICS=## list of comma separated mnemonics for the signer service (each mnemonic corresponds to a signer in LOCAL_SIGNERS) ##

# Below are optional params that enable some features. The above should be good to get started with

DEVELOPER_SUDO_MNEMONIC=## a mnemonic that has `sudo` privileges for a chain. Defaults to `//Alice` ##
DEVELOPER_UTILS=## set to `true` to enable developer testing endpoints ##

# Vault Signer:
VAULT_URL=## The URL of a Vault transit engine##
VAULT_TOKEN=## The access token for authorization with the Vault instance ##

# Fireblocks Signer:
FIREBLOCKS_URL=## The fireblocks URL ##
FIREBLOCKS_API_KEY=## The API Key to use ##
FIREBLOCKS_SECRET_PATH=## Path to secret file to sign requests with ##
# Webhooks:
SUBSCRIPTIONS_TTL=## Amount of milliseconds before a subscription is considered expired ##
SUBSCRIPTIONS_MAX_HANDSHAKE_TRIES=## Amount of attempts to activate a subscription via handshake before it is considered rejected ##
SUBSCRIPTIONS_HANDSHAKE_RETRY_INTERVAL=## Amount of milliseconds between subscription handshake attempts ##
NOTIFICATIONS_MAX_TRIES=## Amount of attempts to deliver a notification before it is considered failed ##
NOTIFICATIONS_RETRY_INTERVAL=## Amount of milliseconds between notification delivery attempts ##
NOTIFICATIONS_LEGITIMACY_SECRET=## A secret used to create HMAC signatures ##
# Auth:
AUTH_STRATEGY=## list of comma separated auth strategies to use e.g. (`apiKey,open`) ##
API_KEYS=## list of comma separated api keys to initialize the `apiKey` strategy with ##
# Datastore:
REST_POSTGRES_HOST=## Domain or IP indicating of the DB ##
REST_POSTGRES_PORT=## Port the DB is listening (usually 5432) ##
REST_POSTGRES_USER=## DB user to use##
REST_POSTGRES_PASSWORD=## Password of the user ##
REST_POSTGRES_DATABASE=## Database to use ##
```

## Signing Transactions

The REST API has endpoints that submit transactions to the block chain (generally POST routes). Each of these endpoints share a field `"options"` that controls what key will sign it, and how it will be processed.

e.g.
```
{
   options: {
      signer: "alice",
      processMode: "submit"
   },
   ...transactionParams
}
```

Process modes include:

  - `submit` This will create a transaction payload, sign it and submit it to the chain. It will respond with 201 when the transaction has been successfully finalized. (Usually around 15 seconds).
  - `submitWithCallback` This works like submit, but returns a response as soon as the transaction is submitted. The URL specified by `webhookUrl` will receive updates as the transaction is processed
  - `dryRun`  This creates and validates a transaction, and returns an estimate of its fees.
  - `offline` This creates an unsigned transaction and returns a serialized JSON payload. The information can be signed, and then submitted to the chain.

### Signing Managers

A signing manager is required for `submit` and `submitWithCallback` processing modes.

There are currently three [signing managers](https://github.com/PolymeshAssociation/signing-managers#projects) the REST API can be configured with, the local signer, the [Hashicorp Vault](https://www.vaultproject.io/) signer or the [Fireblocks](https://www.fireblocks.com/) signing manager. If args for multiple are given the precedence order is Vault over Fireblocks over Local.

For any method that modifies chain state, the key to sign with can be controlled with the "options.signer" field. This can either be the SS58 encoded address, or an ID that is dependent on the particular signing manager.

1. Vault Signing:
   By setting `VAULT_URL` and `VAULT_TOKEN` an external [Vault](https://www.vaultproject.io/) instance will be used to sign transactions. The URL should point to a transit engine in Vault that has Ed25519 keys in it.

   To refer to a key when signing use the Vault name and version `${name}-${version}` e.g. `alice-1`.

1. Fireblocks Signing
   By setting `FIREBLOCKS_URL`, `FIREBLOCKS_API_KEY` and `FIREBLOCKS_SECRET_PATH` Fireblocks raw signing API will be used to sign transactions. The secret path should point to a file containing the secret setup in the Fireblocks platform, along with the API Key.

   The signer consists of 3 integers separated by `-`, as in `1-0-0`. This correspond to `account`, `change` and `address_index` from the [BIP-44 standard](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki). If `change` and `address` portion are left out they will default to `0`. Each combination refers to a unique address that must be on boarded on chain before it can be used.

   Note, if using the docker image the secret file will need to be mounted into the container with the flag `--volume $HOST_SECRET_PATH:$FIREBLOCKS_SECRET_PATH` being passed to `docker run`.

1. Local Signing:
   By using `LOCAL_SIGNERS` and `LOCAL_MNEMONICS` private keys will be initialized in memory. When making a transaction that requires a signer use the corresponding `LOCAL_SIGNERS` (by array offset).

### Offline

Offline payloads contain a field `"unsignedTransaction"`, which consists of 4 keys. `payload` and `rawPayload` correspond to `signPayload` and `signRaw`. You will need to pass one of these to the respective signer you are using (or replicate `signRaw` in your environment). `method` is the hex encoded transaction, which can help verify what is being signed. `metadata` is an echo of whatever is passed as `metadata` in the options. It has no effect on operation, but can be useful for attaching extra info to the transactions, e.g. `clientId` or `memo`

After being generated the signature with the payload can be passed to `/submit` to be submitted to the chain.

This mode introduces the risk transactions are rejected due to incorrect nonces or elapsed lifetime. See the [options DTO](src/common/dto/transaction-options.dto.ts) definition for full details

### Webhooks (alpha)

Normally the endpoints that create transactions wait for block finalization before returning a response, which normally takes around 15 seconds. When processMode `submitAndCallback` is used the `webhookUrl` param must also be provided. The server will respond after submitting the transaction to the mempool with 202 (Accepted) status code instead of the usual 201 (Created).

Before sending any information to the endpoint the service will first make a request with the header `x-hook-secret` set to a value. The endpoint should return a `200` response with this header copied into the response headers.

If you are a developer you can toggle an endpoint to aid with testing by setting the env `DEVELOPER_UTILS=true` which will enabled a endpoint at `/developer-testing/webhook` which can then be supplied as the `webhookUrl`. Note, the IsUrl validator doesn't recognize `localhost` as a valid URL, either use the IP `127.0.0.1` or create an entry in `/etc/hosts` like `127.0.0.1 rest.local` and use that instead.

### Authentication

The REST API uses [passport.js](https://www.passportjs.org/) for authentication. This allows the service to be configurable with multiple strategies.

Currently there are two strategies available:

1. Api Key:
   By configuring `apiKey` as a strategy, any request with the header `x-api-key` will be authenticated with this strategy. The env `API_KEYS` can be used to provide initial keys.
1. Open:
   By configuring `open` as a strategy any request will be authenticated with a default user. This is primarily intended for development, however it can be used to provide a "read only" API. It should **never** be used in combination with a signing manager that holds valuable keys.

More strategies can be added, there are many [pre-made strategies](https://www.passportjs.org/packages/) that are available, and custom ones can be written.

To implement a new strategy, create a new file in `~/auth/strategies/` and update the `strategies.consts` file with an appropriate name. Be sure to add some tests for your logic as well.

### State

The REST API has taken a plugin style approach to where it stores state. Do note, the Polymesh chain is responsible for processing most POST request. This only affects where REST API specific entities are stored (e.g. Users and ApiKeys). Most transactions are permanently stored on chain regardless of the datastore used

Currently there are two datastore available:

1. LocalStore:
   This is the default setting. This uses the process memory to store state. This allows the REST API to be ran as a single process which is convenient for development purposes, or when an instance is intended for read only purposes (i.e. no `signers` are loaded). However all state will be lost when the process shuts down
1. Postgres
   This is the more production ready approach. This allows state to be persisted, and multiple server instances to user the same information. Internally this uses TypeORM to manage the database

`package.json` contains scripts to help manage the development postgres service defined in `docker-compose.yml`. These are all prefixed with `postgres:dev`, e.g. `yarn postgres:dev:start`, which will use the configuration defined in `postgres.dev.config`.

To implement a new repo for a service, first define an abstract class describing the desired interface. Also write a test suite to specify the expected behavior from an implementation. Then in the concrete implementations define a new Repo that satisfies the test suite.

To implement a new datastore create a new module in `~/datastores` and create a set of `Repos` that will implement the abstract classes. You will then need to set up the `DatastoreModule` to export the module when it is configured. For testing, each implemented Repo should be able to pass the `test` method defined on the abstract class it is implementing.


#### Warning

Webhooks are still being developed and should not be used against mainnet. However the API should be stable to develop against for testing and demo purposes

Webhooks have yet to implement a Repo. As such the subscription status is not persisted and the service can not guarantee delivery in the face of ordinary compting faults.

In its current state the transactions would have to be reconciled with chain events as there is a chance for notifications to not be delivered.

### With docker

To pass in the env variables you can use `-e` to pass them individually, or use a file with `--env-file`.
For documentation you will need to expose a port that maps to `:3000` (or its `$PORT` if set) in the container.

```bash
docker build . -t $image_name
docker run -it --env-file .pme.env -p $HOST_PORT:3000 $image_name
```

Accessing `http://localhost:<PORT>` will take you to the swagger playground UI where all endpoints are documented and can be tested

### ActiveMQ (Apple Silicone)

You may need to enable "Use Rosetta for x86/amd64 emulation on Apple Silicon" in docker for the container to start

## License

This project uses [NestJS](https://nestjs.com/), which is [MIT licensed](./LICENSE.MIT).

The project itself is [Apache 2.0 licensed](./LICENSE).
