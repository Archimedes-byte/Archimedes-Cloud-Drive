/**
 * Help script for naming convention tools
 * Shows usage information for all scripts
 */

const fs = require('fs');
const path = require('path');

// Get script name from command line
const scriptName = process.argv[2];

// Help text for each script
const helpTexts = {
  'naming-check': {
    description: 'Checks for naming convention issues in the project',
    usage: 'node scripts/naming-check.js',
    options: []
  },
  'fix-directory-naming': {
    description: 'Fixes directory names to follow kebab-case convention',
    usage: 'node scripts/fix-directory-naming.js [options]',
    options: [
      { name: '--dry-run', description: 'Show what would be done without making actual changes' },
      { name: '--batch <number>', description: 'Process directories in batches of <number>' }
    ]
  },
  'fix-style-naming': {
    description: 'Fixes style file names to follow PascalCase convention',
    usage: 'node scripts/fix-style-naming.js [options]',
    options: [
      { name: '--dry-run', description: 'Show what would be done without making actual changes' },
      { name: '--batch <number>', description: 'Process files in batches of <number>' },
      { name: '--no-match-fix', description: 'Do not fix style files that do not match component names' }
    ]
  },
  'update-import-paths': {
    description: 'Updates import paths in code after renaming directories and files',
    usage: 'node scripts/update-import-paths.js [options]',
    options: [
      { name: '--dry-run', description: 'Show what would be done without making actual changes' },
      { name: '--verbose', description: 'Show detailed progress information' },
      { name: '--batch <number>', description: 'Process files in batches of <number>' }
    ]
  },
  'fix-all-naming': {
    description: 'Orchestrates all naming fix scripts in the correct order',
    usage: 'node scripts/fix-all-naming.js [options]',
    options: [
      { name: '--dry-run', description: 'Show what would be done without making actual changes' },
      { name: '--batch <number>', description: 'Set batch size for all scripts' }
    ]
  }
};

/**
 * Display help for a specific script
 */
function showScriptHelp(script) {
  const help = helpTexts[script];
  
  if (!help) {
    console.error(`Unknown script: ${script}`);
    showGeneralHelp();
    return;
  }
  
  console.log(`\n${script}.js - ${help.description}\n`);
  console.log('Usage:');
  console.log(`  ${help.usage}\n`);
  
  if (help.options && help.options.length > 0) {
    console.log('Options:');
    help.options.forEach(option => {
      console.log(`  ${option.name.padEnd(20)}${option.description}`);
    });
    console.log('');
  }
  
  console.log('For more information, see scripts/README.md or scripts/使用指南.md\n');
}

/**
 * Display general help
 */
function showGeneralHelp() {
  console.log('\nNaming Convention Fix Tools\n');
  console.log('Available scripts:');
  
  Object.keys(helpTexts).forEach(script => {
    console.log(`  ${script.padEnd(25)}${helpTexts[script].description}`);
  });
  
  console.log('\nTo see help for a specific script:');
  console.log('  node scripts/help.js <script-name>\n');
  
  console.log('Recommended usage:');
  console.log('  1. Run naming-check.js to identify issues');
  console.log('  2. Run fix-all-naming.js to fix all issues in the correct order\n');
  
  console.log('For more information, see scripts/README.md or scripts/使用指南.md\n');
}

// Main
if (scriptName) {
  showScriptHelp(scriptName);
} else {
  showGeneralHelp();
} 