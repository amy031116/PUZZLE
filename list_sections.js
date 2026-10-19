const fs = require('fs');
const c = fs.readFileSync('work.html', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<section') || l.includes('class="slider-section"') || l.includes('class="category-section"') || l.includes('class="section trend"') || l.includes('class="banner-section"') || l.includes('class="section blue-works"')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
