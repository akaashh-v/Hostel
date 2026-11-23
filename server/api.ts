import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, hashPassword, verifyPassword, getTodayDateString } from './db';
import { realtimeManager } from './events';
import { MealType, BillingMode } from '../src/types';

export const apiRouter = Router();

function getParamId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Zod Validation Schemas
export const studentLoginSchema = z.object({
  phone_number: z.string().min(5, 'Valid phone number is required'),
  password: z.string().min(1, 'Password is required')
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const createStudentSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone_number: z.string().min(7, 'Valid phone number is required'),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  room_number: z.string().optional()
});

export const markCollectionSchema = z.object({
  meal_id: z.string().min(1, 'meal_id is required')
});

export const foodItemSchema = z.object({
  name: z.string().min(1, 'Dish name is required'),
  meal_type: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
  price: z.number().nonnegative('Price cannot be negative'),
  category: z.enum(['VEG', 'NON_VEG', 'EGG']).optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  serving_date: z.string().optional()
});

export const billingSettingsSchema = z.object({
  mode: z.enum(['FIXED', 'PER_MEAL']),
  fixed_monthly_rate: z.number().nonnegative(),
  breakfast_rate: z.number().nonnegative(),
  lunch_rate: z.number().nonnegative(),
  snacks_rate: z.number().nonnegative(),
  dinner_rate: z.number().nonnegative(),
  late_fee_amount: z.number().nonnegative()
});

export const recordPaymentSchema = z.object({
  bill_id: z.string().min(1, 'Bill ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  payment_method: z.enum(['UPI', 'CASH', 'BANK_TRANSFER', 'CARD']),
  reference_id: z.string().optional(),
  notes: z.string().optional(),
  received_by: z.string().optional()
});

// Helper to extract session token from cookie or Authorization header
function getSessionToken(req: Request): string | undefined {
  if (req.cookies && req.cookies.mess_session) {
    return req.cookies.mess_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

// Set persistent cookie
function setSessionCookie(res: Response, token: string) {
  res.cookie('mess_session', token, {
    httpOnly: true,
    secure: false, // set false for localhost dev/preview
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });
}

// -----------------------------------------------------------------------------
// REALTIME SSE STREAM
// -----------------------------------------------------------------------------
apiRouter.get('/realtime/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  realtimeManager.addClient(res);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString(), message: 'Connected to Live Mess Stream' })}\n\n`);

  // Periodic heartbeat every 25 seconds
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    realtimeManager.removeClient(res);
  });
});

// -----------------------------------------------------------------------------
// AUTHENTICATION: STUDENT
// -----------------------------------------------------------------------------

// Student Registration: Public self-registration is strictly disallowed
apiRouter.post('/auth/student/register', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'admin') {
    res.status(403).json({
      error: 'Student self-registration is disabled. Student accounts can only be created by the hostel administrator.'
    });
    return;
  }

  const parseResult = createStudentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid input data' });
    return;
  }

  const { full_name, phone_number, password, room_number } = parseResult.data;
  const cleanPhone = phone_number.trim().replace(/\s+/g, '');
  const existing = db.findStudentByPhone(cleanPhone);
  if (existing) {
    res.status(409).json({ error: 'A student with this phone number is already registered.' });
    return;
  }

  const passwordHash = hashPassword(password || 'Student@123');
  const student = db.createStudent(full_name, cleanPhone, passwordHash, room_number);
  const { password_hash, ...safeStudent } = student;
  res.status(201).json({ message: 'Student account created', student: safeStudent });
});

// Student Login: Phone Number & Password
apiRouter.post('/auth/student/login', (req: Request, res: Response) => {
  const parseResult = studentLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Phone number and password are required' });
    return;
  }

  const { phone_number, password } = parseResult.data;
  const cleanPhone = phone_number.trim().replace(/\s+/g, '');
  const student = db.findStudentByPhone(cleanPhone);

  if (!student) {
    res.status(401).json({ error: 'Account not found. Please contact the Mess Warden to set up your account.' });
    return;
  }

  if (student.status === 'DEACTIVATED') {
    res.status(403).json({ error: 'Your account has been deactivated. Please contact the Mess Warden.' });
    return;
  }

  if (!verifyPassword(password, student.password_hash)) {
    res.status(401).json({ error: 'Incorrect password. Please try again.' });
    return;
  }

  const token = db.createSession(student.id, 'student');
  setSessionCookie(res, token);

  const { password_hash, ...safeStudent } = student;
  res.json({
    message: 'Login successful',
    token,
    student: safeStudent
  });
});

