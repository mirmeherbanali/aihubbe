# Use a lightweight Node.js base image (e.g., Alpine Linux for smaller image size)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
# Use COPY --chown=node:node for better security practices
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your Node.js application listens on
EXPOSE 3000

# Define the command to run your application when the container starts
CMD ["node", "server.js"]