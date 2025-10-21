// Performance optimization script
// Run this to clear cache and optimize the build process

const fs = require('fs');
const path = require('path');

console.log('🚀 Optimizing Daily Priority for better performance...');

// Clear Next.js cache
const nextCacheDir = path.join(__dirname, '.next');
if (fs.existsSync(nextCacheDir)) {
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
  console.log('✅ Cleared .next cache');
}

// Clear Turbopack cache
const turboCacheDir = path.join(__dirname, '.turbo');
if (fs.existsSync(turboCacheDir)) {
  fs.rmSync(turboCacheDir, { recursive: true, force: true });
  console.log('✅ Cleared .turbo cache');
}

// Clear node_modules/.cache
const nodeCacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(nodeCacheDir)) {
  fs.rmSync(nodeCacheDir, { recursive: true, force: true });
  console.log('✅ Cleared node_modules cache');
}

console.log('🎉 Optimization complete! Run npm run dev for faster startup.');