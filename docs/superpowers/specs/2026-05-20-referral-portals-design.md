# Carely — Referral System v2 + B2B Partner Portal System
**Design Spec — May 20, 2026**
**Status: Approved by TJ — Implementation Ready**

---

## Scope

Three interconnected systems, built as additions to what already exists. Nothing existing is overwritten.

1. **Referral System v2** — upgrade logic, add invite-by-contact, anti-abuse
2. **Partner Portal System** — Doctor, Clinic, Pharmacy, Care Home (hybrid onboarding + live data)
3. **Security & Compliance Layer** — audit logging, consent management, HIPAA/PIPEDA alignment

---

## Guiding Principles

- **Polished additions only** — existing screens, routes, and portals are preserved intact
- **Demo mode stays** — every portal keeps its demo path for sales/outreach meetings
- **Patient controls everything** — no data shared without explicit patient consent
- **Nothing hidden** — all terms, conditions, and data flows are plain-language visible
- **Compliance first** — HIPAA (US) + PIPEDA (Canada) alignment on every decision
- **Locked and armoured** — audit logs, encryption, access controls, rate limits on everything

---

## System 1 — Referral System v2

### What Exists (do not touch)
- `ReferralScreen.tsx` — UI with code display, share options, how-it-works steps
- `referrals.ts` backend — code generation, `applyReferralRewards`, `trackUserReferralSignup`
- `user_referrals` Supabase table

### What Changes (logic only, UI additions)

#### Trigger Gate
- Invite feature is **locked during free trial** — `plan = 'trial'` sees a locked state: "Invite friends unlocks when you become a subscriber"
- Only `monthly`, `annual`, `founding` plans can invite
- Enforced at API level, not just UI

#### New Invite-by-Contact Flow
Current: generic shareable code anyone can use.
New: user invites a **specific person** by entering their name + contact.

**App (additions to ReferralScreen):**
- Below the existing code/share section, add: "Invite someone specific" section
- Input: Name + Email or Phone (one required)
- "Send Invite" button → calls `POST /referrals/invite`
- Shows pending invites list below: "Prabh Singh — invited 3 days ago · Expires in 4 days · Pending"

**Backend — new endpoint `POST /referrals/invite`:**
```
Request: { name, email?, phone? }
Auth: requireAuth + isPaying guard
Creates: referral_invites row {
  inviter_user_id, invitee_name,
  invitee_email (normalized lowercase),
  invitee_phone (E.164 format),
  token (UUID v4),
  expires_at (now + 7 days),
  status: 'pending'
}
Action: sends invite email via SendGrid
```

**Invite email (Day 0):**
- Subject: "[Name] invited you to Carely — your second month is on them"
- Body: warm, personal, mentions inviter's first name, 7-day expiry
- CTA button: `carely.fit/join?ref=TOKEN`

**Follow-up emails (automated):**
- Day 3: "Your invitation is still waiting — 4 days left"
- Day 6: "Last chance — your invite expires tomorrow"
- Stop on: link used, link expired, or invitee unsubscribes

**Link landing page (`carely.fit/join?ref=TOKEN`):**
- Validates token (404 if expired or used)
- Shows: "TJ invited you to Carely"
- Big CTA: "Download Carely"
- On mobile: deep link to App Store / Play Store with ref token carried through
- Token stored in AsyncStorage on first app open

#### New Reward Mechanics

**Monthly subscribers:**
- Referred person: no free trial → pays month 1 at full price ($9.99) → month 2 FREE ($9.99 Stripe credit applied automatically) → normal from month 3
- Referrer: next month free ($9.99 Stripe credit) fires when invitee's first payment clears

**Annual subscribers:**
- Same referred-person experience (pay month 1, month 2 free)
- Referrer: `referral_months_earned` counter incremented by 1 per conversion
- When annual plan ends: Stripe subscription paused for `referral_months_earned` months
- Inviter notified: "You've earned 2 free months — they start when your annual plan ends"

**Nothing fires if invitee doesn't pay.** No exceptions.

#### Conditions Screen (transparent)
"Invite" button opens a bottom sheet before sending:
```
Invite [Name] to Carely

How it works:
• They pay their first month ($9.99) — no free trial for referred friends
• Their second month is completely free, automatically
• You get your next month free once they pay

Rules:
• This invitation expires in 7 days
• Only works if they use your specific link and pay month 1
• Annual subscribers: earn free months that extend your plan

No tricks. No fine print. That's it.
```
"Send Invite" button below. User must see this before sending.