// Student Session Verification (GET /api/auth/student/me)
apiRouter.get('/auth/student/me', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ authenticated: false, error: 'No active student session' });
    return;
  }

  const student = db.findStudentById(session.userId);
  if (!student || student.status === 'DEACTIVATED') {
    res.status(401).json({ authenticated: false, error: 'Student not found or deactivated' });
    return;
  }

  const { password_hash, ...safeStudent } = student;
  res.json({ authenticated: true, student: safeStudent });
});

// -----------------------------------------------------------------------------
// AUTHENTICATION: ADMIN
// -----------------------------------------------------------------------------

// Admin Login: Username & Password
apiRouter.post('/auth/admin/login', (req: Request, res: Response) => {
  const parseResult = adminLoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Username and password are required' });
    return;
  }

  const { username, password } = parseResult.data;
  const admin = db.findAdminByUsername(username);
  if (!admin) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  if (!verifyPassword(password, admin.password_hash)) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  const token = db.createSession(admin.id, 'admin');
  setSessionCookie(res, token);

  const { password_hash, ...safeAdmin } = admin;
  res.json({
    message: 'Admin login successful',
    token,
    admin: safeAdmin
  });
});

// Admin Session Verification (GET /api/auth/admin/me)
apiRouter.get('/auth/admin/me', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'admin') {
    res.status(401).json({ authenticated: false, error: 'No active admin session' });
    return;
  }

  const admin = db.findAdminById(session.userId);
  if (!admin) {
    res.status(401).json({ authenticated: false, error: 'Admin not found' });
    return;
  }

  const { password_hash, ...safeAdmin } = admin;
  res.json({ authenticated: true, admin: safeAdmin });
});

// Common Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  db.removeSession(token);
  res.clearCookie('mess_session', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// -----------------------------------------------------------------------------
// MENU & LIVE SERVING STATUS
// -----------------------------------------------------------------------------

// Get today's menu with meals and items
apiRouter.get('/menu/today', (req: Request, res: Response) => {
  const date = (req.query.date as string) || getTodayDateString();
  const meals = db.getMeals();
  const allItems = db.getAllFoodItems();
  const items = allItems.filter(item => !item.serving_date || item.serving_date === date);

  const menu = meals.map(meal => {
    const mealItems = items.filter(item => item.meal_id === meal.id || item.meal_type === meal.meal_type);
    return {
      ...meal,
      items: mealItems
    };
  });

  res.json({
    date,
    meals: menu
  });
});

// Get all meals & food items
apiRouter.get('/menu/all', (_req: Request, res: Response) => {
  const meals = db.getMeals();
  const items = db.getAllFoodItems();
  res.json({ meals, items });
});

// Add a food item
apiRouter.post('/menu/items', (req: Request, res: Response) => {
  const { meal_id, meal_type, name, description, category, price, image_url, serving_date } = req.body;

  if (!meal_id || !meal_type || !name) {
    res.status(400).json({ error: 'meal_id, meal_type, and name are required' });
    return;
  }

  const newItem = db.createFoodItem({
    meal_id,
    meal_type,
    name,
    description: description || '',
    category: category || 'VEG',
    price: Number(price) || 0,
    image_url: image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    is_available: true,
    serving_date: serving_date || undefined
  });

  realtimeManager.broadcast({
    type: 'MENU_UPDATED',
    timestamp: new Date().toISOString(),
    data: newItem
  });

  res.status(201).json(newItem);
});

// Update a food item
apiRouter.put('/menu/items/:id', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const updates = { ...req.body };
  if (updates.price !== undefined) updates.price = Number(updates.price);
  
  const updated = db.updateFoodItem(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Food item not found' });
    return;
  }

  realtimeManager.broadcast({
    type: 'MENU_UPDATED',
    timestamp: new Date().toISOString(),
    data: updated
  });

  res.json(updated);
});

// Delete a food item
apiRouter.delete('/menu/items/:id', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const deleted = db.deleteFoodItem(id);
  if (!deleted) {
    res.status(404).json({ error: 'Food item not found' });
    return;
  }

  realtimeManager.broadcast({
    type: 'MENU_UPDATED',
    timestamp: new Date().toISOString(),
    data: { id, deleted: true }
  });

  res.json({ message: 'Food item deleted successfully' });
});

// -----------------------------------------------------------------------------
// FOOD COLLECTIONS (QR-BASED RECORDING & TRACKING)
// -----------------------------------------------------------------------------

