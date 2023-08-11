FROM node:lts-alpine3.17 AS builder

RUN apk add --no-cache \
  python3 \
  make \
  cmake \
  g++ \
  jq

WORKDIR /app/builder
RUN chown -R node: /app

USER node

COPY --chown=node:node . .

RUN yarn install \
  --frozen-lockfile \
  --no-progress && \
  yarn build && \
  yarn remove $(cat package.json | jq -r '.devDependencies | keys | join(" ")') && \
  rm -r /home/node/.cache/

FROM node:lts-alpine3.17
WORKDIR /home/node

COPY --from=builder --chown=root:root /app/builder/node_modules ./node_modules
COPY --from=builder --chown=root:root /app/builder/dist/ ./dist

COPY --chown=node:node . /home/node

USER node
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
