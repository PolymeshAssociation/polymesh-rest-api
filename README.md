## Description

REST API that communicates with the Polymesh blockchain

## Setup

### Requirements

- node.js version 12.x
- yarn version 1.x

### Installing Dependencies

```bash
$ yarn
```

### Environment Variables

```bash
PORT=## port in which the server will listen ##
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
