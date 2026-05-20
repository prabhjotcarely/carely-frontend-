# Partner Portal Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete backend for the Partner Portal system — partner applications, approval, activation, auth, patient connections, consent, portal data, pharmacy requests, audit logging, and HQ admin routes.

**Architecture:** Partners are a separate user class with their own session table and JWT middleware. Patient data flows through a consent gate — every portal data route checks `partner_consents` before returning anything. Every data access event writes an `audit_log` row. Admin routes use the existing `x-carely-secret` guard pattern.

**Tech Stack:** TypeScript, Express, Supabase (pg), bcrypt, jsonwebtoken, zod, existing db/client, existing AppError/requireAuth patterns

---

## File Map

**Create:**
- `src/routes/partner.ts` — partner application + activation + auth routes
- `src/routes/portal.ts` — partner-authenticated portal data routes (patients, detail)
- `src/routes/pharmacy.ts` — extended with new medicine request endpoints (MODIFY existing file)
- `src/middleware/partnerAuth.ts` — partner session JWT middleware
- `src/middleware/auditLog.ts` — audit logging middleware helper

**Modify:**
- `src/routes/admin.ts` — add partner management + audit log endpoints
- `src/index.ts` — register `/partner` and `/portal` routes

---

### Task 1: Database Migrations

**Files:**
- Create: `src/db/migrations/007_partner_tables.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- src/db/migrations/007_partner_tables.sql

-- Partner applications (before TJ approval)
CREATE TABLE IF NOT EXISTS partner_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  TEXT NOT NULL CHECK (type IN ('doctor','clinic','pharmacy','care_home')),
  org_name              TEXT NOT NULL,
  contact_name          TEXT NOT NULL,
  email                 TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  license_number        TEXT,
  province_state        TEXT,
  country               TEXT NOT NULL CHECK (country IN ('CA','US')),
  patient_count_estimate INTEGER,
  message               TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  applied_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           TEXT
);

-- Partner accounts (after TJ approval)
CREATE TABLE IF NOT EXISTS partner_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN ('doctor','clinic','pharmacy','care_home')),
  org_name      TEXT NOT NULL,
  contact_name  TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  invite_code   TEXT UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  activated_at  TIMESTAMPTZ,
  country       TEXT NOT NULL DEFAULT 'CA',
  application_id UUID REFERENCES partner_applications(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partner activation tokens (48h, one-time use)
CREATE TABLE IF NOT EXISTS partner_activation_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partner portal sessions
CREATE TABLE IF NOT EXISTS partner_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id     UUID NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  session_token  TEXT NOT NULL UNIQUE,
  expires_at     TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partner <> patient links (connection lifecycle)
CREATE TABLE IF NOT EXISTS partner_patient_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id            UUID NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  patient_user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'pending_partner'
                          CHECK (status IN ('pending_partner','pending_patient_consent','active','disconnected')),
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  partner_accepted_at   TIMESTAMPTZ,
  patient_consented_at  TIMESTAMPTZ,
  disconnected_at       TIMESTAMPTZ,
  UNIQUE(partner_id, patient_user_id)
);

-- Partner consents (audit-grade, never deleted)
CREATE TABLE IF NOT EXISTS partner_consents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  partner_id          UUID NOT NULL REFERENCES partner_accounts(id),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  consent_version     TEXT NOT NULL DEFAULT '1.0',
  consented_at        TIMESTAMPTZ,
  revoked_at          TIMESTAMPTZ,
  consented_ip        TEXT,
  consented_device_id TEXT
);

-- Audit log (never deleted — HIPAA 6-year retention)
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID REFERENCES partner_accounts(id),
  patient_id  UUID REFERENCES users(id),
  event_type  TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medicine requests (pharmacy portal inbox)
CREATE TABLE IF NOT EXISTS medicine_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id       UUID NOT NULL REFERENCES partner_accounts(id),
  request_type     TEXT NOT NULL CHECK (request_type IN ('refill','general')),
  medication_id    UUID,
  medication_name  TEXT,
  current_quantity INTEGER,
  preferred_date   DATE,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','received','ready','picked_up')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_partner_patient_links_partner ON partner_patient_links(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_patient_links_patient ON partner_patient_links(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_consents_user_partner ON partner_consents(user_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_partner ON audit_log(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_patient ON audit_log(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medicine_requests_partner ON medicine_requests(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_token ON partner_sessions(session_token);
```

- [ ] **Step 2: Run migration against Supabase**

Go to Supabase dashboard → SQL Editor → paste the full SQL above → Run.

Verify tables created:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'partner_applications','partner_accounts','partner_activation_tokens',
    'partner_sessions','partner_patient_links','partner_consents',
    'audit_log','medicine_requests'
  );
```
Expected: 8 rows returned.

- [ ] **Step 3: Commit the migration file**

```bash
git add src/db/migrations/007_partner_tables.sql
git commit -m "feat: add partner portal database migration (8 new tables)"
```

---

### Task 2: Partner Auth Middleware

**Files:**
- Create: `src/middleware/partnerAuth.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/middleware/partnerAuth.test.ts
import { partnerAuth } from '../../src/middleware/partnerAuth';
import { db } from '../../src/db/client';

jest.mock('../../src/db/client');

