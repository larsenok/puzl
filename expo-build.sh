rm -rf android ios
rm -rf node_modules
rm package-lock.json
npm install
npx expo install expo
npm install @expo/cli
npx expo prebuild --platform android
eas build -p android
