// ─── CARELY HQ INTEL — hq-intel.js ───────────────────────────────────────────
var _IB = 'https://carely-backend-production.up.railway.app';
var _IS = 'carely-admin-6add43330d2313d8';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function txt(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
function clr(id) { var e = document.getElementById(id); if (e) e.textContent = ''; }
function el(tag, props, text) {
  var e = document.createElement(tag);
  if (props) Object.keys(props).forEach(function(k){ e[k] = props[k]; });
  if (text !== undefined) e.textContent = text;
  return e;
}
function appendBar(container, label, count, max, color) {
  var row = el('div'); row.style.cssText = 'margin-bottom:10px';
  var lRow = el('div'); lRow.style.cssText = 'display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px';
  lRow.appendChild(el('span', null, label));
  lRow.appendChild(el('span', {style:'font-weight:700'}, count));
  row.appendChild(lRow);
  var track = el('div'); track.style.cssText = 'height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden';
  var fill = el('div'); fill.style.cssText = 'height:100%;border-radius:3px;background:'+color+';width:'+Math.round((count/max)*100)+'%;transition:width 0.6s';
  track.appendChild(fill); row.appendChild(track); container.appendChild(row);
}
function appendListItem(container, label, val, color) {
  var row = el('div'); row.style.cssText = 'display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:0.78rem';
  var lb = el('span', null, label); lb.style.color = '#6b7280';
  var vb = el('span', null, val);   vb.style.cssText = 'font-weight:700;color:'+(color||'#0D3347');
  row.appendChild(lb); row.appendChild(vb); container.appendChild(row);
}

// ─── Demographics ─────────────────────────────────────────────────────────────
function loadDemographics() {
  clr('demo-total'); clr('demo-age-bars'); clr('demo-plan-bars'); clr('demo-trend');
  fetch(_IB+'/admin/user-demographics',{headers:{'x-carely-secret':_IS}})
    .then(function(r){return r.json();})
    .then(function(d){
      txt('demo-total', d.total || 0);
      var ageCont = document.getElementById('demo-age-bars');
      if (ageCont && d.ageGroups) {
        var max = Math.max(1, Math.max.apply(null, d.ageGroups.map(function(g){return g.count;})));
        d.ageGroups.forEach(function(g){ appendBar(ageCont, g.label, g.count, max, '#02C39A'); });
      }
      var planCont = document.getElementById('demo-plan-bars');
      if (planCont && d.plans) {
        var max2 = Math.max(1, Math.max.apply(null, d.plans.map(function(p){return p.count;})));
        d.plans.forEach(function(p){ appendBar(planCont, p.plan, p.count, max2, '#028090'); });
      }
      var trendCont = document.getElementById('demo-trend');
      if (trendCont && d.signupTrend) {
        d.signupTrend.forEach(function(t){ appendListItem(trendCont, t.week, t.count+' signups', '#02C39A'); });
      }
    }).catch(function(){ txt('demo-total','—'); });
}

// ─── Elara Intelligence ───────────────────────────────────────────────────────
function loadElaraIntel() {
  fetch(_IB+'/admin/elara-stats',{headers:{'x-carely-secret':_IS}})
    .then(function(r){return r.json();})
    .then(function(d){
      txt('elara-total-mem', d.totalMemory || 0);
      txt('elara-deep-users', d.deepUsers || 0);
      txt('elara-engage-rate', d.engagementRate ? d.engagementRate+'%' : '—');
      txt('elara-deep-rate', d.deepRate ? d.deepRate+'%' : '—');
      var buckCont = document.getElementById('elara-buckets');
      if (buckCont && d.sessionBuckets) {
        var max = Math.max(1, Math.max.apply(null, d.sessionBuckets.map(function(b){return b.count;})));
        d.sessionBuckets.forEach(function(b){ appendBar(buckCont, b.label, b.count, max, '#8b5cf6'); });
      }
    }).catch(function(){});
}

// ─── Behavior Stats ───────────────────────────────────────────────────────────
function loadBehavior() {
  fetch(_IB+'/admin/behavior-stats',{headers:{'x-carely-secret':_IS}})
    .then(function(r){return r.json();})
    .then(function(d){
      txt('beh-adherence30', d.adherence30 ? d.adherence30+'%' : '—');
      txt('beh-adherence7',  d.adherence7  ? d.adherence7+'%'  : '—');
      txt('beh-dose-logs',   d.totalDoseLogs   || 0);
      txt('beh-medicines',   d.totalMedicines  || 0);
      txt('beh-avg-meds',    d.avgMedsPerUser  || '—');
      txt('beh-active',      d.activeUsers     || 0);
      txt('beh-activation',  d.activationRate  ? d.activationRate+'%' : '—');
    }).catch(function(){});
}

// ─── CSV Export (patient data) ────────────────────────────────────────────────
function downloadCSV(btn) {
  if (btn) { btn.textContent = 'Exporting…'; btn.disabled = true; }
  fetch(_IB+'/admin/patient-data-export',{headers:{'x-carely-secret':_IS}})
    .then(function(r){ return r.blob(); })
    .then(function(blob){
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'carely-patients-' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
      if (btn) { btn.textContent = '⬇ Export Patient CSV'; btn.disabled = false; }
    }).catch(function(){
      if (btn) { btn.textContent = 'Error'; btn.disabled = false; }
    });
}

// ─── Condition Summary ────────────────────────────────────────────────────────
function loadConditionSummary() {
  var cont = document.getElementById('condition-list');
  if (!cont) return;
  fetch(_IB+'/admin/condition-summary',{headers:{'x-carely-secret':_IS}})
    .then(function(r){return r.json();})
    .then(function(d){
      cont.textContent = '';
      if (d.conditions) {
        var max = Math.max(1, Math.max.apply(null, d.conditions.map(function(c){return c.count;})));
        d.conditions.forEach(function(c){ appendBar(cont, c.condition, c.count, max, '#02C39A'); });
      }
    }).catch(function(){});
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── FILE REGISTRY — CARD GRID ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

var FILES = [
  { path:'src/index.ts',                   title:'Server Entry Point',       desc:'Express setup, middleware stack (CORS, helmet, rate-limiter, timeout, logger), 28 route mounts.',                           tags:['core'],            agents:'All agents',                        profit:'Every revenue-generating API call flows through here' },
  { path:'src/routes/auth.ts',             title:'Auth Routes',              desc:'Signup, signin, profile fetch/update, Google OAuth, account deletion. Validates Supabase JWT.',                              tags:['route','core'],    agents:'All agents read user plan',         profit:'Controls paid plan gating — founding / monthly / annual' },
  { path:'src/routes/medicines.ts',        title:'Medicine CRUD',            desc:'Add, edit, delete, list medicines. Stores dose_type, colour_tag, nickname, condition_category.',                             tags:['route','db'],      agents:'Elara, Grace, Frank, data export',  profit:'More medicines = higher retention + data asset value' },
  { path:'src/routes/schedules.ts',        title:'Schedule Management',      desc:'Create and manage reminder schedules (frequency, times[], timezone).',                                                       tags:['route'],           agents:'Frank (FCM reminders)',             profit:'Schedules = daily engagement = user retention' },
  { path:'src/routes/doseLogs.ts',         title:'Dose Log Tracker',         desc:'Records taken / skipped / missed / snoozed. Powers adherence, streaks, Elara coaching, caregiver alerts.',                  tags:['route','db','profit'], agents:'Elara, Grace, Cara, Nina, Ace',  profit:'Core data asset — adherence data = product value + investor story' },
  { path:'src/routes/elara.ts',            title:'Elara Website Chat',       desc:'Public AI chat widget on carely.fit. DeepSeek via OpenRouter. Converts website visitors.',                                   tags:['route','agent'],   agents:'Elara (website)',                   profit:'Direct conversion tool — answers questions 24/7' },
  { path:'src/routes/ai.ts',               title:'Elara In-App AI',          desc:'In-app Elara with Redis memory, medicines context, adherence stats. GPT-4o via OpenRouter.',                                 tags:['route','agent','profit'], agents:'Elara (in-app)',             profit:'Core premium feature — main reason users pay' },
  { path:'src/routes/pharmacy.ts',         title:'Pharmacy Refill',          desc:'Pharmacy save, refill emails via SendGrid, logged in Supabase. Branded HTML template.',                                      tags:['route','profit'],  agents:'Zara',                              profit:'B2B pharma upsell — future partner revenue stream' },
  { path:'src/routes/subscription.ts',     title:'Stripe Billing',           desc:'Stripe webhook, plan sync, founding/monthly/annual, trial expiry, cancellation.',                                            tags:['route','profit','core'], agents:'Nina, Lena',                 profit:'DIRECT — every webhook = paid user action' },
  { path:'src/routes/admin.ts',            title:'Admin Dashboard API',      desc:'All HQ endpoints: stats, CRM, condition summary, export, demographics, behavior, Elara stats.',                              tags:['route','agent','profit'], agents:'Hermes, Ace, all agents',    profit:'Powers HQ decisions = better growth = more revenue' },
  { path:'src/routes/reports.ts',          title:'Doctor Reports',           desc:'PDF report generation, send to doctor email via SendGrid. 7-day adherence summary.',                                         tags:['route'],           agents:'Grace',                             profit:'Trust driver — doctors refer patients to Carely' },
  { path:'src/routes/vitals.ts',           title:'Health Vitals',            desc:'Store and retrieve BP, weight, glucose, SpO2. Feeds doctor reports.',                                                        tags:['route','db'],      agents:'Zara',                              profit:'Data depth = higher LTV + data company valuation' },
  { path:'src/routes/caregiver.ts',        title:'Caregiver Connect',        desc:'6-char connect codes, link caregiver to patient, manage permissions.',                                                       tags:['route'],           agents:'Cara, Maya',                       profit:'Caregiver = 2x user acquisition per household' },
  { path:'src/routes/outreach.ts',         title:'B2B Outreach Queue',       desc:'Stores pharmacy + clinic targets. Cole sends personalised cold emails.',                                                      tags:['route','agent'],   agents:'Cole',                              profit:'B2B pipeline = pharmacy partnerships + bulk licences' },
  { path:'src/routes/referrals.ts',        title:'Referral System',          desc:'Generate codes, track conversions, reward free months.',                                                                      tags:['route','profit'],  agents:'Refer',                             profit:'Zero-cost acquisition = revenue multiplier' },
  { path:'src/agentOS/hermesOS.ts',        title:'Hermes CEO OS',            desc:'Master agent. Reads feed, sends directives, daily brief, anomaly alerts via Telegram.',                                       tags:['agent','core'],    agents:'Hermes',                            profit:'Intelligent ops = fewer mistakes = higher revenue' },
  { path:'src/agentOS/elaraAgent.ts',      title:'Elara Agent Core',         desc:'AI caretaker logic. Redis memory, adherence context, personalised check-in generation.',                                      tags:['agent'],           agents:'Elara',                             profit:'Retention engine — Elara = main reason users stay' },
  { path:'src/agentOS/frankAgent.ts',      title:'Frank Dose Agent',         desc:'FCM push for every scheduled dose. Unique, warm messages. Runs on scheduler.',                                               tags:['agent'],           agents:'Frank',                             profit:'Adherence = retention = LTV' },
  { path:'src/agentOS/graceAgent.ts',      title:'Grace Check-in Agent',     desc:'Daily 9AM check-in push via Firebase. Appears as Elara to user.',                                                            tags:['agent'],           agents:'Grace',                             profit:'Habit formation = long-term subscription' },
  { path:'src/agentOS/caraAgent.ts',       title:'Cara Alert Agent',         desc:'Triggered by Maya on missed dose. Sends FCM alert to linked caregiver.',                                                      tags:['agent'],           agents:'Cara, Maya',                       profit:'Caregiver engagement = family plan upsell' },
  { path:'src/agentOS/rexAgent.ts',        title:'Rex Reddit Agent',         desc:'Posts to 18 subreddits every 6h. Reply drafts for Prabh review. Never direct pitches.',                                       tags:['agent'],           agents:'Rex',                               profit:'Organic acquisition — zero ad spend' },
  { path:'src/agentOS/scoutAgent.ts',      title:'Scout SEO Agent',          desc:'Manages 33 blog pages, pings IndexNow on Cloudflare, tracks search rankings.',                                               tags:['agent'],           agents:'Scout',                             profit:'SEO = compounding free traffic' },
  { path:'src/agentOS/aceAgent.ts',        title:'Ace Security Agent',       desc:'8AM brief, EOD scan, anomaly detection, per-agent directives, HQ health report.',                                            tags:['agent','core'],    agents:'Ace',                               profit:'Security + ops intelligence = stable revenue' },
  { path:'src/agentOS/coleAgent.ts',       title:'Cole B2B Agent',           desc:'5 B2B targets/day. Personalised cold emails to pharmacies, senior homes, clinics.',                                          tags:['agent'],           agents:'Cole',                              profit:'B2B = $500+/account ARR' },
  { path:'src/services/scheduler.ts',      title:'Cron Scheduler',           desc:'Runs Frank, Grace, Maya, Leo, Rex, Scout, Ace on schedule. Core timing engine.',                                             tags:['core'],            agents:'All timed agents',                  profit:'Without scheduler nothing runs = zero revenue' },
  { path:'src/services/agentFeed.ts',      title:'Agent Activity Feed',      desc:'Pushes live events to HQ feed. TJ + Prabh see real-time agent activity.',                                                    tags:['core'],            agents:'All agents',                        profit:'Visibility = faster decisions = more revenue' },
  { path:'src/services/obsidianBrain.ts',  title:'Obsidian Brain',           desc:'Company memory store. Seeds knowledge on startup. Agents read + inject context.',                                            tags:['core','agent'],    agents:'Hermes, Elara, all agents',         profit:'Institutional knowledge = consistent brand + strategy' },
  { path:'src/middleware/agentGuard.ts',   title:'Agent Guard',              desc:'Anomaly detection middleware. Flags unusual traffic patterns, rate spikes.',                                                  tags:['core'],            agents:'Ace',                               profit:'Prevents abuse = protects revenue' },
  { path:'src/middleware/circuitBreaker.ts',title:'Circuit Breaker',         desc:'Wraps OpenRouter + Supabase calls. Fails fast, prevents cascade failures.',                                                   tags:['core'],            agents:'All agents',                        profit:'99.9% uptime = no lost revenue from downtime' },
  { path:'src/db/client.ts',              title:'Supabase DB Client',        desc:'Singleton Supabase client. Used by every route and service.',                                                                 tags:['core','db'],       agents:'All routes',                        profit:'Database = entire product depends on it' },
  { path:'src/db/redis.ts',               title:'Redis Cache Client',        desc:'Upstash Redis singleton. Elara memory, session cache, rate limiting.',                                                        tags:['core','db'],       agents:'Elara, rate limiter',               profit:'Fast responses = good UX = retention' },
  { path:'src/routes/seo.ts',             title:'SEO + Blog Routes',         desc:'Blog post CRUD, meta tags, sitemap generation, IndexNow ping to Cloudflare.',                                                tags:['route'],           agents:'Scout',                             profit:'Organic search = compounding traffic' },
  { path:'src/routes/b2b.ts',             title:'B2B Enterprise Routes',     desc:'Enterprise signup, bulk licensing, partner onboarding flows.',                                                               tags:['route','profit'],  agents:'Cole',                              profit:'B2B = highest revenue per account' },
  { path:'src/routes/partner.ts',         title:'Partner Routes',            desc:'Partner auth, patient links, consent management, clinical intelligence.',                                                     tags:['route'],           agents:'Cole, Bridge',                     profit:'Partner network = distribution at scale' },
  { path:'src/hermes/hermesChat.ts',       title:'Hermes Chat API',           desc:'TJ + Prabh Telegram bots. CEO briefings, company updates, alert routing.',                                                   tags:['agent','core'],    agents:'Hermes, Dora',                     profit:'Operator intelligence = faster response to problems' },
];

var _filesFiltered = FILES.slice();
var _filesTagFilter = 'all';

function filterFiles() {
  var q = (document.getElementById('file-search') || {}).value || '';
  q = q.toLowerCase();
  _filesFiltered = FILES.filter(function(f) {
    var matchTag = _filesTagFilter === 'all' || f.tags.indexOf(_filesTagFilter) >= 0;
    if (!matchTag) return false;
    if (!q) return true;
    return (f.path+f.title+f.desc+f.agents+f.profit+f.tags.join(' ')).toLowerCase().indexOf(q) >= 0;
  });
  _renderFiles();
}

function filterByTag(btn, tag) {
  _filesTagFilter = tag;
  document.querySelectorAll('.fr-tag').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  filterFiles();
}

function _makeTagBadge(tag) {
  var s = el('span'); s.className = 'fr-badge badge-'+tag; s.textContent = tag.toUpperCase();
  return s;
}

function _renderFiles() {
  var grid = document.getElementById('file-registry');
  var count = document.getElementById('fr-count');
  if (!grid) return;
  grid.textContent = '';
  if (count) count.textContent = _filesFiltered.length + ' of ' + FILES.length + ' files';

  _filesFiltered.forEach(function(f) {
    var origIdx = FILES.indexOf(f);
    var card = el('div');
    card.className = 'file-card';
    card.setAttribute('onclick', 'openFileDetail('+origIdx+')');

    var pathDiv = el('div'); pathDiv.className = 'fc-path'; pathDiv.textContent = f.path;
    card.appendChild(pathDiv);

    var titleDiv = el('div'); titleDiv.className = 'fc-title'; titleDiv.textContent = f.title;
    card.appendChild(titleDiv);

    var descDiv = el('div'); descDiv.className = 'fc-desc'; descDiv.textContent = f.desc;
    card.appendChild(descDiv);

    var footer = el('div'); footer.className = 'fc-footer';
    f.tags.forEach(function(t){ footer.appendChild(_makeTagBadge(t)); });
    var arrow = el('span'); arrow.className = 'fc-arrow'; arrow.textContent = 'View details →';
    footer.appendChild(arrow);
    card.appendChild(footer);

    grid.appendChild(card);
  });
}

function openFileDetail(idx) {
  var f = FILES[idx];
  if (!f) return;
  var cont = document.getElementById('fd-content');
  if (!cont) return;
  cont.textContent = '';

  var hdr = el('div');
  var nameDiv = el('div'); nameDiv.className = 'fd-name'; nameDiv.textContent = f.title;
  var pathChip = el('div'); pathChip.className = 'fd-path-chip'; pathChip.textContent = f.path;
  hdr.appendChild(nameDiv);
  hdr.appendChild(pathChip);

  var tagsRow = el('div'); tagsRow.className = 'fd-tags';
  f.tags.forEach(function(t){ tagsRow.appendChild(_makeTagBadge(t)); });
  hdr.appendChild(tagsRow);
  cont.appendChild(hdr);

  var tbl = el('table'); tbl.className = 'fd-table';
  var rows = [
    ['What this file does', f.desc],
    ['Agents using it', f.agents],
    ['Revenue impact', f.profit],
    ['File path', f.path]
  ];
  rows.forEach(function(pair) {
    var tr = el('tr');
    var tdL = el('td'); tdL.textContent = pair[0];
    var tdR = el('td'); tdR.textContent = pair[1];
    tr.appendChild(tdL); tr.appendChild(tdR);
    tbl.appendChild(tr);
  });
  cont.appendChild(tbl);

  var exportWrap = el('div'); exportWrap.style.cssText = 'margin-top:20px';
  var exportBtn = el('button'); exportBtn.className = 'fd-export-btn';
  exportBtn.textContent = '⬇ Export This File as CSV';
  exportBtn.setAttribute('onclick', 'exportSingleFileCSV('+idx+')');
  exportWrap.appendChild(exportBtn);
  cont.appendChild(exportWrap);

  _activatePage('file-detail', false);
}

function exportSingleFileCSV(idx) {
  var f = FILES[idx];
  if (!f) return;
  var rows = [
    ['Field','Value'],
    ['File Path', f.path],
    ['Name', f.title],
    ['Tags', f.tags.join(', ')],
    ['Agents Using It', f.agents],
    ['Revenue Impact', f.profit],
    ['Description', f.desc]
  ];
  var csv = rows.map(function(r){
    return r.map(function(cell){
      var s = (cell||'').toString().replace(/"/g,'""');
      return '"'+s+'"';
    }).join(',');
  }).join('\r\n');
  var blob = new Blob([csv], {type:'text/csv'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'carely-'+f.path.replace(/\//g,'-').replace(/\.ts$/,'')+'.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportFilesCSV() {
  var rows = [['Path','Name','Tags','Agents','Revenue Impact','Description']];
  _filesFiltered.forEach(function(f) {
    rows.push([f.path, f.title, f.tags.join(', '), f.agents, f.profit, f.desc]);
  });
  var csv = rows.map(function(r){
    return r.map(function(cell){
      var s = (cell||'').toString().replace(/"/g,'""');
      return '"'+s+'"';
    }).join(',');
  }).join('\r\n');
  var blob = new Blob([csv], {type:'text/csv'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'carely-file-registry-'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Init on page load

// ══════════════════════════════════════════════════════════════════════════════
// ─── USER INTELLIGENCE ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

var _uiUsers = [];
var _uiFilter = 'all';
var _uiSearch = '';

function loadUserIntel() {
  var wrap = document.getElementById('ui-table-wrap');
  if (wrap) { wrap.textContent = ''; var ld = el('div'); ld.style.cssText = 'text-align:center;padding:28px;color:#6b7280;font-size:0.82rem'; ld.textContent = 'Loading users…'; wrap.appendChild(ld); }
  fetch(_IB + '/admin/users-list', { headers: { 'x-carely-secret': _IS } })
    .then(function(r) { return r.json(); })
    .then(function(d) { _uiUsers = d.users || []; _renderUserIntel(); })
    .catch(function() {
      if (wrap) { wrap.textContent = ''; var er = el('div'); er.style.cssText = 'text-align:center;padding:28px;color:#dc2626;font-size:0.82rem'; er.textContent = 'Failed to load — backend may still be deploying'; wrap.appendChild(er); }
    });
}

function setUiFilter(btn, f) {
  _uiFilter = f;
  document.querySelectorAll('.ui-filter').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  _renderUserIntel();
}

function uiSearchChange() {
  _uiSearch = (document.getElementById('ui-search') || {}).value || '';
  _renderUserIntel();
}

function _renderUserIntel() {
  var wrap = document.getElementById('ui-table-wrap');
  var cnt  = document.getElementById('ui-count');
  if (!wrap) return;

  var now = Date.now();
  var filtered = _uiUsers.filter(function(u) {
    var q = _uiSearch.toLowerCase();
    if (q && (u.first_name + ' ' + u.email).toLowerCase().indexOf(q) < 0) return false;
    if (_uiFilter === 'trial') return u.plan === 'trial';
    if (_uiFilter === 'paid') return u.plan !== 'trial' && u.plan !== 'expired';
    if (_uiFilter === 'inactive') {
      if (!u.last_active) return true;
      return (now - new Date(u.last_active).getTime()) > 7*24*3600*1000;
    }
    if (_uiFilter === 'expiring') {
      if (!u.trial_days_remaining) return false;
      return u.trial_days_remaining <= 3;
    }
    if (_uiFilter === 'highadh') return (u.adherence_pct || 0) >= 80;
    return true;
  });

  if (cnt) cnt.textContent = filtered.length + ' of ' + _uiUsers.length + ' users';
  wrap.textContent = '';

  if (filtered.length === 0) {
    var em = el('div'); em.style.cssText = 'text-align:center;padding:40px;color:var(--g500);font-size:0.82rem';
    em.textContent = _uiUsers.length === 0 ? 'No users yet — they will appear here after launch' : 'No users match this filter';
    wrap.appendChild(em); return;
  }

  var tbl = el('table'); tbl.className = 'ui-table';
  var thead = el('thead');
  var htr = el('tr');
  ['Name','Email','Plan','Trial Ends','Medicines','Adherence','Last Active','Elara Memory',''].forEach(function(h){
    var th = el('th'); th.textContent = h; htr.appendChild(th);
  });
  thead.appendChild(htr); tbl.appendChild(thead);

  var tbody = el('tbody');
  filtered.forEach(function(u) {
    var tr = el('tr');

    var tdN = el('td'); tdN.textContent = u.first_name || '—'; tr.appendChild(tdN);
    var tdE = el('td'); tdE.style.fontSize = '0.72rem'; tdE.style.color = 'var(--g500)'; tdE.textContent = u.email || '—'; tr.appendChild(tdE);

    var tdP = el('td');
    var badge = el('span'); badge.className = 'ui-plan ui-plan-'+(u.plan||'trial');
    badge.textContent = (u.plan||'trial').toUpperCase(); tdP.appendChild(badge); tr.appendChild(tdP);

    var tdT = el('td');
    if (u.trial_days_remaining != null) {
      tdT.textContent = u.trial_days_remaining + 'd';
      if (u.trial_days_remaining <= 3) tdT.style.color = '#dc2626';
    } else { tdT.textContent = '—'; }
    tr.appendChild(tdT);

    var tdM = el('td'); tdM.textContent = u.medicine_count || 0; tr.appendChild(tdM);

    var tdA = el('td');
    var adh = u.adherence_pct != null ? Math.round(u.adherence_pct) : null;
    tdA.textContent = adh != null ? adh + '%' : '—';
    if (adh != null) tdA.className = adh >= 80 ? 'ui-adh-high' : adh >= 50 ? 'ui-adh-mid' : 'ui-adh-low';
    tr.appendChild(tdA);

    var tdL = el('td'); tdL.style.fontSize = '0.72rem';
    tdL.textContent = u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never';
    tr.appendChild(tdL);

    var tdMem = el('td'); tdMem.textContent = u.elara_memory_depth || 0; tr.appendChild(tdMem);

    var tdBtn = el('td');
    var btn = el('button'); btn.className = 'ui-target-btn'; btn.textContent = 'Target';
    btn.setAttribute('onclick', 'uiTargetUser("'+encodeURIComponent(JSON.stringify({name:u.first_name,email:u.email,plan:u.plan}))+'")');
    tdBtn.appendChild(btn); tr.appendChild(tdBtn);

    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);
}

function uiTargetUser(encoded) {
  var u = JSON.parse(decodeURIComponent(encoded));
  alert('Hermes targeting: ' + (u.name||u.email) + ' (' + u.plan + ')\nTelegram brief will be sent to TJ + Prabh.');
}

function exportUserIntelCSV() {
  var rows = [['Name','Email','Plan','Trial Days Left','Medicines','Adherence %','Last Active','Elara Memory']];
  _uiUsers.forEach(function(u) {
    rows.push([u.first_name||'',u.email||'',u.plan||'',u.trial_days_remaining||'',
               u.medicine_count||0, u.adherence_pct!=null?Math.round(u.adherence_pct)+'%':'',
               u.last_active||'',u.elara_memory_depth||0]);
  });
  var csv = rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\r\n');
  var blob = new Blob([csv],{type:'text/csv'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href=url; a.download='carely-users-'+new Date().toISOString().slice(0,10)+'.csv';
  a.click(); URL.revokeObjectURL(url);
}


// ══════════════════════════════════════════════════════════════════════════════
// ─── HEALTH INSIGHTS ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function loadHealthInsights() {
  fetch(_IB + '/admin/health-insights', { headers: { 'x-carely-secret': _IS } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      txt('hi-adherence', d.overall_adherence_pct != null ? d.overall_adherence_pct + '%' : '0%');
      txt('hi-total-logs', d.dose_response_breakdown ? d.dose_response_breakdown.total : 0);
      txt('hi-medicines', d.total_medicines || 0);
      txt('hi-vitals', d.total_vitals_logged || 0);

      // Dose breakdown bars
      var db = d.dose_response_breakdown || {};
      var dbCont = document.getElementById('hi-dose-breakdown');
      if (dbCont) {
        dbCont.textContent = '';
        var total = db.total || 1;
        var entries = [
          { label: 'Taken on time', count: db.taken||0, color: '#02C39A' },
          { label: 'Snoozed',       count: db.snoozed||0, color: '#d97706' },
          { label: 'Skipped',       count: db.skipped||0, color: '#f97316' },
          { label: 'Missed',        count: db.missed||0,  color: '#dc2626' },
        ];
        entries.forEach(function(e) {
          var row = el('div'); row.className = 'hi-bar-row';
          var top = el('div'); top.className = 'hi-bar-top';
          var lbl = el('span'); lbl.className = 'hi-bar-label'; lbl.textContent = e.label;
          var cnt = el('span'); cnt.className = 'hi-bar-count'; cnt.textContent = e.count;
          top.appendChild(lbl); top.appendChild(cnt); row.appendChild(top);
          var track = el('div'); track.className = 'hi-track';
          var fill  = el('div'); fill.className  = 'hi-fill';
          fill.style.cssText = 'width:' + Math.round((e.count/total)*100) + '%;background:' + e.color;
          track.appendChild(fill); row.appendChild(track); dbCont.appendChild(row);
        });
      }

      // Dose types
      var dtCont = document.getElementById('hi-dose-types');
      if (dtCont && d.dose_type_breakdown) {
        dtCont.textContent = '';
        var types = d.dose_type_breakdown;
        var maxT = Math.max(1, Math.max.apply(null, Object.values(types).map(Number)));
        Object.keys(types).forEach(function(k) {
          var v = Number(types[k]);
          var row = el('div'); row.className = 'hi-bar-row';
          var top = el('div'); top.className = 'hi-bar-top';
          var lbl = el('span'); lbl.className = 'hi-bar-label'; lbl.textContent = k || 'other';
          var cnt = el('span'); cnt.className = 'hi-bar-count'; cnt.textContent = v;
          top.appendChild(lbl); top.appendChild(cnt); row.appendChild(top);
          var track = el('div'); track.className = 'hi-track';
          var fill  = el('div'); fill.className  = 'hi-fill';
          fill.style.cssText = 'width:' + Math.round((v/maxT)*100) + '%;background:#028090';
          track.appendChild(fill); row.appendChild(track); dtCont.appendChild(row);
        });
        if (!Object.keys(types).length) { var em = el('div'); em.style.cssText='padding:12px;color:var(--g500);font-size:0.78rem'; em.textContent='No data yet'; dtCont.appendChild(em); }
      }

      // Plan distribution
      var pdCont = document.getElementById('hi-plan-dist');
      if (pdCont && d.plan_breakdown) {
        pdCont.textContent = '';
        var plans = d.plan_breakdown;
        var maxP = Math.max(1, Math.max.apply(null, Object.values(plans).map(Number)));
        var colors = { trial:'#7c3aed', founding:'#b45309', monthly:'#028090', annual:'#059669' };
        Object.keys(plans).forEach(function(k) {
          var v = Number(plans[k]);
          var row = el('div'); row.className = 'hi-bar-row';
          var top = el('div'); top.className = 'hi-bar-top';
          var lbl = el('span'); lbl.className = 'hi-bar-label'; lbl.textContent = k;
          var cnt = el('span'); cnt.className = 'hi-bar-count'; cnt.textContent = v + ' users';
          top.appendChild(lbl); top.appendChild(cnt); row.appendChild(top);
          var track = el('div'); track.className = 'hi-track';
          var fill  = el('div'); fill.className  = 'hi-fill';
          fill.style.cssText = 'width:' + Math.round((v/maxP)*100) + '%;background:'+(colors[k]||'#6b7280');
          track.appendChild(fill); row.appendChild(track); pdCont.appendChild(row);
        });
      }

      // Weekly signups
      var wsCont = document.getElementById('hi-signup-trend');
      if (wsCont && d.weekly_signups) {
        wsCont.textContent = '';
        var weeks = d.weekly_signups;
        var maxW = Math.max(1, Math.max.apply(null, weeks.map(function(w){ return w.count; })));
        weeks.forEach(function(w) {
          var row = el('div'); row.className = 'hi-bar-row';
          var top = el('div'); top.className = 'hi-bar-top';
          var lbl = el('span'); lbl.className = 'hi-bar-label'; lbl.textContent = w.week;
          var cnt = el('span'); cnt.className = 'hi-bar-count'; cnt.textContent = w.count;
          top.appendChild(lbl); top.appendChild(cnt); row.appendChild(top);
          var track = el('div'); track.className = 'hi-track';
          var fill  = el('div'); fill.className  = 'hi-fill';
          fill.style.cssText = 'width:' + Math.round((w.count/maxW)*100) + '%;background:#02C39A';
          track.appendChild(fill); row.appendChild(track); wsCont.appendChild(row);
        });
      }
    })
    .catch(function() {
      ['hi-adherence','hi-total-logs','hi-medicines','hi-vitals'].forEach(function(id){ txt(id,'—'); });
    });
}


// Init
filterFiles();
