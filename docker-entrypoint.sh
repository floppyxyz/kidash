#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting kidash..."
exec node server.js
