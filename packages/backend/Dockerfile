# Use Bun's official image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Expose the WebSocket port
EXPOSE 3001

# Run the application
CMD ["bun", "run", "index.ts"]
