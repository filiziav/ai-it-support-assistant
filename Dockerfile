# Dockerfile for AI IT Support Assistant
# Optimized for AWS App Runner, ECS, or Elastic Beanstalk

FROM node:20-alpine AS base

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Expose port (default 3000)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "server.js"]
