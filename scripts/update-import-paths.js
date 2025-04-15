/**
 * Import paths update script
 * This script updates import paths in code after directory and file renaming
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run'); // Don't actually rename, just show what would be done
const VERBOSE = process.argv.includes('--verbose'); // Show more details
const BATCH_SIZE = process.argv.includes('--batch') ? 
  parseInt(process.argv[process.argv.indexOf('--batch') + 1]) : Infinity;

// Store all renames that have happened
const dirRenames = [];
const styleRenames = [];
const filesToProcess = [];
const processedFiles = new Set();

/**
 * Load rename mapping from log file
 */
function loadRenameMapping() {
  try {
    // First try to load directory renames
    if (fs.existsSync('directory-renames.json')) {
      const dirData = fs.readFileSync('directory-renames.json', 'utf8');
      const dirMappings = JSON.parse(dirData);
      dirRenames.push(...dirMappings);
      console.log(`Loaded ${dirMappings.length} directory renames from mapping file.`);
    }
    
    // Then try to load style file renames
    if (fs.existsSync('style-renames.json')) {
      const styleData = fs.readFileSync('style-renames.json', 'utf8');
      const styleMappings = JSON.parse(styleData);
      styleRenames.push(...styleMappings);
      console.log(`Loaded ${styleMappings.length} style file renames from mapping file.`);
    }
  } catch (error) {
    console.error('Error loading rename mappings:', error);
  }
}

/**
 * Generate rename mapping manually
 */
function generateRenameMapping() {
  console.log('No rename mapping files found. Generating mappings manually...');
  
  // Manually generate rename mappings
  // Example directory renames
  const manualDirRenames = [
    { oldPath: 'app/auth/login/components/LoginForm', newPath: 'app/auth/login/components/login-form' },
    { oldPath: 'app/auth/login/components/SocialLogin', newPath: 'app/auth/login/components/social-login' },
    // Add more from the naming-check.js output as needed
  ];
  
  dirRenames.push(...manualDirRenames);
  
  // Example style renames 
  const manualStyleRenames = [
    { oldPath: 'app/file-management/styles/shared.module.css', newPath: 'app/file-management/styles/Shared.module.css' },
    { oldPath: 'app/shared/themes/components/fileList.module.css', newPath: 'app/shared/themes/components/FileList.module.css' },
    // Add more from the naming-check.js output as needed
  ];
  
  styleRenames.push(...manualStyleRenames);
  
  console.log(`Generated ${manualDirRenames.length} directory renames and ${manualStyleRenames.length} style file renames.`);
  
  // Save to files for future use
  fs.writeFileSync('directory-renames.json', JSON.stringify(dirRenames, null, 2));
  fs.writeFileSync('style-renames.json', JSON.stringify(styleRenames, null, 2));
}

/**
 * Find code files to process
 */
async function findFilesToProcess(directory) {
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
        await findFilesToProcess(fullPath);
      } else if (stats.isFile()) {
        // Check if it's a code file to process
        if (/\.(ts|tsx|js|jsx)$/.test(entry) && 
            !entry.endsWith('.d.ts') &&
            !entry.includes('.min.')) {
          filesToProcess.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }
}

/**
 * Update import paths in a file
 */
