# Dockerfile (replace your existing one)
FROM heroiclabs/nakama:3.21.1

# Copy Nakama data folder into image (local.yml + modules)
COPY ./data /nakama/data

# Create an inline start script inside the image so we don't rely on an external file
RUN printf '%s\n' \
  '#!/bin/sh' \
  'echo "---- ENV: dumping DATABASE_ADDRESS (password redacted for logs) ----"' \
  'if [ -n "$DATABASE_ADDRESS" ]; then' \
  '  echo "$DATABASE_ADDRESS" | sed -E "s#(postgres://[^:]+:)[^@]+(@.*)#\\\\1***REDACTED***\\\\2#"' \
  'else' \
  '  echo "DATABASE_ADDRESS is EMPTY"' \
  'fi' \
  'echo "---- now attempting migrations and server start ----"' \
  '/nakama/nakama migrate up --database.address "$DATABASE_ADDRESS" && exec /nakama/nakama --config /nakama/data/local.yml --database.address "$DATABASE_ADDRESS"' \
  > /start.sh && chmod +x /start.sh

EXPOSE 7349 7350 7351

CMD ["/bin/sh","-ecx","/start.sh"]
