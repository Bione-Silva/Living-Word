import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local')

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Missin Supabase credentials")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

try:
    auth_admin = supabase.auth.admin
    res = auth_admin.list_users()
    users = res
    print("Fetched users...")
    
    target = None
    for u in users:
        email = u.email
        print(f" - {email}")
        if email and ("bx" in email.lower() or "bion" in email.lower()):
            target = u
            break
            
    if not target:
        print("User not found!")
    else:
        print(f"Found target: {target.email} | ID: {target.id}")
        auth_admin.update_user_by_id(target.id, {"password": "LivingWord2026!"})
        print(f"SUCCESS! Changed password for {target.email} to: LivingWord2026!")

except Exception as e:
    print(f"Error: {e}")
