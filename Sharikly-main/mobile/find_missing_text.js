const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Does it use <Text> or <Text ?
      if (content.includes('<Text>') || content.includes('<Text ')) {
        // Does it import Text from react-native (handling multiline and aliases)
        // Let's just find the react-native import block
        const rnImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+['\"]react-native['\"]/);
        
        if (rnImportMatch) {
          const importedTokens = rnImportMatch[1].split(',').map(s => s.trim());
          if (!importedTokens.includes('Text')) {
            console.log('Missing Text import inside react-native import block:', file);
          }
        } else {
          // No react-native import block at all!
          console.log('No react-native import block but uses <Text>:', file);
        }
      }
    }
  });
  return results;
}
walk('./src');
