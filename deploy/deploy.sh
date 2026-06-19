#!/bin/bash
# Deployment script for TheSource chat dashboard

# Exit on any error
set -e

# Install dependencies
npm ci

# Build static assets (if any)
# Assuming a simple copy for static HTML/CSS/JS
mkdir -p dist
cp -R src/* dist/
cp -R public/* dist/

# Run any database migrations (placeholder)
# npm run migrate

# Start the server (using a simple static server)
# You can replace this with your preferred production server (e.g., pm2, nginx)
# npx serve -s dist -l 8080 &

# Log deployment success
echo "Deployment completed successfully at $(date)"
