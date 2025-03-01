# Use Ubuntu as the base image
FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update -y && apt-get install -y \
    openjdk-11-jdk \
    python3-pip \
    wget \
    curl \
    nodejs \
    npm



# Expose necessary ports (adjust as needed)
EXPOSE 8080 5000 3000

# Start the backend service (adjust the command if needed)
CMD ["bash"]
