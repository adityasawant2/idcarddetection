@echo off
echo 🚀 Upgrading Expo project to SDK 54...

echo 🧹 Cleaning existing installation...
rmdir /s /q node_modules
del package-lock.json
del yarn.lock

echo 📦 Installing dependencies...
npm install

echo 🔧 Installing Expo CLI...
npm install -g @expo/cli

echo 🔧 Fixing dependencies...
npx expo install --fix

echo ✅ Upgrade complete!
echo 🎯 Now run: npx expo start
pause


