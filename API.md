# HOSTEL MESS — REST API Documentation

Base URL: `/api`
All timestamps are handled and localized in `Asia/Kolkata` (IST).

---

## 1. Authentication Endpoints

### Student Login
- **Endpoint**: `POST /api/auth/student/login`
- **Body**:
  ```json
  {
    "phone_number": "9876543210",
    "password": "Student@123"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "student": {
      "id": "uuid",
      "full_name": "Rahul Sharma",
      "phone_number": "9876543210",
      "room_number": "B-204",
      "status": "ACTIVE"
    }
  }
  ```
- **Errors**: `401 Unauthorized` for invalid credentials; `403 Forbidden` if account deactivated.

### Admin Login
- **Endpoint**: `POST /api/auth/admin/login`
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "Admin@123"
  }
  ```
- **Response**: `200 OK` with admin session.

### Session Verification
- **Endpoint**: `GET /api/auth/me`
- **Response**: Currently authenticated student or admin object.

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Response**: `200 OK` (clears session cookies).

---

## 2. Menu Management Endpoints

### Get Today's Scheduled Menu
- **Endpoint**: `GET /api/menu/today`
- **Response**:
  ```json
  {
    "date": "2026-11-20",
    "meals": [
      {
        "id": "meal-breakfast",
        "meal_type": "BREAKFAST",
        "name": "Breakfast",
        "start_time": "07:30",
        "end_time": "09:30",
        "items": [
          {
            "id": "item-1",
            "name": "Masala Dosa",
            "description": "Crispy golden crepe with potato masala",
            "price": 40,
            "category": "VEG",
            "image_url": "https://..."
          }
        ]
      }
    ]
  }
  ```

### Get All Menu Items (Admin)
- **Endpoint**: `GET /api/admin/menu`

### Add New Menu Item (Admin)
- **Endpoint**: `POST /api/admin/menu/items`
- **Body**:
  ```json
  {
    "name": "Appam",
    "description": "Fermented rice pancake",
    "price": 30,
    "meal_type": "BREAKFAST",
    "category": "VEG",
    "image_url": "https://...",
    "serving_date": "2026-11-20"
  }
  ```

### Update Menu Item (Admin)
- **Endpoint**: `PUT /api/admin/menu/items/:id`

### Delete Menu Item (Admin)
- **Endpoint**: `DELETE /api/admin/menu/items/:id`

---

## 3. Food Collection Endpoints (Core Feature)

### Mark Food As Collected (Student)
- **Endpoint**: `POST /api/collections/mark`
- **Body**:
  ```json
  {
    "meal_id": "meal-breakfast"
  }
  ```
- **Business Logic**:
  - Validates authenticated student.
  - Verifies meal category & current date.
  - Enforces database uniqueness on `[student_id, collection_date, meal_category]`.
  - Saves exact timestamp.
- **Success**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Breakfast marked as collected successfully!",
    "collection": {
      "id": "uuid",
      "meal_type": "BREAKFAST",
      "collection_date": "2026-11-20",
      "collected_at": "2026-11-20T08:15:00.000Z"
    }
  }
  ```
- **Duplicate Failure**: `409 Conflict`
  ```json
  {
    "error": "You have already collected Breakfast today"
  }
  ```

### Get My Collection History (Student)
- **Endpoint**: `GET /api/collections/my?month=11&year=2026`

### Get All Collections Tracker (Admin)
- **Endpoint**: `GET /api/admin/collections?date=2026-11-20&meal_type=BREAKFAST`

### Get Daily Collections Summary (Admin)
- **Endpoint**: `GET /api/admin/collections/summary?date=2026-11-20`

---

## 4. Student Management Endpoints (Admin Only)

### List Students
- **Endpoint**: `GET /api/admin/students?search=rahul`

### Create Student (Admin Only)
- **Endpoint**: `POST /api/admin/students`
- **Body**:
  ```json
  {
    "full_name": "Karan Mehra",
    "phone_number": "9876543299",
    "room_number": "B-305",
    "password": "Student@123"
  }
  ```

### Update Student / Activate / Deactivate
- **Endpoint**: `PUT /api/admin/students/:id`
- **Body**: `{ "status": "DEACTIVATED" }` or `{ "room_number": "B-306" }`

---

## 5. Billing & Payments Endpoints

### Get Student Monthly Bill (Student)
- **Endpoint**: `GET /api/bills/my?month=11&year=2026`

### Get All Monthly Bills (Admin)
- **Endpoint**: `GET /api/admin/bills?month=11&year=2026`

### Record Payment (Admin)
- **Endpoint**: `POST /api/admin/payments`
- **Body**:
  ```json
  {
    "bill_id": "bill-uuid",
    "amount": 1500,
    "payment_method": "UPI",
    "reference_id": "UPI-8849204820",
    "notes": "Paid via Google Pay"
  }
  ```

### Update Billing Settings & Rates (Admin)
- **Endpoint**: `PUT /api/admin/billing/settings`
- **Body**:
  ```json
  {
    "mode": "PER_MEAL",
    "fixed_monthly_rate": 3000,
    "breakfast_rate": 45,
    "lunch_rate": 85,
    "snacks_rate": 35,
    "dinner_rate": 85,
    "late_fee_amount": 100
  }
  ```
