/**
 * Naming Fix Orchestrator
 * This script coordinates all naming fixes in the correct order
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = process.argv.includes('--batch') ? 
  process.argv[process.argv.indexOf('--batch') + 1] : '10';

// Create a readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Execute a script with the given arguments
 */
async function executeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning: node ${scriptPath} ${args.join(' ')}`);
    
    const childProcess = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptPath} exited with code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Ask user for confirmation
 */
async function confirm(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main function to run all scripts in sequence
 */
async function main() {
  try {
    console.log('=== Project Naming Fix Orchestrator ===');
    console.log('This script will fix naming issues in your project in the following steps:');
    console.log('1. Fix directory naming (kebab-case)');
    console.log('2. Fix style file naming (PascalCase)');
    console.log('3. Update import paths in code');
    console.log('\nImportant: Make sure to commit your changes before running this script!');
    
    if (DRY_RUN) {
      console.log('\nRunning in DRY RUN mode - no actual changes will be made.');
    }
    
    const baseArgs = DRY_RUN ? ['--dry-run'] : [];
    if (BATCH_SIZE) {
      baseArgs.push('--batch', BATCH_SIZE);
    }
    
    // Step 1: Fix directory naming
    const runDirFix = await confirm('\nReady to fix directory naming?');
    if (runDirFix) {
      await executeScript('./scripts/fix-directory-naming.js', baseArgs);
      console.log('\n✅ Directory naming fixes complete.');
    } else {
      console.log('\nSkipping directory naming fixes.');
    }
    
    // Step 2: Fix style file naming
    const runStyleFix = await confirm('\nReady to fix style file naming?');
    if (runStyleFix) {
      await executeScript('./scripts/fix-style-naming.js', baseArgs);
      console.log('\n✅ Style file naming fixes complete.');
    } else {
      console.log('\nSkipping style file naming fixes.');
    }
    
    // Step 3: Update import paths
    const runImportFix = await confirm('\nReady to update import paths in code?');
    if (runImportFix) {
      await executeScript('./scripts/update-import-paths.js', [...baseArgs, '--verbose']);
      console.log('\n✅ Import path updates complete.');
    } else {
      console.log('\nSkipping import path updates.');
    }
    
    console.log('\n=== Naming Fix Process Complete ===');
    console.log('\nNext steps:');
    console.log('1. Review the changes made to your codebase');
    console.log('2. Run tests to ensure functionality is preserved');
    console.log('3. Commit the changes to your repository');
    
    rl.close();
  } catch (error) {
    console.error('\n❌ Error during naming fix process:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the main function
main(); 