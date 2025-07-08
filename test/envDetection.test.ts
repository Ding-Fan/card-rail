import { describe, it, expect } from 'vitest';

describe('Environment Detection Test', () => {
    it('should identify the current environment', () => {
        console.log('typeof window:', typeof window);
        console.log('typeof process:', typeof process);
        console.log('typeof global:', typeof global);
        console.log('process.env.NODE_ENV:', process?.env?.NODE_ENV);
        console.log('process.env.VITEST:', process?.env?.VITEST);
        console.log('globalThis:', Object.keys(globalThis));

        if (typeof process !== 'undefined' && process.env?.VITEST) {
            console.log('✅ Running in Vitest environment');
        } else if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
            console.log('✅ Running in browser environment');
        } else if (typeof process !== 'undefined' && process.versions?.node) {
            console.log('✅ Running in Node.js environment');
        } else {
            console.log('❓ Unknown environment');
        }
    });
});
