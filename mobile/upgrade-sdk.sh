#!/bin/bash

echo "🚀 Upgrading Expo project to SDK 54..."

# Clean existing installation
echo "🧹 Cleaning existing installation..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Expo CLI if not present
echo "🔧 Installing Expo CLI..."
npm install -g @expo/cli

# Fix any dependency issues
echo "🔧 Fixing dependencies..."
npx expo install --fix

echo "✅ Upgrade complete!"
echo "🎯 Now run: npx expo start"


