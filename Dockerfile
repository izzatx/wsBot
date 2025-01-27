# Use a lightweight Node.js base image
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port your app listens on
EXPOSE 8080

# Run the application using ts-node
CMD ["npx", "ts-node", "src/index.ts"]