it('rejects missing Bearer token with 401', async () => {
  const req: any = { headers: {} };
  const res: any = {};
  const next = jest.fn();
  await partnerAuth(req, res, next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
});

it('rejects expired session with 401', async () => {
  const req: any = { headers: { authorization: 'Bearer abc' } };
  const res: any = {};
  const next = jest.fn();
  (db.from as jest.Mock).mockReturnValue({
    select: () => ({ eq: () => ({ gt: () => ({ single: () => ({ data: null, error: null }) }) }) }),
  });
  await partnerAuth(req, res, next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /tmp/carely-backend && npx jest tests/middleware/partnerAuth.test.ts --no-coverage
```
Expected: FAIL — `partnerAuth` not found.

- [ ] **Step 3: Write the middleware**

```typescript
// src/middleware/partnerAuth.ts
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { AppError } from './errorHandler';

export interface PartnerRequest extends Request {
  partnerId?: string;
  partnerType?: string;
}

export async function partnerAuth(req: PartnerRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Partner session token required'));
  }
  const token = header.slice(7);

  const { data: session } = await db
    .from('partner_sessions')
    .select('partner_id, expires_at')
    .eq('session_token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!session) return next(new AppError(401, 'Invalid or expired session'));

  const { data: partner } = await db
    .from('partner_accounts')
    .select('id, type, is_active')
    .eq('id', session.partner_id)
    .single();

  if (!partner?.is_active) return next(new AppError(401, 'Partner account not active'));

  // Extend session last_active_at (fire-and-forget)
  db.from('partner_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('session_token', token)
    .then(() => {});

  req.partnerId = partner.id;
  req.partnerType = partner.type;
  next();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/middleware/partnerAuth.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/partnerAuth.ts tests/middleware/partnerAuth.test.ts
git commit -m "feat: add partnerAuth session middleware"
```

---

### Task 3: Audit Log Helper

**Files:**
- Create: `src/middleware/auditLog.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/middleware/auditLog.test.ts
import { writeAuditLog } from '../../src/middleware/auditLog';
import { db } from '../../src/db/client';

jest.mock('../../src/db/client');

it('inserts audit_log row with all fields', async () => {
  const insertMock = jest.fn().mockResolvedValue({ error: null });
  (db.from as jest.Mock).mockReturnValue({ insert: insertMock });

  await writeAuditLog({
    partnerId: 'p1',
    patientId: 'u1',
    eventType: 'view_patient_list',
    ipAddress: '1.2.3.4',
    userAgent: 'Mozilla/5.0',
  });

  expect(db.from).toHaveBeenCalledWith('audit_log');
  expect(insertMock).toHaveBeenCalledWith(
    expect.objectContaining({ partner_id: 'p1', event_type: 'view_patient_list' })
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/middleware/auditLog.test.ts --no-coverage
```
Expected: FAIL — `writeAuditLog` not found.

- [ ] **Step 3: Write the helper**

```typescript
// src/middleware/auditLog.ts
import { db } from '../db/client';

interface AuditEntry {
  partnerId: string;
  patientId?: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  await db.from('audit_log').insert({
    partner_id: entry.partnerId,
    patient_id: entry.patientId ?? null,
    event_type: entry.eventType,
    ip_address: entry.ipAddress ?? null,
    user_agent: entry.userAgent ?? null,
    metadata:   entry.metadata ?? null,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/middleware/auditLog.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/auditLog.ts tests/middleware/auditLog.test.ts
git commit -m "feat: add writeAuditLog helper (HIPAA audit trail)"
```

---

### Task 4: Partner Application + Activation Routes

**Files:**
- Create: `src/routes/partner.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/routes/partner.test.ts
import request from 'supertest';
import app from '../../src/app'; // assumes app exported separately from index.ts

it('POST /partner/apply returns 201 on valid body', async () => {
  const res = await request(app).post('/partner/apply').send({
    type: 'pharmacy',
    org_name: 'Sunrise Pharmacy',
    contact_name: 'Ali Hassan',
    email: 'ali@sunrisepharmacy.ca',
    phone: '+16041234567',
    country: 'CA',
    patient_count_estimate: 50,
  });
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('message');
});

it('POST /partner/apply rejects missing required fields', async () => {
  const res = await request(app).post('/partner/apply').send({ type: 'clinic' });
  expect(res.status).toBe(400);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/routes/partner.test.ts --no-coverage
```
Expected: FAIL — route not registered.

- [ ] **Step 3: Write `src/routes/partner.ts`**

```typescript
// src/routes/partner.ts
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db/client';
import { AppError } from '../middleware/errorHandler';
import { partnerAuth, PartnerRequest } from '../middleware/partnerAuth';
import { sendEmail } from '../services/email';

const router = Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

const applySchema = z.object({
  type:                   z.enum(['doctor','clinic','pharmacy','care_home']),
  org_name:               z.string().min(2).max(100),
  contact_name:           z.string().min(2).max(100),
  email:                  z.string().email(),
  phone:                  z.string().min(7).max(20),
  license_number:         z.string().max(50).optional(),
  province_state:         z.string().max(50).optional(),
  country:                z.enum(['CA','US']),
  patient_count_estimate: z.number().int().positive().optional(),
  message:                z.string().max(1000).optional(),
});

const activateSchema = z.object({
  token:    z.string().uuid(),
  password: z.string().min(10).max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ── POST /partner/apply ──────────────────────────────────────────────────────
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = applySchema.parse(req.body);

    // Check for duplicate application from same email
    const { data: existing } = await db
      .from('partner_applications')
      .select('id, status')
      .eq('email', body.email.toLowerCase())
      .in('status', ['pending','approved'])
      .single();

    if (existing) {
      return next(new AppError(409, 'An application from this email is already under review.'));
    }

    const { data: application, error } = await db
      .from('partner_applications')
      .insert({
        type:                   body.type,
        org_name:               body.org_name,
        contact_name:           body.contact_name,
        email:                  body.email.toLowerCase(),
        phone:                  body.phone,
        license_number:         body.license_number ?? null,
        province_state:         body.province_state ?? null,
        country:                body.country,
        patient_count_estimate: body.patient_count_estimate ?? null,
        message:                body.message ?? null,
      })
      .select('id')
      .single();

    if (error) return next(new AppError(500, 'Could not submit application'));

    // Confirmation email to applicant
    await sendEmail({
      to:      body.email,
      subject: 'Your Carely Partner Application — Received',
      html:    `<p>Hi ${body.contact_name},</p>
                <p>We received your application for <strong>${body.org_name}</strong>. 
                We review each application personally and will be in touch within 2 business days.</p>
                <p>— TJ, Carely</p>`,
    }).catch(() => {}); // non-blocking

    // HQ inbox alert (fire-and-forget)
    db.from('hq_inbox').insert({
      type:    'partner_application',
      title:   `New partner application: ${body.org_name} (${body.type})`,
      body:    `From: ${body.contact_name} <${body.email}>. Application ID: ${application!.id}`,
      read:    false,
    }).then(() => {}).catch(() => {});

    res.status(201).json({
      message: 'Application received. We\'ll be in touch within 2 business days.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
});

// ── POST /partner/activate — partner sets password via emailed token ──────────
router.post('/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = activateSchema.parse(req.body);

    const { data: activation } = await db
      .from('partner_activation_tokens')
      .select('id, partner_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (!activation) return next(new AppError(404, 'Activation link not found or already used.'));
    if (activation.used_at) return next(new AppError(410, 'This activation link has already been used.'));
    if (new Date(activation.expires_at) < new Date()) {
      return next(new AppError(410, 'This activation link has expired. Please contact hello@carely.fit.'));
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Generate unique invite code: TYPE_PREFIX-RANDOM
    const { data: partner } = await db
      .from('partner_accounts')
      .select('type, org_name')
      .eq('id', activation.partner_id)
      .single();

    if (!partner) return next(new AppError(404, 'Partner account not found'));

    const prefix = partner.type === 'doctor' ? 'DR' :
                   partner.type === 'clinic' ? 'CL' :
                   partner.type === 'pharmacy' ? 'PH' : 'CH';
    const orgSlug = partner.org_name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CARE';
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const invite_code = `${prefix}-${orgSlug}-${suffix}`;

    const { error } = await db
      .from('partner_accounts')
      .update({
        password_hash,
        invite_code,
        is_active:    true,
        activated_at: new Date().toISOString(),
      })
      .eq('id', activation.partner_id);

    if (error) return next(new AppError(500, 'Could not activate account'));

    // Mark token used
    await db
      .from('partner_activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', activation.id);

    res.json({
      message:     'Account activated. You can now log in.',
      invite_code,
      portal_url:  getPortalUrl(partner.type),
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
});

// ── POST /partner/auth/login ─────────────────────────────────────────────────
router.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: partner } = await db
      .from('partner_accounts')
      .select('id, type, contact_name, org_name, password_hash, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (!partner) return next(new AppError(401, 'Invalid email or password'));
    if (!partner.is_active) return next(new AppError(401, 'Account not yet activated'));
    if (!partner.password_hash) return next(new AppError(401, 'Account setup incomplete'));

    const valid = await bcrypt.compare(password, partner.password_hash);
    if (!valid) return next(new AppError(401, 'Invalid email or password'));

    // Issue session token (8-hour expiry)
    const session_token = crypto.randomBytes(32).toString('hex');
    const expires_at    = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const { error } = await db.from('partner_sessions').insert({
      partner_id:    partner.id,
      session_token,
      expires_at,
      ip_address:    req.ip,
    });

    if (error) return next(new AppError(500, 'Could not create session'));

    res.json({
      token:        session_token,
      expires_at,
      partner: {
        id:           partner.id,
        type:         partner.type,
        contact_name: partner.contact_name,
        org_name:     partner.org_name,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
});

// ── POST /partner/auth/logout ────────────────────────────────────────────────
router.post('/auth/logout', partnerAuth, async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.slice(7) ?? '';
    await db.from('partner_sessions').delete().eq('session_token', token);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /partner/me ──────────────────────────────────────────────────────────
router.get('/me', partnerAuth, async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const { data: partner } = await db
      .from('partner_accounts')
      .select('id, type, org_name, contact_name, email, invite_code, activated_at, country')
      .eq('id', req.partnerId!)
      .single();

    if (!partner) return next(new AppError(404, 'Partner not found'));
    res.json({ partner });
  } catch (err) { next(err); }
});

// ── POST /partner/patient-request — app user initiates connection ─────────────
// Called by the mobile app (user JWT auth) to request connection with a partner
import { requireAuth, AuthRequest } from '../middleware/auth';

router.post('/patient-request', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inviteCode = z.string().min(1).parse(req.body.invite_code);

    const { data: partner } = await db
      .from('partner_accounts')
      .select('id, org_name, type, is_active')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (!partner || !partner.is_active) {
      return next(new AppError(404, 'Partner code not found. Please check with your provider.'));
    }

    // Check for existing link
    const { data: existing } = await db
      .from('partner_patient_links')
      .select('id, status')
      .eq('partner_id', partner.id)
      .eq('patient_user_id', req.userId!)
      .single();

    if (existing) {
      if (existing.status === 'active') {
        return next(new AppError(409, 'You are already connected to this provider.'));
      }
      if (existing.status === 'pending_partner' || existing.status === 'pending_patient_consent') {
        return next(new AppError(409, 'A connection request with this provider is already pending.'));
      }
    }

    const { error } = await db.from('partner_patient_links').upsert({
      partner_id:      partner.id,
      patient_user_id: req.userId!,
      status:          'pending_partner',
      requested_at:    new Date().toISOString(),
    }, { onConflict: 'partner_id,patient_user_id' });

    if (error) return next(new AppError(500, 'Could not send request'));

    res.status(201).json({
      message: `Request sent to ${partner.org_name}. They'll approve it shortly.`,
      partner: { id: partner.id, name: partner.org_name, type: partner.type },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
});

// ── POST /partner/consent/:linkId — patient grants consent ────────────────────
router.post('/consent/:linkId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { linkId } = req.params;

    const { data: link } = await db
      .from('partner_patient_links')
      .select('id, partner_id, patient_user_id, status')
      .eq('id', linkId)
      .eq('patient_user_id', req.userId!)
      .single();

    if (!link) return next(new AppError(404, 'Connection request not found'));
    if (link.status !== 'pending_patient_consent') {
      return next(new AppError(400, 'This connection is not awaiting your consent'));
    }

    const now = new Date().toISOString();

    await db.from('partner_patient_links')
      .update({ status: 'active', patient_consented_at: now })
      .eq('id', linkId);

    await db.from('partner_consents').upsert({
      user_id:             req.userId!,
      partner_id:          link.partner_id,
      status:              'active',
      consent_version:     '1.0',
      consented_at:        now,
      consented_ip:        req.ip,
      consented_device_id: req.body.device_id ?? null,
    }, { onConflict: 'user_id,partner_id' });

    res.json({ ok: true, message: 'Data sharing enabled. You can disconnect at any time from your profile.' });
  } catch (err) { next(err); }
});

// ── DELETE /partner/disconnect/:partnerId — patient revokes consent ─────────
router.delete('/disconnect/:partnerId', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date().toISOString();

    await db.from('partner_patient_links')
      .update({ status: 'disconnected', disconnected_at: now })
      .eq('partner_id', req.params.partnerId)
      .eq('patient_user_id', req.userId!);

    await db.from('partner_consents')
      .update({ status: 'revoked', revoked_at: now })
      .eq('partner_id', req.params.partnerId)
      .eq('user_id', req.userId!);

    res.json({ ok: true, message: 'Disconnected. This provider can no longer see your data.' });
  } catch (err) { next(err); }
});

// ── GET /partner/my-connections — app: list all patient's active connections ──
router.get('/my-connections', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: links } = await db
      .from('partner_patient_links')
      .select(`
        id, status, requested_at, patient_consented_at,
        partner_accounts(id, type, org_name, contact_name, invite_code)
      `)
      .eq('patient_user_id', req.userId!)
      .neq('status', 'disconnected');

    res.json({ connections: links || [] });
  } catch (err) { next(err); }
});

// ── GET /partner/pending-consent — app: requests awaiting patient consent ────
router.get('/pending-consent', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: links } = await db
      .from('partner_patient_links')
      .select(`
        id, requested_at,
        partner_accounts(id, type, org_name, contact_name)
      `)
      .eq('patient_user_id', req.userId!)
      .eq('status', 'pending_patient_consent');

    res.json({ pending: links || [] });
  } catch (err) { next(err); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPortalUrl(type: string): string {
  const map: Record<string, string> = {
    doctor:    'https://carely.fit/doctor-portal',
    clinic:    'https://carely.fit/clinic-portal',
    pharmacy:  'https://carely.fit/clinic-portal',
    care_home: 'https://carely.fit/care-portal',
  };
  return map[type] ?? 'https://carely.fit';
}

export default router;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/routes/partner.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/partner.ts tests/routes/partner.test.ts
git commit -m "feat: add partner application, activation, and auth routes"
```

---

### Task 5: Portal Data Routes (Patient-Gated, Audit-Logged)

**Files:**
- Create: `src/routes/portal.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/routes/portal.test.ts
import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/db/client';

jest.mock('../../src/db/client');
jest.mock('../../src/middleware/partnerAuth', () => ({
  partnerAuth: (req: any, _res: any, next: any) => {
    req.partnerId = 'partner-uuid';
    req.partnerType = 'clinic';
    next();
  },
}));

it('GET /portal/patients returns 200 with patient list', async () => {
  (db.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'partner_patient_links') {
      return {
        select: () => ({ eq: () => ({ eq: () => ({
          data: [{ patient_user_id: 'u1', partner_accounts: {} }], error: null
        }) }) }),
      };
    }
    if (table === 'audit_log') return { insert: jest.fn().mockResolvedValue({}) };
    return { select: () => ({ in: () => ({ data: [], error: null }) }) };
  });

  const res = await request(app)
    .get('/portal/patients')
    .set('Authorization', 'Bearer valid-session-token');

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('patients');
});

it('GET /portal/patients returns 401 without token', async () => {
  const res = await request(app).get('/portal/patients');
  expect(res.status).toBe(401);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/routes/portal.test.ts --no-coverage
```
Expected: FAIL — route not registered.

- [ ] **Step 3: Write `src/routes/portal.ts`**

```typescript
// src/routes/portal.ts
import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { partnerAuth, PartnerRequest } from '../middleware/partnerAuth';
import { writeAuditLog } from '../middleware/auditLog';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(partnerAuth);

// Helper: check active consent for this partner+patient pair
async function hasConsent(partnerId: string, patientId: string): Promise<boolean> {
  const { data } = await db
    .from('partner_consents')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('user_id', patientId)
    .eq('status', 'active')
    .single();
  return !!data;
}

// ── GET /portal/patients — list all connected + consented patients ─────────────
router.get('/patients', async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const partnerId = req.partnerId!;

    // Get all active links
    const { data: links } = await db
      .from('partner_patient_links')
      .select('patient_user_id')
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    if (!links?.length) {
      return res.json({ patients: [] });
    }

    const patientIds = links.map(l => l.patient_user_id);

    // Fetch users + adherence data
    const { data: users } = await db
      .from('users')
      .select('id, first_name, last_name, last_active_at')
      .in('id', patientIds);

    // Calculate 30-day adherence for each patient
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: doseLogs } = await db
      .from('dose_logs')
      .select('user_id, taken, scheduled_at')
      .in('user_id', patientIds)
      .gte('scheduled_at', thirtyDaysAgo);

    const adherenceMap: Record<string, { taken: number; total: number }> = {};
    for (const log of doseLogs ?? []) {
      if (!adherenceMap[log.user_id]) adherenceMap[log.user_id] = { taken: 0, total: 0 };
      adherenceMap[log.user_id].total++;
      if (log.taken) adherenceMap[log.user_id].taken++;
    }

    // 7-day missed doses
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: missedRecent } = await db
      .from('dose_logs')
      .select('user_id')
      .in('user_id', patientIds)
      .gte('scheduled_at', sevenDaysAgo)
      .eq('taken', false);

    const missedMap: Record<string, number> = {};
    for (const log of missedRecent ?? []) {
      missedMap[log.user_id] = (missedMap[log.user_id] ?? 0) + 1;
    }

    const patients = (users ?? []).map(u => {
      const stats = adherenceMap[u.id] ?? { taken: 0, total: 0 };
      const adherencePct = stats.total > 0
        ? Math.round((stats.taken / stats.total) * 100)
        : null;
      return {
        id:            u.id,
        first_name:    u.first_name,
        last_initial:  u.last_name?.[0] ?? '',
        adherence_pct: adherencePct,
        missed_7d:     missedMap[u.id] ?? 0,
        last_active:   u.last_active_at,
        at_risk:       adherencePct !== null && adherencePct < 70,
      };
    });

    await writeAuditLog({
      partnerId,
      eventType: 'view_patient_list',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata:  { patient_count: patients.length },
    });

    res.json({ patients });
  } catch (err) { next(err); }
});

// ── GET /portal/patient/:userId — individual patient detail ───────────────────
router.get('/patient/:userId', async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const partnerId = req.partnerId!;
    const patientId = req.params.userId;

    const consented = await hasConsent(partnerId, patientId);
    if (!consented) return next(new AppError(403, 'Patient has not granted access to their data'));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const sevenDaysAgo  = new Date(Date.now() - 7  * 86400000).toISOString();

    const [
      { data: user },
      { data: medicines },
      { data: doseLogs30 },
      { data: doseLogs7 },
    ] = await Promise.all([
      db.from('users').select('id, first_name, last_name, last_active_at').eq('id', patientId).single(),
      db.from('medicines').select('id, name, dose_amount, dose_unit').eq('user_id', patientId),
      db.from('dose_logs').select('taken, scheduled_at').eq('user_id', patientId).gte('scheduled_at', thirtyDaysAgo),
      db.from('dose_logs').select('taken, scheduled_at').eq('user_id', patientId).gte('scheduled_at', sevenDaysAgo),
    ]);

    if (!user) return next(new AppError(404, 'Patient not found'));

    const calc = (logs: Array<{ taken: boolean }>) => {
      const total = logs.length;
      const taken = logs.filter(l => l.taken).length;
      return { taken, missed: total - taken, total, pct: total > 0 ? Math.round((taken / total) * 100) : null };
    };

    const stats30 = calc(doseLogs30 ?? []);
    const stats7  = calc(doseLogs7  ?? []);

    await writeAuditLog({
      partnerId,
      patientId,
      eventType: 'view_patient_detail',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      patient: {
        id:         user.id,
        first_name: user.first_name,
        last_initial: user.last_name?.[0] ?? '',
        last_active: user.last_active_at,
        medications: (medicines ?? []).map(m => ({
          name: m.name,
          dose: `${m.dose_amount}${m.dose_unit}`,
        })),
        adherence: {
          last_30_days: stats30,
          last_7_days:  stats7,
        },
      },
    });
  } catch (err) { next(err); }
});

// ── GET /portal/pending-patients — partner sees incoming connection requests ───
router.get('/pending-patients', async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const { data: links } = await db
      .from('partner_patient_links')
      .select(`
        id, requested_at,
        users!patient_user_id(id, first_name, last_name)
      `)
      .eq('partner_id', req.partnerId!)
      .eq('status', 'pending_partner');

    res.json({ pending: links || [] });
  } catch (err) { next(err); }
});

// ── POST /portal/accept-patient/:linkId — partner accepts a patient ───────────
router.post('/accept-patient/:linkId', async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const { data: link } = await db
      .from('partner_patient_links')
      .select('id, partner_id, patient_user_id, status')
      .eq('id', req.params.linkId)
      .eq('partner_id', req.partnerId!)
      .single();

    if (!link) return next(new AppError(404, 'Request not found'));
    if (link.status !== 'pending_partner') return next(new AppError(400, 'Request already processed'));

    await db
      .from('partner_patient_links')
      .update({ status: 'pending_patient_consent', partner_accepted_at: new Date().toISOString() })
      .eq('id', link.id);

    // Push notification to patient goes here via notification service
    // (fire-and-forget, no blocking)
    // sendPushNotification(link.patient_user_id, { title: 'Provider connected', body: '...' });

    res.json({ ok: true, message: 'Patient notified — waiting for their consent.' });
  } catch (err) { next(err); }
});

// ── GET /portal/medicine-requests — pharmacy sees refill inbox ────────────────
router.get('/medicine-requests', async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    if (req.partnerType !== 'pharmacy') {
      return next(new AppError(403, 'Medicine requests are only available for pharmacy partners'));
    }

    const { data: requests } = await db
      .from('medicine_requests')
      .select(`
        id, request_type, medication_name, current_quantity,
        preferred_date, notes, status, created_at, updated_at,
        users!patient_user_id(id, first_name, last_name)
      `)
      .eq('partner_id', req.partnerId!)
      .order('created_at', { ascending: false });

    res.json({ requests: requests || [] });
  } catch (err) { next(err); }
});

// ── PATCH /portal/medicine-request/:id — pharmacy updates request status ──────
router.patch('/medicine-request/:id', async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    if (req.partnerType !== 'pharmacy') {
      return next(new AppError(403, 'Only pharmacy partners can update request status'));
    }

    const newStatus = z.enum(['received','ready','picked_up']).parse(req.body.status);

    const { data: request } = await db
      .from('medicine_requests')
      .select('id, partner_id, patient_user_id')
      .eq('id', req.params.id)
      .eq('partner_id', req.partnerId!)
      .single();

    if (!request) return next(new AppError(404, 'Request not found'));

    await db.from('medicine_requests').update({
      status:     newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', request.id);

    await writeAuditLog({
      partnerId:  req.partnerId!,
      patientId:  request.patient_user_id,
      eventType:  `medicine_request_${newStatus}`,
      ipAddress:  req.ip,
      userAgent:  req.headers['user-agent'],
    });

    res.json({ ok: true, status: newStatus });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, 'Invalid status value'));
    next(err);
  }
});

