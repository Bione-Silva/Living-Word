
import requests
import os

supabase_url = "https://priumwdestycikzfcysg.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"
user_id = "945f6c31-52a1-46a5-91f9-ed1954c3ae06"

headers = {
    "apikey": service_role_key,
    "Authorization": f"Bearer {service_role_key}",
    "Content-Type": "application/json"
}

def set_master_plan():
    print(f"Setting master plan for {user_id}...")
    # Using patch to see if it works
    res = requests.patch(f"{supabase_url}/rest/v1/profiles?id=eq.{user_id}", headers=headers, json={"plan": "igreja"})
    if res.status_code in [200, 201, 204]:
        print("Plan updated to 'igreja'.")
    else:
        print(f"Error: {res.text}")

if __name__ == "__main__":
    set_master_plan()
