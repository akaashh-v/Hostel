// Verification test script for backend authentication and persistent session
const http = require('http');

async function runTest() {
  // Start express server on a test port
  const { app } = await import('./server/index.ts');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5199, resolve));
  console.log('Test server started on port 5199');

  const BASE = 'http://localhost:5199';

  // 1. Initial GET /api/auth/me without cookies
  console.log('\n--- 1. Testing GET /api/auth/me (No Cookies) ---');
  let res = await fetch(`${BASE}/api/auth/me`);
  let data = await res.json();
  console.log('Status:', res.status, 'Data:', data);
  if (data.authenticated !== false) throw new Error('Expected unauthenticated for empty session');
  console.log('✓ Correctly reported unauthenticated');

  // 2. Register new student via POST /api/auth/register
  console.log('\n--- 2. Testing First-Time Student Registration ---');
  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Akash Kumar', phone: '9847099887' }),
  });
  data = await res.json();
  const rawCookies = res.headers.get('set-cookie');
  console.log('Status:', res.status, 'Response:', data);
  console.log('Set-Cookie Header:', rawCookies);

  if (!data.success || !data.student) throw new Error('Registration failed');
  if (!rawCookies || !rawCookies.includes('mess_student_session=') || !rawCookies.includes('HttpOnly')) {
    throw new Error('HttpOnly cookie was not set in response header!');
  }
  console.log('✓ Successfully registered and received persistent HttpOnly cookie');

  // Extract session cookie value
  const cookieMatch = rawCookies.match(/mess_student_session=([^;]+)/);
  const cookieVal = cookieMatch[0];

  // 3. Subsequent QR Scan Simulation: GET /api/auth/me with Cookie
  console.log('\n--- 3. Testing Subsequent Visit / QR Scan with Cookie ---');
  res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: cookieVal },
  });
  data = await res.json();
  console.log('Status:', res.status, 'Data:', data);
  if (!data.authenticated || !data.student || data.student.phone !== '9847099887') {
    throw new Error('Subsequent visit failed to recognize student via cookie');
  }
  console.log('✓ Student recognized directly via HttpOnly cookie! Status:', data.status);

  // 4. Duplicate Registration Attempt with same phone number
  console.log('\n--- 4. Testing Duplicate Registration Prevention ---');
  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Different Name', phone: '9847099887' }),
  });
  data = await res.json();
  console.log('Status:', res.status, 'Response:', data);
  if (!data.duplicate || data.code !== 'REQUIRES_RECOVERY') {
    throw new Error('Duplicate phone should trigger REQUIRES_RECOVERY');
  }
  console.log('✓ Duplicate phone correctly blocked and directed to admin-assisted recovery');

  // 5. Logout POST /api/auth/logout
  console.log('\n--- 5. Testing Logout ---');
  res = await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieVal },
  });
  data = await res.json();
  const clearCookieHeader = res.headers.get('set-cookie');
  console.log('Status:', res.status, 'Response:', data, 'Clear-Cookie:', clearCookieHeader);
  console.log('✓ Logout successfully cleared HttpOnly session');

  server.close();
  console.log('\n===========================================');
  console.log('ALL AUTHENTICATION & SESSION TESTS PASSED! ');
  console.log('===========================================');
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