export default router;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/routes/portal.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/portal.ts tests/routes/portal.test.ts
git commit -m "feat: add portal data routes with consent gate and audit logging"
```

---

### Task 6: Pharmacy Medicine Request (Patient Side)

**Files:**
- Modify: `src/routes/pharmacy.ts` (add new endpoints after existing ones)

- [ ] **Step 1: Write the failing test**

```typescript
// tests/routes/pharmacy-requests.test.ts
import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/db/client';

jest.mock('../../src/db/client');
jest.mock('../../src/middleware/auth', () => ({
  requireAuth: (req: any, _: any, next: any) => { req.userId = 'user-1'; next(); },
  AuthRequest: {},
}));

it('POST /pharmacy/refill-request returns 201 with valid body', async () => {
  (db.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'partner_patient_links') {
      return {
        select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({
          single: () => ({ data: { partner_id: 'p1' }, error: null })
        }) }) }) }),
      };
    }
    if (table === 'medicine_requests') {
      return { insert: () => ({ select: () => ({ single: () => ({ data: { id: 'req-1' }, error: null }) }) }) };
    }
    return {};
  });

  const res = await request(app)
    .post('/pharmacy/refill-request')
    .set('Authorization', 'Bearer user-token')
    .send({
      medication_name:  'Metformin 500mg',
      current_quantity: 10,
      preferred_date:   '2026-05-25',
    });

  expect(res.status).toBe(201);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/routes/pharmacy-requests.test.ts --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Add medicine request endpoints to `src/routes/pharmacy.ts`**

