
import requests
import os
import json

# Setup from .env.local values
supabase_url = "https://priumwdestycikzfcysg.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMzg0OSwiZXhwIjoyMDkwNzk5ODQ5fQ.sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"
email = "bione22@gmail.com"
password = "LivingWord2026@"

headers = {
    "apikey": service_role_key,
    "Authorization": f"Bearer {service_role_key}",
    "Content-Type": "application/json"
}

def sync_admin():
    print(f"Checking user: {email}...")
    
    # 1. List users to find the ID
    res = requests.get(f"{supabase_url}/auth/v1/admin/users", headers=headers)
    if res.status_code != 200:
        print(f"Error listing users: {res.text}")
        return

    users = res.json().get('users', [])
    user = next((u for u in users if u.get('email') == email), None)
    
    user_id = None
    if user:
        user_id = user['id']
        print(f"User found (ID: {user_id}). Resetting password...")
        # Update password
        update_res = requests.put(
            f"{supabase_url}/auth/v1/admin/users/{user_id}",
            headers=headers,
            json={"password": password, "email_confirm": True}
        )
        if update_res.status_code == 200:
            print("Password updated successfully.")
        else:
            print(f"Error updating password: {update_res.text}")
            return
    else:
        print("User not found. Creating user...")
        create_res = requests.post(
            f"{supabase_url}/auth/v1/admin/users",
            headers=headers,
            json={
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": "Bione Silva"}
            }
        )
        if create_res.status_code == 201:
            user_data = create_res.json()
            user_id = user_data['id']
            print(f"User created successfully (ID: {user_id}).")
        else:
            print(f"Error creating user: {create_res.text}")
            return

    # 2. Ensure Profile exists with master access
    print(f"Syncing profile for ID {user_id}...")
    profile_res = requests.post(
        f"{supabase_url}/rest/v1/profiles",
        headers={**headers, "Prefer": "resolution=merge-duplicates"},
        json={
            "id": user_id,
            "full_name": "Bione Silva",
            "email": email,
            "plan": "igreja",
            "credits_remaining": 999999,
            "credits_monthly_limit": 999999
        }
    )
    
    if profile_res.status_code in [200, 201, 204]:
        print("Profile synced with master access ('igreja' plan).")
    else:
        print(f"Error syncing profile: {profile_res.text}")

if __name__ == "__main__":
    sync_admin()
