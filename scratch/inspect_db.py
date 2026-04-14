import urllib.request
import json
import ssl

url = "https://priumwdestycikzfcysg.supabase.co/rest/v1/profiles?limit=1"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjM4NDksImV4cCI6MjA5MDc5OTg0OX0.ROZuKEh4PYSygLr3y3fqvXUGcWFAIXIxCQQW0MinaPo",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaXVtd2Rlc3R5Y2lremZjeXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjM4NDksImV4cCI6MjA5MDc5OTg0OX0.ROZuKEh4PYSygLr3y3fqvXUGcWFAIXIxCQQW0MinaPo"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("PROFILES DATA:", json.dumps(data, indent=2))
except Exception as e:
    print("ERROR:", e)

# Let's get the openapi spec to see the column definitions
url_openapi = "https://priumwdestycikzfcysg.supabase.co/rest/v1/?apikey=sajpSk081mza8QoNTC8DeIMo7HJpByti9NhQlsee4FI"
req_openapi = urllib.request.Request(url_openapi, headers=headers)
try:
    with urllib.request.urlopen(req_openapi, context=ctx) as response:
        data = json.loads(response.read().decode('utf-8'))
        profiles_def = data.get('definitions', {}).get('profiles', {})
        print("\nPROFILES SCHEMA DEFINITION:")
        print(json.dumps(profiles_def, indent=2))
except Exception as e:
    print("ERROR:", e)
