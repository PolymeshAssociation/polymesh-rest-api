FROM node:lts-alpine3.17 AS builder

RUN apk add --no-cache \
    python3 \
    make \
    cmake \
    g++ \
    jq

WORKDIR /app/builder
RUN chown -R node: /app
RUN corepack enable

USER node

COPY --chown=node:node . .

ENV YARN_ENABLE_SCRIPTS=false

RUN yarn install \
    --immutable \
    --inline-builds \
    --mode=skip-build && \
    yarn build && \
    yarn remove $(cat package.json | jq -r '.devDependencies | keys | join(" ")') && \
    rm -r /home/node/.cache/

FROM node:lts-alpine3.17
WORKDIR /home/node
ENV NODE_ENV production

COPY --from=builder --chown=node:node /app/builder/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/builder/dist/ ./dist

COPY --chown=node:node . /home/node

USER node
CMD [ "node", "dist/main.js" ]
