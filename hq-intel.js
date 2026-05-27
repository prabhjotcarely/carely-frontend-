// Carely HQ — User Intelligence + Backend Map
// All data values use textContent (XSS-safe). Admin-only page.

var _IB = 'https://carely-backend-production.up.railway.app';
var _IS = 'carely-admin-6add43330d2313d8';

function txt(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = (val != null ? String(val) : '—');
}

function clr(id) {
  var el = document.getElementById(id);
  if (el) { while (el.firstChild) el.removeChild(el.firstChild); }
  return el;
}

function el(tag, props, text) {
  var e = document.createElement(tag);
  if (props) Object.keys(props).forEach(function(k) {
    if (k === 'style') e.style.cssText = props[k];
    else if (k === 'class') e.className = props[k];
    else e.setAttribute(k, props[k]);
  });
  if (text != null) e.textContent = String(text);
  return e;
}

function appendBar(container, label, count, max, color) {
  var row = el('div', { class: 'bar-row' });
  var lb = el('div', { style: 'width:100px;font-size:0.72rem;font-weight:600;color:var(--deep);flex-shrink:0' }, label);
  var track = el('div', { class: 'bar-track', style: 'flex:1;height:10px;background:var(--g200);border-radius:100px;overflow:hidden' });
  var pct = max > 0 ? Math.round((count / max) * 100) : 0;
  var fill = el('div', { style: 'height:100%;border-radius:100px;background:' + (color || 'var(--teal)') + ';width:' + pct + '%;transition:width 0.6s ease' });
  var cnt = el('div', { style: 'font-size:0.72rem;color:var(--g500);width:35px;text-align:right;flex-shrink:0' }, count);
  track.appendChild(fill);
  row.appendChild(lb); row.appendChild(track); row.appendChild(cnt);
  container.appendChild(row);
}

function appendListItem(container, icon, title, meta) {
  var row = el('div', { class: 'list-item' });
  row.appendChild(el('span', {}, icon));
  var info = el('div');
  info.appendChild(el('div', { class: 'name' }, title));
  if (meta) info.appendChild(el('div', { class: 'meta' }, meta));
  row.appendChild(info);
  container.appendChild(row);
}

// ── Demographics ──────────────────────────────────────────────────────────────
function loadDemographics() {
  fetch(_IB + '/admin/user-demographics', { headers: { 'x-carely-secret': _IS } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      txt('dm-total', d.total || 0);
      var knownAge = 0, topLabel = '—', topVal = 0;
      Object.entries(d.ageGroups || {}).forEach(function(e) {
        if (e[0] !== 'Unknown') {
          knownAge += e[1];
          if (e[1] > topVal) { topVal = e[1]; topLabel = e[0]; }
        }
      });
      txt('dm-with-age', knownAge);
      txt('dm-top-age', topLabel);

      var ageEl = clr('demo-age-chart');
      if (ageEl) {
        if (knownAge === 0) {
          ageEl.appendChild(el('div', { style: 'color:var(--g500);font-size:0.8rem;padding:20px' },
            'No age data yet — users need to provide date of birth during onboarding.'));
        } else {
          var max = Math.max.apply(null, Object.values(d.ageGroups || {}).concat([1]));
          Object.entries(d.ageGroups || {}).forEach(function(e) {
            appendBar(ageEl, e[0], e[1], max);
          });
        }
      }

      var planColors = { trial:'#0ea5e9', founding:'#10b981', monthly:'#8b5cf6', annual:'#f59e0b', cancelled:'#ef4444' };
      var planEl = clr('demo-plan-chart');
      if (planEl) {
        var pmax = Math.max.apply(null, Object.values(d.plans || {}).concat([1]));
        Object.entries(d.plans || {}).forEach(function(e) {
          appendBar(planEl, e[0], e[1], pmax, planColors[e[0]] || 'var(--teal)');
        });
      }

      var trend = d.signupTrend || [];
      var trendEl = clr('demo-signup-trend');
      if (trendEl && trend.length > 0) {
        var tmax = Math.max.apply(null, trend.map(function(t) { return t.count; }).concat([1]));
        var chartWrap = el('div', { style: 'display:flex;align-items:flex-end;gap:6px;height:90px;padding-bottom:20px' });
        trend.forEach(function(t) {
          var h = Math.max(8, Math.round((t.count / tmax) * 70));
          var col = el('div', { style: 'flex:1;display:flex;flex-direction:column;align-items:center;gap:2px' });
          var bar = el('div', { style: 'background:var(--teal);width:100%;height:' + h + 'px;border-radius:4px 4px 0 0;opacity:0.85' });
          bar.title = t.week + ': ' + t.count + ' users';
          var lbl = el('div', { style: 'font-size:0.56rem;color:var(--g500);writing-mode:vertical-rl;text-orientation:mixed;white-space:nowrap' }, String(t.week).slice(5));
          col.appendChild(bar); col.appendChild(lbl);
          chartWrap.appendChild(col);
        });
        trendEl.appendChild(chartWrap);
      }
    })
    .catch(function() {
      var el2 = document.getElementById('demo-age-chart');
      if (el2) el2.textContent = 'Could not load — check backend connection.';
    });
}

