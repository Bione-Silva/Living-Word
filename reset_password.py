import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('.env.local')

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}

# 1. Fetch users
req = urllib.request.Request(f"{supabase_url}/admin/users", headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        users_data = json.loads(response.read().decode())
        users = users_data.get('users', [])
except Exception as e:
    print(f"Error fetching users: {e}")
    sys.exit(1)

target = None
print("Users in database:")
for u in users:
    email = u.get("email", "")
    print(f" - {email}")
    if "bx4" in email.lower() or "bion" in email.lower():
        target = u

if not target:
    print("User bx4 or bione not found!")
    sys.exit(1)

print(f"\nFound target: {target['email']} (ID: {target['id']})")

# 2. Update user
update_req = urllib.request.Request(
    f"{supabase_url}/admin/users/{target['id']}", 
    headers=headers, 
    method="PUT",
    data=json.dumps({"password": "LivingWord2026!"}).encode()
)
try:
    with urllib.request.urlopen(update_req) as res:
        print(f"SUCCESS! Changed password for {target['email']} to: LivingWord2026!")
except Exception as e:
    print(f"Error updating user: {e}")
