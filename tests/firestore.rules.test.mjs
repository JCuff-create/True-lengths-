/**
 * Firestore security rules unit tests (Firebase Emulator).
 * Run: npm run test:rules
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'massive-ridge-298sv';
const RULES_PATH = resolve(process.cwd(), 'firestore.rules');

let testEnv;

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/owner1'), {
      uid: 'owner1',
      email: 'carolyn.owner@truelengths.com',
      name: 'Owner',
      role: 'owner',
      status: 'active',
      salonId: 'truelengths-main',
    });
    await setDoc(doc(db, 'users/stylist1'), {
      uid: 'stylist1',
      email: 'stylist@example.com',
      name: 'Stylist',
      role: 'stylist',
      status: 'active',
      salonId: 'truelengths-main',
    });
    await setDoc(doc(db, 'users/customer1'), {
      uid: 'customer1',
      email: 'customer@example.com',
      name: 'Customer One',
      role: 'customer',
      status: 'active',
      salonId: 'truelengths-main',
      loyaltyPoints: 10,
    });
    await setDoc(doc(db, 'users/customer2'), {
      uid: 'customer2',
      email: 'customer2@example.com',
      name: 'Customer Two',
      role: 'customer',
      status: 'active',
      salonId: 'truelengths-main',
    });
    await setDoc(doc(db, 'services/svc1'), {
      id: 'svc1',
      name: 'Silk Press',
      price: 75,
      durationMinutes: 60,
      category: 'Silk Press',
    });
    await setDoc(doc(db, 'gallery/g1'), {
      id: 'g1',
      title: 'Look',
      afterUrl: 'https://example.com/a.jpg',
    });
    await setDoc(doc(db, 'stylists/stylist1'), {
      id: 'stylist1',
      name: 'Stylist',
      commissionRate: 0.5,
    });
    await setDoc(doc(db, 'appointments/apt1'), {
      id: 'apt1',
      customerId: 'customer1',
      customerName: 'Customer One',
      serviceId: 'svc1',
      stylistId: 'stylist1',
      status: 'upcoming',
      date: '2026-09-10',
      time: '10:00 AM',
      price: 75,
    });
    await setDoc(doc(db, 'inventory/inv1'), {
      id: 'inv1',
      name: 'Serum',
      stockCount: 4,
    });
    await setDoc(doc(db, 'staffInvites/invA'), {
      inviteId: 'invA',
      role: 'stylist',
      status: 'pending',
    });
    await setDoc(doc(db, 'notifications/n1'), {
      id: 'n1',
      title: 'Hello',
      targetRole: 'customer',
      message: 'hi',
    });
    await setDoc(doc(db, 'giftCards/gc1'), {
      id: 'gc1',
      code: 'TL-1111',
      createdByUid: 'customer1',
      currentBalance: 50,
    });
  });
}

function authedDb(uid, email) {
  return testEnv.authenticatedContext(uid, email ? { email } : undefined).firestore();
}

function unauthDb() {
  return testEnv.unauthenticatedContext().firestore();
}

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`FAIL  ${name}`);
    console.error(`      ${err?.message || err}`);
    failed += 1;
  }
}

async function main() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });

  await testEnv.clearFirestore();
  await seed();

  await check('unauth can read public services', async () => {
    await assertSucceeds(getDoc(doc(unauthDb(), 'services/svc1')));
  });
  await check('unauth can read public gallery', async () => {
    await assertSucceeds(getDoc(doc(unauthDb(), 'gallery/g1')));
  });
  await check('unauth can read public stylists directory', async () => {
    await assertSucceeds(getDoc(doc(unauthDb(), 'stylists/stylist1')));
  });
  await check('unauth cannot write services', async () => {
    await assertFails(setDoc(doc(unauthDb(), 'services/hack'), { name: 'x' }));
  });
  await check('unauth cannot read users', async () => {
    await assertFails(getDoc(doc(unauthDb(), 'users/customer1')));
  });
  await check('unauth cannot read appointments', async () => {
    await assertFails(getDoc(doc(unauthDb(), 'appointments/apt1')));
  });
  await check('unauth cannot read staffInvites', async () => {
    await assertFails(getDoc(doc(unauthDb(), 'staffInvites/invA')));
  });
  await check('unauth cannot read inventory', async () => {
    await assertFails(getDoc(doc(unauthDb(), 'inventory/inv1')));
  });

  const customer = () => authedDb('customer1');
  await check('customer reads own profile', async () => {
    await assertSucceeds(getDoc(doc(customer(), 'users/customer1')));
  });
  await check('customer cannot read other customer profile', async () => {
    await assertFails(getDoc(doc(customer(), 'users/customer2')));
  });
  await check('customer cannot read owner profile', async () => {
    await assertFails(getDoc(doc(customer(), 'users/owner1')));
  });
  await check('customer cannot read stylist auth profile', async () => {
    await assertFails(getDoc(doc(customer(), 'users/stylist1')));
  });
  await check('customer cannot escalate own role', async () => {
    await assertFails(updateDoc(doc(customer(), 'users/customer1'), { role: 'owner' }));
  });
  await check('customer cannot change own status', async () => {
    await assertFails(updateDoc(doc(customer(), 'users/customer1'), { status: 'disabled' }));
  });
  await check('customer can update own name', async () => {
    await assertSucceeds(updateDoc(doc(customer(), 'users/customer1'), { name: 'Updated' }));
  });
  await check('customer reads own appointment', async () => {
    await assertSucceeds(getDoc(doc(customer(), 'appointments/apt1')));
  });
  await check('customer cannot read inventory', async () => {
    await assertFails(getDoc(doc(customer(), 'inventory/inv1')));
  });
  await check('customer cannot write services', async () => {
    await assertFails(updateDoc(doc(customer(), 'services/svc1'), { price: 1 }));
  });
  await check('customer cannot read staffInvites', async () => {
    await assertFails(getDoc(doc(customer(), 'staffInvites/invA')));
  });
  await check('customer can create own appointment', async () => {
    await assertSucceeds(
      setDoc(doc(customer(), 'appointments/apt-new'), {
        id: 'apt-new',
        customerId: 'customer1',
        serviceId: 'svc1',
        stylistId: 'stylist1',
        status: 'upcoming',
        date: '2026-09-11',
        time: '11:00 AM',
      })
    );
  });
  await check('customer cannot create appointment for someone else', async () => {
    await assertFails(
      setDoc(doc(customer(), 'appointments/apt-steal'), {
        id: 'apt-steal',
        customerId: 'customer2',
        serviceId: 'svc1',
        stylistId: 'stylist1',
        status: 'upcoming',
        date: '2026-09-11',
        time: '12:00 PM',
      })
    );
  });
  await check('customer reads own gift card', async () => {
    await assertSucceeds(getDoc(doc(customer(), 'giftCards/gc1')));
  });
  await check('customer cannot approve stylist', async () => {
    await assertFails(updateDoc(doc(customer(), 'users/stylist1'), { status: 'active' }));
  });

  const stylist = () => authedDb('stylist1');
  await check('stylist reads customer profile', async () => {
    await assertSucceeds(getDoc(doc(stylist(), 'users/customer1')));
  });
  await check('stylist cannot read owner profile', async () => {
    await assertFails(getDoc(doc(stylist(), 'users/owner1')));
  });
  await check('stylist cannot escalate to owner', async () => {
    await assertFails(updateDoc(doc(stylist(), 'users/stylist1'), { role: 'owner' }));
  });
  await check('stylist cannot change another user role', async () => {
    await assertFails(updateDoc(doc(stylist(), 'users/customer1'), { role: 'owner' }));
  });
  await check('stylist can read appointments', async () => {
    await assertSucceeds(getDoc(doc(stylist(), 'appointments/apt1')));
  });
  await check('stylist can read inventory', async () => {
    await assertSucceeds(getDoc(doc(stylist(), 'inventory/inv1')));
  });
  await check('stylist cannot write inventory', async () => {
    await assertFails(updateDoc(doc(stylist(), 'inventory/inv1'), { stockCount: 99 }));
  });
  await check('stylist cannot read staffInvites', async () => {
    await assertFails(getDoc(doc(stylist(), 'staffInvites/invA')));
  });
  await check('stylist cannot write services', async () => {
    await assertFails(updateDoc(doc(stylist(), 'services/svc1'), { price: 9 }));
  });
  await check('stylist can update own stylist directory card', async () => {
    await assertSucceeds(updateDoc(doc(stylist(), 'stylists/stylist1'), { bio: 'Updated bio' }));
  });

  const owner = () => authedDb('owner1', 'carolyn.owner@truelengths.com');
  await check('owner reads all user profiles', async () => {
    await assertSucceeds(getDoc(doc(owner(), 'users/customer1')));
    await assertSucceeds(getDoc(doc(owner(), 'users/stylist1')));
    await assertSucceeds(getDoc(doc(owner(), 'users/owner1')));
  });
  await check('owner can approve stylist', async () => {
    await assertSucceeds(updateDoc(doc(owner(), 'users/stylist1'), { status: 'active' }));
  });
  await check('owner can manage services', async () => {
    await assertSucceeds(updateDoc(doc(owner(), 'services/svc1'), { price: 80 }));
  });
  await check('owner can manage inventory', async () => {
    await assertSucceeds(updateDoc(doc(owner(), 'inventory/inv1'), { stockCount: 10 }));
  });
  await check('owner can read and write staffInvites', async () => {
    await assertSucceeds(getDoc(doc(owner(), 'staffInvites/invA')));
    await assertSucceeds(
      setDoc(doc(owner(), 'staffInvites/invB'), {
        inviteId: 'invB',
        role: 'stylist',
        status: 'pending',
      })
    );
  });
  await check('owner can delete appointment', async () => {
    await assertSucceeds(deleteDoc(doc(owner(), 'appointments/apt-new')));
  });
  await check('default unknown collection denied', async () => {
    await assertFails(getDoc(doc(owner(), 'secrets/x')));
    await assertFails(setDoc(doc(customer(), 'secrets/x'), { a: 1 }));
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  await testEnv.cleanup();
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await testEnv?.cleanup();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
