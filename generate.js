const fs = require('fs');

const categories = ['게임컨텐츠', '멀티미디어', '모션그래픽', '애니메이션'];
const colors = ['#ff2482', '#407dff', '#ffc20d', '#00c853', '#9b0045'];

// 1. Generate 48 detail pages
let detailHtml = '';
try {
  detailHtml = fs.readFileSync('detail.html', 'utf-8');
} catch(e) {
  console.log('detail.html not found');
}

if (detailHtml) {
  for(let i = 1; i <= 48; i++) {
    let cat = categories[i % categories.length];
    // We can inject a meta tag or something to indicate the section, but they can edit it later.
    let newHtml = detailHtml.replace('<title>PUZZLE - Detail</title>', `<title>PUZZLE - ${cat} ${i}</title>`);
    fs.writeFileSync(`detail_${i}.html`, newHtml);
  }
  console.log('Generated 48 detail pages.');
}

// 2. Update work.html
let workHtml = fs.readFileSync('work.html', 'utf-8');

// Generate 48 trend cards
let trendCards = '';
let workCards = '';

for(let i = 1; i <= 48; i++) {
  let cat = categories[i % categories.length];
  let color = colors[i % colors.length];
  
  trendCards += `
          <a
            class="card tall"
            href="detail_${i}.html"
            data-category="${cat}"
            aria-label="${cat} 작품 ${i}"
            style="background-color: ${color}"
          ></a>`;
          
  workCards += `
          <article class="work-item" data-category="${cat}">
            <a class="card tall" href="detail_${i}.html" aria-label="작품 상세 ${i}" style="background-color: ${color}"></a>
            <div class="meta">
              <span class="major">${cat}</span>
              <strong>작품 제목 ${i}</strong>
              <span class="name">디자이너 ${i}</span>
            </div>
          </article>`;
}

// Replace trendGrid content
const trendRegex = /(<div class="trend-grid" id="trendGrid">)[\s\S]*?(<\/section>)/;
workHtml = workHtml.replace(trendRegex, `$1${trendCards}\n        </div>\n      $2`);

// Replace worksGrid content
const worksRegex = /(<div class="works-grid">)[\s\S]*?(<\/div>\s*<\/section>\s*<script>)/;
if(worksRegex.test(workHtml)) {
  workHtml = workHtml.replace(worksRegex, `$1${workCards}\n        </div>\n      </section>\n\n      <script>`);
} else {
  const worksRegex2 = /(<div class="works-grid">)[\s\S]*?(<\/div>\s*<\/section>)/;
  workHtml = workHtml.replace(worksRegex2, `$1${workCards}\n        </div>\n      </section>`);
}

fs.writeFileSync('work.html', workHtml);
console.log('work.html updated with 48 cards.');
