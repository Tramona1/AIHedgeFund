// Test module resolution for @repo packages

console.log('Testing module resolution for @repo packages...');

try {
  const logger = require('@repo/logger');
  console.log('Successfully imported @repo/logger');
  console.log('Logger:', logger);
} catch (error) {
  console.error('Error importing @repo/logger:', error.message);
}

try {
  const db = require('@repo/db');
  console.log('Successfully imported @repo/db');
  console.log('DB:', db);
} catch (error) {
  console.error('Error importing @repo/db:', error.message);
}

try {
  const id = require('@repo/id');
  console.log('Successfully imported @repo/id');
  console.log('ID:', id);
} catch (error) {
  console.error('Error importing @repo/id:', error.message);
}

console.log('Module resolution test completed.'); 