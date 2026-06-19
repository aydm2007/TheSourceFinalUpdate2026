import sqlite3

def check_tables():
    conn = sqlite3.connect('smart_agri_db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("ALL TABLES:")
    for t in tables:
        print(t[0])
        
    print("\nCHECKING FOR SMART CARD / ACHIEVEMENT TABLES...")
    for t in tables:
        if 'card' in t[0].lower() or 'achieve' in t[0].lower():
            print("FOUND:", t[0])
            cursor.execute(f"PRAGMA table_info({t[0]})")
            print(cursor.fetchall())
            
check_tables()
