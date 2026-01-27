import requests
import uuid

API_URL = "http://localhost:8000/api"

def test_otp_flow():
    email = "test_otp_user@example.com"
    print(f"Testing OTP Flow for {email}")
    
    # 1. Send OTP
    print("1. Sending OTP...")
    try:
        res = requests.post(f"{API_URL}/auth/send-otp", json={"email": email})
        print(f"   Status: {res.status_code}")
        data = res.json()
        print(f"   Response: {data}")
        
        if not res.ok:
            print("ERROR: Send OTP failed")
            return
            
        code = data.get("dev_code")
        if not code:
            print("ERROR: No dev_code returned (maybe email sent?)")
            # If using real email, we can't automate this easily without access to inbox
            # But for now assume dev_code is returned or we rely on '000000' backdoor check if enabled
            return
            
    except Exception as e:
        print(f"ERROR: Conn failed: {e}")
        return

    # 2. Verify OTP
    print(f"\n2. Verifying OTP: {code}...")
    try:
        res = requests.post(f"{API_URL}/auth/verify-otp", json={"email": email, "code": code})
        print(f"   Status: {res.status_code}")
        print(f"   Response: {res.text}")
        
        if res.ok:
            print("SUCCESS: Login successful")
        else:
            print("FAILURE: Login failed")
            
    except Exception as e:
         print(f"ERROR: Conn failed: {e}")

if __name__ == "__main__":
    test_otp_flow()
