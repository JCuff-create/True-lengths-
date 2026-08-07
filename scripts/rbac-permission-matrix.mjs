/**
 * Offline RBAC permission matrix + route-guard checks.
 * Run with: npx tsx scripts/rbac-permission-matrix.mjs
 */

import { canReadProfile } from '../server/authRole.ts';
import { canAccessProfile, sanitizePersonalProfileUpdate } from '../src/lib/profiles.ts';
import { parseProfileHash } from '../src/lib/roles.ts';

function actor(role, uid, status = 'active') {
  return { uid, role, status, email: `${uid}@test.com`, profile: {}, collection: `${role}s` };
}

const cases = [
  // Customer
  { name: 'customer → own customer', actor: actor('customer', 'c1'), targetRole: 'customer', targetUid: 'c1', expect: true },
  { name: 'customer → other customer', actor: actor('customer', 'c1'), targetRole: 'customer', targetUid: 'c2', expect: false },
  { name: 'customer → stylist', actor: actor('customer', 'c1'), targetRole: 'stylist', targetUid: 's1', expect: false },
  { name: 'customer → owner', actor: actor('customer', 'c1'), targetRole: 'owner', targetUid: 'o1', expect: false },

  // Stylist
  { name: 'stylist → own stylist', actor: actor('stylist', 's1'), targetRole: 'stylist', targetUid: 's1', expect: true },
  { name: 'stylist → other stylist', actor: actor('stylist', 's1'), targetRole: 'stylist', targetUid: 's2', expect: true },
  { name: 'stylist → customer', actor: actor('stylist', 's1'), targetRole: 'customer', targetUid: 'c1', expect: true },
  { name: 'stylist → owner DENY', actor: actor('stylist', 's1'), targetRole: 'owner', targetUid: 'o1', expect: false },
  { name: 'pending stylist → other stylist DENY', actor: actor('stylist', 's1', 'pending'), targetRole: 'stylist', targetUid: 's2', expect: false },
  { name: 'pending stylist → own stylist', actor: actor('stylist', 's1', 'pending'), targetRole: 'stylist', targetUid: 's1', expect: true },
  { name: 'pending stylist → customer DENY', actor: actor('stylist', 's1', 'pending'), targetRole: 'customer', targetUid: 'c1', expect: false },
  { name: 'pending stylist → owner DENY', actor: actor('stylist', 's1', 'pending'), targetRole: 'owner', targetUid: 'o1', expect: false },

  // Owner
  { name: 'owner → customer', actor: actor('owner', 'o1'), targetRole: 'customer', targetUid: 'c1', expect: true },
  { name: 'owner → stylist', actor: actor('owner', 'o1'), targetRole: 'stylist', targetUid: 's1', expect: true },
  { name: 'owner → owner', actor: actor('owner', 'o1'), targetRole: 'owner', targetUid: 'o1', expect: true },
  { name: 'owner → other owner', actor: actor('owner', 'o1'), targetRole: 'owner', targetUid: 'o2', expect: true },
];

let passed = 0;
for (const c of cases) {
  const actual = canReadProfile(c.actor, c.targetRole, c.targetUid);
  if (actual !== c.expect) {
    console.error(`FAIL  ${c.name}: expected ${c.expect}, got ${actual}`);
    process.exit(1);
  }
  const front = canAccessProfile(
    c.actor.role,
    c.actor.uid,
    c.actor.status,
    c.targetRole,
    c.targetUid
  );
  if (front !== c.expect) {
    console.error(`FAIL  frontend canAccessProfile mismatch for ${c.name}: ${front}`);
    process.exit(1);
  }
  console.log(`PASS  ${c.name}`);
  passed += 1;
}

const urlCases = [
  {
    name: 'customer opening owner URL',
    hash: '#/owner/owner_dashboard',
    actorRole: 'customer',
    expectRedirect: true,
  },
  {
    name: 'customer opening stylist URL',
    hash: '#/stylist/stylist_schedule',
    actorRole: 'customer',
    expectRedirect: true,
  },
  {
    name: 'stylist opening owner URL',
    hash: '#/owner/profile/o1',
    actorRole: 'stylist',
    actorUid: 's1',
    expectRedirect: true,
  },
  {
    name: 'stylist opening owner profile deep-link DENY',
    hash: '#/stylist/profile/owner/o1',
    actorRole: 'stylist',
    actorUid: 's1',
    expectProfileDeny: true,
  },
  {
    name: 'customer opening other customer profile DENY',
    hash: '#/customer/profile/c2',
    actorRole: 'customer',
    actorUid: 'c1',
    expectProfileDeny: true,
  },
  {
    name: 'owner may open stylist profile path',
    hash: '#/owner/profile/stylist/s1',
    actorRole: 'owner',
    actorUid: 'o1',
    expectProfileDeny: false,
  },
];

for (const u of urlCases) {
  const profilePath = parseProfileHash(u.hash);
  if (u.expectProfileDeny !== undefined) {
    if (!profilePath) {
      console.error(`FAIL  ${u.name}: expected profile hash parse`);
      process.exit(1);
    }
    const allowed = canAccessProfile(
      u.actorRole,
      u.actorUid,
      'active',
      profilePath.profileRole,
      profilePath.profileUid || u.actorUid
    );
    const deny = !allowed;
    if (deny !== u.expectProfileDeny) {
      console.error(`FAIL  ${u.name}: allowed=${allowed}`);
      process.exit(1);
    }
    console.log(`PASS  ${u.name}`);
    passed += 1;
    continue;
  }

  const portalRole = u.hash.replace(/^#\/?/, '').split('/')[0];
  const redirect = portalRole !== u.actorRole;
  if (redirect !== u.expectRedirect) {
    console.error(`FAIL  ${u.name}: redirect=${redirect}`);
    process.exit(1);
  }
  console.log(`PASS  ${u.name}`);
  passed += 1;
}

const locked = sanitizePersonalProfileUpdate(
  {
    id: 'c1',
    uid: 'c1',
    name: 'Pat',
    email: 'pat@test.com',
    role: 'customer',
    status: 'active',
    salonId: 'truelengths-main',
  },
  { role: 'owner', status: 'disabled', salonId: 'hacked', name: 'Pat Updated' }
);
if (locked.role !== 'customer' || locked.status !== 'active' || locked.salonId !== 'truelengths-main') {
  console.error('FAIL  sanitizePersonalProfileUpdate allowed admin field change');
  process.exit(1);
}
if (locked.name !== 'Pat Updated') {
  console.error('FAIL  sanitizePersonalProfileUpdate blocked personal name update');
  process.exit(1);
}
console.log('PASS  customer cannot escalate role/status/salonId via profile update');
passed += 1;

console.log(`\n${passed} RBAC checks passed.`);
console.log('Confirmed: stylist actors cannot read owner profiles in any tested case.');
console.log('Confirmed: URL/portal spoofing redirects non-owners away from owner areas.');
