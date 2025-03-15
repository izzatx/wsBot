# Use a larger base image to ensure all dependencies are available
FROM node:18-bullseye

# Set the working directory
WORKDIR /app

# Install dependencies for Selenium and Chrome
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    wget \
    xvfb \
    jq \
    libxi6 \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libappindicator3-1 \
    libgtk-3-0 \
    libasound2 \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libpango-1.0-0 \
    libudev1 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium (works for both ARM and x86)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Manually specify ChromeDriver version (Latest stable)
ENV CHROMEDRIVER_VERSION=122.0.6261.94

# Download and install ChromeDriver
RUN wget -N https://storage.googleapis.com/chrome-for-testing-public/$CHROMEDRIVER_VERSION/linux64/chromedriver-linux64.zip -P /tmp/ \
    && unzip /tmp/chromedriver-linux64.zip -d /tmp/ \
    && mv /tmp/chromedriver-linux64/chromedriver /usr/local/bin/chromedriver \
    && rm -rf /tmp/chromedriver-linux64 /tmp/chromedriver-linux64.zip \
    && chmod +x /usr/local/bin/chromedriver

# Ensure the tokens folder exists for Venom-Bot sessions
RUN mkdir -p /app/tokens && chmod -R 777 /app/tokens


# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the application port
EXPOSE 8080

# Run the application
CMD ["npm", "start"]
