/**
 * Directory naming fix script
 * This script fixes directories with incorrect naming convention
 * It renames directories from non-kebab-case to kebab-case
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

// Store directories to rename
const dirsToRename = [];

/**
 * Convert string to kebab case
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Check if a directory name follows kebab-case
 */
function isKebabCase(name) {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/**
 * Find directories to rename
 */
async function findDirectoriesToRename(directory, depth = 0) {
  try {
    const entries = await readdir(directory);
    
    // Process deeper directories first (to avoid path changes during renames)
    const subdirectories = [];
    
    for (const entry of entries) {
      // Skip dot directories and node_modules, .git, etc.
      if (entry.startsWith('.') || ['node_modules', '.git', '.next', 'dist', '.vscode'].includes(entry)) {
        continue;
      }
      
      const fullPath = path.join(directory, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Skip Next.js dynamic route directories (starting with [)
        if (entry.startsWith('[')) {
          continue;
        }
        
        subdirectories.push({ name: entry, path: fullPath });
      }
    }
    
    // Process deeper directories first
    for (const subdir of subdirectories) {
      await findDirectoriesToRename(subdir.path, depth + 1);
      
      // Check if this directory needs to be renamed
      if (!isKebabCase(subdir.name)) {
        const newName = toKebabCase(subdir.name);
        dirsToRename.push({
          path: subdir.path,
          newPath: path.join(directory, newName),
          oldName: subdir.name,
          newName: newName,
          depth: depth
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }
}

/**
 * Rename directories
 */
async function renameDirectories() {
  // Sort by depth (highest depth first)
  dirsToRename.sort((a, b) => b.depth - a.depth);
  
  console.log(`Found ${dirsToRename.length} directories to rename.`);
  
  if (DRY_RUN) {
    console.log('DRY RUN MODE: No changes will be made.');
  }
  
  if (BATCH_SIZE < Infinity) {
    console.log(`Processing in batches of ${BATCH_SIZE} directories.`);
  }
  
  const batchCount = Math.ceil(dirsToRename.length / BATCH_SIZE);
  
  for (let batch = 0; batch < batchCount; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, dirsToRename.length);
    
    if (batchCount > 1) {
      console.log(`\nProcessing batch ${batch + 1}/${batchCount} (${start + 1}-${end} of ${dirsToRename.length}):`);
    }
    
    for (let i = start; i < end; i++) {
      const dir = dirsToRename[i];
      console.log(`${i + 1}. ${dir.path} → ${dir.newPath}`);
      
      if (!DRY_RUN) {
        try {
          await rename(dir.path, dir.newPath);
          // Log the rename for future reference
          renameLogger.logDirectoryRename(dir.path, dir.newPath);
          console.log(`   Renamed successfully`);
        } catch (error) {
          console.error(`   Error renaming: ${error.message}`);
        }
      }
    }
    
    if (batchCount > 1 && batch < batchCount - 1) {
      console.log('\nNext batch? Press Ctrl+C to exit or Enter to continue...');
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
  const dirsToCheck = ['app', 'scripts', 'prisma', 'public'];
  
  console.log('Scanning directories for naming issues...');
  
  for (const dir of dirsToCheck) {
    await findDirectoriesToRename(dir);
  }
  
  await renameDirectories();
  
  if (!DRY_RUN && dirsToRename.length > 0) {
    console.log('\nDirectory renaming complete. You may now need to:');
    console.log('1. Update import statements in your code');
    console.log('2. Run the file naming fix script');
    console.log('3. Update any path references in your code');
    console.log(`\nDirectory renames have been logged to directory-renames.json`);
  }
}

// Run script
main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
}); 