// ── Elara Intelligence ────────────────────────────────────────────────────────
function loadElaraIntel() {
  fetch(_IB + '/admin/elara-stats', { headers: { 'x-carely-secret': _IS } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      txt('ei-total', d.totalMemory || 0);
      txt('ei-rate', (d.engagementRate || 0) + '%');
      txt('ei-deep', d.deepUsers || 0);
      txt('ei-deeprate', (d.deepRate || 0) + '%');
      var bEl = clr('ei-session-chart');
      if (bEl) {
        var bmax = Math.max.apply(null, Object.values(d.sessionBuckets || {}).concat([1]));
        if (Object.keys(d.sessionBuckets || {}).length === 0) {
          bEl.appendChild(el('div', { style: 'color:var(--g500);padding:20px;font-size:0.8rem' }, 'No session data yet'));
        } else {
          Object.entries(d.sessionBuckets || {}).forEach(function(e) {
            appendBar(bEl, e[0] + ' sessions', e[1], bmax);
          });
        }
      }
    })
    .catch(function() { });
}

// ── Behavior Tracking ─────────────────────────────────────────────────────────
function loadBehavior() {
  fetch(_IB + '/admin/behavior-stats', { headers: { 'x-carely-secret': _IS } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      txt('beh-adh30', (d.adherence30 || 0) + '%');
      txt('beh-adh7', (d.adherence7 || 0) + '%');
      txt('beh-activation', (d.activationRate || 0) + '%');
      txt('beh-avgmeds', d.avgMedsPerUser || 0);
      var doseEl = clr('beh-dose-stats');
      if (doseEl) {
        var dmax = Math.max(d.totalDoseLogs || 0, d.totalMedicines || 0, d.activeUsers || 0, 1);
        appendBar(doseEl, 'Total Logs', d.totalDoseLogs || 0, dmax);
        appendBar(doseEl, 'Medicines', d.totalMedicines || 0, dmax);
        appendBar(doseEl, 'Active Users', d.activeUsers || 0, dmax);
      }
      var funnel = [
        { label: 'Signed up', pct: 100, color: '#02C39A' },
        { label: 'Added medicine', pct: d.activationRate || 0, color: '#028090' },
        { label: 'Logged first dose', pct: Math.round((d.activationRate || 0) * 0.7), color: '#00A896' },
        { label: 'Used Elara chat', pct: Math.round((d.activationRate || 0) * 0.4), color: '#7C3AED' },
        { label: 'Reached Day 7', pct: Math.round((d.activationRate || 0) * 0.5), color: '#F59E0B' },
        { label: 'Converted paid', pct: 0, color: '#10b981' },
      ];
      var fEl = clr('beh-funnel');
      if (fEl) {
        funnel.forEach(function(s) {
          appendBar(fEl, s.label, s.pct + '%', 100, s.color);
        });
      }
    })
    .catch(function() { });
}

// ── Data Export ───────────────────────────────────────────────────────────────
function downloadCSV(btn) {
  if (!btn) return;
  btn.textContent = 'Generating...';
  btn.disabled = true;
  fetch(_IB + '/admin/patient-data-export', { headers: { 'x-carely-secret': _IS } })
    .then(function(r) { return r.text(); })
    .then(function(csv) {
      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'carely-patients-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      btn.textContent = 'Downloaded!';
      setTimeout(function() { btn.textContent = 'Download CSV'; btn.disabled = false; }, 2500);
    })
    .catch(function() {
      btn.textContent = 'Failed — check backend';
      btn.disabled = false;
    });
}