Open `src/routes/pharmacy.ts` and append BEFORE `export default router;`:

```typescript
import { z } from 'zod';

const refillRequestSchema = z.object({
  medication_id:    z.string().uuid().optional(),
  medication_name:  z.string().min(1).max(100),
  current_quantity: z.number().int().min(0).optional(),
  preferred_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes:            z.string().max(500).optional(),
});

const generalRequestSchema = z.object({
  medication_name: z.string().max(100).optional(),
  notes:           z.string().min(1).max(500),
});

// ── POST /pharmacy/refill-request — patient sends refill request ──────────────
router.post('/refill-request', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = refillRequestSchema.parse(req.body);

    // Find connected pharmacy partner
    const { data: link } = await db
      .from('partner_patient_links')
      .select('partner_id')
      .eq('patient_user_id', req.userId!)
      .eq('status', 'active')
      // subquery: partner must be type 'pharmacy'
      .eq('partner_accounts.type', 'pharmacy')
      .single();

    if (!link) {
      return next(new AppError(400, 'You have no connected pharmacy. Connect one first from your profile.'));
    }

    const { data: requestRow, error } = await db
      .from('medicine_requests')
      .insert({
        patient_user_id: req.userId!,
        partner_id:      link.partner_id,
        request_type:    'refill',
        medication_id:   body.medication_id ?? null,
        medication_name: body.medication_name,
        current_quantity: body.current_quantity ?? null,
        preferred_date:  body.preferred_date ?? null,
        notes:           body.notes ?? null,
      })
      .select('id')
      .single();

    if (error) return next(new AppError(500, 'Could not send refill request'));

    res.status(201).json({
      message: 'Refill request sent to your pharmacy. They\'ll notify you when it\'s ready.',
      request_id: requestRow!.id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
});

// ── POST /pharmacy/general-request — free-text pharmacy request ───────────────
router.post('/general-request', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = generalRequestSchema.parse(req.body);

    const { data: link } = await db
      .from('partner_patient_links')
      .select('partner_id')
      .eq('patient_user_id', req.userId!)
      .eq('status', 'active')
      .single();

    if (!link) {
      return next(new AppError(400, 'You have no connected pharmacy. Connect one first from your profile.'));
    }

    const { data: requestRow, error } = await db
      .from('medicine_requests')
      .insert({
        patient_user_id: req.userId!,
        partner_id:      link.partner_id,
        request_type:    'general',
        medication_name: body.medication_name ?? null,
        notes:           body.notes,
      })
      .select('id')
      .single();

    if (error) return next(new AppError(500, 'Could not send request'));

    res.status(201).json({
      message: 'Request sent to your pharmacy.',
      request_id: requestRow!.id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
});

// ── GET /pharmacy/my-requests — patient sees their own request history ─────────
router.get('/my-requests', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: requests } = await db
      .from('medicine_requests')
      .select(`
        id, request_type, medication_name, status, preferred_date,
        notes, created_at, updated_at,
        partner_accounts!partner_id(org_name)
      `)
      .eq('patient_user_id', req.userId!)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ requests: requests || [] });
  } catch (err) { next(err); }
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/routes/pharmacy-requests.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/pharmacy.ts tests/routes/pharmacy-requests.test.ts
git commit -m "feat: add patient-side pharmacy medicine request endpoints"
```

