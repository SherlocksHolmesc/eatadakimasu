// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Get project root (parent directory of frontend)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Watch the parent directory so we can access convex folder
config.watchFolders = [workspaceRoot];

// Allow Metro to resolve modules from the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
