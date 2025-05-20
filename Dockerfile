FROM node:18-slim

# Install required packages with proper repository setup
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    unzip \
    gnupg \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Add AdoptOpenJDK repository
RUN wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add - && \
    echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list

# Install OpenJDK 11
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    temurin-11-jdk \
    && rm -rf /var/lib/apt/lists/*

# Install Android SDK
ENV ANDROID_SDK_ROOT=/opt/android-sdk
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip *tools*linux*.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools && \
    mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest && \
    rm *tools*linux*.zip

# Set environment variables
ENV PATH=${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools
ENV JAVA_HOME=/usr/lib/jvm/temurin-11-jdk-amd64

# Accept licenses and install required SDK packages
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"] 
