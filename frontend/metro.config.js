// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

// Get project root (parent directory of frontend)
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

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

// Custom resolver to handle convex imports from workspace root
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  // Handle convex imports that go outside the project root
  if (realModuleName && realModuleName.includes('convex/_generated')) {
    // Try to resolve from workspace root
    const convexPath = path.resolve(workspaceRoot, 'convex/_generated/api');
    try {
      const resolved = require.resolve(convexPath);
      return {
        type: 'sourceFile',
        filePath: resolved,
      };
    } catch (e) {
      // Fall through to default resolver
    }
  }
  // Use default resolver for everything else
  if (defaultResolver) {
    return defaultResolver(context, realModuleName, platform, moduleName);
  }
  return context.resolveRequest(context, realModuleName, platform);
};

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
