## Description

REST API that communicates with the Polymesh blockchain

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
RELAYER_DIDS=## list of comma separated DIDs for the relayer service ##
RELAYER_MNEMONICS=## list of comma separated mnemonics for the relayer service (each mnemonic corresponds to a DID in RELAYER_DIDS) ##
VAULT_TRANSIT_URL=## The URL for the vault transit engine ##
VAULT_TOKEN=## Access token for the vault instance ##
VAULT_KEYS=## list of comma separated key names for the relayer service ##
SS58_FORMAT=## Specify chains address format. Defaults to 42. Should be 12 for mainnet.
```

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

To pass in the env variables you can use `-e` to pass them indiviudally, or use a file with `--env-file`.
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

## Signers

The rest api supports multiple places to store the signing keys for transactions. The simplest, but least secure way, is to set `RELAYER_DIDS` and `RELAYER_MNEMONICS` env variables. When these are set the mnemonic will be stored in memory and requests will be signed with the corresponding DID passed in the `signer` field.

The alternative is to use [Vault](https://www.vaultproject.io/) with the transit module enabled. For this the envs `VAULT_TRANSIT_URL`, `VAULT_TOKEN` and `VAULT_KEYS` need to be set. With this mode enabled all extrinsic payloads will be signed with keys in Vault. The key name in Vault should be passed as the `signer` in requests.

Only one singer can be used at a time. If both sets of variables are set Vault signing will take precedence.

### Vault Signer Dev

For local development vault can be downloaded [here](https://www.vaultproject.io/downloads) and started with `vault server -dev`. The root token will be printed and is also saved in `~/.vault_token`.

There will be an admin page at `localhost:8200`, here you will need to enable the `transit` engine and generate a new `ed25519` key. The key name should be set in the env var `VAULT_KEYS`.

When the server starts up, it will print each key with its corresponding address in the logs. Copy the address and visit [app.polymesh.live](https://app.polymesh.live/) on the proper netowork. Go to Account > Address Book to add the addres. Then go to Developer > Extrinisics, select `testUils/mockCddRegisterDid`. Use Alice to sign the extrinsic targeting the account. Then use Accounts > Transfer to send the account some POLYX.

Once these steps are complete the key should be ready to sign transactions by specifying its name in the `signer` field.

## License

Nest is [MIT licensed](LICENSE).
