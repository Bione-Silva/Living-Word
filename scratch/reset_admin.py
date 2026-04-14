
import requests
import os

supabase_url = "https://priumwdestycikzfcysg.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"
user_id = "945f6c31-52a1-46a5-91f9-ed1954c3ae06"
email = "bx4usa@gmail.com"
password = "LivingWord2026@"

headers = {
    "apikey": service_role_key,
    "Authorization": f"Bearer {service_role_key}",
    "Content-Type": "application/json"
}

def update_admin():
    print(f"Updating password for {email} (ID: {user_id})...")
    
    # 1. Update Password
    res = requests.put(
        f"{supabase_url}/auth/v1/admin/users/{user_id}",
        headers=headers,
        json={"password": password, "email_confirm": True}
    )
    
    if res.status_code == 200:
        print("Password updated successfully.")
    else:
        print(f"Error updating password: {res.text}")
        return

    # 2. Sync Profile
    print(f"Ensuring master profile access for {user_id}...")
    # Since we found earlier that the 'email' column doesn't exist, we only pass what's valid
    profile_res = requests.post(
        f"{supabase_url}/rest/v1/profiles",
        headers={**headers, "Prefer": "resolution=merge-duplicates"},
        json={
            "id": user_id,
            "full_name": "Bione Silva",
            "plan": "igreja",
            "generations_limit": 999999
        }
    )
    
    if profile_res.status_code in [200, 201, 204]:
        print("Profile updated with 'igreja' plan.")
    else:
        print(f"Error updating profile: {profile_res.text}")

if __name__ == "__main__":
    update_admin();
