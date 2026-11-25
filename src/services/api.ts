import {
  Student,
  Admin,
  Meal,
  FoodItem,
  FoodCollection,
  Notification,
  BillingSettings,
  MonthlyBill,
  Payment,
  HostelSettings
} from '../types';

const BASE_URL = '/api';

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mess_session_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return data as T;
}

export const api = {
  // Auth: Student
  registerStudent: (full_name: string, phone_number: string, password: string, room_number?: string) =>
    fetchJSON<{ message: string; token: string; student: Student }>('/auth/student/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, phone_number, password, room_number })
    }),

  loginStudent: (phone_number: string, password: string) =>
    fetchJSON<{ message: string; token: string; student: Student }>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number, password })
    }),

  getStudentSession: () =>
    fetchJSON<{ authenticated: boolean; student: Student }>('/auth/student/me'),

  updateStudentPassword: (new_password: string, current_password?: string) =>
    fetchJSON<{ message: string }>('/auth/student/password', {
      method: 'PUT',
      body: JSON.stringify({ new_password, current_password })
    }),

  // Auth: Admin
  loginAdmin: (username: string, password: string) =>
    fetchJSON<{ message: string; token: string; admin: Admin }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  getAdminSession: () =>
    fetchJSON<{ authenticated: boolean; admin: Admin }>('/auth/admin/me'),

  logout: () =>
    fetchJSON<{ message: string }>('/auth/logout', { method: 'POST' }),

  // Menu & Live status
  getTodayMenu: (date?: string) =>
    fetchJSON<{ date: string; meals: (Meal & { items: FoodItem[] })[] }>(
      date ? `/menu/today?date=${date}` : '/menu/today'
    ),

  getAllMenu: () =>
    fetchJSON<{ meals: Meal[]; items: FoodItem[] }>('/menu/all'),

  createFoodItem: (data: Partial<FoodItem>) =>
    fetchJSON<FoodItem>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateFoodItem: (id: string, data: Partial<FoodItem>) =>
    fetchJSON<FoodItem>(`/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteFoodItem: (id: string) =>
    fetchJSON<{ message: string }>(`/menu/items/${id}`, { method: 'DELETE' }),

  // Collections
  markFoodCollected: (meal_id: string, food_item_id?: string, food_item_name?: string) =>
    fetchJSON<{ message: string; collection: FoodCollection }>('/collections/mark', {
      method: 'POST',
      body: JSON.stringify({ meal_id, food_item_id, food_item_name })
    }),

  getMyCollections: (month?: number, year?: number) => {
    const q = month && year ? `?month=${month}&year=${year}` : '';
    return fetchJSON<FoodCollection[]>(`/collections/my${q}`);
  },

  getAllCollections: (filters?: { date?: string; meal_type?: string; search?: string; month?: number; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.meal_type) params.append('meal_type', filters.meal_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.month) params.append('month', String(filters.month));
    if (filters?.year) params.append('year', String(filters.year));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchJSON<FoodCollection[]>(`/collections${qs}`);
  },

  getCollectionsSummary: (date?: string) =>
    fetchJSON<{
      date: string;
      total_active_students: number;
      total_collections_today: number;
      monthly_collections: number;
      monthly_revenue: number;
      pending_payments: number;
      meals: {
        meal_id: string;
        meal_type: string;
        name: string;
        start_time: string;
        end_time: string;
        collected_count: number;
        total_students: number;
        collected_students: { id: string; name: string; phone: string }[];
        uncollected_students: { id: string; name: string; phone: string }[];
      }[];
    }>(date ? `/collections/summary?date=${date}` : '/collections/summary'),

  // Students (Admin)
  getStudents: (search?: string) =>
    fetchJSON<Student[]>(search ? `/students?search=${encodeURIComponent(search)}` : '/students'),

  createStudentManually: (data: { full_name: string; phone_number: string; room_number?: string; password?: string }) =>
    fetchJSON<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateStudent: (id: string, data: Partial<Student & { password?: string }>) =>
    fetchJSON<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteStudent: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/students/${id}`, {
      method: 'DELETE'
    }),

  getStudentProfile: (id: string) =>
    fetchJSON<{
      student: Student;
      total_collections: number;
      collections: FoodCollection[];
      bills: MonthlyBill[];
      payments: Payment[];
    }>(`/students/${id}/profile`),

  // Billing
  getBillingSettings: () =>
    fetchJSON<BillingSettings>('/billing/settings'),

  updateBillingSettings: (data: Partial<BillingSettings>) =>
    fetchJSON<BillingSettings>('/billing/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getMonthlyBills: (month?: number, year?: number) => {
    const q = month && year ? `?month=${month}&year=${year}` : '';
    return fetchJSON<MonthlyBill[]>(`/billing/bills${q}`);
  },

  getMyBill: (month?: number, year?: number) => {
    const q = month && year ? `?month=${month}&year=${year}` : '';
    return fetchJSON<MonthlyBill & { payments: Payment[]; settings: BillingSettings }>(`/billing/my-bill${q}`);
  },

  recordPayment: (data: {
    bill_id: string;
    amount: number;
    payment_method: string;
    received_by?: string;
    reference_id?: string;
    notes?: string;
  }) =>
    fetchJSON<{ success: boolean; payment: Payment; bill: MonthlyBill }>('/billing/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Notifications
  getNotifications: () =>
    fetchJSON<{ notifications: Notification[]; unread_count: number }>('/notifications'),

  markNotificationRead: (id: string) =>
    fetchJSON<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    fetchJSON<{ success: boolean; count: number }>('/notifications/read-all', { method: 'POST' }),

  // Collection Payment Settlement
  payCollection: (data: { collection_id: string; payment_method?: string; reference_id?: string }) =>
    fetchJSON<{ success: boolean; payment: Payment; collection: FoodCollection }>('/payments/collect-pay', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Hostel Settings & QR
  getHostelSettings: () =>
    fetchJSON<HostelSettings>('/settings/info'),

  updateHostelSettings: (data: Partial<HostelSettings>) =>
    fetchJSON<HostelSettings>('/settings/info', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};
