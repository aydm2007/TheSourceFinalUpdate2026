import sqlite3
import json

def extract_users(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Try to find user tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Tables found: {tables}")
        
        user_table = None
        if 'auth_user' in tables:
            user_table = 'auth_user'
        elif 'users' in tables:
            user_table = 'users'
        
        if user_table:
            cursor.execute(f"SELECT * FROM {user_table}")
            columns = [description[0] for description in cursor.description]
            users = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # Mask passwords if they exist
            for user in users:
                if 'password' in user:
                    user['password'] = '********'
            
            print(json.dumps(users, indent=2))
        else:
            print("No user table found.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    extract_users('smart_agri_db')
