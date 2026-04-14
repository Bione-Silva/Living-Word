import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

req = urllib.request.Request(
    f"{url}/rest/v1/elite_mind_content?select=id",
    headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "count=exact"
    },
    method="HEAD"
)
try:
    with urllib.request.urlopen(req) as response:
        content_range = response.headers.get("Content-Range")
        if content_range:
            count = content_range.split('/')[-1]
            print(f"Total Rows: {count}")
        else:
            print("No Content-Range header found")
except Exception as e:
    print(f"Error: {e}")