async function updateImportsInFile(filePath) {
  // Skip if already processed
  if (processedFiles.has(filePath)) {
    return { filePath, updated: false, reason: 'already-processed' };
  }
  
  try {
    let content = await readFile(filePath, 'utf8');
    let originalContent = content;
    let updated = false;
    
    // Replace directory paths in imports (longest paths first to avoid partial matches)
    const sortedDirRenames = [...dirRenames].sort((a, b) => b.oldPath.length - a.oldPath.length);
    
    for (const rename of sortedDirRenames) {
      const oldPathPattern = rename.oldPath.replace(/\//g, '[/\\\\]');
      const escapedOldPath = oldPathPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const newPathReplacement = rename.newPath.replace(/\//g, path.sep);
      
      // Match imports and requires with the oldPath
      const importRegex = new RegExp(`(from\\s+['"])${escapedOldPath}(['\\/])`, 'g');
      const requireRegex = new RegExp(`(require\\(['"])${escapedOldPath}(['\\/])`, 'g');
      
      // Replace in the content
      const newContent = content
        .replace(importRegex, `$1${newPathReplacement}$2`)
        .replace(requireRegex, `$1${newPathReplacement}$2`);
      
      if (newContent !== content) {
        content = newContent;
        updated = true;
      }
    }
    
    // Replace style paths in imports
    for (const rename of styleRenames) {
      const oldFileName = path.basename(rename.oldPath);
      const newFileName = path.basename(rename.newPath);
      const oldDirName = path.dirname(rename.oldPath);
      const newDirName = path.dirname(rename.newPath);
      
      // Match imports with the old file name
      const importRegex = new RegExp(`(from\\s+['"])${oldDirName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[/\\\\]${oldFileName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}(['"])`, 'g');
      
      // Replace in the content
      const newContent = content.replace(importRegex, `$1${newDirName}${path.sep}${newFileName}$2`);
      
      if (newContent !== content) {
        content = newContent;
        updated = true;
      }
    }
    
    // Write the file if it was updated and not in dry run mode
    if (updated && !DRY_RUN) {
      await writeFile(filePath, content, 'utf8');
      processedFiles.add(filePath);
      return { filePath, updated: true, changes: originalContent !== content };
    }
    
    processedFiles.add(filePath);
    return { filePath, updated: false, changes: originalContent !== content };
    
  } catch (error) {
    return { filePath, error: error.message, updated: false };
  }
}

/**
 * Process files in batches
 */
async function processBatchedFiles() {
  console.log(`Found ${filesToProcess.length} files to check for import updates.`);
  
  if (DRY_RUN) {
    console.log('DRY RUN MODE: No changes will be made.');
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  
  const batchCount = Math.ceil(filesToProcess.length / BATCH_SIZE);
  
  for (let batch = 0; batch < batchCount; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, filesToProcess.length);
    
    if (batchCount > 1) {
      console.log(`\nProcessing batch ${batch + 1}/${batchCount} (${start + 1}-${end} of ${filesToProcess.length}):`);
    }
    
    const batchFiles = filesToProcess.slice(start, end);
    const results = await Promise.all(batchFiles.map(file => updateImportsInFile(file)));
    
    for (const result of results) {
      if (result.error) {
        console.error(`  Error processing ${result.filePath}: ${result.error}`);
        errorCount++;
      } else if (result.changes) {
        console.log(`  Updated imports in: ${result.filePath}`);
        updatedCount++;
      } else if (VERBOSE) {
        console.log(`  No changes needed in: ${result.filePath}`);
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
  
  return { updatedCount, errorCount };
}

/**
 * Main function
 */
async function main() {
  console.log('Starting import path update process...');
  
  // First, load or generate rename mappings
  if (fs.existsSync('directory-renames.json') || fs.existsSync('style-renames.json')) {
    loadRenameMapping();
  } else {
    generateRenameMapping();
  }
  
  // Check if we have any rename mappings
  if (dirRenames.length === 0 && styleRenames.length === 0) {
    console.log('No rename mappings found. Please verify rename mapping files or edit the script.');
    return;
  }
  
  // Find files to process
  await findFilesToProcess('app');
  await findFilesToProcess('scripts');
  
  // Process the files
  const { updatedCount, errorCount } = await processBatchedFiles();
  
  console.log('\nUpdate complete:');
  console.log(`- ${updatedCount} files updated`);
  console.log(`- ${errorCount} files had errors`);
  console.log(`- ${filesToProcess.length - updatedCount - errorCount} files unchanged`);
  
  if (DRY_RUN) {
    console.log('\nThis was a dry run. No actual changes were made.');
    console.log('Run without --dry-run to apply the changes.');
  }
}

// Run script
main().catch(error => {
  console.error('Error running script:', error);
  process.exit(1);
}); 