#!/usr/bin/env node
/*
  SHOSA API smoke test
  - Run backend first (npm start)
  - Then run: npm run test:smoke
*/

const API_BASE = process.env.SHOSA_API_BASE || 'http://localhost:4000';

function logPass(msg) {
  console.log(`✅ ${msg}`);
}

function logFail(msg, err) {
  console.error(`❌ ${msg}`);
  if (err) console.error(err);
}

async function request(path, options = {}) {
  const mergedHeaders = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: mergedHeaders,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, json };
}

async function main() {
  const stamp = Date.now();
  const testUser = {
    fullName: 'Smoke Test Alumni',
    email: `smoke-${stamp}@example.com`,
    password: 'SmokePass123!',
    passwordConfirm: 'SmokePass123!',
    campus: 'Main Campus',
  };

  try {
    const health = await request('/');
    if (health.status !== 200 || !health.json?.ok) {
      throw new Error(`Health endpoint failed: ${health.status} ${JSON.stringify(health.json)}`);
    }
    logPass('Health check endpoint responded correctly');

    const register = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    if (register.status !== 200 || !register.json?.token) {
      throw new Error(`Register failed: ${register.status} ${JSON.stringify(register.json)}`);
    }
    logPass('Alumni registration works');

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    if (login.status !== 200 || !login.json?.token) {
      throw new Error(`Login failed: ${login.status} ${JSON.stringify(login.json)}`);
    }
    const token = login.json.token;
    logPass('Alumni login works');

    const me = await request('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (me.status !== 200 || me.json?.email !== testUser.email) {
      throw new Error(`Profile fetch failed: ${me.status} ${JSON.stringify(me.json)}`);
    }
    logPass('Authenticated profile endpoint works');

    const blockedSaccoPayment = await request('/api/payments/mobilemoney', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        paymentType: 'sacco_yearly_subscription',
        amount: 100000,
        phone: '0700000000',
        network: 'MTN',
      }),
    });
    if (blockedSaccoPayment.status !== 400) {
      throw new Error(`Expected blocked SACCO payment before registration; got ${blockedSaccoPayment.status}`);
    }
    logPass('SACCO payment gating before registration works');

    const saccoRegister = await request('/api/sacco/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        membershipType: 'ordinary',
        monthlyContribution: 50000,
        startDate: new Date().toISOString().slice(0, 10),
      }),
    });
    if (saccoRegister.status !== 200) {
      throw new Error(`SACCO register failed: ${saccoRegister.status} ${JSON.stringify(saccoRegister.json)}`);
    }
    logPass('SACCO registration endpoint works');

    const donation = await request('/api/payments/mobilemoney', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        paymentType: 'donation',
        amount: 10000,
        phone: '0700000000',
        network: 'MTN',
        description: 'Smoke test donation',
      }),
    });
    if (donation.status !== 400) {
      throw new Error(`Expected SACCO-first-payment rule; got ${donation.status} ${JSON.stringify(donation.json)}`);
    }
    logPass('First-payment rule enforcement is active');

    console.log('\n🎉 Smoke test completed successfully.');
    process.exit(0);
  } catch (err) {
    logFail('Smoke test failed', err);
    process.exit(1);
  }
}

main();
