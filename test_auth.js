// Test file to debug authenticateToken import
const { authenticateToken } = require('./src/middlewares/auth');

console.log('authenticateToken type:', typeof authenticateToken);
console.log('authenticateToken is function?:', typeof authenticateToken === 'function');
console.log('authenticateToken:', authenticateToken);
