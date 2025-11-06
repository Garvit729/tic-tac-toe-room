# Use official Nakama image
FROM heroiclabs/nakama:3.21.1

# Copy your Nakama data folder (local.yml + modules)
COPY ./data /nakama/data

# Expose Nakama ports
EXPOSE 7349 7350 7351

# # Run migrations and start Nakama
# CMD ["/bin/sh","-ecx","/nakama/nakama migrate up --database.address \"$DATABASE_ADDRESS\" && exec /nakama/nakama --config /nakama/data/local.yml --database.address \"$DATABASE_ADDRESS\""]

# copy start script and make executable
COPY ./start.sh /start.sh
RUN chmod +x /start.sh

# use start script as entrypoint
CMD ["/bin/sh","-ecx","/start.sh"]
