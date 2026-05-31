const fs = require('fs');
const path = require('path');

function checkEncoding() {
  const srcPath = path.join(__dirname, '..', 'src');
  let errors = [];

  function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          const match = line.match(/(\w)\?(\w)/g);
          if (match) {
            errors.push(`${fullPath}:${idx + 1} - Possible mojibake detected: ${match.join(', ')}`);
          }
        });
      }
    });
  }

  walkDir(srcPath);

  if (errors.length > 0) {
    console.error('❌ Encoding issues found:');
    errors.forEach(err => console.error(`  ${err}`));
    process.exit(1);
  }

  console.log('✅ Encoding OK - all files are properly UTF-8 encoded');
  process.exit(0);
}

checkEncoding();
