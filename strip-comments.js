const fs = require('fs');
const path = require('path');

function stripComments(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html')) {

    content = content.replace(/(?<!:)\/\/.*/g, '');
   
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    if (filePath.endsWith('.html')) {
        content = content.replace(/<!--[\s\S]*?-->/g, '');
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Stripped comments from ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      stripComments(fullPath);
    }
  }
}

walkDir('./src');
