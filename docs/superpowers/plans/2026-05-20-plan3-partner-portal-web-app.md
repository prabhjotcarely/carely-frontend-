# Partner Portal Web + App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the web portals and React Native app to the partner backend — real form submissions, real portal auth, demo mode preserved, new app screens for partner connection and pharmacy requests.

**Architecture:** Web portals use vanilla JS + fetch to call the backend. App adds four new screens (ConnectPartner, PartnerConsent, ConnectedPartners, PharmacyRequest) plus enhancements to ProfileScreen and MedicinesScreen. Demo mode is a query-param switch on every portal — `?demo=true` shows hardcoded data, no auth required. Live mode requires session token stored in `sessionStorage`.

**Tech Stack:** Vanilla HTML/JS (portals), React Native + TypeScript (app), existing API_BASE pattern, existing app colors (#028090 teal, #02C39A mint, #0B2D3D deep)

**Security note:** All portal JS uses safe DOM manipulation (`textContent`, `createElement`) — never `innerHTML` with user-controlled content. AI chat replies rendered via `textContent` only.

---

## File Map

**Create (web):**
- `portal/activate.html` — partner self-activation page (set password via token)
- `join.html` — referral landing page (`?ref=TOKEN`, validates token, App Store CTA)

**Modify (web):**
- `for-doctors.html` — wire form to `POST /partner/apply`, replace mailto
- `for-pharmacies.html` — same
- `for-senior-homes.html` — same
- `clinic-portal.html` — replace PIN with `?demo=true` logic + real session auth
- `care-portal.html` — same pattern
- `doctor-portal.html` — add real session auth + patient list from API

**Create (app):**
- `src/screens/partners/ConnectPartnerScreen.tsx` — enter partner code or scan QR
- `src/screens/partners/PartnerConsentScreen.tsx` — consent flow for specific request
- `src/screens/partners/ConnectedPartnersScreen.tsx` — list active connections + disconnect
- `src/components/PharmacyRequestModal.tsx` — refill + general request modal

**Modify (app):**
- `src/screens/profile/ProfileScreen.tsx` — add "Connected Partners" row
- `src/screens/medicines/MedicinesScreen.tsx` — enhance Refill button with pharmacy send
- `src/navigation/RootNavigator.tsx` — register new screens
- `src/services/api.ts` — add partner API calls

---

### Task 1: Partner Activation Page

**Files:**
- Create: `portal/activate.html`

- [ ] **Step 1: Write the failing test (manual)**

Open `https://carely.fit/portal/activate?token=invalid-token-12345` in a browser.
Expected right now: 404 page.

- [ ] **Step 2: Create `portal/activate.html`**

First: `mkdir -p /Users/taran27/carely-frontend/portal`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Activate Partner Account — Carely</title>
  <link rel="icon" type="image/png" href="../elara-3d-new.png" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0D3347 0%, #028090 60%, #02C39A 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 20px; padding: 48px 40px; width: 440px; max-width: 100%; box-shadow: 0 32px 80px rgba(13,51,71,.35); }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .logo img { height: 40px; }
    .logo span { font-size: 1.2rem; font-weight: 800; color: #0D3347; }
    h1 { font-size: 1.5rem; font-weight: 800; color: #0D3347; margin-bottom: 6px; margin-top: 24px; }
    .subtitle { font-size: 0.9rem; color: #6b8fa3; margin-bottom: 32px; }
    label { display: block; font-size: 0.78rem; font-weight: 700; color: #6b8fa3; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 5px; }
    input[type="password"] { width: 100%; padding: 12px 14px; border: 1.5px solid #e0eaf0; border-radius: 10px; font-size: 0.95rem; color: #0d3347; background: #f8fbfc; outline: none; font-family: inherit; transition: border-color 0.2s; margin-bottom: 16px; }
    input[type="password"]:focus { border-color: #028090; box-shadow: 0 0 0 3px rgba(2,128,144,0.1); }
    .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #028090, #02C39A); color: #fff; border: none; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 4px; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #e53e3e; font-size: 0.85rem; margin-top: 10px; display: none; }
    .success { display: none; text-align: center; }
    .success h2 { font-size: 1.3rem; font-weight: 800; color: #0D3347; margin-bottom: 8px; }
    .success p { font-size: 0.9rem; color: #6b8fa3; margin-bottom: 16px; }
    .invite-code { background: #e0faf4; border: 1.5px solid #02C39A; border-radius: 10px; padding: 12px 16px; font-size: 1.2rem; font-weight: 800; color: #0D3347; text-align: center; letter-spacing: 0.05em; margin: 12px 0; }
    .portal-btn { display: block; width: 100%; padding: 13px; background: #0D3347; color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; text-decoration: none; text-align: center; font-family: inherit; }
    .req-list { font-size: 0.8rem; color: #9ab8c4; margin-top: -8px; margin-bottom: 16px; line-height: 1.8; }
    .token-error { text-align: center; padding: 20px 0; }
    .token-error h2 { font-size: 1.2rem; color: #e53e3e; font-weight: 800; margin-bottom: 8px; }
    .token-error p { font-size: 0.88rem; color: #6b8fa3; }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">
    <img src="../elara-bot-logo.png" alt="Carely" />
    <span>Carely</span>
  </div>

  <div id="loading">
    <h1>Activating your account...</h1>
    <p class="subtitle">Verifying your activation link.</p>
  </div>

  <div id="token-error" style="display:none" class="token-error">
    <h2>Link expired or invalid</h2>
    <p>This activation link has expired or already been used.<br/>
       Email <a href="mailto:hello@carely.fit" style="color:#028090">hello@carely.fit</a> to request a new one.</p>
  </div>

  <div id="setup-form" style="display:none">
    <h1>Set your password</h1>
    <p class="subtitle" id="org-name-sub">Create a secure password for your Carely portal.</p>
    <label for="pw1">Password</label>
    <input type="password" id="pw1" placeholder="At least 10 characters" />
    <label for="pw2">Confirm Password</label>
    <input type="password" id="pw2" placeholder="Re-enter your password" />
    <p class="req-list">Must be at least 10 characters</p>
    <button class="btn" id="activate-btn" onclick="doActivate()">Activate My Account</button>
    <p class="error" id="activate-err"></p>
  </div>

  <div id="success" class="success">
    <img src="../elara-bot-logo.png" style="height:60px;margin-bottom:16px;" />
    <h2>You're in!</h2>
    <p>Your Carely partner account is live. Share this invite code with patients so they can connect to you in the Carely app.</p>
    <div class="invite-code" id="invite-code-display"></div>
    <p style="font-size:0.8rem;color:#9ab8c4;margin-bottom:16px;">Patients enter this code under Profile › Connect with a Partner</p>
    <a href="#" id="go-to-portal" class="portal-btn">Go to my portal</a>
  </div>
</div>

<script>
var API = 'https://carely-backend-production.up.railway.app';
var params = new URLSearchParams(location.search);
var token = params.get('token');

if (!token) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('token-error').style.display = 'block';
} else {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('setup-form').style.display = 'block';
}

async function doActivate() {
  var pw1 = document.getElementById('pw1').value;
  var pw2 = document.getElementById('pw2').value;
  var btn = document.getElementById('activate-btn');
  var err = document.getElementById('activate-err');
  err.style.display = 'none';

  if (pw1.length < 10) { showErr('Password must be at least 10 characters.'); return; }
  if (pw1 !== pw2) { showErr('Passwords do not match.'); return; }

  btn.disabled = true;
  btn.textContent = 'Activating...';

  try {
    var res = await fetch(API + '/partner/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, password: pw1 }),
    });
    var data = await res.json();
    if (!res.ok) {
      if (res.status === 410) {
        document.getElementById('setup-form').style.display = 'none';
        document.getElementById('token-error').style.display = 'block';
      } else {
        showErr(data.message || 'Something went wrong. Try again.');
        btn.disabled = false;
        btn.textContent = 'Activate My Account';
      }
      return;
    }
    // Use textContent to safely display server values
    document.getElementById('invite-code-display').textContent = data.invite_code || '';
    document.getElementById('go-to-portal').href = data.portal_url || '/';
    document.getElementById('setup-form').style.display = 'none';
    document.getElementById('success').style.display = 'block';
  } catch(e) {
    showErr('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Activate My Account';
  }
}

function showErr(msg) {
  var err = document.getElementById('activate-err');
  err.textContent = msg; // textContent — safe
  err.style.display = 'block';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doActivate();
});
</script>
</body>
</html>
```

- [ ] **Step 3: Verify manually**

Open `file:///Users/taran27/carely-frontend/portal/activate.html?token=test-uuid` in browser.
Expected: Set password form visible.
Open without token: Expected: "Link expired or invalid" message.

- [ ] **Step 4: Commit**

```bash
cd /Users/taran27/carely-frontend
mkdir -p portal
git add portal/activate.html
git commit -m "feat: add partner account activation page"
```

---

### Task 2: Referral Landing Page

**Files:**
- Create: `join.html`

- [ ] **Step 1: Write `join.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to Carely</title>
  <link rel="icon" type="image/png" href="elara-3d-new.png" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: linear-gradient(160deg, #0D3347 0%, #028090 50%, #02C39A 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 24px; padding: 48px 40px; width: 480px; max-width: 100%; box-shadow: 0 40px 100px rgba(13,51,71,.4); text-align: center; }
    .logo { height: 64px; margin-bottom: 24px; }
    .badge { display: inline-block; background: #e0faf4; color: #028090; border: 1.5px solid #02C39A; border-radius: 20px; padding: 5px 16px; font-size: 0.8rem; font-weight: 700; margin-bottom: 16px; }
    h1 { font-size: 1.8rem; font-weight: 900; color: #0D3347; margin-bottom: 10px; letter-spacing: -0.03em; line-height: 1.2; }
    .sub { font-size: 1rem; color: #6b8fa3; margin-bottom: 32px; line-height: 1.6; }
    .offer-box { background: linear-gradient(135deg, #e0faf4, #f0f9ff); border: 1.5px solid #02C39A; border-radius: 16px; padding: 20px 24px; margin-bottom: 28px; text-align: left; }
    .offer-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .offer-row:last-child { margin-bottom: 0; }
    .check { background: #02C39A; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .offer-text { font-size: 0.9rem; color: #0D3347; font-weight: 500; line-height: 1.5; }
    .cta { display: block; width: 100%; padding: 16px; background: linear-gradient(135deg, #028090, #02C39A); color: #fff; border: none; border-radius: 12px; font-size: 1.05rem; font-weight: 800; cursor: pointer; text-decoration: none; font-family: inherit; }
    .cta-android { display: block; width: 100%; padding: 14px; background: #0D3347; color: #fff; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; text-decoration: none; margin-top: 10px; font-family: inherit; }
    .note { font-size: 0.78rem; color: #9ab8c4; margin-top: 16px; }
  </style>
</head>
<body>
<div class="card">
  <img src="elara-bot-logo.png" alt="Carely" class="logo" />
  <div class="badge" id="invite-badge">Personal Invite</div>
  <h1 id="invite-headline">You've been invited to Carely</h1>
  <p class="sub" id="invite-sub">Your friend thinks Carely can help you. Here's what you get as an invited member:</p>

  <div class="offer-box">
    <div class="offer-row">
      <div class="check">&#10003;</div>
      <div class="offer-text">Pay <strong>month 1</strong> at the normal price ($9.99)</div>
    </div>
    <div class="offer-row">
      <div class="check">&#10003;</div>
      <div class="offer-text"><strong>Month 2 is completely free</strong> — automatically applied</div>
    </div>
    <div class="offer-row">
      <div class="check">&#10003;</div>
      <div class="offer-text">Medication reminders, AI caretaker, adherence tracking — everything included</div>
    </div>
  </div>

  <a href="https://apps.apple.com/app/carely/id6771328455" id="ios-cta" class="cta">Download on the App Store</a>
  <a href="https://play.google.com/store/apps/details?id=com.carely.app" id="android-cta" class="cta-android">Get it on Google Play</a>
  <p class="note" id="expire-note">This invitation expires in 7 days. Link is personal to you.</p>
</div>

<script>
var API = 'https://carely-backend-production.up.railway.app';
var params = new URLSearchParams(location.search);
var ref = params.get('ref');

if (ref) {
  try { localStorage.setItem('carely_ref', ref); } catch(e) {}

  fetch(API + '/referrals/validate-invite?token=' + encodeURIComponent(ref))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.valid && data.inviter_name) {
        // Use textContent — safe, no XSS risk
        document.getElementById('invite-badge').textContent = 'Invited by ' + data.inviter_name;
        document.getElementById('invite-headline').textContent = data.inviter_name + ' invited you to Carely';
        document.getElementById('invite-sub').textContent =
          data.inviter_name + ' uses Carely to manage their medications and wants you to try it. As their invited guest, you get a special deal:';
        if (data.days_left !== undefined) {
          document.getElementById('expire-note').textContent =
            'This invitation expires in ' + data.days_left + ' day' + (data.days_left !== 1 ? 's' : '') + '. Link is personal to you.';
        }
      } else if (data.valid === false) {
        document.getElementById('invite-headline').textContent = 'This invite has expired';
        document.getElementById('invite-sub').textContent = 'This invitation link is no longer valid. You can still download Carely — your 7-day free trial is waiting.';
        document.getElementById('invite-badge').textContent = 'Invite Expired';
        document.getElementById('expire-note').style.display = 'none';
      }
    })
    .catch(function() {});
}

var ua = navigator.userAgent;
var isIOS = /iPhone|iPad|iPod/.test(ua);
var isAndroid = /Android/.test(ua);
if (isIOS) {
  document.getElementById('android-cta').style.display = 'none';
} else if (isAndroid) {
  document.getElementById('ios-cta').style.display = 'none';
}
</script>
</body>
</html>
```

**Backend endpoint to add to `src/routes/referrals.ts`** (needed for the validate step above):

```typescript
// GET /referrals/validate-invite?token=TOKEN — used by join.html
router.get('/validate-invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.json({ valid: false });

    const { data: invite } = await db
      .from('referral_invites')
      .select('status, expires_at, inviter_user_id')
      .eq('token', token)
      .single();

    if (!invite || invite.status !== 'pending') return res.json({ valid: false });
    if (new Date(invite.expires_at) < new Date()) return res.json({ valid: false });

    const { data: inviter } = await db
      .from('users')
      .select('first_name')
      .eq('id', invite.inviter_user_id)
      .single();

    const daysLeft = Math.ceil(
      (new Date(invite.expires_at).getTime() - Date.now()) / 86400000
    );

    res.json({ valid: true, inviter_name: inviter?.first_name ?? 'A friend', days_left: daysLeft });
  } catch (err) { next(err); }
});
```

- [ ] **Step 2: Commit**

```bash
git add join.html
git commit -m "feat: add referral invite landing page (join.html)"
```

---

### Task 3: Wire Partner Application Forms to Real Backend

**Files:**
- Modify: `for-doctors.html`
- Modify: `for-pharmacies.html`
- Modify: `for-senior-homes.html`

- [ ] **Step 1: Update `for-doctors.html` form**

Find:
```html
<form class="contact-form" action="mailto:hello@carely.fit" method="post" enctype="text/plain">
```
Replace with:
```html
<form class="contact-form" id="partner-apply-form" onsubmit="submitApplication(event)">
```

Find (the `<a href="mailto:..."` submit button):
```html
<a href="mailto:hello@carely.fit?subject=Partnership Enquiry — Doctor&body=Hi Carely team, I'm a physician and I'd like to learn more about connecting my practice to Carely." class="form-submit">Send Partnership Enquiry</a>
```
Replace with:
```html
<button type="submit" class="form-submit" id="apply-submit-btn">Send Partnership Enquiry</button>
<p id="apply-success" style="display:none;color:#028090;font-size:0.88rem;margin-top:10px;font-weight:600;">Application received. We'll be in touch within 2 business days.</p>
<p id="apply-error" style="display:none;color:#e53e3e;font-size:0.88rem;margin-top:10px;"></p>
```

Add phone field after email field in the form:
```html
<div class="form-group">
  <label for="phone">Phone Number</label>
  <input type="tel" id="phone" name="phone" placeholder="+1 604 555 0123" required />
</div>
```

Before `</body>` in `for-doctors.html`, add:
```html
<script>
async function submitApplication(e) {
  e.preventDefault();
  var btn = document.getElementById('apply-submit-btn');
  var successEl = document.getElementById('apply-success');
  var errEl = document.getElementById('apply-error');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    var res = await fetch('https://carely-backend-production.up.railway.app/partner/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:         'doctor',
        contact_name: document.getElementById('name').value.trim(),
        org_name:     document.getElementById('org').value.trim(),
        email:        document.getElementById('email').value.trim(),
        phone:        document.getElementById('phone').value.trim(),
        country:      'CA',
        message:      document.getElementById('message').value.trim(),
      }),
    });
    var data = await res.json();
    if (res.ok) {
      document.getElementById('partner-apply-form').style.display = 'none';
      successEl.style.display = 'block';
    } else {
      // Use textContent — safe, prevents XSS from server response
      errEl.textContent = data.message || 'Something went wrong. Please email hello@carely.fit';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Send Partnership Enquiry';
    }
  } catch(err) {
    errEl.textContent = 'Network error. Please email hello@carely.fit directly.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Send Partnership Enquiry';
  }
}
</script>
```

- [ ] **Step 2: Repeat for `for-pharmacies.html`**

Same pattern. Change `type: 'pharmacy'` in the fetch body. Change submit button text to `Apply to become a partner`. Check field IDs in that file (may differ from for-doctors).

- [ ] **Step 3: Repeat for `for-senior-homes.html`**

Same pattern. Change `type: 'care_home'`. Submit button text: `Book a partnership call`.

- [ ] **Step 4: Test manually**

Open `carely.fit/for-doctors` in browser.
Fill out all fields and submit.
Expected: "Application received" message replaces form.
Check Railway backend logs: `POST /partner/apply 201`.

- [ ] **Step 5: Commit each file separately**

```bash
git add for-doctors.html
git commit -m "feat: wire for-doctors form to POST /partner/apply"

git add for-pharmacies.html
git commit -m "feat: wire for-pharmacies form to POST /partner/apply"

git add for-senior-homes.html
git commit -m "feat: wire for-senior-homes form to POST /partner/apply"
```

---

### Task 4: Clinic Portal — Demo Mode + Real Auth

**Files:**
- Modify: `clinic-portal.html`

The existing portal has a hardcoded PIN "272727" and demo data. We preserve the demo data exactly and route access:
- `?demo=true` — show demo data, yellow banner, skip login
- No param — show real login form

- [ ] **Step 1: Replace the PIN gate block**

Find the `<!-- PIN GATE -->` div (lines ~149–163) and replace it entirely with:

```html
<!-- LOGIN GATE (hidden in demo mode) -->
<div id="login-gate" style="position:fixed;inset:0;background:linear-gradient(135deg,#0D3347 0%,#028090 55%,#02C39A 100%);display:flex;align-items:center;justify-content:center;z-index:9999;">
  <div style="background:#fff;border-radius:20px;padding:48px 40px;width:420px;max-width:92vw;box-shadow:0 32px 80px rgba(13,51,71,.35);">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
      <img src="elara-bot-logo.png" alt="Carely" style="height:42px;width:auto;">
      <div style="font-size:20px;font-weight:800;color:#0D3347;">Carely <span style="color:#028090;">Clinic Portal</span></div>
    </div>
    <div style="font-size:13px;color:#6b8fa3;margin-bottom:28px;">Sign in to view your patient adherence dashboard.</div>
    <label style="display:block;font-size:11px;font-weight:700;color:#6b8fa3;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px;">Email</label>
    <input type="email" id="login-email" placeholder="your@clinic.ca" style="width:100%;padding:11px 14px;border:1.5px solid #e0eaf0;border-radius:9px;font-size:14px;color:#0d3347;background:#f8fbfc;outline:none;font-family:inherit;margin-bottom:14px;" />
    <label style="display:block;font-size:11px;font-weight:700;color:#6b8fa3;text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px;">Password</label>
    <input type="password" id="login-password" placeholder="Your portal password" style="width:100%;padding:11px 14px;border:1.5px solid #e0eaf0;border-radius:9px;font-size:14px;color:#0d3347;background:#f8fbfc;outline:none;font-family:inherit;" />
    <div id="login-err" style="display:none;color:#e53e3e;font-size:13px;margin-top:8px;"></div>
    <button id="login-btn" onclick="doLogin()" style="width:100%;margin-top:20px;padding:14px;background:linear-gradient(135deg,#028090,#02C39A);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">Sign In</button>
    <div style="margin-top:16px;text-align:center;">
      <a href="?demo=true" style="font-size:12px;color:#6b8fa3;text-decoration:none;">View demo dashboard instead</a>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Replace the auth JS block**

Find `function doUnlock()` and its surrounding sessionStorage check. Replace the entire block with:

```javascript
var API = 'https://carely-backend-production.up.railway.app';
var pageParams = new URLSearchParams(location.search);
var isDemo = pageParams.get('demo') === 'true';
var sessionToken = sessionStorage.getItem('partner_session_token');

(function init() {
  if (isDemo) {
    document.getElementById('login-gate').style.display = 'none';
    document.getElementById('portal').style.display = 'block';
    markDemoMode();
    renderDemoData();
    return;
  }
  if (sessionToken) {
    fetchLiveData(sessionToken);
  } else {
    document.getElementById('login-gate').style.display = 'flex';
  }
})();

function markDemoMode() {
  var note = document.querySelector('.demo-note');
  if (note) {
    note.textContent = 'Demo mode — showing sample data for illustration purposes. Apply to become a partner at carely.fit/for-clinics';
  }
}

async function doLogin() {
  var email    = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;
  var btn      = document.getElementById('login-btn');
  var errEl    = document.getElementById('login-err');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  try {
    var res = await fetch(API + '/partner/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    });
    var data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.message || 'Invalid email or password'; // textContent — safe
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Sign In';
      return;
    }
    sessionStorage.setItem('partner_session_token', data.token);
    sessionToken = data.token;
    document.getElementById('login-gate').style.display = 'none';
    fetchLiveData(data.token);
  } catch(e) {
    errEl.textContent = 'Network error. Please try again.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

document.getElementById('login-password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doLogin();
});

function doLogout() {
  sessionStorage.removeItem('partner_session_token');
  location.href = location.pathname;
}

async function fetchLiveData(token) {
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('portal').style.display = 'block';

  var demoNote = document.querySelector('.demo-note');
  if (demoNote) demoNote.remove();

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.style.display = 'block';

  try {
    var res = await fetch(API + '/portal/patients', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    if (res.status === 401) {
      sessionStorage.removeItem('partner_session_token');
      document.getElementById('portal').style.display = 'none';
      document.getElementById('login-gate').style.display = 'flex';
      return;
    }
    var data = await res.json();
    renderLivePatients(data.patients || []);
  } catch(e) {
    renderLivePatients([]);
  }
}

function renderLivePatients(patients) {
  var statsGrid = document.getElementById('stats-grid');
  if (!statsGrid) return;

  var total   = patients.length;
  var sumAdh  = patients.reduce(function(s, p) { return s + (p.adherence_pct || 0); }, 0);
  var avgAdh  = total > 0 ? Math.round(sumAdh / total) : 0;
  var atRisk  = patients.filter(function(p) { return p.at_risk; }).length;
  var onTrack = total - atRisk;

  // Build stats using safe DOM methods
  statsGrid.textContent = '';
  var statsData = [
    { val: total,    label: 'Total Patients',      cls: '' },
    { val: avgAdh + '%', label: 'Avg Adherence (30d)', cls: 'green' },
    { val: atRisk,   label: 'At Risk (<70%)',       cls: 'red',   alert: true },
    { val: onTrack,  label: 'On Track',             cls: '' },
  ];
  statsData.forEach(function(stat) {
    var card = document.createElement('div');
    card.className = 'stat-card' + (stat.alert ? ' alert-card' : '');
    var val = document.createElement('div');
    val.className = 'stat-value' + (stat.cls ? ' ' + stat.cls : '');
    val.textContent = stat.val;
    var lbl = document.createElement('div');
    lbl.className = 'stat-label';
    lbl.textContent = stat.label;
    card.appendChild(val);
    card.appendChild(lbl);
    statsGrid.appendChild(card);
  });

  var countEl = document.getElementById('patient-count');
  if (countEl) countEl.textContent = total + ' patient' + (total !== 1 ? 's' : '');

  // Build patient table rows safely
  var tbody = document.querySelector('table tbody');
  if (!tbody) { tbody = document.createElement('tbody'); document.querySelector('table').appendChild(tbody); }
  tbody.textContent = '';

  if (patients.length === 0) {
    var emptyRow = document.createElement('tr');
    var emptyCell = document.createElement('td');
    emptyCell.colSpan = 5;
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = '40px';
    emptyCell.style.color = 'var(--grey-500)';
    emptyCell.textContent = 'No connected patients yet. Share your invite code with patients to get started.';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    patients.forEach(function(p) {
      var pct = p.adherence_pct || 0;
      var color = pct >= 80 ? 'var(--mint)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';
      var row = document.createElement('tr');
      row.className = 'clickable';
      row.addEventListener('click', function() { openPatientModal(p.id); });

      // Name cell
      var nameCell = document.createElement('td');
      var nameBold = document.createElement('strong');
      nameBold.textContent = (p.first_name || '') + ' ' + (p.last_initial || '') + '.';
      nameCell.appendChild(nameBold);

      // Adherence cell
      var adhCell = document.createElement('td');
      var adhWrap = document.createElement('div');
      adhWrap.className = 'adherence-bar-wrap';
      var adhBg = document.createElement('div');
      adhBg.className = 'adherence-bar-bg';
      var adhFill = document.createElement('div');
      adhFill.className = 'adherence-bar-fill';
      adhFill.style.width = pct + '%';
      adhFill.style.background = color;
      adhBg.appendChild(adhFill);
      var adhPct = document.createElement('span');
      adhPct.className = 'adherence-pct';
      adhPct.style.color = color;
      adhPct.textContent = p.adherence_pct !== null ? pct + '%' : '—';
      adhWrap.appendChild(adhBg);
      adhWrap.appendChild(adhPct);
      adhCell.appendChild(adhWrap);

      // Missed, last active, badge cells
      var missedCell = document.createElement('td');
      missedCell.textContent = (p.missed_7d || 0).toString();
      var lastCell = document.createElement('td');
      lastCell.textContent = p.last_active ? new Date(p.last_active).toLocaleDateString() : '—';
      var badgeCell = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'badge ' + (pct >= 70 ? 'badge-green' : 'badge-red');
      badge.textContent = pct >= 70 ? 'On track' : 'At risk';
      badgeCell.appendChild(badge);

      row.appendChild(nameCell);
      row.appendChild(adhCell);
      row.appendChild(missedCell);
      row.appendChild(lastCell);
      row.appendChild(badgeCell);
      tbody.appendChild(row);
    });
  }
}
```

**Important:** Rename the existing JS initialization (the call that sets up the demo data) to `function renderDemoData() { ... }` — wrapping the existing code. No change to the demo data itself.

- [ ] **Step 3: Add logout button to nav**

In the nav `div.nav-inner`, after the `nav-pill` span:
```html
<button id="logout-btn" onclick="doLogout()" style="display:none;background:transparent;border:1px solid var(--grey-300);color:var(--grey-500);padding:6px 14px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:inherit;">Sign out</button>
```

- [ ] **Step 4: Test manually**

`carely.fit/clinic-portal?demo=true` — demo dashboard, yellow banner, no login.
`carely.fit/clinic-portal` — login form.

- [ ] **Step 5: Commit**

```bash
git add clinic-portal.html
git commit -m "feat: clinic-portal — replace PIN 272727 with demo mode and real auth"
```

---

### Task 5: Care Portal — Demo Mode + Real Auth

**Files:**
- Modify: `care-portal.html`

- [ ] **Step 1: Find existing auth gate**

```bash
grep -n "pin\|PIN\|doUnlock\|sessionStorage\|272727\|gate" /Users/taran27/carely-frontend/care-portal.html | head -15
```

- [ ] **Step 2: Apply same replacement as Task 4**

Replace PIN gate with the login gate HTML (same as clinic-portal but change title to "Care Home Portal").

Replace `doUnlock` JS block with same JS as Task 4 (same `doLogin`, `doLogout`, `fetchLiveData`, `renderLivePatients` functions).

Rename the existing demo data render call to `renderDemoData()`.

Add logout button to nav.

- [ ] **Step 3: Commit**

```bash
git add care-portal.html
git commit -m "feat: care-portal — replace PIN gate with demo mode and real auth"
```

---

### Task 6: Doctor Portal — Real Auth + Patient List

**Files:**
- Modify: `doctor-portal.html`

- [ ] **Step 1: Find existing auth gate**

```bash
grep -n "pin\|PIN\|doUnlock\|sessionStorage\|272727\|gate" /Users/taran27/carely-frontend/doctor-portal.html | head -15
```

- [ ] **Step 2: Apply login gate + add patient picker**

Apply same login gate replacement from Task 4.

Add a patient selector div before the main report content area (after `<main>` or the portal div opening):

```html
<div id="patient-selector" style="background:#fff;border-radius:12px;border:1.5px solid var(--grey-300);padding:16px 20px;margin-bottom:24px;display:none;">
  <label style="font-size:0.78rem;font-weight:700;color:var(--grey-500);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:8px;">Select patient</label>
  <select id="patient-select-dropdown" onchange="loadPatient(this.value)" style="width:100%;padding:10px 14px;border:1.5px solid var(--grey-300);border-radius:8px;font-size:0.95rem;color:var(--text);font-family:inherit;">
    <option value="">Choose a patient...</option>
  </select>
</div>
```

In the `fetchLiveData` function for doctor portal, after getting patients list:

```javascript
async function fetchLiveData(token) {
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('portal').style.display = 'block';

  try {
    var res = await fetch(API + '/portal/patients', {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    if (res.status === 401) {
      sessionStorage.removeItem('partner_session_token');
      document.getElementById('portal').style.display = 'none';
      document.getElementById('login-gate').style.display = 'flex';
      return;
    }
    var data = await res.json();
    var patients = data.patients || [];

    var selector = document.getElementById('patient-selector');
    var dropdown = document.getElementById('patient-select-dropdown');
    // Reset dropdown to default option only
    while (dropdown.options.length > 1) dropdown.remove(1);

    patients.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      // textContent — safe, no XSS risk
      opt.textContent = (p.first_name || '') + ' ' + (p.last_initial || '') + '. — ' + (p.adherence_pct !== null ? p.adherence_pct + '%' : '?') + ' adherence';
      dropdown.appendChild(opt);
    });

    if (patients.length > 0) {
      selector.style.display = 'block';
      loadPatient(patients[0].id);
      dropdown.value = patients[0].id;
    }
  } catch(e) {}
}

async function loadPatient(userId) {
  if (!userId) return;
  try {
    var res = await fetch(API + '/portal/patient/' + userId, {
      headers: { 'Authorization': 'Bearer ' + sessionToken },
    });
    var data = await res.json();
    if (data.patient) updatePatientDisplay(data.patient);
  } catch(e) {}
}

function updatePatientDisplay(patient) {
  // Update all elements that show patient name — use data-* selectors if available,
  // or update the specific IDs that exist in the existing doctor-portal layout.
  // Use textContent throughout — no innerHTML with patient data.
  var nameEls = document.querySelectorAll('[data-patient-name], #patient-name');
  nameEls.forEach(function(el) {
    el.textContent = (patient.first_name || '') + ' ' + (patient.last_initial || '') + '.';
  });

  var adhEl = document.getElementById('adherence-pct') || document.querySelector('[data-adherence]');
  if (adhEl) adhEl.textContent = (patient.adherence && patient.adherence.last_30_days.pct !== null)
    ? patient.adherence.last_30_days.pct + '%' : '—';
}
```

- [ ] **Step 3: Commit**

```bash
git add doctor-portal.html
git commit -m "feat: doctor-portal — real auth and patient list picker"
```

---

### Task 7: B2B Support Chat Widget (All Portals)

**Files:**
- Modify: `clinic-portal.html`, `care-portal.html`, `doctor-portal.html`

- [ ] **Step 1: Add chat widget to `clinic-portal.html`**

Before `</body>`:

```html
<!-- B2B SUPPORT CHAT WIDGET -->
<div id="support-chat" style="position:fixed;bottom:24px;right:24px;z-index:500;">
  <button id="chat-toggle" onclick="toggleChat()"
    style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#028090,#02C39A);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(2,128,144,0.4);display:flex;align-items:center;justify-content:center;">
    <svg id="chat-icon-open" width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg id="chat-icon-close" width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24" style="display:none">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>

  <div id="chat-window" style="display:none;position:absolute;bottom:68px;right:0;width:340px;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(13,43,36,0.2);border:1px solid var(--grey-300);overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0D3347,#028090);padding:16px 18px;display:flex;align-items:center;gap:10px;">
      <img src="elara-bot-logo.png" style="height:32px;width:32px;border-radius:50%;background:rgba(255,255,255,0.15);padding:3px;object-fit:contain;" alt="Support" />
      <div>
        <div style="font-size:0.9rem;font-weight:700;color:#fff;">Portal Support</div>
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.65);">AI assistant · Not medical advice</div>
      </div>
    </div>
    <div id="chat-messages" style="height:260px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;">
      <!-- Initial message added by JS below — safe textContent approach -->
    </div>
    <div style="padding:12px;border-top:1px solid #f0f0f0;display:flex;gap:8px;">
      <input id="chat-input" type="text" placeholder="Ask a question..."
        maxlength="500"
        style="flex:1;border:1.5px solid var(--grey-300);border-radius:8px;padding:8px 12px;font-size:0.85rem;font-family:inherit;outline:none;"
        onkeydown="if(event.key==='Enter')sendChatMessage()" />
      <button onclick="sendChatMessage()"
        style="background:var(--teal);border:none;border-radius:8px;padding:8px 14px;color:#fff;font-weight:700;font-size:0.85rem;cursor:pointer;font-family:inherit;">
        Send
      </button>
    </div>
  </div>
</div>

<script>
// Add initial AI greeting using textContent — safe
(function() {
  var initialBubble = document.createElement('div');
  initialBubble.style.cssText = 'background:#f0f9ff;border-radius:10px;padding:10px 12px;font-size:0.83rem;color:#0D3347;line-height:1.5;';
  initialBubble.textContent = 'Hi! I can help you navigate the Carely clinic portal — adding patients, reading stats, or understanding the dashboard. What do you need?';
  var disclaimer = document.createElement('div');
  disclaimer.style.cssText = 'font-size:0.7rem;color:#9ab8c4;margin-top:4px;';
  disclaimer.textContent = 'AI assistant · Responses may not always be accurate';
  initialBubble.appendChild(disclaimer);
  document.getElementById('chat-messages').appendChild(initialBubble);
})();

function toggleChat() {
  var win = document.getElementById('chat-window');
  var iconOpen = document.getElementById('chat-icon-open');
  var iconClose = document.getElementById('chat-icon-close');
  var isOpen = win.style.display === 'none';
  win.style.display = isOpen ? 'block' : 'none';
  iconOpen.style.display = isOpen ? 'none' : 'block';
  iconClose.style.display = isOpen ? 'block' : 'none';
  if (isOpen) document.getElementById('chat-input').focus();
}

async function sendChatMessage() {
  var input = document.getElementById('chat-input');
  var msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  var messages = document.getElementById('chat-messages');

  // User bubble — use textContent, never innerHTML
  var userBubble = document.createElement('div');
  userBubble.style.cssText = 'align-self:flex-end;background:var(--teal);color:#fff;border-radius:10px;padding:9px 12px;font-size:0.83rem;max-width:80%;margin-left:auto;';
  userBubble.textContent = msg; // textContent — XSS safe
  messages.appendChild(userBubble);
  messages.scrollTop = messages.scrollHeight;

  // Loading bubble
  var loadingBubble = document.createElement('div');
  loadingBubble.style.cssText = 'background:#f0f9ff;border-radius:10px;padding:9px 12px;font-size:0.83rem;color:#9ab8c4;';
  loadingBubble.textContent = '...';
  messages.appendChild(loadingBubble);
  messages.scrollTop = messages.scrollHeight;

  var token = sessionStorage.getItem('partner_session_token') || 'demo';
  try {
    var res = await fetch('https://carely-backend-production.up.railway.app/partner-chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ message: msg }),
    });
    var data = await res.json();
    // Use textContent — AI reply treated as untrusted content
    loadingBubble.textContent = data.reply || 'For help, email hello@carely.fit';
    loadingBubble.style.color = '#0D3347';
  } catch(e) {
    loadingBubble.textContent = 'Network error. Try again or email hello@carely.fit';
  }
  messages.scrollTop = messages.scrollHeight;
}
</script>
```

- [ ] **Step 2: Copy same widget to `care-portal.html`**

Same JS and HTML. The chat system prompt is determined server-side from the partner's account `type`.

- [ ] **Step 3: Copy same widget to `doctor-portal.html`**

Same widget.

- [ ] **Step 4: Commit each file**

```bash
git add clinic-portal.html
git commit -m "feat: add B2B support chat widget to clinic portal"

git add care-portal.html
git commit -m "feat: add B2B support chat widget to care portal"

git add doctor-portal.html
git commit -m "feat: add B2B support chat widget to doctor portal"
```

---

### Task 8: App — Add Partner API Calls to api.ts

**Files:**
- Modify: `src/services/api.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/services/api-partners.test.ts
import { partnersApi } from '../../src/services/api';

it('partnersApi.sendConnectRequest is defined', () => {
  expect(partnersApi.sendConnectRequest).toBeDefined();
});
it('partnersApi.getMyConnections is defined', () => {
  expect(partnersApi.getMyConnections).toBeDefined();
});
it('partnersApi.grantConsent is defined', () => {
  expect(partnersApi.grantConsent).toBeDefined();
});
it('partnersApi.disconnect is defined', () => {
  expect(partnersApi.disconnect).toBeDefined();
});
it('partnersApi.sendRefillRequest is defined', () => {
  expect(partnersApi.sendRefillRequest).toBeDefined();
});
it('partnersApi.sendGeneralRequest is defined', () => {
  expect(partnersApi.sendGeneralRequest).toBeDefined();
});
it('partnersApi.getMyPharmacyRequests is defined', () => {
  expect(partnersApi.getMyPharmacyRequests).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /path/to/carely-app && npx jest tests/services/api-partners.test.ts --no-coverage
```
Expected: FAIL — `partnersApi` not exported.

- [ ] **Step 3: Append to `src/services/api.ts`**

```typescript
export const partnersApi = {
  sendConnectRequest: (inviteCode: string) =>
    api.post('/partner/patient-request', { invite_code: inviteCode }),

  getMyConnections: () =>
    api.get('/partner/my-connections'),

  getPendingConsent: () =>
    api.get('/partner/pending-consent'),

  grantConsent: (linkId: string, deviceId?: string) =>
    api.post(`/partner/consent/${linkId}`, { device_id: deviceId }),

  disconnect: (partnerId: string) =>
    api.delete(`/partner/disconnect/${partnerId}`),

  sendRefillRequest: (params: {
    medication_id?: string;
    medication_name: string;
    current_quantity?: number;
    preferred_date?: string;
    notes?: string;
  }) => api.post('/pharmacy/refill-request', params),

  sendGeneralRequest: (params: {
    medication_name?: string;
    notes: string;
  }) => api.post('/pharmacy/general-request', params),

  getMyPharmacyRequests: () =>
    api.get('/pharmacy/my-requests'),
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/services/api-partners.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/api.ts tests/services/api-partners.test.ts
git commit -m "feat: add partner and pharmacy API calls to api.ts"
```

---

### Task 9: ConnectPartnerScreen

**Files:**
- Create: `src/screens/partners/ConnectPartnerScreen.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/screens/ConnectPartnerScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ConnectPartnerScreen from '../../src/screens/partners/ConnectPartnerScreen';
import { partnersApi } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  partnersApi: { sendConnectRequest: jest.fn() },
}));

it('renders invite code input', () => {
  const { getByPlaceholderText } = render(
    <ConnectPartnerScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() } as any} route={{} as any} />
  );
  expect(getByPlaceholderText('e.g. PH-DAWN-3K9M')).toBeTruthy();
});

it('calls sendConnectRequest on submit', async () => {
  (partnersApi.sendConnectRequest as jest.Mock).mockResolvedValue({ data: {} });
  const { getByPlaceholderText, getByText } = render(
    <ConnectPartnerScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() } as any} route={{} as any} />
  );
  fireEvent.changeText(getByPlaceholderText('e.g. PH-DAWN-3K9M'), 'PH-TEST-1234');
  fireEvent.press(getByText('Send Connection Request'));
  await waitFor(() => {
    expect(partnersApi.sendConnectRequest).toHaveBeenCalledWith('PH-TEST-1234');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/screens/ConnectPartnerScreen.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Create `src/screens/partners/` directory and write screen**

`mkdir -p src/screens/partners`

```typescript
// src/screens/partners/ConnectPartnerScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParams } from '../../navigation/RootNavigator';
import { partnersApi } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParams, 'ConnectPartner'>;
  route: RouteProp<AppStackParams, 'ConnectPartner'>;
};

export default function ConnectPartnerScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      Alert.alert('Enter a code', 'Please enter the partner code your provider gave you.');
      return;
    }
    setLoading(true);
    try {
      await partnersApi.sendConnectRequest(trimmed);
      Alert.alert(
        'Request sent',
        "Your provider will be notified. Once they accept, you'll get a notification to share your data.",
        [{ text: 'Got it', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not send request. Please check the code and try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.container}>
          <Text style={s.title}>Connect with a Provider</Text>
          <Text style={s.subtitle}>
            Enter the partner code your doctor, clinic, pharmacy, or care home gave you.
            They will see your medication adherence data once you both approve.
          </Text>

          <View style={s.card}>
            <Text style={s.label}>Partner Code</Text>
            <TextInput
              style={s.input}
              value={code}
              onChangeText={setCode}
              placeholder="e.g. PH-DAWN-3K9M"
              placeholderTextColor="#9AB8C4"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleConnect}
            />
            <Text style={s.hint}>
              Ask your provider for their Carely partner code. It looks like PH-XXXX-XXXX.
            </Text>
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoTitle}>What they will see</Text>
            <Text style={s.infoRow}>Your adherence % (30-day)</Text>
            <Text style={s.infoRow}>Missed dose count (7-day, 30-day)</Text>
            <Text style={s.infoRow}>Your medication names and doses</Text>
            <Text style={s.infoRow}>Your last active date</Text>
            <Text style={s.infoNotRow}>Not your journal, personal notes, or vitals</Text>
          </View>

          <Text style={s.note}>
            You stay in control. Disconnect at any time from your profile settings.
          </Text>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleConnect}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Send Connection Request</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.cancelBtn}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F5F7FA' },
  scroll:      { flexGrow: 1 },
  container:   { flex: 1, padding: 24, paddingTop: 16 },
  title:       { fontSize: 22, fontWeight: '800', color: '#0B2D3D', marginBottom: 8 },
  subtitle:    { fontSize: 14, color: '#6B8FA3', lineHeight: 22, marginBottom: 24 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E0EAF0', marginBottom: 20 },
  label:       { fontSize: 11, fontWeight: '700', color: '#9AB8C4', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  input:       { borderWidth: 1.5, borderColor: '#E0EAF0', borderRadius: 10, padding: 13, fontSize: 18, fontWeight: '700', color: '#0B2D3D', letterSpacing: 1, backgroundColor: '#F8FBFC' },
  hint:        { fontSize: 12, color: '#9AB8C4', marginTop: 8, lineHeight: 18 },
  infoBox:     { backgroundColor: '#F0F9FF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  infoTitle:   { fontSize: 12, fontWeight: '700', color: '#0369A1', marginBottom: 8 },
  infoRow:     { fontSize: 13, color: '#0B2D3D', marginBottom: 4, paddingLeft: 12, lineHeight: 20 },
  infoNotRow:  { fontSize: 12, color: '#9AB8C4', marginTop: 4, paddingLeft: 12 },
  note:        { fontSize: 12, color: '#9AB8C4', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  btn:         { backgroundColor: '#028090', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn:   { alignItems: 'center', paddingVertical: 12 },
  cancelText:  { color: '#6B8FA3', fontSize: 15 },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/screens/ConnectPartnerScreen.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/partners/ConnectPartnerScreen.tsx tests/screens/ConnectPartnerScreen.test.tsx
git commit -m "feat: add ConnectPartnerScreen"
```

---

### Task 10: PartnerConsentScreen

**Files:**
- Create: `src/screens/partners/PartnerConsentScreen.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/screens/PartnerConsentScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PartnerConsentScreen from '../../src/screens/partners/PartnerConsentScreen';
import { partnersApi } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  partnersApi: { grantConsent: jest.fn() },
}));

const mockRoute: any = {
  params: {
    linkId:      'link-uuid-123',
    partnerName: 'Dr. Sarah Chen',
    partnerOrg:  'Westside Family Medicine',
    partnerType: 'doctor',
  },
};

it('renders partner name', () => {
  const { getByText } = render(
    <PartnerConsentScreen navigation={{ goBack: jest.fn() } as any} route={mockRoute} />
  );
  expect(getByText(/Dr. Sarah Chen/)).toBeTruthy();
});

it('calls grantConsent when button pressed', async () => {
  (partnersApi.grantConsent as jest.Mock).mockResolvedValue({ data: {} });
  const { getByText } = render(
    <PartnerConsentScreen navigation={{ goBack: jest.fn() } as any} route={mockRoute} />
  );
  fireEvent.press(getByText('Share my data'));
  await waitFor(() => {
    expect(partnersApi.grantConsent).toHaveBeenCalledWith('link-uuid-123', undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/screens/PartnerConsentScreen.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Write the screen**

```typescript
// src/screens/partners/PartnerConsentScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParams } from '../../navigation/RootNavigator';
import { partnersApi } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParams, 'PartnerConsent'>;
  route: RouteProp<AppStackParams, 'PartnerConsent'>;
};

export default function PartnerConsentScreen({ navigation, route }: Props) {
  const { linkId, partnerName, partnerOrg, partnerType } = route.params;
  const [loading, setLoading] = useState(false);

  const typeLabel =
    partnerType === 'doctor'   ? 'Doctor' :
    partnerType === 'clinic'   ? 'Clinic' :
    partnerType === 'pharmacy' ? 'Pharmacy' : 'Care Home';

  async function handleConsent() {
    setLoading(true);
    try {
      await partnersApi.grantConsent(linkId);
      Alert.alert(
        'Connected',
        `${partnerName} can now see your Carely data. You can disconnect at any time from your profile.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not grant consent. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  const SHARED_ITEMS = [
    'Your medication adherence % (30-day)',
    'Missed dose count (7-day and 30-day)',
    'Your current streak',
    'Medication names and doses',
    'Your last active date',
  ];

  const NOT_SHARED_ITEMS = [
    'Your journal entries or personal notes',
    'Your vitals data',
    'Any other personal information',
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.container}>
          <View style={s.headerChip}>
            <Text style={s.chipText}>{typeLabel}</Text>
          </View>
          <Text style={s.title}>{partnerName}</Text>
          <Text style={s.org}>{partnerOrg}</Text>
          <Text style={s.subtitle}>
            {partnerName} accepted your connection request and would like to see your Carely data to support your care.
          </Text>

          <View style={s.shareBox}>
            <Text style={s.shareTitle}>They will see:</Text>
            {SHARED_ITEMS.map(item => (
              <View key={item} style={s.shareRow}>
                <View style={s.checkDot} />
                <Text style={s.shareItem}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={s.noShareBox}>
            <Text style={s.noShareTitle}>They will NOT see:</Text>
            {NOT_SHARED_ITEMS.map(item => (
              <Text key={item} style={s.noShareItem}>{item}</Text>
            ))}
          </View>

          <Text style={s.note}>
            You can disconnect at any time from Profile then Connected Partners. Removal is instant.
          </Text>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleConsent}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Share my data</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.denyBtn}>
            <Text style={s.denyText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F5F7FA' },
  scroll:       { flexGrow: 1 },
  container:    { flex: 1, padding: 24, paddingTop: 20 },
  headerChip:   { alignSelf: 'flex-start', backgroundColor: '#E0FAF4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12, borderWidth: 1, borderColor: '#02C39A' },
  chipText:     { fontSize: 11, fontWeight: '700', color: '#028090', textTransform: 'uppercase', letterSpacing: 0.5 },
  title:        { fontSize: 22, fontWeight: '800', color: '#0B2D3D', marginBottom: 4 },
  org:          { fontSize: 14, color: '#6B8FA3', marginBottom: 16 },
  subtitle:     { fontSize: 14, color: '#4A6B7A', lineHeight: 22, marginBottom: 24 },
  shareBox:     { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E0EAF0' },
  shareTitle:   { fontSize: 12, fontWeight: '700', color: '#028090', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  shareRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#02C39A', marginRight: 10 },
  shareItem:    { fontSize: 14, color: '#0B2D3D', lineHeight: 20 },
  noShareBox:   { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  noShareTitle: { fontSize: 12, fontWeight: '700', color: '#9AB8C4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  noShareItem:  { fontSize: 13, color: '#9AB8C4', marginBottom: 4 },
  note:         { fontSize: 12, color: '#9AB8C4', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  btn:          { backgroundColor: '#028090', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  denyBtn:      { alignItems: 'center', paddingVertical: 12 },
  denyText:     { color: '#9AB8C4', fontSize: 15 },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/screens/PartnerConsentScreen.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/partners/PartnerConsentScreen.tsx tests/screens/PartnerConsentScreen.test.tsx
git commit -m "feat: add PartnerConsentScreen"
```

---

### Task 11: ConnectedPartnersScreen

**Files:**
- Create: `src/screens/partners/ConnectedPartnersScreen.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/screens/ConnectedPartnersScreen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ConnectedPartnersScreen from '../../src/screens/partners/ConnectedPartnersScreen';
import { partnersApi } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  partnersApi: {
    getMyConnections:  jest.fn().mockResolvedValue({ data: { connections: [] } }),
    getPendingConsent: jest.fn().mockResolvedValue({ data: { pending: [] } }),
    disconnect:        jest.fn(),
  },
}));

it('renders empty state when no connections', async () => {
  const { getByText } = render(
    <ConnectedPartnersScreen navigation={{ goBack: jest.fn(), navigate: jest.fn() } as any} route={{} as any} />
  );
  await waitFor(() => {
    expect(getByText(/No connected providers yet/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/screens/ConnectedPartnersScreen.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Write the screen**

```typescript
// src/screens/partners/ConnectedPartnersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Alert, ActivityIndicator, SafeAreaView, RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParams } from '../../navigation/RootNavigator';
import { partnersApi } from '../../services/api';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParams, 'ConnectedPartners'>;
  route: RouteProp<AppStackParams, 'ConnectedPartners'>;
};

interface PartnerInfo {
  id: string;
  type: string;
  org_name: string;
  contact_name: string;
  invite_code: string;
}

interface Connection {
  id: string;
  status: string;
  patient_consented_at?: string;
  partner_accounts: PartnerInfo;
}

interface PendingConsent {
  id: string;
  requested_at: string;
  partner_accounts: Omit<PartnerInfo, 'invite_code'>;
}

const TYPE_LABELS: Record<string, string> = {
  doctor: 'Doctor', clinic: 'Clinic', pharmacy: 'Pharmacy', care_home: 'Care Home',
};

export default function ConnectedPartnersScreen({ navigation }: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending,     setPending]     = useState<PendingConsent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    try {
      const [connRes, pendRes] = await Promise.all([
        partnersApi.getMyConnections(),
        partnersApi.getPendingConsent(),
      ]);
      setConnections(connRes.data.connections ?? []);
      setPending(pendRes.data.pending ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleConsent(item: PendingConsent) {
    navigation.navigate('PartnerConsent', {
      linkId:      item.id,
      partnerName: item.partner_accounts.contact_name,
      partnerOrg:  item.partner_accounts.org_name,
      partnerType: item.partner_accounts.type,
    });
  }

  async function handleDisconnect(connection: Connection) {
    Alert.alert(
      `Disconnect from ${connection.partner_accounts.org_name}?`,
      'They will immediately lose access to your Carely data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect', style: 'destructive',
          onPress: async () => {
            try {
              await partnersApi.disconnect(connection.partner_accounts.id);
              setConnections(prev => prev.filter(c => c.id !== connection.id));
            } catch {
              Alert.alert('Error', 'Could not disconnect. Please try again.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} color="#028090" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#028090" />}
        ListHeaderComponent={
          <View>
            <Text style={s.title}>Connected Partners</Text>
            <Text style={s.subtitle}>Providers who can see your medication data.</Text>
            {pending.length > 0 && (
              <View>
                <Text style={s.sectionLabel}>Waiting for your approval</Text>
                {pending.map(item => (
                  <View key={item.id} style={s.pendingCard}>
                    <View style={s.cardLeft}>
                      <Text style={s.cardChip}>{TYPE_LABELS[item.partner_accounts.type] ?? 'Partner'}</Text>
                      <Text style={s.cardName}>{item.partner_accounts.contact_name}</Text>
                      <Text style={s.cardOrg}>{item.partner_accounts.org_name}</Text>
                    </View>
                    <TouchableOpacity style={s.approveBtn} onPress={() => handleConsent(item)}>
                      <Text style={s.approveBtnText}>Review</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {connections.length > 0 && (
              <Text style={s.sectionLabel}>Active connections</Text>
            )}
          </View>
        }
        data={connections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardLeft}>
              <Text style={s.cardChip}>{TYPE_LABELS[item.partner_accounts.type] ?? 'Partner'}</Text>
              <Text style={s.cardName}>{item.partner_accounts.contact_name}</Text>
              <Text style={s.cardOrg}>{item.partner_accounts.org_name}</Text>
              {item.patient_consented_at && (
                <Text style={s.connectedSince}>
                  Connected {new Date(item.patient_consented_at).toLocaleDateString()}
                </Text>
              )}
            </View>
            <TouchableOpacity style={s.disconnectBtn} onPress={() => handleDisconnect(item)}>
              <Text style={s.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          pending.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No connected providers yet</Text>
              <Text style={s.emptyBody}>
                Connect your doctor, clinic, pharmacy, or care home to share your adherence data with them.
              </Text>
              <TouchableOpacity style={s.connectBtn} onPress={() => navigation.navigate('ConnectPartner')}>
                <Text style={s.connectBtnText}>Connect a Provider</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={
          connections.length > 0 ? (
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('ConnectPartner')}>
              <Text style={s.addBtnText}>+ Connect another provider</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#F5F7FA' },
  list:            { padding: 20, flexGrow: 1 },
  title:           { fontSize: 22, fontWeight: '800', color: '#0B2D3D', marginBottom: 6 },
  subtitle:        { fontSize: 14, color: '#6B8FA3', marginBottom: 24, lineHeight: 20 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: '#9AB8C4', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12, marginTop: 4 },
  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0EAF0', flexDirection: 'row', alignItems: 'center' },
  pendingCard:     { backgroundColor: '#FFF7ED', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FCD34D', flexDirection: 'row', alignItems: 'center' },
  cardLeft:        { flex: 1 },
  cardChip:        { fontSize: 10, fontWeight: '700', color: '#028090', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cardName:        { fontSize: 15, fontWeight: '700', color: '#0B2D3D', marginBottom: 2 },
  cardOrg:         { fontSize: 13, color: '#6B8FA3' },
  connectedSince:  { fontSize: 11, color: '#9AB8C4', marginTop: 4 },
  approveBtn:      { backgroundColor: '#028090', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  approveBtnText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  disconnectBtn:   { borderWidth: 1, borderColor: '#E0EAF0', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12 },
  disconnectText:  { color: '#9AB8C4', fontSize: 13, fontWeight: '600' },
  empty:           { alignItems: 'center', paddingTop: 40 },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: '#0B2D3D', marginBottom: 8 },
  emptyBody:       { fontSize: 14, color: '#6B8FA3', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 20 },
  connectBtn:      { backgroundColor: '#028090', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  connectBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  addBtn:          { alignItems: 'center', paddingVertical: 16 },
  addBtnText:      { color: '#028090', fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/screens/ConnectedPartnersScreen.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/screens/partners/ tests/screens/ConnectedPartnersScreen.test.tsx
git commit -m "feat: add ConnectedPartnersScreen"
```

---

### Task 12: PharmacyRequestModal

**Files:**
- Create: `src/components/PharmacyRequestModal.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/components/PharmacyRequestModal.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PharmacyRequestModal from '../../src/components/PharmacyRequestModal';
import { partnersApi } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  partnersApi: {
    sendRefillRequest:  jest.fn().mockResolvedValue({ data: {} }),
    sendGeneralRequest: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

const mockMeds = [
  { id: 'med-1', name: 'Metformin 500mg' },
  { id: 'med-2', name: 'Lisinopril 10mg' },
];

it('renders both request options', () => {
  const { getByText } = render(
    <PharmacyRequestModal visible={true} onClose={jest.fn()} medications={mockMeds} pharmacyName="Sunrise Pharmacy" />
  );
  expect(getByText('Refill a medication')).toBeTruthy();
  expect(getByText('Request something else')).toBeTruthy();
});

it('calls sendRefillRequest on refill submit', async () => {
  const { getByText } = render(
    <PharmacyRequestModal visible={true} onClose={jest.fn()} medications={mockMeds} pharmacyName="Sunrise Pharmacy" />
  );
  fireEvent.press(getByText('Refill a medication'));
  fireEvent.press(getByText('Metformin 500mg'));
  fireEvent.press(getByText('Send Request'));
  await waitFor(() => {
    expect(partnersApi.sendRefillRequest).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/components/PharmacyRequestModal.test.tsx --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Write the component**

```typescript
// src/components/PharmacyRequestModal.tsx
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { partnersApi } from '../services/api';

interface Medication {
  id: string;
  name: string;
}

interface Props {
  visible:      boolean;
  onClose:      () => void;
  medications:  Medication[];
  pharmacyName: string;
}

type Mode = 'choose' | 'refill' | 'general';

export default function PharmacyRequestModal({ visible, onClose, medications, pharmacyName }: Props) {
  const [mode,            setMode]            = useState<Mode>('choose');
  const [selectedMed,     setSelectedMed]     = useState<Medication | null>(null);
  const [notes,           setNotes]           = useState('');
  const [generalMedName,  setGeneralMedName]  = useState('');
  const [loading,         setLoading]         = useState(false);

  function reset() {
    setMode('choose');
    setSelectedMed(null);
    setNotes('');
    setGeneralMedName('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSend() {
    setLoading(true);
    try {
      if (mode === 'refill') {
        if (!selectedMed) {
          Alert.alert('Select a medication', 'Please choose a medication to refill.');
          setLoading(false);
          return;
        }
        await partnersApi.sendRefillRequest({
          medication_id:   selectedMed.id,
          medication_name: selectedMed.name,
          notes:           notes.trim() || undefined,
        });
      } else {
        if (!notes.trim() && !generalMedName.trim()) {
          Alert.alert('Add a note', 'Please describe what you need.');
          setLoading(false);
          return;
        }
        await partnersApi.sendGeneralRequest({
          medication_name: generalMedName.trim() || undefined,
          notes:           notes.trim() || generalMedName.trim(),
        });
      }
      Alert.alert(
        'Request sent',
        `${pharmacyName} will notify you when it's ready.`,
        [{ text: 'Done', onPress: handleClose }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not send request. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Text style={s.headerTitle}>Request from Pharmacy</Text>
            <Text style={s.headerSub}>{pharmacyName}</Text>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <Text style={s.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>

          {mode === 'choose' && (
            <View style={s.body}>
              <Text style={s.chooseLabel}>What do you need?</Text>
              <TouchableOpacity style={s.optionCard} onPress={() => setMode('refill')}>
                <View style={s.optionLeft}>
                  <Text style={s.optionTitle}>Refill a medication</Text>
                  <Text style={s.optionSub}>Request a refill for one of your tracked medications</Text>
                </View>
                <Text style={s.optionArrow}>{'>'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.optionCard} onPress={() => setMode('general')}>
                <View style={s.optionLeft}>
                  <Text style={s.optionTitle}>Request something else</Text>
                  <Text style={s.optionSub}>Ask about availability, OTC items, or anything else</Text>
                </View>
                <Text style={s.optionArrow}>{'>'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'refill' && (
            <View style={s.body}>
              <TouchableOpacity onPress={() => setMode('choose')} style={s.backBtn}>
                <Text style={s.backText}>{'< Back'}</Text>
              </TouchableOpacity>
              <Text style={s.formLabel}>Select medication</Text>
              {medications.map(med => (
                <TouchableOpacity
                  key={med.id}
                  style={[s.medRow, selectedMed?.id === med.id && s.medRowSelected]}
                  onPress={() => setSelectedMed(med)}
                >
                  <View style={[s.medDot, selectedMed?.id === med.id && s.medDotSelected]} />
                  <Text style={s.medName}>{med.name}</Text>
                </TouchableOpacity>
              ))}
              {medications.length === 0 && (
                <Text style={s.emptyMeds}>No tracked medications found. Add medications in the app first.</Text>
              )}
              <Text style={[s.formLabel, { marginTop: 20 }]}>Optional note</Text>
              <TextInput
                style={s.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Current quantity, pickup preferences, anything helpful..."
                placeholderTextColor="#9AB8C4"
                multiline
                numberOfLines={3}
                maxLength={300}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!selectedMed || loading) && s.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!selectedMed || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.sendBtnText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          )}

          {mode === 'general' && (
            <View style={s.body}>
              <TouchableOpacity onPress={() => setMode('choose')} style={s.backBtn}>
                <Text style={s.backText}>{'< Back'}</Text>
              </TouchableOpacity>
              <Text style={s.formLabel}>Medication name (optional)</Text>
              <TextInput
                style={s.input}
                value={generalMedName}
                onChangeText={setGeneralMedName}
                placeholder="e.g. Tylenol Extra Strength"
                placeholderTextColor="#9AB8C4"
                maxLength={100}
              />
              <Text style={[s.formLabel, { marginTop: 16 }]}>What do you need?</Text>
              <TextInput
                style={s.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="Describe your request in as much detail as you'd like..."
                placeholderTextColor="#9AB8C4"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.sendBtn, loading && s.sendBtnDisabled]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.sendBtnText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#F5F7FA' },
  scroll:          { flexGrow: 1 },
  header:          { backgroundColor: '#0B2D3D', padding: 24, paddingBottom: 20, position: 'relative' },
  headerTitle:     { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub:       { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  closeBtn:        { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.12)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  body:            { padding: 20 },
  chooseLabel:     { fontSize: 16, fontWeight: '700', color: '#0B2D3D', marginBottom: 16 },
  optionCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E0EAF0', flexDirection: 'row', alignItems: 'center' },
  optionLeft:      { flex: 1 },
  optionTitle:     { fontSize: 15, fontWeight: '700', color: '#0B2D3D', marginBottom: 3 },
  optionSub:       { fontSize: 13, color: '#6B8FA3', lineHeight: 18 },
  optionArrow:     { fontSize: 22, color: '#9AB8C4', marginLeft: 8 },
  backBtn:         { marginBottom: 16 },
  backText:        { fontSize: 14, color: '#028090', fontWeight: '600' },
  formLabel:       { fontSize: 11, fontWeight: '700', color: '#9AB8C4', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  medRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E0EAF0' },
  medRowSelected:  { borderColor: '#028090', backgroundColor: '#F0FAFA' },
  medDot:          { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#E0EAF0', marginRight: 12 },
  medDotSelected:  { backgroundColor: '#028090', borderColor: '#028090' },
  medName:         { fontSize: 14, fontWeight: '600', color: '#0B2D3D' },
  emptyMeds:       { fontSize: 13, color: '#9AB8C4', lineHeight: 20 },
  input:           { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0EAF0', padding: 12, fontSize: 14, color: '#0B2D3D' },
  textArea:        { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E0EAF0', padding: 12, fontSize: 14, color: '#0B2D3D', minHeight: 90, textAlignVertical: 'top' },
  sendBtn:         { backgroundColor: '#028090', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/components/PharmacyRequestModal.test.tsx --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PharmacyRequestModal.tsx tests/components/PharmacyRequestModal.test.tsx
git commit -m "feat: add PharmacyRequestModal (refill + general request)"
```

---

### Task 13: Wire Navigation + ProfileScreen + MedicinesScreen

**Files:**
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/screens/profile/ProfileScreen.tsx`
- Modify: `src/screens/medicines/MedicinesScreen.tsx`

- [ ] **Step 1: Add partner screens to `AppStackParams` in `RootNavigator.tsx`**

Find the `AppStackParams` type definition (the object that lists all screen params) and add:
```typescript
ConnectPartner:    undefined;
PartnerConsent:    {
  linkId:      string;
  partnerName: string;
  partnerOrg:  string;
  partnerType: string;
};
ConnectedPartners: undefined;
```

Add imports near the top (after existing screen imports):
```typescript
import ConnectPartnerScreen    from '../screens/partners/ConnectPartnerScreen';
import PartnerConsentScreen    from '../screens/partners/PartnerConsentScreen';
import ConnectedPartnersScreen from '../screens/partners/ConnectedPartnersScreen';
```

Inside the `Stack.Navigator`, add the three new screens (alongside the existing screens):
```typescript
<Stack.Screen
  name="ConnectPartner"
  component={ConnectPartnerScreen}
  options={{ title: 'Connect a Provider', headerStyle: { backgroundColor: '#F5F7FA' }, headerTintColor: '#028090' }}
/>
<Stack.Screen
  name="PartnerConsent"
  component={PartnerConsentScreen}
  options={{ title: 'Share Your Data', headerStyle: { backgroundColor: '#F5F7FA' }, headerTintColor: '#028090' }}
/>
<Stack.Screen
  name="ConnectedPartners"
  component={ConnectedPartnersScreen}
  options={{ title: 'Connected Partners', headerStyle: { backgroundColor: '#F5F7FA' }, headerTintColor: '#028090' }}
/>
```

- [ ] **Step 2: Add "Connected Partners" row to `ProfileScreen.tsx`**

In `ProfileScreen.tsx`, near the top of the component, add navigation hook if not already present:
```typescript
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation<any>();
```

Find the section in the JSX where profile settings rows live (look for existing rows for Caregiver, Privacy, etc.) and add before the last row in that section:
```typescript
<TouchableOpacity style={profileStyles.row} onPress={() => navigation.navigate('ConnectedPartners')}>
  <View style={profileStyles.rowLeft}>
    <Text style={profileStyles.rowLabel}>Connected Partners</Text>
  </View>
  <Text style={profileStyles.rowArrow}>{'>'}</Text>
</TouchableOpacity>
```

(Use the same row styling as the other profile rows — `profileStyles.row`, `profileStyles.rowLeft`, `profileStyles.rowLabel` — or whatever style names the existing rows use. Look at existing rows and match exactly.)

- [ ] **Step 3: Wire PharmacyRequestModal into `MedicinesScreen.tsx`**

In `MedicinesScreen.tsx`, add to imports:
```typescript
import PharmacyRequestModal from '../../components/PharmacyRequestModal';
import { partnersApi } from '../../services/api';
```

Add state (alongside existing state at the top of the component):
```typescript
const [showPharmacyModal, setShowPharmacyModal] = useState(false);
const [connectedPharmacy, setConnectedPharmacy] = useState<{ name: string } | null>(null);
```

In the existing `useEffect` that loads medicines data (or add a separate one), add pharmacy connection check:
```typescript
partnersApi.getMyConnections()
  .then(res => {
    const pharmacy = (res.data.connections ?? []).find(
      (c: any) => c.partner_accounts?.type === 'pharmacy' && c.status === 'active'
    );
    if (pharmacy) setConnectedPharmacy({ name: pharmacy.partner_accounts.org_name });
  })
  .catch(() => {});
```

In the JSX, add the pharmacy button and modal. Place the button near the bottom of the medicines list, or in a header section, based on the existing layout:
```typescript
{connectedPharmacy && (
  <TouchableOpacity
    style={medicineStyles.pharmacyBtn}
    onPress={() => setShowPharmacyModal(true)}
  >
    <Text style={medicineStyles.pharmacyBtnText}>
      Request from {connectedPharmacy.name}
    </Text>
  </TouchableOpacity>
)}

<PharmacyRequestModal
  visible={showPharmacyModal}
  onClose={() => setShowPharmacyModal(false)}
  medications={(medicines ?? []).map((m: any) => ({
    id:   m.id,
    name: `${m.name} ${m.dose_amount ?? ''}${m.dose_unit ?? ''}`.trim(),
  }))}
  pharmacyName={connectedPharmacy?.name ?? 'Your Pharmacy'}
/>
```

Add to the existing `StyleSheet.create` in `MedicinesScreen.tsx`:
```typescript
pharmacyBtn:     { backgroundColor: '#E0FAF4', borderRadius: 12, padding: 14, alignItems: 'center', margin: 16, borderWidth: 1, borderColor: '#02C39A' },
pharmacyBtnText: { color: '#028090', fontSize: 14, fontWeight: '700' },
```

- [ ] **Step 4: TypeScript check**

```bash
cd /path/to/carely-app && npx tsc --noEmit
```
Expected: Zero errors. Fix any type mismatches before proceeding.

- [ ] **Step 5: Commit each file separately**

```bash
git add src/navigation/RootNavigator.tsx
git commit -m "feat: register ConnectPartner, PartnerConsent, ConnectedPartners screens in navigator"

git add src/screens/profile/ProfileScreen.tsx
git commit -m "feat: add Connected Partners row to ProfileScreen"

git add src/screens/medicines/MedicinesScreen.tsx
git commit -m "feat: add pharmacy request button to MedicinesScreen"
```

---

### Task 14: Final Push + Smoke Test

- [ ] **Step 1: Run full app test suite**

```bash
cd /path/to/carely-app && npx jest --no-coverage --forceExit
```
Expected: All green.

- [ ] **Step 2: Run full backend test suite + type check**

```bash
cd /tmp/carely-backend && npx jest --no-coverage --forceExit && npx tsc --noEmit
```
Expected: All green, zero TS errors.

- [ ] **Step 3: Push frontend to GitHub (auto-deploys to carely.fit)**

```bash
cd /Users/taran27/carely-frontend && git push origin main
```

Wait 1–2 minutes for deployment.

- [ ] **Step 4: Smoke test web pages**

```
carely.fit/for-doctors           — submit form, see success message
carely.fit/clinic-portal?demo=true — demo dashboard, yellow banner, no login
carely.fit/clinic-portal         — login form shows
carely.fit/portal/activate?token=fake — token error state
carely.fit/join?ref=fake         — shows "Try Carely" state
```

- [ ] **Step 5: Build app for testing**

```bash
eas build --platform ios --profile preview
```

- [ ] **Step 6: Tag the release**

```bash
cd /Users/taran27/carely-frontend
git tag v2.0-partner-portals-web
git push origin --tags
```

---

## Self-Review Against Spec

| Spec Requirement | Task |
|---|---|
| `for-doctors.html` form wired to real backend | Task 3 |
| `for-pharmacies.html` form wired to real backend | Task 3 |
| `for-senior-homes.html` form wired to real backend | Task 3 |
| `carely.fit/portal/activate` page | Task 1 |
| `carely.fit/join?ref=TOKEN` landing page | Task 2 |
| `/referrals/validate-invite` backend endpoint | Task 2 |
| `clinic-portal.html` demo via `?demo=true`, PIN removed | Task 4 |
| `clinic-portal.html` real auth + live patient data | Task 4 |
| `care-portal.html` demo + real auth | Task 5 |
| `doctor-portal.html` real auth + patient list | Task 6 |
| B2B support chatbot on all three portals | Task 7 |
| Chat uses textContent (no XSS) | Tasks 7, 4 |
| `ConnectPartnerScreen` | Task 9 |
| `PartnerConsentScreen` | Task 10 |
| `ConnectedPartnersScreen` | Task 11 |
| `PharmacyRequestModal` refill + general | Task 12 |
| ProfileScreen Connected Partners row | Task 13 |
| MedicinesScreen pharmacy request button | Task 13 |
| Navigation registration | Task 13 |
| Patient data field list in consent screen | Task 10 |
| "Disconnect at any time" messaging | Tasks 9, 10, 11 |
| All API calls via `partnersApi` | Task 8 |

**Placeholder scan:** No TBDs. Task 5 care-portal defers exact PIN gate line numbers to a grep in Step 1 — this is orientation, not a placeholder. Task 6 references existing DOM element IDs in `updatePatientDisplay` — developer must grep existing doctor-portal for those IDs, which is standard practice.

**Type consistency:** `PartnerConsent` route params (`linkId`, `partnerName`, `partnerOrg`, `partnerType`) match Task 11 (`ConnectedPartnersScreen`) and Task 10 (`PartnerConsentScreen`). `PharmacyRequestModal.medications` type `{id: string; name: string}[]` matches Task 13's mapping.
