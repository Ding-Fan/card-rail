#!/usr/bin/env node

/**
 * Test runner for CardRail Sync functionality
 * 
 * This script runs different test suites for the sync feature:
 * - Unit tests for passphrase and sync service
 * - Integration tests for the settings page
 * - E2E tests for the complete sync flow
 * - Database schema validation tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTests(testFile, description) {
    log(`\n🧪 Running ${description}...`, 'cyan');
    try {
        execSync(`npx vitest run ${testFile}`, { stdio: 'inherit' });
        log(`✅ ${description} passed!`, 'green');
        return true;
    } catch (error) {
        log(`❌ ${description} failed!`, 'red');
        return false;
    }
}

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        log(`✅ ${description} exists`, 'green');
        return true;
    } else {
        log(`❌ ${description} missing`, 'red');
        return false;
    }
}

function checkEnvVars() {
    log('\n🔍 Checking environment configuration...', 'yellow');

    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        log('❌ .env.local file not found', 'red');
        return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
    const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (hasSupabaseUrl && hasSupabaseKey) {
        log('✅ Supabase configuration found', 'green');
        return true;
    } else {
        log('❌ Supabase configuration incomplete', 'red');
        log('   Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local', 'yellow');
        return false;
    }
}

function checkDatabaseSetup() {
    log('\n🗄️  Checking database setup files...', 'yellow');

    const schemaFile = path.join(process.cwd(), 'supabase-schema-simple.sql');
    const setupGuide = path.join(process.cwd(), 'SUPABASE_SETUP.md');

    let allFilesExist = true;
    allFilesExist &= checkFile(schemaFile, 'Database schema SQL file');
    allFilesExist &= checkFile(setupGuide, 'Setup guide');

    if (!allFilesExist) {
        log('\n📋 To set up the database:', 'yellow');
        log('1. Run the SQL script from supabase-schema-simple.sql in your Supabase dashboard', 'yellow');
        log('2. See SUPABASE_SETUP.md for detailed instructions', 'yellow');
    }

    return allFilesExist;
}

function main() {
    log('🚀 CardRail Sync Test Suite', 'bright');
    log('='.repeat(50), 'blue');

    // Check prerequisites
    const envConfigured = checkEnvVars();
    const dbFilesExist = checkDatabaseSetup();

    // Run test suites
    const testResults = [];

    // Unit tests
    testResults.push(runTests('test/syncService.test.ts', 'Sync Service Unit Tests'));

    // Integration tests
    testResults.push(runTests('test/settings.enableSync.test.tsx', 'Settings Page Integration Tests'));

    // E2E tests
    testResults.push(runTests('test/enableSync.e2e.test.tsx', 'Enable Sync E2E Tests'));

    // Database tests (only if Supabase is configured)
    if (envConfigured && dbFilesExist) {
        testResults.push(runTests('test/database.test.ts', 'Database Schema Tests'));
    } else {
        log('\n⚠️  Skipping database tests - Supabase not configured', 'yellow');
        testResults.push(false);
    }

    // Summary
    log('\n📊 Test Results Summary', 'bright');
    log('='.repeat(50), 'blue');

    const totalTests = testResults.length;
    const passedTests = testResults.filter(Boolean).length;
    const failedTests = totalTests - passedTests;

    if (failedTests === 0) {
        log(`🎉 All tests passed! (${passedTests}/${totalTests})`, 'green');
    } else {
        log(`⚠️  ${failedTests} test suite(s) failed, ${passedTests} passed`, 'yellow');
    }

    if (!envConfigured || !dbFilesExist) {
        log('\n💡 Setup Tips:', 'cyan');
        log('• Configure Supabase credentials in .env.local', 'cyan');
        log('• Run the database schema script in your Supabase dashboard', 'cyan');
        log('• See SUPABASE_SETUP.md for complete setup instructions', 'cyan');
    }

    log('\n🔧 Available Test Commands:', 'magenta');
    log('• npm run test:sync - Run all sync tests', 'magenta');
    log('• npm run test:sync:unit - Run unit tests only', 'magenta');
    log('• npm run test:sync:integration - Run integration tests only', 'magenta');
    log('• npm run test:sync:e2e - Run E2E tests only', 'magenta');
    log('• npm run test:sync:db - Run database tests only', 'magenta');

    process.exit(failedTests === 0 ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { main };