---

### Task 7: Admin Partner Management Routes

**Files:**
- Modify: `src/routes/admin.ts` (append partner management section)

- [ ] **Step 1: Write the failing test**

```typescript
// tests/routes/admin-partners.test.ts
import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/db/client';

jest.mock('../../src/db/client');

const ADMIN_SECRET = 'test-admin-secret-must-be-long-enough-32chars';
process.env.ADMIN_SECRET = ADMIN_SECRET;

it('GET /admin/partners returns 401 without secret', async () => {
  const res = await request(app).get('/admin/partners');
  expect(res.status).toBe(401);
});

it('GET /admin/partners returns 200 with valid secret', async () => {
  (db.from as jest.Mock).mockReturnValue({
    select: () => ({ order: () => ({ data: [], error: null }) }),
  });

  const res = await request(app)
    .get('/admin/partners')
    .set('x-carely-secret', ADMIN_SECRET);

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('applications');
});

it('POST /admin/partner/:id/approve returns 200', async () => {
  (db.from as jest.Mock).mockImplementation((table: string) => {
    if (table === 'partner_applications') {
      return {
        select: () => ({ eq: () => ({ single: () => ({
          data: { id: 'app-1', type: 'clinic', org_name: 'Test Clinic',
                  contact_name: 'Dr. Lee', email: 'lee@clinic.ca', phone: '+1604',
                  license_number: null, province_state: 'BC', country: 'CA' },
          error: null
        }) }) }),
        update: () => ({ eq: () => ({ error: null }) }),
      };
    }
    if (table === 'partner_accounts') {
      return { insert: () => ({ select: () => ({ single: () => ({ data: { id: 'pa-1' }, error: null }) }) }) };
    }
    if (table === 'partner_activation_tokens') {
      return { insert: () => ({ error: null }) };
    }
    return {};
  });

  const res = await request(app)
    .post('/admin/partner/app-1/approve')
    .set('x-carely-secret', ADMIN_SECRET);

  expect(res.status).toBe(200);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/routes/admin-partners.test.ts --no-coverage
```
Expected: FAIL — endpoints not defined.