// Student marks food as collected
apiRouter.post('/collections/mark', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ error: 'Please log in to record food collection' });
    return;
  }

  const student = db.findStudentById(session.userId);
  if (!student) {
    res.status(401).json({ error: 'Student account not found' });
    return;
  }

  if (student.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Your student account is not active' });
    return;
  }

  const parseResult = markCollectionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'meal_id is required' });
    return;
  }

  const { meal_id } = parseResult.data;
  const meal = db.findMealById(meal_id);
  if (!meal) {
    res.status(404).json({ error: 'Meal not found' });
    return;
  }

  const today = getTodayDateString();
  const currentItems = db.getFoodItems(today).filter(i => i.meal_id === meal.id || i.meal_type === meal.meal_type);
  const itemNames = currentItems.map(i => i.name);

  // Attempt to mark collection with strict duplicate validation
  const result = db.markFoodCollected(
    student.id,
    student.full_name,
    student.phone_number,
    meal.id,
    meal.meal_type,
    today,
    itemNames
  );

  if (!result.success) {
    res.status(409).json({ error: result.error });
    return;
  }

  // Broadcast event to admin monitoring screen
  realtimeManager.broadcast({
    type: 'COLLECTION_MARKED',
    timestamp: new Date().toISOString(),
    data: result.collection
  });

  res.status(201).json({
    message: `Food collection confirmed for ${meal.name}!`,
    collection: result.collection
  });
});

// Student's own collection history
apiRouter.get('/collections/my', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;

  let list = db.getCollections().filter(c => c.student_id === session.userId);

  if (month && year) {
    list = list.filter(c => {
      const d = new Date(c.collection_date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }

  list.sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime());
  res.json(list);
});

// Admin collection feed & summary
apiRouter.get('/collections', (req: Request, res: Response) => {
  const date = (req.query.date as string) || '';
  const mealType = (req.query.meal_type as string) || '';
  const search = (req.query.search as string || '').toLowerCase().trim();

  let list = db.getCollections();

  if (date) {
    list = list.filter(c => c.collection_date === date);
  }
  if (mealType) {
    list = list.filter(c => c.meal_type === mealType);
  }
  if (search) {
    list = list.filter(
      c =>
        c.student_name.toLowerCase().includes(search) ||
        c.student_phone.includes(search)
    );
  }

  list.sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime());
  res.json(list);
});

