const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude expo-sqlite from web bundle (it uses WebAssembly which Metro can't handle)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    // Return empty module for web
    return {
      type: 'empty',
    };
  }
  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