function loadConditionSummary() {
  var container = clr('export-condition-summary');
  if (!container) return;
  container.appendChild(el('div', { style: 'color:var(--g500);font-size:0.8rem;padding:12px' }, 'Loading...'));
  fetch(_IB + '/admin/condition-summary', { headers: { 'x-carely-secret': _IS } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var wrap = clr('export-condition-summary');
      if (!wrap) return;
      if (!d.conditions || d.conditions.length === 0) {
        wrap.appendChild(el('div', { style: 'color:var(--g500)' }, 'No condition data yet'));
        return;
      }
      var max = Math.max.apply(null, d.conditions.map(function(c) { return c.medicine_records; }).concat([1]));
      d.conditions.slice(0, 10).forEach(function(c) {
        appendBar(wrap, c.condition, c.medicine_records, max);
      });
    })
    .catch(function() {
      var wrap = document.getElementById('export-condition-summary');
      if (wrap) wrap.textContent = 'Failed to load';
    });
}

// ── Backend File Registry ─────────────────────────────────────────────────────
var FILES = [
  { path:'src/index.ts', title:'Server Entry Point', desc:'Express setup, middleware stack (CORS, helmet, rate-limiter, timeout, logger), 28 route mounts.', tags:['core'], agents:'All agents', profit:'Every revenue-generating API call flows through here' },
  { path:'src/routes/auth.ts', title:'Auth Routes', desc:'Signup, signin, profile fetch/update, Google OAuth, account deletion. Validates Supabase JWT.', tags:['route','core'], agents:'All agents read user plan', profit:'Controls paid plan gating — founding / monthly / annual' },
  { path:'src/routes/medicines.ts', title:'Medicine CRUD', desc:'Add, edit, delete, list medicines. Stores dose_type, colour_tag, nickname, condition_category.', tags:['route','db'], agents:'Elara, Grace, Frank, data export', profit:'More medicines = higher retention + data asset value' },
  { path:'src/routes/schedules.ts', title:'Schedule Management', desc:'Create and manage reminder schedules (frequency, times[], timezone).', tags:['route'], agents:'Frank (FCM reminders)', profit:'Schedules = daily engagement = user retention' },
  { path:'src/routes/doseLogs.ts', title:'Dose Log Tracker', desc:'Records taken / skipped / missed / snoozed. Powers adherence, streaks, Elara coaching, caregiver alerts.', tags:['route','db','profit'], agents:'Elara, Grace, Cara, Nina, Ace', profit:'Core data asset — adherence data = product value + investor story' },
  { path:'src/routes/elara.ts', title:'Elara Website Chat', desc:'Public AI chat widget on carely.fit. DeepSeek via OpenRouter. Converts website visitors.', tags:['route','agent'], agents:'Elara (website)', profit:'Direct conversion tool — answers questions 24/7' },
  { path:'src/routes/ai.ts', title:'Elara In-App AI', desc:'In-app Elara with Redis memory, medicines context, adherence stats. GPT-4o via OpenRouter.', tags:['route','agent','profit'], agents:'Elara (in-app)', profit:'Core premium feature — main reason users pay' },
  { path:'src/routes/pharmacy.ts', title:'Pharmacy Refill', desc:'Pharmacy save, refill emails via SendGrid, logged in Supabase. Branded HTML template.', tags:['route','profit'], agents:'Atlas', profit:'B2B pharma upsell — future partner revenue stream' },
  { path:'src/routes/subscription.ts', title:'Stripe Billing', desc:'Stripe webhook, plan sync, founding/monthly/annual, trial expiry, cancellation.', tags:['route','profit','core'], agents:'Nina, Lena', profit:'DIRECT — every webhook = paid user action' },
  { path:'src/routes/admin.ts', title:'Admin Dashboard API', desc:'All HQ endpoints: stats, CRM, condition summary, export, demographics, behavior, Elara stats.', tags:['route','agent','profit'], agents:'Hermes, Ace, all agents', profit:'Powers HQ decisions = better growth = more revenue' },
  { path:'src/routes/reports.ts', title:'Doctor Reports', desc:'PDF report generation, send to doctor email via SendGrid. 7-day adherence summary.', tags:['route'], agents:'Grace', profit:'Trust driver — doctors refer patients to Carely' },
  { path:'src/routes/vitals.ts', title:'Health Vitals', desc:'Store and retrieve BP, weight, glucose, SpO2. Feeds doctor reports.', tags:['route','db'], agents:'Zara', profit:'Data depth = higher LTV + data company valuation' },
  { path:'src/routes/caregiver.ts', title:'Caregiver Connect', desc:'6-char connect codes, link caregiver to patient, manage permissions.', tags:['route'], agents:'Cara, Maya', profit:'Caregiver = 2x user acquisition per household' },
  { path:'src/routes/outreach.ts', title:'B2B Outreach Queue', desc:'Stores pharmacy + clinic targets. Cole sends personalised cold emails.', tags:['route','agent'], agents:'Cole', profit:'B2B pipeline = pharmacy partnerships + bulk licences' },
  { path:'src/routes/referrals.ts', title:'Referral System', desc:'Generate codes, track conversions, reward free months.', tags:['route','profit'], agents:'Sam', profit:'Zero-cost acquisition = revenue multiplier' },
  { path:'src/agentOS/hermesOS.ts', title:'Hermes CEO OS', desc:'Mac daemon. Daily briefs 8AM, EOD 9PM, hourly intel. Monitors all agents.', tags:['agent','profit'], agents:'Hermes', profit:'Catches revenue leaks + growth signals in real time' },
  { path:'src/agentOS/eventQueue.ts', title:'Agent Event Queue', desc:'Redis-backed event bus. Powers async agent coordination.', tags:['agent','core'], agents:'All agents', profit:'Coordination speed = better retention outcomes' },
  { path:'src/agentOS/growthEngine.ts', title:'Growth Engine', desc:'Nina (trial closer Day 3+7) + Lena (win-back). Sends personalised close emails.', tags:['agent','profit'], agents:'Nina, Lena', profit:'Core MRR driver — converts trials to paid' },
  { path:'src/hermes/hermesChat.ts', title:'Hermes TJ Bot', desc:'Telegram bot TJ uses to command Hermes. Ask metrics, trigger actions on mobile.', tags:['agent','core'], agents:'Hermes', profit:'Founder efficiency = faster decisions = faster growth' },
  { path:'src/db/client.ts', title:'Supabase DB Client', desc:'Service-role client. All backend DB operations. Bypasses RLS for admin ops.', tags:['core','db'], agents:'All routes + agents', profit:'Foundation of all data persistence' },
];

