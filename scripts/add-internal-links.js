#!/usr/bin/env node
// add-internal-links.js
// Injects a "Related Articles" section into every blog post before the CTA.
// Run: node scripts/add-internal-links.js
// Safe to re-run — removes existing section before re-injecting.

const fs   = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'blog');

// ─── Page metadata ────────────────────────────────────────────────────────────
const PAGES = {
  'medication-reminder-adhd':                  { title: 'Medication Reminder App for ADHD',              tag: 'ADHD' },
  'medication-reminder-alzheimers-dementia':   { title: 'Medication Reminder for Alzheimer\'s & Dementia', tag: 'DEMENTIA' },
  'medication-reminder-diabetes':              { title: 'Medication Reminder App for Diabetes',           tag: 'DIABETES' },
  'medication-reminder-hypertension':          { title: 'Medication Reminder for Hypertension',           tag: 'HYPERTENSION' },
  'medication-reminder-heart-disease':         { title: 'Medication Reminder for Heart Disease',          tag: 'HEART DISEASE' },
  'medication-reminder-cancer':                { title: 'Medication Reminder App for Cancer Patients',    tag: 'CANCER' },
  'chronic-illness-medication-tracker':        { title: 'Medication Tracker for Chronic Illness',         tag: 'CHRONIC ILLNESS' },
  'blood-pressure-tracking-app':               { title: 'Blood Pressure Tracking App',                    tag: 'BLOOD PRESSURE' },
  'blood-sugar-tracker-app':                   { title: 'Blood Sugar Tracker App',                        tag: 'BLOOD SUGAR' },
  'long-distance-caregiver-app':               { title: 'Long-Distance Caregiver App',                    tag: 'CAREGIVING' },
  'caregiver-app-for-aging-parents':           { title: 'Caregiver App for Aging Parents',                tag: 'AGING PARENTS' },
  'ai-caregiver-app':                          { title: 'AI Caregiver App',                               tag: 'AI CAREGIVER' },
  'how-to-remind-elderly-parent-medication':   { title: 'How to Remind Elderly Parents to Take Medication', tag: 'CAREGIVING' },
  'best-medication-reminder-app-elderly':      { title: 'Best Medication Reminder App for the Elderly',   tag: 'ELDERLY CARE' },
  'ai-medication-reminder-elderly-parents':    { title: 'AI Medication Reminder for Elderly Parents',     tag: 'AI + ELDERLY' },
  'medisafe-alternative':                      { title: 'Best Medisafe Alternative',                      tag: 'COMPARISON' },
  'carezone-alternative':                      { title: 'Best CareZone Alternative',                      tag: 'COMPARISON' },
  'carely-one-alternative':                    { title: 'Best Carely One Alternative',                    tag: 'COMPARISON' },
  'meetcarely-alternative':                    { title: 'Best MeetCarely Alternative',                    tag: 'COMPARISON' },
  'roundhealth-alternative':                   { title: 'Best Round Health Alternative',                  tag: 'COMPARISON' },
  'pill-reminder-app':                         { title: 'Pill Reminder App',                              tag: 'PILL REMINDER' },
  'dose-tracker-app':                          { title: 'Dose Tracker App',                               tag: 'DOSE TRACKING' },
  'medicine-tracker-app':                      { title: 'Medicine Tracker App',                           tag: 'MED TRACKER' },
  'medication-management-app':                 { title: 'Medication Management App',                      tag: 'MED MANAGEMENT' },
  'all-in-one-health-tracker-app':             { title: 'All-in-One Health Tracker App',                  tag: 'HEALTH TRACKING' },
  'vitals-tracking-app':                       { title: 'Vitals Tracking App',                            tag: 'VITALS' },
  'supplement-reminder-app':                   { title: 'Supplement Reminder App',                        tag: 'SUPPLEMENTS' },
  'supplement-tracker-busy-professionals':     { title: 'Supplement Tracker for Busy Professionals',      tag: 'SUPPLEMENTS' },
  'medication-reminder-busy-professionals':    { title: 'Medication Reminder for Busy Professionals',     tag: 'BUSY LIFE' },
  'elara-ai-caretaker':                        { title: 'Meet Elara — Your AI Caretaker',                 tag: 'ELARA AI' },
  'medication-reminder-app-canada':            { title: 'Medication Reminder App in Canada',              tag: 'CANADA' },
  'faq':                                       { title: 'Frequently Asked Questions — Carely',            tag: 'FAQ' },
};

