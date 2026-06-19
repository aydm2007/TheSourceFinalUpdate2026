import sqlite3
import json

def inspect_records():
    conn = sqlite3.connect('smart_agri_db')
    cursor = conn.cursor()
    
    # 1. Check Employees
    print("--- EMPLOYEES ---")
    cursor.execute("SELECT id, first_name, last_name, employee_id, id_number, role, is_active FROM core_employee LIMIT 5")
    for r in cursor.fetchall():
        print(r)
        
    # 2. Check Daily Logs
    print("\n--- DAILY LOGS ---")
    cursor.execute("SELECT id, log_date, status, notes FROM core_dailylog LIMIT 5")
    for r in cursor.fetchall():
        print(r)
        
    # 3. Check Activities (especially JSON data field)
    print("\n--- ACTIVITIES ---")
    cursor.execute("SELECT id, tree_count_delta, data, task_id, log_id FROM core_activity WHERE data IS NOT NULL AND data != '' LIMIT 5")
    for r in cursor.fetchall():
        print(f"ID: {r[0]}, Delta: {r[1]}, Task: {r[3]}, Log: {r[4]}")
        try:
            parsed = json.loads(r[2])
            print("Parsed Data JSON:", json.dumps(parsed, indent=2)[:500])
        except Exception as e:
            print("Raw Data:", r[2][:200])

inspect_records()
