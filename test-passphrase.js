const { generatePassphrase, generateUserId, validatePassphrase } = require('./lib/passphrase.ts');

console.log('Testing BIP39 passphrase generator...');

// Test generating a passphrase
const passphrase = generatePassphrase();
console.log('Generated passphrase:', passphrase);

// Test validation
const isValid = validatePassphrase(passphrase);
console.log('Is valid:', isValid);

// Test user ID generation
const userId = generateUserId(passphrase);
console.log('Generated user ID:', userId);

// Test with a known valid mnemonic
const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const testUserId = generateUserId(testMnemonic);
console.log('Test mnemonic user ID:', testUserId);
console.log('Test mnemonic is valid:', validatePassphrase(testMnemonic));