// ─── Relationship map — 3 related posts per page ──────────────────────────────
const RELATED = {
  'medication-reminder-adhd': [
    'chronic-illness-medication-tracker',
    'supplement-tracker-busy-professionals',
    'medication-reminder-busy-professionals',
  ],
  'medication-reminder-alzheimers-dementia': [
    'long-distance-caregiver-app',
    'caregiver-app-for-aging-parents',
    'best-medication-reminder-app-elderly',
  ],
  'medication-reminder-diabetes': [
    'blood-sugar-tracker-app',
    'chronic-illness-medication-tracker',
    'medication-management-app',
  ],
  'medication-reminder-hypertension': [
    'blood-pressure-tracking-app',
    'chronic-illness-medication-tracker',
    'medication-management-app',
  ],
  'medication-reminder-heart-disease': [
    'blood-pressure-tracking-app',
    'chronic-illness-medication-tracker',
    'elara-ai-caretaker',
  ],
  'medication-reminder-cancer': [
    'chronic-illness-medication-tracker',
    'caregiver-app-for-aging-parents',
    'medication-management-app',
  ],
  'chronic-illness-medication-tracker': [
    'medication-management-app',
    'all-in-one-health-tracker-app',
    'vitals-tracking-app',
  ],
  'blood-pressure-tracking-app': [
    'medication-reminder-hypertension',
    'medication-reminder-heart-disease',
    'medication-management-app',
  ],
  'blood-sugar-tracker-app': [
    'medication-reminder-diabetes',
    'chronic-illness-medication-tracker',
    'medication-management-app',
  ],
  'long-distance-caregiver-app': [
    'caregiver-app-for-aging-parents',
    'ai-caregiver-app',
    'best-medication-reminder-app-elderly',
  ],
  'caregiver-app-for-aging-parents': [
    'long-distance-caregiver-app',
    'how-to-remind-elderly-parent-medication',
    'ai-caregiver-app',
  ],
  'ai-caregiver-app': [
    'elara-ai-caretaker',
    'long-distance-caregiver-app',
    'medication-management-app',
  ],
  'how-to-remind-elderly-parent-medication': [
    'best-medication-reminder-app-elderly',
    'caregiver-app-for-aging-parents',
    'long-distance-caregiver-app',
  ],
  'best-medication-reminder-app-elderly': [
    'how-to-remind-elderly-parent-medication',
    'caregiver-app-for-aging-parents',
    'ai-medication-reminder-elderly-parents',
  ],
  'ai-medication-reminder-elderly-parents': [
    'best-medication-reminder-app-elderly',
    'long-distance-caregiver-app',
    'elara-ai-caretaker',
  ],
  'medisafe-alternative': [
    'carezone-alternative',
    'pill-reminder-app',
    'medication-management-app',
  ],
  'carezone-alternative': [
    'medisafe-alternative',
    'best-medication-reminder-app-elderly',
    'caregiver-app-for-aging-parents',
  ],
  'carely-one-alternative': [
    'medisafe-alternative',
    'medication-management-app',
    'elara-ai-caretaker',
  ],
  'meetcarely-alternative': [
    'carely-one-alternative',
    'long-distance-caregiver-app',
    'ai-caregiver-app',
  ],
  'roundhealth-alternative': [
    'medisafe-alternative',
    'pill-reminder-app',
    'all-in-one-health-tracker-app',
  ],
  'pill-reminder-app': [
    'dose-tracker-app',
    'medicine-tracker-app',
    'medication-management-app',
  ],
  'dose-tracker-app': [
    'pill-reminder-app',
    'medicine-tracker-app',
    'medication-management-app',
  ],
  'medicine-tracker-app': [
    'pill-reminder-app',
    'dose-tracker-app',
    'medication-management-app',
  ],
  'medication-management-app': [
    'all-in-one-health-tracker-app',
    'vitals-tracking-app',
    'elara-ai-caretaker',
  ],
  'all-in-one-health-tracker-app': [
    'vitals-tracking-app',
    'medication-management-app',
    'supplement-reminder-app',
  ],
  'vitals-tracking-app': [
    'all-in-one-health-tracker-app',
    'blood-pressure-tracking-app',
    'blood-sugar-tracker-app',
  ],
  'supplement-reminder-app': [
    'supplement-tracker-busy-professionals',
    'medication-reminder-adhd',
    'all-in-one-health-tracker-app',
  ],
  'supplement-tracker-busy-professionals': [
    'supplement-reminder-app',
    'medication-reminder-busy-professionals',
    'all-in-one-health-tracker-app',
  ],
  'medication-reminder-busy-professionals': [
    'supplement-tracker-busy-professionals',
    'medication-reminder-adhd',
    'dose-tracker-app',
  ],
  'elara-ai-caretaker': [
    'ai-medication-reminder-elderly-parents',
    'ai-caregiver-app',
    'medication-management-app',
  ],
  'medication-reminder-app-canada': [
    'best-medication-reminder-app-elderly',
    'long-distance-caregiver-app',
    'medication-management-app',
  ],
  'faq': [
    'medication-management-app',
    'elara-ai-caretaker',
    'best-medication-reminder-app-elderly',
  ],
};