#### Invite Link Mechanics
- One link = one person. Token tied to invitee_email or invitee_phone
- If someone else tries to use the link → "This invitation was sent to a specific person"
- Link redeemable once. After use, status → 'used'
- After 7 days, status → 'expired' (cron job)
- Referrer can have unlimited outstanding invites (each unique)
- Referrer can re-invite after expiry

---

## System 2 — Partner Portal System

### Portal Types
| Type | URL | What they see |
|---|---|---|
| Doctor | carely.fit/doctor-portal | Single patient report (existing) + patient list |
| Clinic | carely.fit/clinic-portal | All connected patients, org-level stats |
| Pharmacy | carely.fit/clinic-portal (pharmacy mode) | Connected patients + medicine request inbox |
| Care Home | carely.fit/care-portal | All residents, floor groupings, alert feed |

### Demo Mode (preserved for sales/outreach)
Every portal URL accepts `?demo=true`:
- `carely.fit/clinic-portal?demo=true` — shows existing hardcoded demo data
- No login required in demo mode
- Yellow demo banner: "Demo mode — showing sample data for illustration purposes"
- "Apply to become a partner" CTA on demo pages
- Existing PIN "272727" removed and replaced by `?demo=true` param

### Partner Onboarding — Hybrid Flow

#### Step 1: Application (carely.fit/for-doctors, /for-pharmacies, etc.)
Current: mailto link (not a real form submission)
New: `POST /partner/apply` — real backend submission

Form fields:
```
name (contact person name)
org_name (clinic/pharmacy/care home name)
type: 'doctor' | 'clinic' | 'pharmacy' | 'care_home'
email (work email)
phone
license_number (doctors/clinics — professional license)
province_or_state
country: 'CA' | 'US'
patient_count_estimate
message (optional)
```

Backend stores in `partner_applications` table, sends confirmation email to applicant, fires HQ inbox alert to TJ.

#### Step 2: TJ Approves in HQ
New "Partners" page in HQ sidebar:
- Lists all pending applications with applicant details
- "Approve" button → `POST /admin/partner/:id/approve`
  - Creates `partner_accounts` row
  - Generates activation token (UUID, 48h expiry)
  - Emails activation link to partner: `carely.fit/portal/activate?token=XXX`
- "Reject" button → sends polite decline email

#### Step 3: Partner Self-Activates
`carely.fit/portal/activate?token=XXX`:
- Validates token (48h expiry)
- Partner sets their portal password
- Account goes live
- Partner immediately sees their dashboard (no patients yet)
- Partner gets their **unique invite code** (e.g., `DR-CHEN-4X7K`) and shareable link
- QR code generated and downloadable (for printing in waiting rooms)

### Patient Connection Flow

**From patient side (app):**
- Profile → "Connect with a Partner" → "Connect with my Doctor / Pharmacy / Care Home"
- Enter the partner's invite code OR scan QR
- App shows partner's name + type: "Connect to Dr. Sarah Chen — Westside Family Medicine?"
- Patient taps "Send Request"
- Backend: `POST /partner/patient-request` → creates `partner_patient_links` row, status: 'pending_partner'
- Patient sees: "Request sent — waiting for Dr. Chen to approve"

**From partner side (portal):**
- Portal shows "New patient request" notification
- Partner sees: patient first name + last initial, request date
- Partner clicks "Accept" → `POST /partner/accept-patient/:linkId`
- Status → 'pending_patient_consent'
- Patient gets push notification: "Dr. Chen accepted your request. Tap to share your data."

**Patient consent (app):**
- Notification → opens in-app consent screen:
  - "Dr. Sarah Chen at Westside Family Medicine would like to see your Carely data"
  - "They will see: your medication adherence %, missed dose history, medication list, and last active date"
  - "They will NOT see: your journal entries, personal notes, or vitals unless you add them later"
  - "You can disconnect at any time from your Profile settings"
  - Toggle: "Share my data with Dr. Chen" → ON
- Consent stored: `{ user_id, partner_id, consented_at, consent_version: '1.0', ip_address, device_id }`
- Status → 'active'

**Disconnection (patient):**
- Profile → Connected Partners → "Disconnect from Dr. Chen"
- Immediate: partner can no longer fetch patient data
- Logged: `{ user_id, partner_id, disconnected_at, reason: 'patient_initiated' }`

### Data Shared With Portals (toggle ON = everything below)

