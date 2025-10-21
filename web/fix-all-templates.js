const fs = require('fs');
const path = require('path');

function fixTemplatesInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let changes = 0;

  // Fix template literals with ${} expressions (but not styled-components or className with only CSS)
  const templateRegex = /`([^`]*\$\{[^`]*)`/g;

  content = content.replace(templateRegex, (match, innerContent) => {
    // Skip if it's in styled-components, css tagged templates, or graphql
    const beforeMatch = content.substring(Math.max(0, content.indexOf(match) - 30), content.indexOf(match));
    if (/styled\.|css`|graphql`/.test(beforeMatch)) {
      return match;
    }

    // Skip className strings that only have CSS variables
    if (/className\s*=\s*`[^`]*\$\{[^`]*\}/i.test(content.substring(content.indexOf(match) - 50, content.indexOf(match) + match.length))) {
      // But fix if it has API calls or non-CSS expressions
      if (!/\/api\/|Date\.now|Math\.random|\.length|\.size|\.id|toast\.|confirm\(/.test(innerContent)) {
        return match;
      }
    }

    // Convert template literal to string concatenation
    let result = innerContent;

    // Replace ${expression} with ' + expression + '
    result = result.replace(/\$\{([^}]+)\}/g, (m, expr) => {
      return "' + (" + expr.trim() + ") + '";
    });

    // Wrap in quotes
    result = "'" + result + "'";

    // Clean up empty strings
    result = result.replace(/'' \+ /g, '');
    result = result.replace(/ \+ ''/g, '');
    result = result.replace(/^''\s*\+\s*/g, '');
    result = result.replace(/\s*\+\s*''$/g, '');

    changes++;
    return result;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changes;
  }
  return 0;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, callback);
      }
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      callback(filePath);
    }
  });
}

console.log('🔍 Scanning for template literals...\n');

let totalFiles = 0;
let fixedFiles = 0;
let totalChanges = 0;

const srcDir = path.join(__dirname, 'src');

walkDir(srcDir, (filePath) => {
  totalFiles++;
  const changes = fixTemplatesInFile(filePath);
  if (changes > 0) {
    fixedFiles++;
    totalChanges += changes;
    const relativePath = path.relative(__dirname, filePath);
    console.log(`✓ Fixed ${changes} template literal(s) in: ${relativePath}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Total files scanned: ${totalFiles}`);
console.log(`   Files modified: ${fixedFiles}`);
console.log(`   Total changes: ${totalChanges}`);
console.log(`\n✅ All template literals fixed!`);
