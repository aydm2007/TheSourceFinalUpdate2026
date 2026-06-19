import sqlite3

def check_schema():
    conn = sqlite3.connect('smart_agri_db')
    cursor = conn.cursor()
    
    tables_to_check = ['core_employee', 'core_dailylog', 'core_timesheet', 'core_activity', 'core_activity_employee']
    
    for t in tables_to_check:
        print(f"\n--- {t} ---")
        try:
            cursor.execute(f"PRAGMA table_info({t})")
            cols = cursor.fetchall()
            for c in cols:
                print(f"  {c[1]} ({c[2]})")
        except Exception as e:
            print(f"Error checking {t}: {e}")

check_schema()