| Data | Shared | Notes |
|---|---|---|
| First name | Yes | Last name only if patient grants full profile |
| Adherence % (30-day) | Yes | |
| Missed dose count (7-day, 30-day) | Yes | |
| Current streak | Yes | |
| Medication names + doses | Yes | What they take, not personal notes |
| Last active date | Yes | |
| Missed dose alerts (real-time) | Yes | Push to portal on each miss |
| Journal entries | No | Private always |
| Personal notes | No | Private always |
| Vitals | No | Unless future consent added |

### Doctor Portal (polished live version)
Building on existing `doctor-portal.html`:
- Remove hardcoded demo data
- Add real auth: `POST /portal/auth/login` → JWT session token
- Replace demo patient with real API: `GET /portal/patients` → returns all consented patients
- Patient list with: name, adherence ring, last active, med count, alert badge
- Individual patient: existing `doctor-portal.html` layout, now fed with real data via `GET /portal/patient/:id`
- Session timeout: 8 hours (auto-logout)

### Clinic Portal (polished live version)
Building on existing `clinic-portal.html`:
- Same auth as doctor portal
- Summary cards: total patients, avg adherence, at-risk count, doses confirmed today
- Patient table with adherence %, status (on-track/at-risk), last active
- Missed dose alerts feed (real-time from Redis)
- Demo mode via `?demo=true` (existing data preserved, PIN removed)

### Pharmacy Portal
Same as clinic portal + medicine request inbox:

**Medicine request tab:**
- Shows incoming requests from connected patients
- Each card: patient name, medication name, current quantity, preferred date, notes
- Status buttons: "Mark Received" → "Mark Ready" → "Mark Picked Up"
- Pharmacy marks status → patient gets push notification immediately

**Refill request from app (upgrade to existing Refill button):**
- Current: updates pill count locally only
- New: if user has a connected partner pharmacy:
  - Refill modal adds section: "Also request from [Pharmacy Name]" (toggle ON by default)
  - Pre-fills: medication name, current qty, suggested pickup date (+2 days)
  - Optional note field
  - Sends `POST /pharmacy/refill-request`
- If no connected partner pharmacy: existing behavior unchanged

**New "Request from Pharmacy" on PharmacyScreen:**
- If connected: shows "Request" button → modal with:
  - Option A: "Refill an existing medication" → selects from tracked meds, pre-fills form
  - Option B: "Request something else" → free text + optional medication name
- Both options clean, clear, equal size buttons
- Pharmacy colors match app: #028090 teal, #02C39A mint, #0B2D3D deep

### Care Home Portal
Building on existing `care-portal.html`:
- Same auth and patient-connection flow
- Additional: patient grouping by wing/floor (if care home provides)
- Alert: any resident who missed 2+ consecutive doses is flagged "Needs attention"
- Summary ring: org-wide adherence %
- Demo mode via `?demo=true` (existing rich demo data preserved)

### B2B Support Chatbot
Each portal gets a chat bubble (bottom right corner), separate from Elara:

**System prompt per portal type:**
- Doctor: knows about patient reports, adherence data, connecting patients, how to read the dashboard
- Clinic: knows about org-level stats, patient management, how to add/remove patients
- Pharmacy: knows about refill requests, request status, patient connections
- Care home: knows about resident management, alert thresholds, floor groupings

**Hard rules (same as Elara):**
- Cannot discuss specific patient health data
- Cannot give medical advice
- Cannot reveal backend/infrastructure
- Prompt injection sanitizer
- Output filter (no keys, JWTs, URLs)
- Rate limited: 20 requests/hour per session

**Escalation:** any question it can't answer → "For this, email hello@carely.fit — TJ responds within 1 business day"

---

## System 3 — Security & Compliance Layer

### Health Data Classification
- Medication names + doses + schedules = **Protected Health Information (PHI)**
- Adherence %, dose logs, missed dose records = **PHI**
- Name + email + phone = **PII**
- PHI + PII combined = **Sensitive PHI** — highest protection level

### Encryption
- **At rest:** Supabase AES-256 encryption — already active for all tables
- **In transit:** HTTPS/TLS 1.3 — Railway handles this at the edge
- **No PHI in email bodies** — emails contain only links (e.g., "View your report") not the data itself
- **Future (scale):** column-level encryption for medication names and dose details

### Audit Logging (new — `audit_log` table)
Every partner portal data access logged:
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_accounts(id),
  patient_id UUID REFERENCES users(id),
  event_type TEXT, -- 'view_patient_list', 'view_patient_detail', 'export_report', 'consent_granted', 'consent_revoked'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- Logs never deleted — retained minimum 6 years (HIPAA: 6 years from creation or last use)