// Admin collection summary & analytics
apiRouter.get('/collections/summary', (req: Request, res: Response) => {
  const date = (req.query.date as string) || getTodayDateString();
  const allStudents = db.getStudents().filter(s => s.status === 'ACTIVE');
  const allCollections = db.getCollections();
  const todayCollections = allCollections.filter(c => c.collection_date === date);

  const now = new Date(date);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthlyCollections = allCollections.filter(c => {
    const d = new Date(c.collection_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const bills = db.getMonthlyBills(currentMonth, currentYear);
  const monthlyRevenue = bills.reduce((acc, b) => acc + (b.paid_amount || 0), 0);
  const pendingPayments = bills.reduce((acc, b) => acc + (b.balance_amount || 0), 0);

  const meals = db.getMeals();

  const mealSummary = meals.map(m => {
    const mealCollections = todayCollections.filter(c => c.meal_id === m.id || c.meal_type === m.meal_type);
    const collectedStudentIds = new Set(mealCollections.map(c => c.student_id));

    const collectedStudents = allStudents.filter(s => collectedStudentIds.has(s.id));
    const uncollectedStudents = allStudents.filter(s => !collectedStudentIds.has(s.id));

    return {
      meal_id: m.id,
      meal_type: m.meal_type,
      name: m.name,
      start_time: m.start_time,
      end_time: m.end_time,
      collected_count: mealCollections.length,
      total_students: allStudents.length,
      collected_students: collectedStudents.map(s => ({ id: s.id, name: s.full_name, phone: s.phone_number })),
      uncollected_students: uncollectedStudents.map(s => ({ id: s.id, name: s.full_name, phone: s.phone_number }))
    };
  });

  res.json({
    date,
    total_active_students: allStudents.length,
    total_collections_today: todayCollections.length,
    monthly_collections: monthlyCollections.length,
    monthly_revenue: monthlyRevenue,
    pending_payments: pendingPayments,
    meals: mealSummary
  });
});

// -----------------------------------------------------------------------------
// STUDENT MANAGEMENT (ADMIN)
// -----------------------------------------------------------------------------

// List students
apiRouter.get('/students', (req: Request, res: Response) => {
  const search = (req.query.search as string || '').toLowerCase().trim();
  let students = db.getStudents();

  if (search) {
    students = students.filter(
      s => s.full_name.toLowerCase().includes(search) || s.phone_number.includes(search) || (s.room_number && s.room_number.toLowerCase().includes(search))
    );
  }

  const safeStudents = students.map(({ password_hash, ...rest }) => rest);
  res.json(safeStudents);
});

// Admin add student manually
apiRouter.post('/students', (req: Request, res: Response) => {
  const parseResult = createStudentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Full name and phone number are required' });
    return;
  }

  const { full_name, phone_number, password, room_number } = parseResult.data;
  const cleanPhone = String(phone_number).trim().replace(/\s+/g, '');
  if (db.findStudentByPhone(cleanPhone)) {
    res.status(409).json({ error: 'Student with this phone number already exists' });
    return;
  }

  const defaultPassword = password || 'Student@123';
  const newStudent = db.createStudent(full_name, cleanPhone, hashPassword(defaultPassword));
  if (room_number) {
    db.updateStudent(newStudent.id, { room_number });
  }

  const { password_hash, ...safe } = newStudent;
  res.status(201).json(safe);
});

// Update student
apiRouter.put('/students/:id', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const { full_name, phone_number, room_number, status, password } = req.body;

  const updates: any = {};
  if (full_name) updates.full_name = full_name;
  if (phone_number) updates.phone_number = phone_number.trim().replace(/\s+/g, '');
  if (room_number !== undefined) updates.room_number = room_number;
  if (status) updates.status = status;
  if (password) updates.password_hash = hashPassword(password);

  const updated = db.updateStudent(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const { password_hash, ...safe } = updated;
  res.json(safe);
});

// Student Profile with History & Billing
apiRouter.get('/students/:id/profile', (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  const student = db.findStudentById(id);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const collections = db.getCollections().filter(c => c.student_id === id);
  const bills = db.getMonthlyBills().filter(b => b.student_id === id);
  const payments = db.getAllPayments().filter(p => p.student_id === id);

  const { password_hash, ...safeStudent } = student;
  res.json({
    student: safeStudent,
    total_collections: collections.length,
    collections: collections.slice(0, 30),
    bills,
    payments
  });
});

// -----------------------------------------------------------------------------
// BILLING & PAYMENTS
// -----------------------------------------------------------------------------

// Get billing settings
apiRouter.get('/billing/settings', (_req: Request, res: Response) => {
  res.json(db.getBillingSettings());
});

// Update billing settings
apiRouter.put('/billing/settings', (req: Request, res: Response) => {
  const parseResult = billingSettingsSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid billing configuration' });
    return;
  }
  const updated = db.updateBillingSettings(parseResult.data);
  realtimeManager.broadcast({
    type: 'BILL_UPDATED',
    timestamp: new Date().toISOString(),
    data: updated
  });
  res.json(updated);
});

// Get Monthly Bills (Admin)
apiRouter.get('/billing/bills', (req: Request, res: Response) => {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const bills = db.getMonthlyBills(month, year);
  res.json(bills);
});

// Student's Current Bill
apiRouter.get('/billing/my-bill', (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = db.validateSession(token);

  if (!session || session.role !== 'student') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const now = new Date();
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
  const year = req.query.year ? Number(req.query.year) : now.getFullYear();

  const bill = db.getStudentBill(session.userId, month, year);
  const settings = db.getBillingSettings();

  if (!bill) {
    // Return empty placeholder bill
    res.json({
      student_id: session.userId,
      month,
      year,
      breakfast_count: 0,
      lunch_count: 0,
      snacks_count: 0,
      dinner_count: 0,
      total_meals: 0,
      billing_mode: settings.mode,
      base_amount: 0,
      late_fee: 0,
      total_amount: 0,
      paid_amount: 0,
      balance_amount: 0,
      payment_status: 'PAID',
      settings
    });
    return;
  }

  const payments = db.getPaymentsForBill(bill.id);
  res.json({ ...bill, payments, settings });
});

// Record Payment
apiRouter.post(['/billing/payments', '/payments'], (req: Request, res: Response) => {
  const parseResult = recordPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Invalid payment record data' });
    return;
  }

  const { bill_id, amount, payment_method, received_by, reference_id, notes } = parseResult.data;

  const result = db.recordPayment(bill_id, Number(amount), payment_method, received_by, reference_id, notes);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  realtimeManager.broadcast({
    type: 'BILL_UPDATED',
    timestamp: new Date().toISOString(),
    data: { bill: result.bill, payment: result.payment }
  });

  res.status(201).json(result);
});

// -----------------------------------------------------------------------------
// HOSTEL SETTINGS & QR INFO
// -----------------------------------------------------------------------------
apiRouter.get('/settings/info', (_req: Request, res: Response) => {
  res.json(db.getHostelSettings());
});

apiRouter.put('/settings/info', (req: Request, res: Response) => {
  const updated = db.updateHostelSettings(req.body);
  res.json(updated);
});
