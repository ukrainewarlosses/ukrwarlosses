const fs = require('fs');
const path = require('path');

// Configuration
const outputFile = 'nextjs_project_code.txt';
const rootDir = process.cwd(); // Current working directory (run from project root)
const excludeDirs = ['node_modules', '.next', '.git', 'public', 'cache']; // Exclude these directory names anywhere (add more if needed)
const excludePaths = ['src/data']; // Exclude these specific relative paths (normalized to '/')
const includeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.json', '.md', '.yml', '.yaml']; // File types to include

// Function to check if a file should be included
function shouldInclude(filePath) {
  const ext = path.extname(filePath);
  return includeExtensions.includes(ext);
}

// Function to recursively walk the directory
function walkDir(dir, callback) {
  fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const dirName = entry.name;
        const relativeDir = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        if (!excludeDirs.includes(dirName) && !excludePaths.includes(relativeDir)) {
          walkDir(fullPath, callback);
        }
      } else if (shouldInclude(fullPath)) {
        callback(fullPath);
      }
    });
  });
}

// Clear the output file if it exists
fs.writeFileSync(outputFile, '');

// Walk the directory and append files
walkDir(rootDir, (filePath) => {
  try {
    const relativePath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const separator = `\n\n// === File: ${relativePath} ===\n\n`;
    fs.appendFileSync(outputFile, separator + content);
    console.log(`Appended: ${relativePath}`);
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
  }
});

console.log(`\nAll files compiled into ${outputFile}`);