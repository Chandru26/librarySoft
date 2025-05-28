const fs = require('fs').promises;
const path = require('path');

/**
 * Reads the content of an SQL file.
 * @param {string} filePath - The path to the SQL file, relative to the project root.
 * @returns {Promise<string>} - A promise that resolves with the file content.
 */
async function readSqlFile(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    return fileContent;
  } catch (error) {
    console.error(`Error reading SQL file at ${filePath}:`, error);
    throw new Error(`Could not read SQL file: ${filePath}`);
  }
}

module.exports = { readSqlFile };