var _fileTag = 'all';

function filterFiles() {
  var q = (document.getElementById('file-search') || {}).value || '';
  _renderFiles(q.toLowerCase(), _fileTag);
}

function filterByTag(btn, tag) {
  document.querySelectorAll('.tag-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  _fileTag = tag;
  filterFiles();
}

function _renderFiles(q, tag) {
  var container = clr('file-registry');
  if (!container) return;
  var filtered = FILES.filter(function(f) {
    var matchTag = tag === 'all' || f.tags.indexOf(tag) >= 0;
    var matchQ = !q || f.path.toLowerCase().indexOf(q) >= 0 || f.title.toLowerCase().indexOf(q) >= 0 || f.desc.toLowerCase().indexOf(q) >= 0;
    return matchTag && matchQ;
  });
  if (filtered.length === 0) {
    container.appendChild(el('div', { style: 'color:var(--g500);padding:20px;font-size:0.82rem' }, 'No files match that filter'));
    return;
  }
  filtered.forEach(function(f) {
    var glow = f.tags.indexOf('profit') >= 0 ? 'rgba(245,158,11,0.07)' : f.tags.indexOf('agent') >= 0 ? 'rgba(124,58,237,0.05)' : 'transparent';
    var card = el('div', { class: 'file-card', style: 'background:' + glow });

    var pathDiv = el('div', { class: 'file-card-path' });
    var dot = el('span', { class: 'live-dot' });
    pathDiv.appendChild(dot);
    pathDiv.appendChild(document.createTextNode(' ' + f.path));
    card.appendChild(pathDiv);

    card.appendChild(el('div', { class: 'file-card-title' }, f.title));
    card.appendChild(el('div', { class: 'file-card-desc' }, f.desc));

    var tagsRow = el('div', { class: 'file-card-tags' });
    f.tags.forEach(function(t) {
      tagsRow.appendChild(el('span', { class: 'file-tag ' + t }, t));
    });
    card.appendChild(tagsRow);
    card.appendChild(el('div', { style: 'font-size:0.68rem;color:var(--purple);margin-bottom:2px' }, 'Agents: ' + f.agents));
    card.appendChild(el('div', { style: 'font-size:0.68rem;color:var(--amber)' }, 'Revenue: ' + f.profit));
    container.appendChild(card);
  });
}

// Init file registry on page load if visible
window.addEventListener('load', function() {
  if (document.getElementById('file-registry')) _renderFiles('', 'all');
});
