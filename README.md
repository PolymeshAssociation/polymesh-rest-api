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
RELAYER_DIDS=## list of comma separated DIDs for the relayer service ##
RELAYER_MNEMONICS=## list of comma separated mnemonics for the relayer service (each mnemonic corresponds to a DID in RELAYER_DIDS) ##
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

## License

Nest is [MIT licensed](LICENSE).
