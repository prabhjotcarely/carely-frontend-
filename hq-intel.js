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
// ─── FILE REGISTRY — TABLE VIEW ──────────────────────────────────────────────
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
var _filesSortCol  = '';
var _filesSortAsc  = true;
var _filesExpanded = {};
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
  if (_filesSortCol) _applySortFiles();
  _renderFiles();
}

function filterByTag(btn, tag) {
  _filesTagFilter = tag;
  document.querySelectorAll('.fr-tag').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  filterFiles();
}

function sortFiles(col) {
  if (_filesSortCol === col) { _filesSortAsc = !_filesSortAsc; }
  else { _filesSortCol = col; _filesSortAsc = true; }
  document.querySelectorAll('.fr-table th').forEach(function(th){ th.classList.remove('sorted'); });
  var hdr = document.getElementById('fh-'+col);
  if (hdr) {
    hdr.classList.add('sorted');
    hdr.querySelector('.sort-arrow').textContent = _filesSortAsc ? '↑' : '↓';
  }
  _applySortFiles();
  _renderFiles();
}

function _applySortFiles() {
  var col = _filesSortCol;
  _filesFiltered.sort(function(a,b){
    var av = (a[col]||'').toString().toLowerCase();
    var bv = (b[col]||'').toString().toLowerCase();
    if (av < bv) return _filesSortAsc ? -1 : 1;
    if (av > bv) return _filesSortAsc ?  1 :-1;
    return 0;
  });
}

function _makeTagBadge(tag) {
  var s = el('span'); s.className = 'fr-badge badge-'+tag; s.textContent = tag.toUpperCase();
  return s;
}

function toggleFileRow(idx) {
  _filesExpanded[idx] = !_filesExpanded[idx];
  _renderFiles();
}

function _renderFiles() {
  var tbody = document.getElementById('file-registry');
  var count = document.getElementById('fr-count');
  if (!tbody) return;
  tbody.textContent = '';
  if (count) count.textContent = _filesFiltered.length + ' of ' + FILES.length + ' files';

  _filesFiltered.forEach(function(f, i) {
    var origIdx = FILES.indexOf(f);
    var expanded = !!_filesExpanded[origIdx];

    // Main row
    var tr = el('tr');
    tr.className = 'fr-row' + (expanded ? ' expanded' : '');
    tr.setAttribute('onclick', 'toggleFileRow('+origIdx+')');

    var tdNum = el('td'); tdNum.className = 'fr-row-num'; tdNum.textContent = i+1;
    tr.appendChild(tdNum);

    var tdPath = el('td');
    var pathSpan = el('span'); pathSpan.className = 'fr-path'; pathSpan.textContent = f.path;
    tdPath.appendChild(pathSpan);
    tr.appendChild(tdPath);

    var tdName = el('td');
    var nameSpan = el('span'); nameSpan.className = 'fr-name'; nameSpan.textContent = f.title;
    tdName.appendChild(nameSpan);
    tr.appendChild(tdName);

    var tdTags = el('td');
    f.tags.forEach(function(t){ tdTags.appendChild(_makeTagBadge(t)); });
    tr.appendChild(tdTags);

    var tdAgents = el('td'); tdAgents.className = 'fr-agents'; tdAgents.textContent = f.agents;
    tr.appendChild(tdAgents);

    var tdProfit = el('td'); tdProfit.className = 'fr-profit'; tdProfit.textContent = f.profit;
    tr.appendChild(tdProfit);

    var tdChev = el('td');
    var chev = el('span'); chev.className = 'fr-chevron'; chev.textContent = '›';
    tdChev.appendChild(chev);
    tr.appendChild(tdChev);

    tbody.appendChild(tr);

    // Expanded detail row
    if (expanded) {
      var trExp = el('tr'); trExp.className = 'fr-expand-row';
      var tdExp = el('td'); tdExp.setAttribute('colspan', '7');

      var grid = el('div'); grid.className = 'fr-expand-grid';

      var s1 = el('div'); s1.className = 'fr-expand-section';
      var l1 = el('div'); l1.className = 'fr-expand-label'; l1.textContent = 'Description';
      var v1 = el('div'); v1.className = 'fr-expand-val';   v1.textContent = f.desc;
      s1.appendChild(l1); s1.appendChild(v1); grid.appendChild(s1);

      var s2 = el('div'); s2.className = 'fr-expand-section';
      var l2 = el('div'); l2.className = 'fr-expand-label'; l2.textContent = 'Agents Using This File';
      var v2 = el('div'); v2.className = 'fr-expand-val';   v2.textContent = f.agents;
      s2.appendChild(l2); s2.appendChild(v2); grid.appendChild(s2);

      var s3 = el('div'); s3.className = 'fr-expand-section fr-expand-profit';
      var l3 = el('div'); l3.className = 'fr-expand-label'; l3.textContent = 'Revenue Impact';
      var v3 = el('div'); v3.className = 'fr-expand-val';   v3.textContent = f.profit;
      s3.appendChild(l3); s3.appendChild(v3); grid.appendChild(s3);

      tdExp.appendChild(grid);
      trExp.appendChild(tdExp);
      tbody.appendChild(trExp);
    }
  });
}

// ─── Export File Registry as CSV ──────────────────────────────────────────────
function exportFilesCSV() {
  var rows = [['Path','Name','Tags','Agents','Revenue Impact','Description']];
  _filesFiltered.forEach(function(f) {
    rows.push([
      f.path,
      f.title,
      f.tags.join(', '),
      f.agents,
      f.profit,
      f.desc
    ]);
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
  a.href = url;
  a.download = 'carely-file-registry-'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Init on page load
filterFiles();
