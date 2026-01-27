import requests
import uuid

API_URL = "http://localhost:8000/api"
SESSION_ID = f"test_sess_{uuid.uuid4().hex[:8]}"

def test_cart_flow():
    print(f"Testing with Session ID: {SESSION_ID}")
    
    # 1. Get Products
    print("1. Fetching Products...")
    try:
        res = requests.get(f"{API_URL}/products")
        products = res.json()
        if not products:
            print("ERROR: No products found")
            return
        product = products[0]
        print(f"   found: {product['name']} ({product['product_id']})")
    except Exception as e:
        print(f"ERROR: Failed to connect to backend: {e}")
        return

    # 2. Add to Cart
    print("\n2. Adding to Cart...")
    headers = {"X-Cart-Session-ID": SESSION_ID}
    payload = {
        "product_id": product["product_id"],
        "quantity": 1,
        "size": product["sizes"][0]
    }
    res = requests.post(f"{API_URL}/cart/add", json=payload, headers=headers)
    print(f"   Status: {res.status_code}")
    print(f"   Response: {res.json()}")

    # 3. Get Cart
    print("\n3. Fetching Cart...")
    res = requests.get(f"{API_URL}/cart", headers=headers)
    cart = res.json()
    items = cart.get("items", [])
    print(f"   Cart Items: {len(items)}")
    
    if len(items) > 0 and items[0]["product_id"] == product["product_id"]:
        print("SUCCESS: Cart updated correctly.")
    else:
        print("FAILURE: Cart verify failed.")

if __name__ == "__main__":
    test_cart_flow()