- Only TJ can access audit logs (HQ admin only, `x-carely-secret` protected)
- Audit logs tab added to HQ Partners page

### Consent Management
```sql
CREATE TABLE partner_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  partner_id UUID REFERENCES partner_accounts(id),
  status TEXT, -- 'active', 'revoked'
  consent_version TEXT DEFAULT '1.0',
  consented_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  consented_ip TEXT,
  consented_device_id TEXT
);
```
- Consent is never assumed — defaults to NOT shared
- Revocation is instant — middleware checks `partner_consents` on every portal data request
- Consent language must be plain English, specific (not bundled with ToS)
- Users can revoke at any time, no friction

### HIPAA Alignment (US Users)
Carely is a consumer health app. Key positions:
- **PHI question:** Medication data + adherence from a named individual = likely PHI if used with healthcare providers. Take the conservative path — treat it as PHI.
- **BAA with Supabase:** Required. Supabase offers BAAs on their Team/Enterprise plan. Add to pending tasks (needed before B2B portal goes live with real patient data).
- **BAA with SendGrid:** Required if any PHI in emails. Solution: never put PHI in emails — only links. This keeps SendGrid outside the BAA requirement.
- **Stripe:** Payments only, not PHI — no BAA needed.
- **Minimum necessary:** Partners only see data relevant to care coordination — no raw logs, no personal notes, no journal entries.
- **Access controls:** Each partner only sees their connected patients. No cross-partner data access.
- **Session timeout:** 8 hours inactive auto-logout on all partner portals.
- **Unique user identification:** Each partner account has unique credentials (no shared logins).
- **Audit controls:** Every data access event logged (implemented above).

### PIPEDA Alignment (Canadian Users)
- **Meaningful consent:** Consent screen is explicit, purpose-specific, in plain language. Not bundled with any other agreement.
- **Not a service condition:** Users can use Carely fully without connecting to any partner.
- **Right to access:** `GET /user/my-data` endpoint returns all stored data. Already exists via reports routes. Add data export (JSON/PDF) to comply fully.
- **Right to withdraw:** Disconnect from any partner instantly, any time, no friction.
- **Data minimization:** Portals receive only what's necessary for the specific use case.
- **No onward transfer:** Partner portal data is read-only display — no export to third parties.
- **Provincial (PHIPA/BC PIPA):** Same consent principles apply. No additional data residency requirements for this use case — Supabase US region is acceptable with proper consent.

### Anti-Fraud System

#### At Signup (anti-abuse)
- **Device fingerprint:** Expo `Device.deviceId` + `Device.modelName` stored in `user_devices` table at first signup
- **IP address:** stored at signup + each login
- **Max accounts per device:** soft limit at 2 (warning logged), hard block at 3+ from same device_id within 30 days
- **Disposable email detection:** check MX record quality + known disposable domain list (disposable-email-domains npm package). Reject known disposable domains with clear error: "Please use your real email address."
- **Phone verification:** OTP required for account creation (Twilio). One phone number = one account. Phone stored hashed.
- **Free trial:** one trial per phone number + one trial per device_id. No exceptions.

#### At Referral Redemption
- Referral link tied to specific invitee_email or invitee_phone — verified match required
- If signing up with different email than invited → link rejected: "This invitation was sent to a different email address"
- Cannot refer yourself (checks inviter vs invitee user_id)
- Cannot use referral code on account with prior trial or payment history
- Stripe card fingerprint: if same fingerprint already exists in system → flag as potential abuse (no reward issued, manual review)

#### Ongoing Velocity Checks
- Max 20 outgoing invites per referrer per 24 hours
- Max 5 failed referral redemptions per IP per hour → temp block
- Stripe Radar: enable all default rules + card velocity checks

---

## New Database Tables

