FROM heroiclabs/nakama:3.21.1

COPY ./data /nakama/data

# create start script inside image so we don't rely on an external file
# create start script inside image so we don't rely on an external file
RUN printf '%s\n' \
  '#!/bin/sh' \
  'echo "---- ENV: dumping DATABASE_ADDRESS (password redacted for logs) ----"' \
  '# Clean DATABASE_ADDRESS by removing CR and LF characters and trimming spaces' \
  'CLEAN_DB=$(printf "%s" "$DATABASE_ADDRESS" | tr -d "\r\n" | sed -E "s/^[[:space:]]+|[[:space:]]+$//g")' \
  'if [ -n "$CLEAN_DB" ]; then' \
  '  echo "$CLEAN_DB" | sed -E "s#(postgres://[^:]+:)[^@]+(@.*)#\\\\1***REDACTED***\\\\2#"' \
  'else' \
  '  echo "DATABASE_ADDRESS is EMPTY after trimming"' \
  'fi' \
  'echo "---- now attempting migrations and server start ----"' \
  '/nakama/nakama migrate up --database.address "$CLEAN_DB" && exec /nakama/nakama --config /nakama/data/local.yml --database.address "$CLEAN_DB"' \
  > /start.sh && chmod +x /start.sh


EXPOSE 7349 7350 7351

ENTRYPOINT ["/bin/sh","-ecx","/start.sh"]
