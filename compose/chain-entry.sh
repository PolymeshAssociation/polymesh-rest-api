#!/bin/bash

/usr/local/bin/polymesh \
-d /var/lib/polymesh \
--unsafe-rpc-external --wasm-execution=compiled \
--no-prometheus --no-telemetry --pruning=archive --no-mdns \
--validator --rpc-cors=all --rpc-methods=unsafe --force-authoring \
--node-key 0000000000000000000000000000000000000000000000000000000000000001 \
--port 30333 $1
