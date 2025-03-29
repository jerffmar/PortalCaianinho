# Base image for Node.js
FROM alpine:3.18
# Install supervisord
RUN apk add --no-cache supervisorctl
RUN apk add --no-cache nodejs npm
RUN apk add --no-cache supervisord
RUN apk add --no-cache curl

