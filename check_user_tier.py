import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

res = supabase.auth.admin.list_users()
users = getattr(res, "users", [])
user = next((u for u in users if u.email == 'bx4usa@gmail.com'), None)

if user:
    profile = supabase.table('profiles').select('*').eq('id', user.id).execute()
    print("Profile:", profile.data)
else:
    print("User not found.")
