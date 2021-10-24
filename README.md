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

For local development vault can be downloaded [here](https://www.vaultproject.io/downloads) and started with `vault server -dev`. This will server an admin page on `localhost:8200`. The printed root token can be used to log in, and then enable new engine, and then select "transit".

A new keypair can be created by selecting the engine and choosing to generate a `ed25519` type pair.

To get the public key hex encoded, this bash command can be used.

```sh
curl -s --header "X-Vault-Token: $VAULT_TOKEN" "http://localhost:8200/v1/transit/keys/$KEY" |
  jq '.data.keys | .["1"].public_key' |
  sed 's/"//g' |
  base64 -d | \
  hexdump -e '16/1 "%02x"'
```

This result can then be encoded with a util function from polkadot/util.

```ts
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');

const hexAddr = '0xe12ec5af5ee2d2d334af5f50407d7a7a3165488c94f6b4e8aecb66f28567349a'; // result with prepended 0x
const address = encodeAddress(hexToU8a(hexAddr));
console.log('address: ', address);
```

## License

Nest is [MIT licensed](LICENSE).
