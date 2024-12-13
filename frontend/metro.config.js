// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Remove all exclusions from the blockList
config.resolver.blockList = [];

// Add any specific file extensions you want Metro to handle
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx'];

// Enable symlinks
config.resolver.enableSymlinks = true;

module.exports = config;
