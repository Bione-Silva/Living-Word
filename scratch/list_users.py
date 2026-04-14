
import requests
import os

supabase_url = "https://priumwdestycikzfcysg.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"

headers = {
    "apikey": service_role_key,
    "Authorization": f"Bearer {service_role_key}",
    "Content-Type": "application/json"
}

def find_users():
    print(f"Listing all users in Auth...")
    res = requests.get(f"{supabase_url}/auth/v1/admin/users", headers=headers)
    if res.status_code == 200:
        users = res.json().get('users', [])
        for u in users:
            print(f"User: {u.get('email')} (ID: {u.get('id')})")
    else:
        print(f"Error listing users: {res.text}")

if __name__ == "__main__":
    find_users()
