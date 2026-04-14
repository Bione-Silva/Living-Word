
import requests
import os

supabase_url = "https://priumwdestycikzfcysg.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"
email = "bione22@gmail.com"

headers = {
    "apikey": service_role_key,
    "Authorization": f"Bearer {service_role_key}"
}

def check_db():
    print(f"Checking public.profiles for {email}...")
    res = requests.get(f"{supabase_url}/rest/v1/profiles?email=eq.{email}", headers=headers)
    if res.status_code == 200:
        profiles = res.json()
        if profiles:
            print(f"Profile found: {profiles[0]}")
        else:
            print("No profile found in public.profiles.")
    else:
        print(f"Error checking profiles: {res.text}")

if __name__ == "__main__":
    check_db()
