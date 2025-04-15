/**
 * Rename Logger Script
 * Records directory and file renames to JSON files for later reference
 */

const fs = require('fs');
const path = require('path');

// Configuration 
const DIR_RENAME_LOG = 'directory-renames.json';
const STYLE_RENAME_LOG = 'style-renames.json';

/**
 * Logger class to record and save rename operations
 */
class RenameLogger {
  constructor() {
    this.directoryRenames = this.loadExistingLog(DIR_RENAME_LOG);
    this.styleRenames = this.loadExistingLog(STYLE_RENAME_LOG);
  }
  
  /**
   * Load existing log file if it exists
   */
  loadExistingLog(logFile) {
    try {
      if (fs.existsSync(logFile)) {
        const data = fs.readFileSync(logFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error loading ${logFile}:`, error);
    }
    return [];
  }
  
  /**
   * Log a directory rename operation
   */
  logDirectoryRename(oldPath, newPath) {
    const renameEntry = {
      oldPath: this.normalizePath(oldPath),
      newPath: this.normalizePath(newPath),
      timestamp: new Date().toISOString()
    };
    
    // Check for duplicates
    if (!this.directoryRenames.some(entry => 
      entry.oldPath === renameEntry.oldPath && 
      entry.newPath === renameEntry.newPath)) {
      this.directoryRenames.push(renameEntry);
      this.saveDirectoryRenames();
      return true;
    }
    return false;
  }
  
  /**
   * Log a style file rename operation
   */
  logStyleRename(oldPath, newPath) {
    const renameEntry = {
      oldPath: this.normalizePath(oldPath),
      newPath: this.normalizePath(newPath),
      timestamp: new Date().toISOString()
    };
    
    // Check for duplicates
    if (!this.styleRenames.some(entry => 
      entry.oldPath === renameEntry.oldPath && 
      entry.newPath === renameEntry.newPath)) {
      this.styleRenames.push(renameEntry);
      this.saveStyleRenames();
      return true;
    }
    return false;
  }
  
  /**
   * Normalize path to forward slashes for consistency
   */
  normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
  }
  
  /**
   * Save directory renames to JSON file
   */
  saveDirectoryRenames() {
    fs.writeFileSync(
      DIR_RENAME_LOG, 
      JSON.stringify(this.directoryRenames, null, 2)
    );
    return this.directoryRenames.length;
  }
  
  /**
   * Save style renames to JSON file
   */
  saveStyleRenames() {
    fs.writeFileSync(
      STYLE_RENAME_LOG, 
      JSON.stringify(this.styleRenames, null, 2)
    );
    return this.styleRenames.length;
  }
  
  /**
   * Get all directory renames
   */
  getDirectoryRenames() {
    return this.directoryRenames;
  }
  
  /**
   * Get all style renames
   */
  getStyleRenames() {
    return this.styleRenames;
  }
  
  /**
   * Clear all logs
   */
  clearLogs() {
    this.directoryRenames = [];
    this.styleRenames = [];
    this.saveDirectoryRenames();
    this.saveStyleRenames();
  }
}

// Export the logger for use in other scripts
module.exports = new RenameLogger(); 