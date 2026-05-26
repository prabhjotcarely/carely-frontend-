#!/usr/bin/env node
// add-disclaimer.js
// Adds a medical/legal disclaimer to every blog page.
// Placed after content, before Related Articles section.
// Safe to re-run — removes existing disclaimer before re-injecting.

const fs   = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

const DISCLAIMER_CSS = `
    .medical-disclaimer{max-width:760px;margin:32px auto 0;padding:0 24px}
    .medical-disclaimer-inner{border-left:3px solid #e8efed;padding:12px 16px;border-radius:0 8px 8px 0;background:#f9fbfc}
    .medical-disclaimer-inner p{margin:0;font-size:0.75rem;line-height:1.6;color:#6b7c75;font-style:italic}
    .medical-disclaimer-inner strong{color:#0D3347;font-style:normal;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:4px}`;

const DISCLAIMER_HTML = `
<div class="medical-disclaimer">
  <div class="medical-disclaimer-inner">
    <p><strong>Medical Disclaimer</strong>Carely is a medication reminder and tracking tool, not a medical device. It does not provide medical advice, diagnosis, or treatment recommendations. Always follow your healthcare provider's instructions regarding your medications and health conditions. If you have concerns about your medication schedule, contact your doctor or pharmacist.</p>
  </div>
</div>

`;

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove any previously injected disclaimer
  html = html.replace(/\n?<div class="medical-disclaimer">[\s\S]*?<\/div>\n?\n?/g, '');

  // Inject CSS before </style>
  if (!html.includes('.medical-disclaimer{')) {
    html = html.replace('</style>', DISCLAIMER_CSS + '\n  </style>');
  }

  // Inject before .related-posts if it exists, otherwise before .cta-section or .cta-inline
  const insertBefore = html.includes('<div class="related-posts">')
    ? '<div class="related-posts">'
    : html.includes('<div class="cta-section">')
    ? '<div class="cta-section">'
    : '<div class="cta-inline">';

  if (!html.includes(insertBefore)) return false;

  html = html.replace(insertBefore, DISCLAIMER_HTML + insertBefore);
  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
let done = 0;

for (const file of files) {
  const ok = processFile(path.join(BLOG_DIR, file));
  console.log(`  ${ok ? 'OK  ' : 'SKIP'} ${file}`);
  if (ok) done++;
}

console.log(`\nDone — disclaimer added to ${done} pages.`);
