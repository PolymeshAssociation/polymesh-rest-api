#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    SELECT 'CREATE DATABASE rest'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rest')\gexec
EOSQL