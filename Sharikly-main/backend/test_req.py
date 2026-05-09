import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:8000/api/auth/register/', data=json.dumps({'email': 'dahomyarii@gmail.com', 'username': 'dahomyarii', 'password': 'AdeefIsAw12@', 'phone_number': ''}).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    print(res.read().decode('utf-8'))
except Exception as e:
    print(e.code, e.read().decode('utf-8'))
