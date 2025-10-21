const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/JavaScript files
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', { cwd: __dirname });

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Fix template literals with variables (but keep simple strings)
  // Only fix template literals that contain ${...}
  content = content.replace(/`([^`]*\$\{[^`]*)`/g, (match) => {
    // Skip if it's a styled-component or similar
    if (match.includes('styled.') || match.includes('css`')) {
      return match;
    }

    // Convert template literal to string concatenation
    let result = match;
    result = result.slice(1, -1); // Remove backticks

    // Replace ${...} with ' + ... + '
    result = result.replace(/\$\{([^}]+)\}/g, "' + ($1) + '");

    // Clean up extra concatenations
    result = "'" + result + "'";
    result = result.replace(/'' \+ /g, '');
    result = result.replace(/ \+ ''/g, '');
    result = result.replace(/^'' \+ /, '');
    result = result.replace(/ \+ ''$/, '');

    return result;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);
