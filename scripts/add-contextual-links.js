#!/usr/bin/env node
// add-contextual-links.js
// Injects contextual in-body links into blog post <p> paragraphs.
// Only the FIRST occurrence of each keyword per page, never inside existing <a> tags,
// never linking a page to itself, never in headings.
// Run: node scripts/add-contextual-links.js
// Safe to re-run — idempotent (won't double-link).

const fs   = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

const LINK_STYLE = 'color:#028090;font-weight:600;text-decoration:underline;text-underline-offset:3px';

// ─── Universal keyword → target page map ─────────────────────────────────────
// Each entry: regex to find, target slug, display text to wrap
// Order matters — more specific phrases before generic ones
const KEYWORD_MAP = [
  // Conditions
  { pattern: /\bAlzheimer'?s disease\b/i,          target: 'medication-reminder-alzheimers-dementia',  display: "Alzheimer's disease" },
  { pattern: /\bAlzheimer'?s\b/i,                  target: 'medication-reminder-alzheimers-dementia',  display: "Alzheimer's" },
  { pattern: /\bdementia\b/i,                      target: 'medication-reminder-alzheimers-dementia',  display: 'dementia' },
  { pattern: /\bADHD medications?\b/i,             target: 'medication-reminder-adhd',                 display: 'ADHD medications' },
  { pattern: /\bADHD\b/i,                          target: 'medication-reminder-adhd',                 display: 'ADHD' },
  { pattern: /\bType 2 diabetes\b/i,               target: 'medication-reminder-diabetes',             display: 'Type 2 diabetes' },
  { pattern: /\bdiabetes medications?\b/i,         target: 'medication-reminder-diabetes',             display: 'diabetes medications' },
  { pattern: /\bblood pressure medications?\b/i,   target: 'blood-pressure-tracking-app',              display: 'blood pressure medications' },
  { pattern: /\bhigh blood pressure\b/i,           target: 'medication-reminder-hypertension',         display: 'high blood pressure' },
  { pattern: /\bhypertension\b/i,                  target: 'medication-reminder-hypertension',         display: 'hypertension' },
  { pattern: /\bheart disease\b/i,                 target: 'medication-reminder-heart-disease',        display: 'heart disease' },
  { pattern: /\bchronic illness\b/i,               target: 'chronic-illness-medication-tracker',       display: 'chronic illness' },
  { pattern: /\bchronic conditions?\b/i,           target: 'chronic-illness-medication-tracker',       display: 'chronic condition' },

  // Care roles
  { pattern: /\blong-distance caregiver\b/i,       target: 'long-distance-caregiver-app',              display: 'long-distance caregiver' },
  { pattern: /\baging parents?\b/i,                target: 'caregiver-app-for-aging-parents',          display: 'aging parents' },
  { pattern: /\belderly parents?\b/i,              target: 'best-medication-reminder-app-elderly',     display: 'elderly parents' },
  { pattern: /\belderly patients?\b/i,             target: 'best-medication-reminder-app-elderly',     display: 'elderly patients' },

  // Product features
  { pattern: /\bpill organizer\b/i,                target: 'pill-reminder-app',                        display: 'pill organizer' },
  { pattern: /\bsupplement tracker\b/i,            target: 'supplement-tracker-busy-professionals',    display: 'supplement tracker' },
  { pattern: /\bsupplement reminder\b/i,           target: 'supplement-reminder-app',                  display: 'supplement reminder' },
  { pattern: /\bvitals? tracking\b/i,              target: 'vitals-tracking-app',                      display: 'vitals tracking' },
  { pattern: /\bdose tracker\b/i,                  target: 'dose-tracker-app',                         display: 'dose tracker' },
  { pattern: /\bmedication management\b/i,         target: 'medication-management-app',                display: 'medication management' },
  { pattern: /\bblood sugar (levels?|tracking)\b/i, target: 'blood-sugar-tracker-app',                 display: 'blood sugar tracking' },

  // Competitors (only on non-competitor pages)
  { pattern: /\bMedisafe\b/i,                      target: 'medisafe-alternative',                     display: 'Medisafe' },
  { pattern: /\bCareZone\b/i,                      target: 'carezone-alternative',                     display: 'CareZone' },

  // AI / Elara
  { pattern: /\bElara\b/i,                         target: 'elara-ai-caretaker',                       display: 'Elara' },
  { pattern: /\bAI caretaker\b/i,                  target: 'elara-ai-caretaker',                       display: 'AI caretaker' },
];

// ─── Helper: is position inside an existing <a>...</a> block? ─────────────────
function isInsideAnchor(html, matchStart, matchEnd) {
  // Find the last <a before matchStart — if it exists and there's no </a> between it and matchStart, we're inside
  const before = html.slice(0, matchStart);
  const lastAOpen  = before.lastIndexOf('<a ');
  const lastAClose = before.lastIndexOf('</a>');
  return lastAOpen !== -1 && lastAOpen > lastAClose;
}

// ─── Helper: is position inside a heading tag? ────────────────────────────────
function isInsideHeading(html, matchStart) {
  const before = html.slice(0, matchStart);
  const lastHeadOpen  = Math.max(before.lastIndexOf('<h1'), before.lastIndexOf('<h2'), before.lastIndexOf('<h3'));
  const lastHeadClose = Math.max(before.lastIndexOf('</h1>'), before.lastIndexOf('</h2>'), before.lastIndexOf('</h3>'));
  return lastHeadOpen !== -1 && lastHeadOpen > lastHeadClose;
}

// ─── Process a single page ────────────────────────────────────────────────────
function processFile(filePath, slug) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Work only inside the .content div — stop before related-posts / cta
  const contentStart = html.indexOf('<div class="content">');
  const ctaStart     = html.indexOf('<div class="related-posts">') !== -1
    ? html.indexOf('<div class="related-posts">')
    : html.indexOf('<div class="cta-section">');

  if (contentStart === -1 || ctaStart === -1) return { html, count: 0 };

  const before  = html.slice(0, contentStart);
  let   content = html.slice(contentStart, ctaStart);
  const after   = html.slice(ctaStart);

  const usedTargets = new Set();
  let count = 0;

  for (const { pattern, target, display } of KEYWORD_MAP) {
    // Never self-link, never use same target twice
    if (target === slug)         continue;
    if (usedTargets.has(target)) continue;

    let replaced = false;
    content = content.replace(pattern, (match, offset) => {
      if (replaced) return match; // only first occurrence

      // Reconstruct full offset in the content string
      const fullOffset = content.indexOf(match); // approximate — good enough for first-occurrence check
      if (isInsideAnchor(content, fullOffset, fullOffset + match.length)) return match;
      if (isInsideHeading(content, fullOffset)) return match;

      replaced = true;
      usedTargets.add(target);
      count++;
      return `<a href="/blog/${target}.html" style="${LINK_STYLE}">${display}</a>`;
    });
  }

  return { html: before + content + after, count };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
let totalLinks = 0;

for (const file of files) {
  const slug     = file.replace('.html', '');
  const filePath = path.join(BLOG_DIR, file);
  const { html, count } = processFile(filePath, slug);
  if (count > 0) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`  +${count} link${count !== 1 ? 's' : ''}  ${file}`);
    totalLinks += count;
  } else {
    console.log(`  --       ${file}`);
  }
}

console.log(`\nDone — ${totalLinks} contextual links injected across ${files.length} pages.`);