```sql
-- Partner applications (before approval)
partner_applications (id, type, org_name, contact_name, email, phone, license_number, province_state, country, patient_count_estimate, message, status, applied_at, reviewed_at, reviewed_by)

-- Partner accounts (after approval)
partner_accounts (id, type, org_name, contact_name, email, password_hash, invite_code, portal_token, activated_at, is_active, country)

-- Partner activation tokens (48h, one-time)
partner_activation_tokens (id, partner_id, token, expires_at, used_at)

-- Partner <> patient links
partner_patient_links (id, partner_id, patient_user_id, status ['pending_partner'|'pending_patient'|'active'|'disconnected'], requested_at, partner_accepted_at, patient_consented_at, disconnected_at)

-- Partner consents (audit-grade)
partner_consents (id, user_id, partner_id, status, consent_version, consented_at, revoked_at, consented_ip, consented_device_id)

-- Partner portal sessions
partner_sessions (id, partner_id, session_token, created_at, expires_at, last_active_at, ip_address)

-- Audit log (never deleted)
audit_log (id, partner_id, patient_id, event_type, ip_address, user_agent, created_at)

-- Medicine requests (pharmacy portal)
medicine_requests (id, patient_user_id, partner_id, request_type ['refill'|'general'], medication_id, medication_name, current_quantity, preferred_date, notes, status ['pending'|'received'|'ready'|'picked_up'], created_at, updated_at)

-- Device fingerprints (anti-fraud)
user_devices (id, user_id, device_id, model_name, os_version, ip_at_signup, created_at)

-- Referral invites (new — replaces generic code system)
referral_invites (id, inviter_user_id, invitee_name, invitee_email, invitee_phone, token, status ['pending'|'used'|'expired'], expires_at, used_at, created_at)
```

---

## New Backend Routes

```
POST /partner/apply                    — partner application form submission
POST /partner/activate                 — set password via activation token
POST /partner/auth/login               — portal login (email + password)
POST /partner/auth/logout              — invalidate session
GET  /partner/me                       — current partner account details

POST /partner/patient-request          — patient requests to connect with partner
GET  /portal/pending-patients          — partner sees incoming connection requests
POST /portal/accept-patient/:linkId    — partner accepts a patient connection
GET  /portal/patients                  — list all connected + consented patients
GET  /portal/patient/:userId           — individual patient detail (adherence, meds, alerts)

POST /pharmacy/refill-request          — patient sends refill request to connected pharmacy
GET  /portal/medicine-requests         — pharmacy sees all incoming requests
PATCH /portal/medicine-request/:id     — pharmacy updates request status

POST /referrals/invite                 — invite a specific person
GET  /referrals/my-invites             — list of sent invites + status

POST /admin/partner/:id/approve        — TJ approves application in HQ
POST /admin/partner/:id/reject         — TJ rejects application
GET  /admin/partners                   — list all partner applications
GET  /admin/audit-log                  — view audit log (HQ only)
```

---

## New App Screens

```
InviteByContactScreen         — enter name + email/phone, send specific invite
PendingInvitesScreen          — list of sent invites, status, expiry
ConnectPartnerScreen          — enter partner code or scan QR
PartnerConsentScreen          — "Dr. Chen wants to see your data" consent flow
ConnectedPartnersScreen       — list of active connections, disconnect option
PharmacyRequestModal          — enhanced pharmacy request (refill + general)
```

---

## Existing Files Modified (additions only, nothing removed)

**Frontend:**
- `for-doctors.html` — form submission wired to `POST /partner/apply`
- `for-pharmacies.html` — same
- `for-senior-homes.html` — same
- `clinic-portal.html` — demo PIN removed, `?demo=true` param, real auth added
- `care-portal.html` — same
- `doctor-portal.html` — patient list added alongside existing single-patient view

**App:**
- `ReferralScreen.tsx` — invite-by-contact section added, conditions bottom sheet added
- `MedicinesScreen.tsx` — Refill modal enhanced to send to connected pharmacy
- `PharmacyScreen.tsx` — "Request from pharmacy" button added if partner connected
- `ProfileScreen.tsx` — "Connected Partners" section added

**Backend:**
- `referrals.ts` — invite endpoint, new reward logic, anti-abuse checks
- `pharmacy.ts` — medicine request endpoints added
- `doctor.ts` — existing email flow preserved, new portal data endpoints added
- `index.ts` — new route registrations

---

## What Stays Untouched

- All existing adherence rings, heat maps, dose logs, vitals
- All existing agent/Hermes infrastructure
- All existing Elara chat functionality
- All existing auth (email/password, Google OAuth)
- All existing Stripe payment flows
- All existing security middleware (helmet, rate limiting, agentGuard, circuitBreaker)
- demo-mode hardcoded data in all three portals (preserved, just accessed via `?demo=true` now)

---

## Compliance Pending Actions

Before B2B portal goes live with real patient data:
1. **Supabase BAA** — upgrade to Team plan ($25/mo) and sign Business Associate Agreement
2. **Privacy Policy update** — add section on partner data sharing, patient rights, retention policy
3. **Terms of Service update** — add partner terms, data processing agreement for partners
4. **Partner Agreement** — partners must sign before activation (checkboxes at portal activation)

---
*Spec written May 20, 2026. Research agent compliance validation pending.*