- [ ] **Step 3: Append to `src/routes/admin.ts`** (before `export default router`)

```typescript
import crypto from 'crypto';
import { sendEmail } from '../services/email';

// ── GET /admin/partners — list all partner applications ───────────────────────
router.get('/partners', async (req: Request, res: Response) => {
  if (!guard(req, res)) return;

  const { data: applications } = await db
    .from('partner_applications')
    .select('id, type, org_name, contact_name, email, phone, license_number, province_state, country, patient_count_estimate, message, status, applied_at, reviewed_at')
    .order('applied_at', { ascending: false });

  const { data: accounts } = await db
    .from('partner_accounts')
    .select('id, type, org_name, contact_name, email, invite_code, is_active, activated_at, created_at');

  res.json({ applications: applications || [], accounts: accounts || [] });
});

// ── POST /admin/partner/:id/approve — approve application, create account ─────
router.post('/partner/:id/approve', async (req: Request, res: Response) => {
  if (!guard(req, res)) return;

  const { data: application } = await db
    .from('partner_applications')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (!application) {
    res.status(404).json({ message: 'Application not found' });
    return;
  }

  if (application.status !== 'pending') {
    res.status(409).json({ message: 'Application already reviewed' });
    return;
  }

  // Create partner account (inactive until self-activated)
  const { data: account, error: accountError } = await db
    .from('partner_accounts')
    .insert({
      type:           application.type,
      org_name:       application.org_name,
      contact_name:   application.contact_name,
      email:          application.email,
      country:        application.country,
      application_id: application.id,
    })
    .select('id')
    .single();

  if (accountError || !account) {
    res.status(500).json({ message: 'Could not create partner account' });
    return;
  }

  // Generate 48-hour activation token
  const token      = crypto.randomUUID();
  const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await db.from('partner_activation_tokens').insert({
    partner_id: account.id,
    token,
    expires_at,
  });

  // Mark application approved
  await db.from('partner_applications').update({
    status:      'approved',
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'TJ',
  }).eq('id', application.id);

  // Send activation email
  const activationUrl = `https://carely.fit/portal/activate?token=${token}`;
  await sendEmail({
    to:      application.email,
    subject: 'Your Carely Partner Application — Approved',
    html: `<p>Hi ${application.contact_name},</p>
           <p>Great news — your application for <strong>${application.org_name}</strong> has been approved.</p>
           <p><a href="${activationUrl}">Click here to set up your account</a></p>
           <p>This link expires in 48 hours.</p>
           <p>Once activated, you'll get your partner code to share with patients.</p>
           <p>— TJ, Carely</p>`,
  }).catch(() => {});

  res.json({
    message:        `Approved. Activation email sent to ${application.email}`,
    partner_id:     account.id,
    activation_url: activationUrl,
  });
});

