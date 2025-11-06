#!/bin/sh
echo "---- ENV: dumping DATABASE_ADDRESS (password redacted for logs) ----"
# show beginning and end of the URL but hide the password in between
if [ -n "$DATABASE_ADDRESS" ]; then
  echo "$DATABASE_ADDRESS" | sed -E 's#(postgres://[^:]+:)[^@]+(@.*)#\1***REDACTED***\2#'
else
  echo "DATABASE_ADDRESS is EMPTY"
fi
echo "---- now attempting migrations and server start ----"

# Run migrations then start Nakama (same as before)
/nakama/nakama migrate up --database.address "$DATABASE_ADDRESS" && exec /nakama/nakama --config /nakama/data/local.yml --database.address "$DATABASE_ADDRESS"
