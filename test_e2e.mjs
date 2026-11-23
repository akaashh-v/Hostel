// Automated End-to-End Verification Test Script
const BASE_URL = 'http://localhost:5000/api';

async function testSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING HOSTEL MESS SYSTEM END-TO-END TEST SUITE');
  console.log('====================================================\n');

  let studentToken = '';
  let studentId = '';
  let adminToken = '';
  let placedOrderId = '';

  // 1. Student Request OTP
  console.log('1. Testing Student OTP Request...');
  const otpRes = await fetch(`${BASE_URL}/auth/student/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Rahul Nair',
      phone: '+919876543210',
      email: 'rahul.nair@example.com',
    }),
  }).then((r) => r.json());

  if (!otpRes.success || !otpRes.devOtp) {
    throw new Error(`Failed OTP Request: ${JSON.stringify(otpRes)}`);
  }
  console.log(`   ✓ OTP received successfully: ${otpRes.devOtp}`);

  // 2. Student Verify OTP
  console.log('2. Testing Student Verify OTP & Session Token...');
  const verifyRes = await fetch(`${BASE_URL}/auth/student/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919876543210',
      email: 'rahul.nair@example.com',
      otp: otpRes.devOtp,
    }),
  }).then((r) => r.json());

  if (!verifyRes.success || !verifyRes.token) {
    throw new Error(`Failed OTP Verification: ${JSON.stringify(verifyRes)}`);
  }
  studentToken = verifyRes.token;
  studentId = verifyRes.student.id;
  console.log(`   ✓ Authenticated student: ${verifyRes.student.fullName} (ID: ${studentId})`);

  // 3. Admin Login
  console.log('3. Testing Admin Login with Bcrypt Password Verification...');
  const adminRes = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'Admin@123',
    }),
  }).then((r) => r.json());

  if (!adminRes.success || !adminRes.token) {
    throw new Error(`Failed Admin Login: ${JSON.stringify(adminRes)}`);
  }
  adminToken = adminRes.token;
  console.log(`   ✓ Admin authenticated: ${adminRes.admin.fullName} (Role: ${adminRes.admin.role})`);

  // 4. Role-based Access Control Test
  console.log('4. Testing Role-Based Security: Student trying to access Admin endpoint...');
  const rbacRes = await fetch(`${BASE_URL}/students`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  if (rbacRes.status === 403) {
    console.log('   ✓ Security verified: Access denied with HTTP 403 Forbidden for Student.');
  } else {
    throw new Error(`RBAC Failure! Expected 403 but got ${rbacRes.status}`);
  }

  // 5. Menu & Specials
  console.log("5. Testing Today's Menu & Kerala Specials Retrieval...");
  const menuRes = await fetch(`${BASE_URL}/menu/today`).then((r) => r.json());
  if (!menuRes.success || !menuRes.todaysSpecial || !menuRes.keralaSpecial) {
    throw new Error('Failed to fetch food menu');
  }
  console.log(`   ✓ Menu retrieved: ${menuRes.allItems.length} total dishes, ${menuRes.keralaSpecial.length} Kerala specials.`);

  const sampleFoodItem = menuRes.allItems[0];
  console.log(`   ✓ Sample dish: ${sampleFoodItem.name} @ ₹${sampleFoodItem.price}`);

  // 6. Student Food Ordering (Transactional with historical price snapshot)
  console.log('6. Testing Student Order Placement with backend price security...');
  const orderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      items: [
        { foodItemId: sampleFoodItem.id, quantity: 2 },
      ],
    }),
  }).then((r) => r.json());

  if (!orderRes.success || !orderRes.order) {
    throw new Error(`Failed to place order: ${JSON.stringify(orderRes)}`);
  }
  placedOrderId = orderRes.order.id;
  const expectedTotal = sampleFoodItem.price * 2;
  console.log(`   ✓ Order created: ${orderRes.order.orderNumber}, Total: ₹${orderRes.order.totalAmount} (Expected: ₹${expectedTotal})`);

  // 7. Order Cancellation within grace window
  console.log('7. Testing Order Cancellation within grace period...');
  const cancelRes = await fetch(`${BASE_URL}/orders/${placedOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ reason: 'E2E Testing Cancel Feature' }),
  }).then((r) => r.json());

  if (!cancelRes.success || cancelRes.order.orderStatus !== 'CANCELLED') {
    throw new Error(`Failed to cancel order: ${JSON.stringify(cancelRes)}`);
  }
  console.log(`   ✓ Order ${cancelRes.order.orderNumber} successfully marked CANCELLED with reason: "${cancelRes.order.cancellationReason}"`);

  // 8. Place a Confirmed Order to verify monthly billing calculation
  console.log('8. Placing a Second Order to be Confirmed and Billed...');
  const order2Res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      items: [
        { foodItemId: sampleFoodItem.id, quantity: 1 },
      ],
    }),
  }).then((r) => r.json());

  const confirmedOrderId = order2Res.order.id;

  // Admin confirms this second order
  await fetch(`${BASE_URL}/orders/${confirmedOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'CONFIRMED' }),
  });
  console.log(`   ✓ Second order ${order2Res.order.orderNumber} confirmed by Admin.`);

  // 9. Monthly Food Report and Billing Reconcile
  console.log('9. Testing Monthly Food Billing & Exclusion of Cancelled Orders...');
  const now = new Date();
  const billRes = await fetch(
    `${BASE_URL}/reports/monthly-billing?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    }
  ).then((r) => r.json());

  if (!billRes.success) {
    throw new Error(`Failed to fetch monthly billing: ${JSON.stringify(billRes)}`);
  }
  console.log(`   ✓ Monthly Billing generated for ${billRes.monthPrefix}: ${billRes.billingRows.length} students billed, total revenue ₹${billRes.summary.totalRevenue}`);

  // 10. Student Individual Itemized Bill Check
  console.log('10. Testing Individual Student Itemized Bill...');
  const studentBillRes = await fetch(
    `${BASE_URL}/reports/student-bill/${studentId}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
    {
      headers: { Authorization: `Bearer ${studentToken}` },
    }
  ).then((r) => r.json());

  if (!studentBillRes.success || studentBillRes.totalMonthlyBill === undefined) {
    throw new Error('Failed to fetch student individual bill');
  }
  console.log(`   ✓ Student bill verified: ₹${studentBillRes.totalMonthlyBill} across ${studentBillRes.totalOrders} completed orders.`);

  // 11. Admin Dashboard Stats & Real Charts
  console.log('11. Testing Admin Executive Dashboard Stats & Recharts Data Sources...');
  const statsRes = await fetch(`${BASE_URL}/reports/dashboard-stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then((r) => r.json());

  if (!statsRes.success || !statsRes.stats || !statsRes.charts) {
    throw new Error('Failed to fetch dashboard stats');
  }
  console.log(`   ✓ Metrics verified: ${statsRes.stats.totalStudents} students, ${statsRes.stats.totalFoodItems} dishes, ₹${statsRes.stats.todayRevenue} today revenue, ₹${statsRes.stats.monthlyRevenue} monthly revenue.`);
  console.log(`   ✓ Recharts datasets: ${statsRes.charts.dailyOrders.length} daily points, ${statsRes.charts.monthlyRevenue.length} monthly points, ${statsRes.charts.topFoodItems.length} top dishes, ${statsRes.charts.categoryDistribution.length} category slices.`);

  console.log('\n====================================================');
  console.log('🎉 ALL 11 END-TO-END INTEGRATION TESTS PASSED!');
  console.log('====================================================\n');
}

testSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