// ─── CSS to inject into each page's <style> block ────────────────────────────
const RELATED_CSS = `
    .related-posts{max-width:760px;margin:0 auto;padding:48px 24px 8px}
    .related-posts-heading{font-size:0.75rem;font-weight:800;color:#028090;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:16px}
    .related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
    .related-card{display:flex;flex-direction:column;gap:6px;padding:16px 18px;border:1.5px solid #e8efed;border-radius:12px;text-decoration:none;background:#fff;transition:border-color 0.15s,box-shadow 0.15s,transform 0.1s}
    .related-card:hover{border-color:#028090;box-shadow:0 2px 14px rgba(2,128,144,0.12);transform:translateY(-1px)}
    .related-card-tag{font-size:0.62rem;font-weight:800;color:#028090;text-transform:uppercase;letter-spacing:0.1em}
    .related-card-title{font-size:0.84rem;font-weight:700;color:#0D3347;line-height:1.4}
    .related-card-arrow{font-size:0.78rem;color:#028090;font-weight:700;margin-top:auto;padding-top:6px}`;

// ─── Build the related posts HTML block ───────────────────────────────────────
function buildRelatedHTML(slug) {
  const related = RELATED[slug];
  if (!related || related.length === 0) return '';

  const cards = related.map(relSlug => {
    const page = PAGES[relSlug];
    if (!page) return '';
    return `    <a href="/blog/${relSlug}.html" class="related-card">
      <span class="related-card-tag">${page.tag}</span>
      <div class="related-card-title">${page.title}</div>
      <span class="related-card-arrow">Read more →</span>
    </a>`;
  }).filter(Boolean).join('\n');

  if (!cards) return '';

  return `
<div class="related-posts">
  <div class="related-posts-heading">Related Articles</div>
  <div class="related-grid">
${cards}
  </div>
</div>

`;
}

// ─── Process a single blog file ───────────────────────────────────────────────
function processFile(filePath, slug) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove any previously injected related posts block
  html = html.replace(/\n?<div class="related-posts">[\s\S]*?<\/div>\n?\n?(?=\n?<div class="cta-section">)/g, '');

  // Inject CSS into the existing <style> block (before closing </style>)
  if (!html.includes('.related-posts{')) {
    html = html.replace('</style>', RELATED_CSS + '\n  </style>');
  }

  // Inject related posts HTML before .cta-section
  const relatedHTML = buildRelatedHTML(slug);
  if (relatedHTML && html.includes('<div class="cta-section">')) {
    html = html.replace('<div class="cta-section">', relatedHTML + '<div class="cta-section">');
  }

  fs.writeFileSync(filePath, html, 'utf8');
  return !!relatedHTML;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let processed = 0;
let skipped   = 0;

for (const slug of Object.keys(RELATED)) {
  const filePath = path.join(BLOG_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP  ${slug}.html — file not found`);
    skipped++;
    continue;
  }
  const injected = processFile(filePath, slug);
  console.log(`  ${injected ? 'OK  ' : 'SKIP'} ${slug}.html`);
  if (injected) processed++;
}

console.log(`\nDone — ${processed} pages updated, ${skipped} skipped.`);
