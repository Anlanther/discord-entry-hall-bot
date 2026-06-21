FROM node:24-bookworm

# Install Zsh, Git, curl, and zsh-syntax-highlighting
RUN apt-get update && apt-get install -y \
    zsh \
    git \
    curl \
    zsh-syntax-highlighting \
    && apt-get clean

# Add Zsh to valid login shells and set as default for 'node' user
RUN echo /usr/bin/zsh >> /etc/shells
RUN chsh -s /usr/bin/zsh node

# Install TypeScript and ts-node globally (optional but helpful)
RUN npm install -g typescript ts-node

# Set working directory
WORKDIR /workspace

# Keep the container running
CMD ["zsh"]
