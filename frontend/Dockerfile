# Dockerfile for Vite+React frontend
# note: this dockerfile has the parent directory as context,
# so COPY commands include "frontend/"

FROM node:20-alpine as build

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
COPY ./.env .
RUN npm install
COPY frontend/ .

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
