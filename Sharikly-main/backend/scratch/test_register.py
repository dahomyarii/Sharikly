import requests
import json

url = "http://127.0.0.1:8000/api/auth/register/"
data = {
    "email": "test_new_user@gmail.com",
    "username": "test_new_user",
    "password": "AdeefIsAw12@",
    "phone_number": "0500000000"
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, data=json.dumps(data), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
