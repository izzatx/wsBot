# Use Puppeteer's official image
FROM ghcr.io/puppeteer/puppeteer:23.6.1

USER root

# Clean up duplicate sources
RUN rm -rf /etc/apt/sources.list.d/google*

# Install necessary dependencies for Puppeteer
RUN apt-get update --allow-insecure-repositories && apt-get install -y \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libgbm1 \
    libgtk-3-0 \
    libxshmfence1 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Add a flag to prevent Puppeteer from downloading Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set the working directory
WORKDIR /app

# Declare a volume for node_modules
VOLUME ["/app/node_modules"]

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port your app listens on
EXPOSE 8080

# Run the application
CMD ["npm", "start"]
