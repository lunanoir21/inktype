#!/bin/sh
set -e
# Create or upgrade the SQLite database, then start the server.
prisma migrate deploy --schema ./prisma/schema.prisma
exec node apps/web/server.js