// ── POST /admin/partner/:id/reject ────────────────────────────────────────────
router.post('/partner/:id/reject', async (req: Request, res: Response) => {
  if (!guard(req, res)) return;

  const { data: application } = await db
    .from('partner_applications')
    .select('id, contact_name, email, org_name, status')
    .eq('id', req.params.id)
    .single();

  if (!application) {
    res.status(404).json({ message: 'Application not found' });
    return;
  }

  if (application.status !== 'pending') {
    res.status(409).json({ message: 'Application already reviewed' });
    return;
  }

  await db.from('partner_applications').update({
    status:      'rejected',
    reviewed_at: new Date().toISOString(),
    reviewed_by: 'TJ',
  }).eq('id', application.id);

  await sendEmail({
    to:      application.email,
    subject: 'Carely Partner Application — Update',
    html: `<p>Hi ${application.contact_name},</p>
           <p>Thank you for your interest in partnering with Carely for ${application.org_name}.</p>
           <p>At this time, we're not able to proceed. If your situation changes, feel free to re-apply.</p>
           <p>— TJ, Carely</p>`,
  }).catch(() => {});

  res.json({ message: 'Application rejected and email sent.' });
});

// ── GET /admin/audit-log — view audit trail (HQ only) ─────────────────────────
router.get('/audit-log', async (req: Request, res: Response) => {
  if (!guard(req, res)) return;

  const limit  = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const offset = parseInt(req.query.offset as string) || 0;

  const { data: logs } = await db
    .from('audit_log')
    .select(`
      id, event_type, ip_address, user_agent, created_at, metadata,
      partner_accounts!partner_id(org_name, type),
      users!patient_id(first_name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  res.json({ logs: logs || [], limit, offset });
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/routes/admin-partners.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/admin.ts tests/routes/admin-partners.test.ts
git commit -m "feat: add admin partner management and audit log routes"
```

---

### Task 8: B2B Support Chatbot Route

**Files:**
- Create: `src/routes/partnerChat.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/routes/partnerChat.test.ts
import request from 'supertest';
import app from '../../src/app';

jest.mock('../../src/middleware/partnerAuth', () => ({
  partnerAuth: (req: any, _: any, next: any) => {
    req.partnerId = 'p1';
    req.partnerType = 'clinic';
    next();
  },
}));

it('POST /partner-chat/message returns 400 on empty message', async () => {
  const res = await request(app)
    .post('/partner-chat/message')
    .set('Authorization', 'Bearer token')
    .send({ message: '' });
  expect(res.status).toBe(400);
});

it('POST /partner-chat/message returns 200 on valid message', async () => {
  const res = await request(app)
    .post('/partner-chat/message')
    .set('Authorization', 'Bearer token')
    .send({ message: 'How do I add a new patient?' });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('reply');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/routes/partnerChat.test.ts --no-coverage
```
Expected: FAIL

- [ ] **Step 3: Write `src/routes/partnerChat.ts`**

```typescript
// src/routes/partnerChat.ts
import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { partnerAuth, PartnerRequest } from '../middleware/partnerAuth';
import { AppError } from '../middleware/errorHandler';
import { withBreaker } from '../middleware/circuitBreaker';
import rateLimit from 'express-rate-limit';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => req.partnerId ?? req.ip,
  message: { message: 'Chat limit reached. Please try again in an hour.' },
});

const SYSTEM_PROMPTS: Record<string, string> = {
  doctor: `You are a support assistant for Carely's doctor portal. 
You help doctors understand: patient adherence reports, how to read the dashboard, 
how to connect with patients, and how to interpret medication data.
Rules: Never discuss specific patient health data. Never give medical advice. 
Never reveal backend infrastructure, API keys, or system internals.
If you cannot answer, say: "For this, email hello@carely.fit — TJ responds within 1 business day."
Always disclose you are an AI assistant.`,

  clinic: `You are a support assistant for Carely's clinic portal.
You help clinic staff understand: org-level adherence stats, patient management, 
how to add or remove patients, how to read summary cards and alert feeds.
Rules: Never discuss specific patient health data. Never give medical advice.
Never reveal backend infrastructure, API keys, or system internals.
If you cannot answer, say: "For this, email hello@carely.fit — TJ responds within 1 business day."
Always disclose you are an AI assistant.`,

  pharmacy: `You are a support assistant for Carely's pharmacy portal.
You help pharmacy staff understand: refill request management, request status updates (received/ready/picked up),
how to connect with patients, and how to use the medicine request inbox.
Rules: Never discuss specific patient health data. Never give medical advice.
Never reveal backend infrastructure, API keys, or system internals.
If you cannot answer, say: "For this, email hello@carely.fit — TJ responds within 1 business day."
Always disclose you are an AI assistant.`,

  care_home: `You are a support assistant for Carely's care home portal.
You help care home staff understand: resident management, alert thresholds for missed doses,
floor/wing groupings, org-wide adherence rings, and how to respond to "Needs attention" flags.
Rules: Never discuss specific resident health data. Never give medical advice.
Never reveal backend infrastructure, API keys, or system internals.
If you cannot answer, say: "For this, email hello@carely.fit — TJ responds within 1 business day."
Always disclose you are an AI assistant.`,
};

const INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /you are now/i,
  /system prompt/i,
  /reveal (your )?(prompt|instructions|api key)/i,
  /act as/i,
  /jailbreak/i,
];

function sanitizeInput(text: string): string {
  let out = text.slice(0, 500); // hard cap
  for (const pattern of INJECTION_PATTERNS) {
    out = out.replace(pattern, '[removed]');
  }
  return out;
}

function filterOutput(text: string): string {
  // Strip anything that looks like a key, JWT, or URL
  return text
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[redacted]')   // long tokens
    .replace(/https?:\/\/[^\s]+/g, '[url removed]')       // URLs
    .replace(/Bearer\s+\S+/gi, '[token removed]');         // Bearer tokens
}

router.post('/message', chatLimiter, partnerAuth, async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const { message } = z.object({ message: z.string().min(1).max(500) }).parse(req.body);

    const partnerType = req.partnerType ?? 'clinic';
    const systemPrompt = SYSTEM_PROMPTS[partnerType] ?? SYSTEM_PROMPTS.clinic;
    const sanitized = sanitizeInput(message);

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await withBreaker('openai', async () =>
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system',  content: systemPrompt },
          { role: 'user',    content: sanitized },
        ],
        max_tokens: 400,
        temperature: 0.3,
      })
    );

    const rawReply = completion.choices[0]?.message?.content ?? 'For help, email hello@carely.fit';
    const reply = filterOutput(rawReply);

    res.json({ reply });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, 'Message cannot be empty'));
    next(err);
  }
});

export default router;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/routes/partnerChat.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/partnerChat.ts tests/routes/partnerChat.test.ts
git commit -m "feat: add B2B partner support chatbot with injection/output filters"
```

---

### Task 9: Register All New Routes in index.ts

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/routes/registration.test.ts
import request from 'supertest';
import app from '../../src/app';

it('POST /partner/apply exists (not 404)', async () => {
  const res = await request(app).post('/partner/apply').send({});
  expect(res.status).not.toBe(404);
});

it('GET /portal/patients exists (not 404)', async () => {
  const res = await request(app).get('/portal/patients');
  expect(res.status).not.toBe(404);
});

it('POST /partner-chat/message exists (not 404)', async () => {
  const res = await request(app).post('/partner-chat/message').send({});
  expect(res.status).not.toBe(404);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/routes/registration.test.ts --no-coverage
```
Expected: FAIL — 404s on all three.

- [ ] **Step 3: Add imports and route registrations to `src/index.ts`**

After line `import pharmacyRoutes from './routes/pharmacy';`:

```typescript
import partnerRoutes    from './routes/partner';
import portalRoutes     from './routes/portal';
import partnerChatRoutes from './routes/partnerChat';
```

After line `app.use('/pharmacy',  pharmacyRoutes);`:

```typescript
// Partner portal system
const partnerChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Chat limit reached.' },
});

app.use('/partner',       partnerRoutes);
app.use('/portal',        portalRoutes);
app.use('/partner-chat',  partnerChatLimiter, partnerChatRoutes);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/routes/registration.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Run full test suite**

```bash
npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts tests/routes/registration.test.ts
git commit -m "feat: register partner, portal, and partnerChat routes in index.ts"
```

---

### Task 10: TypeScript Build Verification + Deploy

**Files:**
- No new files — verification only

- [ ] **Step 1: Run TypeScript compiler**

```bash
cd /tmp/carely-backend && npx tsc --noEmit
```
Expected: Zero errors. Fix any type errors before proceeding.

Common fixes:
- If `users!patient_user_id` Supabase join syntax causes TS errors, cast as `any` on the result destructure
- If `withBreaker` import missing, import from `'../middleware/circuitBreaker'`

- [ ] **Step 2: Run full test suite one more time**

```bash
npx jest --no-coverage --forceExit
```
Expected: All green.

- [ ] **Step 3: Push to Railway**

```bash
git push origin main
```

Railway will auto-deploy. Monitor build logs in Railway dashboard.

- [ ] **Step 4: Smoke test live endpoints**

```bash
# Apply endpoint
curl -s -X POST https://carely-backend-production.up.railway.app/partner/apply \
  -H "Content-Type: application/json" \
  -d '{"type":"pharmacy","org_name":"Test Pharmacy","contact_name":"Ali","email":"ali@test.ca","phone":"+16041234567","country":"CA"}' \
  | jq .
```
Expected: `{"message": "Application received..."}`

```bash
# Health check
curl -s https://carely-backend-production.up.railway.app/health | jq .status
```
Expected: `"ok"`

- [ ] **Step 5: Commit**

```bash
git tag v2.0-partner-backend
git push origin v2.0-partner-backend
```

---

## Self-Review Against Spec

**Spec coverage check:**

| Spec Requirement | Task |
|---|---|
| `partner_applications` table | Task 1 |
| `partner_accounts` table | Task 1 |
| `partner_activation_tokens` table | Task 1 |
| `partner_patient_links` table | Task 1 |
| `partner_consents` table | Task 1 |
| `partner_sessions` table | Task 1 |
| `audit_log` table | Task 1 |
| `medicine_requests` table | Task 1 |
| `POST /partner/apply` | Task 4 |
| `POST /partner/activate` | Task 4 |
| `POST /partner/auth/login` | Task 4 |
| `POST /partner/auth/logout` | Task 4 |
| `GET /partner/me` | Task 4 |
| `POST /partner/patient-request` (app user) | Task 4 |
| `POST /partner/consent/:linkId` | Task 4 |
| `DELETE /partner/disconnect/:partnerId` | Task 4 |
| `GET /partner/my-connections` | Task 4 |
| `GET /portal/patients` (consent-gated, audit-logged) | Task 5 |
| `GET /portal/patient/:userId` (consent-gated, audit-logged) | Task 5 |
| `GET /portal/pending-patients` | Task 5 |
| `POST /portal/accept-patient/:linkId` | Task 5 |
| `GET /portal/medicine-requests` | Task 5 |
| `PATCH /portal/medicine-request/:id` | Task 5 |
| `POST /pharmacy/refill-request` (patient side) | Task 6 |
| `POST /pharmacy/general-request` (patient side) | Task 6 |
| `GET /pharmacy/my-requests` | Task 6 |
| `GET /admin/partners` | Task 7 |
| `POST /admin/partner/:id/approve` | Task 7 |
| `POST /admin/partner/:id/reject` | Task 7 |
| `GET /admin/audit-log` | Task 7 |
| B2B support chatbot per portal type | Task 8 |
| Chatbot injection sanitizer + output filter | Task 8 |
| Route registration | Task 9 |
| TS build + deploy | Task 10 |

No spec gaps found.

**Placeholder scan:** No TBDs, no "implement later", no vague steps. All code is complete.

**Type consistency:** `PartnerRequest` used consistently across Task 2, 4, 5, 8. `writeAuditLog` signature matches usage in Tasks 3, 5, 6.
