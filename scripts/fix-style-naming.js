/**
 * Style file naming fix script
 * This script fixes CSS module files with incorrect naming convention
 * It renames style files to match component names using PascalCase
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const renameLogger = require('./rename-logger');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run'); // Don't actually rename, just show what would be done
const BATCH_SIZE = process.argv.includes('--batch') ? 
  parseInt(process.argv[process.argv.indexOf('--batch') + 1]) : Infinity;
const FIX_COMPONENT_MATCH = !process.argv.includes('--no-match-fix');

// Store files to rename
const filesToRename = [];
const mismatchedStyles = [];

/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
  // Remove extension and .module
  const baseName = str.replace(/\.module\.(css|scss)$/, '');
  
  // Convert to PascalCase
  const pascalCase = baseName
    .replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^([a-z])/, (_, c) => c.toUpperCase());
  
  // Get original extension
  const ext = str.match(/\.module\.(css|scss)$/)[0];
  
  return pascalCase + ext;
}

/**
 * Check if a file name follows PascalCase for module styles
 */
function isPascalCaseStyle(name) {
  return /^[A-Z][a-zA-Z0-9]*\.module\.(css|scss)$/.test(name);
}

/**
 * Find style files to rename
 */
async function findStylesToRename(directory) {
  try {
    const entries = await readdir(directory);
    
    for (const entry of entries) {
      // Skip dot files/directories
      if (entry.startsWith('.') && entry !== '.env') {
        continue;
      }
      
      const fullPath = path.join(directory, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (['node_modules', '.git', '.next', 'dist', '.vscode'].includes(entry)) {
          continue;
        }
        
        // Recursively scan subdirectory
        await findStylesToRename(fullPath);
      } else if (stats.isFile() && /\.module\.(css|scss)$/.test(entry)) {
        // Found a style module file
        
        // 1. Check if file name uses PascalCase
        if (!isPascalCaseStyle(entry)) {
          const newName = toPascalCase(entry);
          filesToRename.push({
            path: fullPath,
            newPath: path.join(directory, newName),
            oldName: entry,
            newName: newName,
            type: 'style-case'
          });
        }
        
        // 2. Check if style file matches a component file
        if (FIX_COMPONENT_MATCH) {
          const styleBaseName = entry.replace(/\.module\.(css|scss)$/, '');
          const dirFiles = fs.readdirSync(directory);
          const componentFiles = dirFiles.filter(f => /\.(tsx|jsx)$/.test(f) && !f.includes('index.'));
          
          // Skip Next.js special page components
          const nextJsSpecialFiles = ['page.tsx', 'layout.tsx', 'error.tsx', 'loading.tsx', 'not-found.tsx', 'providers.tsx', 'route.js'];
          if (nextJsSpecialFiles.includes(componentFiles[0])) {
            continue;
          }
          
          // Check if we have component files but none match the style name
          if (componentFiles.length > 0) {
            let hasMatch = false;
            
            for (const compFile of componentFiles) {
              const compBaseName = compFile.replace(/\.(tsx|jsx)$/, '');
              if (styleBaseName === compBaseName) {
                hasMatch = true;
                break;
              }
            }
            
            if (!hasMatch) {
              // Style doesn't match any component, use the first component name as target
              const targetComponent = componentFiles[0];
              const targetBaseName = targetComponent.replace(/\.(tsx|jsx)$/, '');
              const newName = `${targetBaseName}.module.${entry.split('.').pop()}`;
              
              mismatchedStyles.push({
                path: fullPath,
                newPath: path.join(directory, newName),
                oldName: entry,
                newName: newName,
                component: targetComponent,
                type: 'style-mismatch'
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }
}

/**
 * Rename files
 */
async function renameFiles(files, title) {
  console.log(`\n${title} (${files.length} files):`);
  
  if (files.length === 0) {
    console.log('  No files to rename.');
    return;
  }
  
  if (DRY_RUN) {
    console.log('  DRY RUN MODE: No changes will be made.');
  }
  
  const batchCount = Math.ceil(files.length / BATCH_SIZE);
  
  for (let batch = 0; batch < batchCount; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, files.length);
    
    if (batchCount > 1) {
      console.log(`\n  Processing batch ${batch + 1}/${batchCount} (${start + 1}-${end} of ${files.length}):`);
    }
    
    for (let i = start; i < end; i++) {
      const file = files[i];
      console.log(`  ${i + 1}. ${file.path} → ${file.newPath}`);
      
      if (file.type === 'style-mismatch') {
        console.log(`     (Matching with component: ${file.component})`);
      }
      
      if (!DRY_RUN) {
        try {
          await rename(file.path, file.newPath);
          // Log the rename for future reference
          renameLogger.logStyleRename(file.path, file.newPath);
          console.log(`     Renamed successfully.`);
        } catch (error) {
          console.error(`     Error renaming: ${error.message}`);
        }
      }
    }
    
    if (batchCount > 1 && batch < batchCount - 1) {
      console.log('\n  Next batch? Press Ctrl+C to exit or Enter to continue...');
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
    }
  }
}

/**
 * Main function
 */
async function main() {
  const dirsToCheck = ['app'];
  
  console.log('Scanning directories for style naming issues...');
  
  for (const dir of dirsToCheck) {
    await findStylesToRename(dir);
  }
  
  // Rename style files with incorrect case
  await renameFiles(filesToRename, 'Style files with incorrect case');
  
  // Rename mismatched style files
  await renameFiles(mismatchedStyles, 'Style files that don\'t match component names');
  
  if (!DRY_RUN && (filesToRename.length > 0 || mismatchedStyles.length > 0)) {
    console.log('\nStyle file renaming complete. You may now need to:');
    console.log('1. Update import statements in your code');
    console.log('2. Run the import fix script to update references');
    console.log(`\nStyle file renames have been logged to style-renames.json`);
  }
}

// Run script
main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
}); 