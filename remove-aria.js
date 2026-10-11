const fs = require('fs');
let html = fs.readFileSync('work.html', 'utf-8');

// 정규식을 사용하여 aria-label 속성을 모두 찾아 제거합니다.
html = html.replace(/\s+aria-label="[^"]*"/g, '');

fs.writeFileSync('work.html', html);
console.log('Removed all aria-labels from work.html');
