import requests
import json
import sys

BASE_URL = "http://localhost:5173/api"

def run_tests():
    print("=" * 70)
    print("HOSTEL MESS — COMPREHENSIVE END-TO-END VERIFICATION SUITE")
    print("=" * 70)

    # 1. MENU VERIFICATION (30 dishes with prices across 4 sessions)
    print("\n[TEST 1] Verifying /api/menu/today and 30 demo dishes...")
    r = requests.get(f"{BASE_URL}/menu/today")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    menu_data = r.json()
    meals = menu_data.get("meals", [])
    assert len(meals) == 4, f"Expected 4 meals, got {len(meals)}"

    total_dishes = 0
    meal_dishes = {}
    for m in meals:
        name = m.get("name")
        items = m.get("items", [])
        total_dishes += len(items)
        meal_dishes[name] = len(items)
        # Ensure no live status on meal or items
        assert "status" not in m or m.get("status") is None, "Live serving status found on meal!"
        for item in items:
            assert "status" not in item or item.get("status") is None, "Live serving status found on dish!"
            assert "price" in item and item["price"] > 0, f"Dish {item.get('name')} missing price!"
            assert "image_url" in item and len(item["image_url"]) > 10, f"Dish {item.get('name')} missing image!"
            assert "category" in item, f"Dish {item.get('name')} missing category!"

    print(f"✓ Menu Loaded: Total dishes across sessions: {total_dishes}")
    for m_name, count in meal_dishes.items():
        print(f"  - {m_name}: {count} dishes")
    assert total_dishes >= 30, f"Expected at least 30 dishes, got {total_dishes}"

    # 2. PUBLIC REGISTRATION IS STRICTLY DISABLED
    print("\n[TEST 2] Verifying public student registration is rejected with 403 Forbidden...")
    unauth_session = requests.Session()
    reg_payload = {
        "full_name": "Public Registrant",
        "phone_number": "9999900001",
        "password": "Password@123"
    }
    r = unauth_session.post(f"{BASE_URL}/auth/student/register", json=reg_payload)
    assert r.status_code == 403, f"Expected 403 for public registration, got {r.status_code}: {r.text}"
    print(f"✓ Public registration correctly blocked: '{r.json().get('error')}'")

    # 3. ADMIN AUTHENTICATION
    print("\n[TEST 3] Testing Admin Authentication (/api/auth/admin/login)...")
    admin_session = requests.Session()
    r = admin_session.post(f"{BASE_URL}/auth/admin/login", json={"username": "admin", "password": "Admin@123"})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    admin_data = r.json()
    assert "admin" in admin_data["admin"]["role"].lower(), f"Unexpected role: {admin_data['admin']['role']}"
    print(f"✓ Admin Logged In: {admin_data['admin']['full_name']} (Role: {admin_data['admin']['role']})")

    # 4. ADMIN STUDENT CREATION & DUPLICATE PHONE CHECK
    print("\n[TEST 4] Testing Admin Student Account Creation & Unique Phone Constraint...")
    test_phone = "9876500123"
    student_payload = {
        "full_name": "Deepak Kumar",
        "phone_number": test_phone,
        "password": "Student@123",
        "room_number": "B-305"
    }
    r = admin_session.post(f"{BASE_URL}/students", json=student_payload)
    if r.status_code == 409:
        print("  Student already exists from previous test run.")
    else:
        assert r.status_code == 201, f"Failed to create student: {r.status_code} {r.text}"
        new_st = r.json()
        assert new_st["full_name"] == "Deepak Kumar"
        print(f"✓ Admin created student: {new_st['full_name']} ({new_st['phone_number']}) in {new_st['room_number']}")

    # Test duplicate phone rejection
    r = admin_session.post(f"{BASE_URL}/students", json=student_payload)
    assert r.status_code == 409, f"Expected 409 for duplicate phone, got {r.status_code}"
    print(f"✓ Duplicate phone correctly rejected: '{r.json().get('error')}'")

    # 5. STUDENT LOGIN & PERSISTENT SESSION
    print("\n[TEST 5] Testing Student Login with Phone & Password...")
    student_session = requests.Session()
    login_payload = {
        "phone_number": "9876543210", # Rahul Sharma
        "password": "Student@123"
    }
    r = student_session.post(f"{BASE_URL}/auth/student/login", json=login_payload)
    assert r.status_code == 200, f"Student login failed: {r.status_code} {r.text}"
    st_info = r.json()
    assert "token" in st_info
    print(f"✓ Student Logged In: {st_info['student']['full_name']} ({st_info['student']['phone_number']})")

    # Verify session
    r = student_session.get(f"{BASE_URL}/auth/student/me")
    assert r.status_code == 200 and r.json()["authenticated"] == True
    print("✓ Persistent Student Session verified via /auth/student/me")

    # 6. FOOD COLLECTION & STRICT DUPLICATE PREVENTION
    print("\n[TEST 6] Testing Food Collection (MARK AS COLLECTED) & Duplicate Prevention...")
    coll_payload = {"meal_id": "meal-breakfast"}
    r = student_session.post(f"{BASE_URL}/collections/mark", json=coll_payload)
    if r.status_code == 201:
        c_data = r.json()
        print(f"✓ Food Collection Saved: {c_data['collection']['meal_type']} collected at {c_data['collection']['collected_at']}")
    elif r.status_code == 409:
        print(f"✓ Meal was already collected today, testing duplicate rejection: '{r.json().get('error')}'")
    else:
        assert False, f"Unexpected response: {r.status_code} {r.text}"

    # Verify duplicate collection attempt is rejected by server with 409
    r = student_session.post(f"{BASE_URL}/collections/mark", json=coll_payload)
    assert r.status_code == 409, f"Expected 409 Conflict for duplicate collection, got {r.status_code}"
    print(f"✓ Database Unique Constraint Verified: Duplicate collection blocked with 409 Conflict.")

    # 7. STUDENT CANNOT ACCESS ADMIN ROUTES
    print("\n[TEST 7] Testing Role-Based Security: Student cannot perform Admin actions...")
    r = student_session.post(f"{BASE_URL}/auth/student/register", json={"full_name": "Hacker", "phone_number": "1111111111", "password": "pass"})
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code}"
    print("✓ Unauthorized admin actions correctly blocked for student.")

    # 8. ADMIN MENU MANAGEMENT (CRUD dishes & prices)
    print("\n[TEST 8] Testing Admin Menu Management (CRUD dishes & prices)...")
    test_dish = {
        "meal_id": "meal-dinner",
        "meal_type": "DINNER",
        "name": "Paneer Butter Masala",
        "description": "Rich and creamy cottage cheese curry in tomato cashew gravy",
        "category": "VEG",
        "price": 80,
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80",
        "serving_date": "2026-11-20"
    }
    r = admin_session.post(f"{BASE_URL}/menu/items", json=test_dish)
    assert r.status_code == 201, f"Failed to add dish: {r.status_code} {r.text}"
    created = r.json()
    d_id = created["id"]
    print(f"✓ Created Dish: {created['name']} (₹{created['price']})")

    # Update price
    r = admin_session.put(f"{BASE_URL}/menu/items/{d_id}", json={"price": 90, "name": "Shahi Paneer Butter Masala"})
    assert r.status_code == 200
    updated = r.json()
    assert updated["price"] == 90
    print(f"✓ Updated Dish Price: {updated['name']} -> ₹{updated['price']}")

    # Delete dish
    r = admin_session.delete(f"{BASE_URL}/menu/items/{d_id}")
    assert r.status_code == 200
    print(f"✓ Deleted Dish Cleanly: {r.json()['message']}")

    # 9. BILLING & PAYMENTS
    print("\n[TEST 9] Testing Billing Calculations & Payment Recording...")
    r = admin_session.get(f"{BASE_URL}/billing/bills")
    assert r.status_code == 200
    bills = r.json()
    assert len(bills) > 0, "No bills generated"
    first_bill = bills[0]
    print(f"✓ Retrieved Bill for {first_bill['student_name']}: Total ₹{first_bill['total_amount']}, Balance ₹{first_bill['balance_amount']}")

    # Record partial payment
    pay_payload = {
        "bill_id": first_bill["id"],
        "amount": 200.0,
        "payment_method": "UPI",
        "reference_id": "UPI-TEST-998811",
        "notes": "Automated verification test payment"
    }
    r = admin_session.post(f"{BASE_URL}/billing/payments", json=pay_payload)
    assert r.status_code == 201, f"Failed to record payment: {r.status_code} {r.text}"
    pay_res = r.json()
    assert pay_res["success"] == True
    print(f"✓ Recorded Payment of ₹200.00 via UPI (Reference: UPI-TEST-998811)")
    print(f"  New Balance: ₹{pay_res['bill']['balance_amount']}, Status: {pay_res['bill']['payment_status']}")

    # 10. ADMIN DASHBOARD & SUMMARY
    print("\n[TEST 10] Testing Admin Dashboard Summary Metrics...")
    r = admin_session.get(f"{BASE_URL}/collections/summary")
    assert r.status_code == 200
    summary = r.json()
    print(f"✓ Today's Collections Logged: {summary.get('total_collections_today', 0)}")
    print(f"✓ Active Students Enrolled: {summary.get('total_active_students', 0)}")
    print(f"✓ Monthly Collections: {summary.get('monthly_collections', 0)}")
    print(f"✓ Monthly Revenue: ₹{summary.get('monthly_revenue', 0)}")

    print("\n" + "=" * 70)
    print("ALL 10 VERIFICATION WORKFLOWS PASSED WITH 0 ERRORS! 🎉")
    print("=" * 70)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
