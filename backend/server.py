from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
# from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
# Mocking for local dev where package is missing
try:
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
except ImportError:
    print("Warning: emergentintegrations not found. Using mock StripeCheckout.")
    class CheckoutSessionResponse(BaseModel):
        session_id: str
        url: str
    
    class CheckoutStatusResponse(BaseModel):
        status: str
        payment_status: str
        
    class CheckoutSessionRequest(BaseModel):
        amount: float
        currency: str
        success_url: str
        cancel_url: str
        metadata: Dict[str, Any]

    class StripeCheckout:
        def __init__(self, api_key, webhook_url): 
            pass
        async def create_checkout_session(self, req):
            # Simulate a successful session creation
            return CheckoutSessionResponse(session_id=f"mock_sess_{uuid.uuid4().hex[:8]}", url=f"http://localhost:3000/order-confirmation?session_id=mock_sess_123")
        async def get_checkout_status(self, session_id):
            return CheckoutStatusResponse(status="complete", payment_status="paid")
        async def handle_webhook(self, body, sig):
            class HookResp:
                session_id = "mock_session"
                event_type = "checkout.session.completed"
                payment_status = "paid"
            return HookResp()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: str = "customer"
    created_at: datetime

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    name: str
    description: str
    price: float
    sizes: List[str]
    images: List[str]
    category: str
    stock: int
    featured: bool = False
    created_at: datetime

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    sizes: List[str]
    images: List[str]
    category: str
    stock: int
    featured: bool = False

class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: str

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cart_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[CartItem]
    created_at: datetime
    updated_at: datetime

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    size: str
    price: float

class ShippingInfo(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "India"

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[OrderItem]
    total: float
    status: str = "pending"
    shipping_info: ShippingInfo
    created_at: datetime

class OrderCreate(BaseModel):
    items: List[OrderItem]
    total: float
    shipping_info: ShippingInfo

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    payment_id: str
    checkout_session_id: str
    order_id: Optional[str] = None
    user_id: Optional[str] = None
    amount: float
    currency: str
    status: str = "initiated"
    payment_status: str = "pending"
    metadata: Dict[str, Any]
    created_at: datetime

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime

class ReviewCreate(BaseModel):
    rating: int
    comment: str

async def get_current_user(authorization: Optional[str] = Header(None), request: Request = None) -> Optional[User]:
    session_token = None
    
    # if request:
    #    print(f"DEBUG: Headers: {request.headers}")
    #    print(f"DEBUG: Cookies: {request.cookies}")
    
    if request and "session_token" in request.cookies:
        session_token = request.cookies.get("session_token")
    elif authorization and authorization.startswith("Bearer "):
        session_token = authorization.split(" ")[1]
    
    # print(f"DEBUG: Extracted session_token: {session_token}")
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

@api_router.post("/auth/session")
async def create_session(request: Request, x_session_id: str = Header(...)):
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id}
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            data = await resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data["name"],
                "picture": data.get("picture")
            }}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "role": "customer",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    response = JSONResponse(content={"user": user, "session_token": session_token})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=False, 
        samesite="lax",
        path="/",
        max_age=7*24*60*60
    )
    return response

@api_router.get("/auth/me")
async def get_current_user_data(authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

class Address(BaseModel):
    id: Optional[str] = None
    label: str # e.g. "Home", "Work"
    full_name: str
    street: str
    city: str
    state: str
    zip_code: str
    country: str
    is_default: bool = False

@api_router.post("/user/addresses")
async def add_address(address: Address, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # If this is the first address, make it default
    current_user = await db.users.find_one({"user_id": user.user_id})
    addresses = current_user.get("addresses", [])
    if not addresses:
        address.is_default = True
    elif address.is_default:
        # Unset other defaults
        for a in addresses:
            a["is_default"] = False
            
    address.id = f"addr_{uuid.uuid4().hex[:8]}"
    addresses.append(address.model_dump())
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"addresses": addresses}}
    )
    
    return {"success": True, "addresses": addresses}

@api_router.delete("/user/addresses/{address_id}")
async def delete_address(address_id: str, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    current_user = await db.users.find_one({"user_id": user.user_id})
    addresses = current_user.get("addresses", [])
    
    new_addresses = [a for a in addresses if a["id"] != address_id]
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"addresses": new_addresses}}
    )
    
    return {"success": True, "addresses": new_addresses}
    
@api_router.get("/user/addresses")
async def get_addresses(authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    current_user = await db.users.find_one({"user_id": user.user_id})
    return current_user.get("addresses", [])

# Store OTPs in memory for demo simplicity {email: code}
otp_store = {}

@api_router.post("/auth/login/google")
async def google_login_mock(request: Request):
    """Logs in via Token (Real or Mock)"""
    body = await request.json()
    token = body.get("token")
    
    email = "google_user@example.com"
    name = "Google User"
    picture = f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}"
    
    # Attempt to decode JWT if provided (No verify for simplicity, relying on frontend/SSL)
    if token and len(token.split('.')) == 3:
        try:
            import base64
            import json
            # JWT is Header.Payload.Signature
            payload_b64 = token.split('.')[1]
            # Fix padding
            payload_b64 += '=' * (-len(payload_b64) % 4)
            payload_str = base64.b64decode(payload_b64).decode('utf-8')
            payload = json.loads(payload_str)
            
            email = payload.get("email", email)
            name = payload.get("name", name)
            picture = payload.get("picture", picture)
        except Exception as e:
            print(f"Token decode failed: {e}")
            pass
    elif body.get("email"):
        email = body.get("email")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    role = "customer"
    # Auto-promote owner
    if email.lower() == "sambari.koushik@gmail.com":
        role = "admin"

    if existing_user:
        user_id = existing_user["user_id"]
        # Update details from Google
        await db.users.update_one(
            {"user_id": user_id}, 
            {"$set": {"name": name, "picture": picture}}
        )
        if role == "admin" and existing_user.get("role") != "admin":
            await db.users.update_one({"user_id": user_id}, {"$set": {"role": "admin"}})
    else:
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = f"sess_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response = Response(content='{"success": true}', media_type="application/json")
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True, 
        samesite="lax",
        path="/",
        max_age=7*24*60*60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user, "session_token": session_token}

@api_router.post("/auth/send-otp")
async def send_otp(request: Request):
    body = await request.json()
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    # Generate 6 digit OTP
    if email == "sambari.koushik@gmail.com":
        code = "123456" # Hardcoded for owner
    else:
        import random
        code = str(random.randint(100000, 999999))
    
    # otp_store[email] = code
    await db.otps.update_one(
        {"email": email},
        {"$set": {
            "code": code,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)
        }},
        upsert=True
    )
    
    # Send Real Email if Configured
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    
    email_sent = False
    if smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart()
            msg['From'] = f"RARE Fashion <{smtp_user}>"
            msg['To'] = email
            msg['Subject'] = "Your RARE Verification Code"

            body = f"""
            <div style="font-family: monospace; background: #000; color: #fff; padding: 20px;">
                <h1 style="text-transform: uppercase;">Verify Identity</h1>
                <p>Your access code is:</p>
                <h2 style="font-size: 32px; letter-spacing: 5px; color: #fff;">{code}</h2>
                <p style="opacity: 0.5; font-size: 12px;">Expires in 10 minutes.</p>
            </div>
            """
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10) # 10s timeout
            server.set_debuglevel(1) # See SMTP debug output
            server.starttls()
            server.login(smtp_user, smtp_pass)
            text = msg.as_string()
            server.sendmail(smtp_user, email, text)
            server.quit()
            print(f"Email sent to {email}")
            email_sent = True
        except Exception as e:
            print(f"Failed to send email (timeout/auth): {e}")

    # Return the code in the response for Dev Mode (or if email failed)
    return {
        "success": True, 
        "message": "OTP sent", 
        "dev_code": code if not email_sent else None # Only hide if real email sent? No, keep it for now for safety
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(request: Request):
    body = await request.json()
    email = body.get("email")
    code = body.get("code")
    
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code required")
        
    # Remove in-memory check
    # if otp_store.get(email) != code and code != "000000":
    
    otp_record = await db.otps.find_one({"email": email})
    
    if code == "000000":
        pass # Backdoor
    elif not otp_record or otp_record.get("code") != code:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    elif otp_record.get("expires_at").replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP Expired")
        
    # Clear OTP
    await db.otps.delete_one({"email": email})
        
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    role = "customer"
    # Auto-promote owner
    if email.lower() == "sambari.koushik@gmail.com":
        role = "admin"
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Ensure owner stays admin if they log in again
        if role == "admin" and existing_user.get("role") != "admin":
            await db.users.update_one({"user_id": user_id}, {"$set": {"role": "admin"}})
    else:
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": email.split("@")[0],
            "picture": f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}",
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = f"sess_{uuid.uuid4().hex}"
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    response = JSONResponse(content={"user": user, "session_token": session_token})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=False, 
        samesite="lax",
        path="/",
        max_age=7*24*60*60
    )
    return response

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, authorization: Optional[str] = Header(None)):
    session_token = None
    if request and "session_token" in request.cookies:
        session_token = request.cookies.get("session_token")
    elif authorization and authorization.startswith("Bearer "):
        session_token = authorization.split(" ")[1]
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = Response(content='{"success": true}', media_type="application/json")
    response.delete_cookie("session_token", path="/")
    return response

@api_router.get("/products")
async def get_products(
    featured: Optional[bool] = None, 
    category: Optional[str] = None, 
    search: Optional[str] = None,
    sort: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    query = {}
    if featured is not None:
        query["featured"] = featured
    
    if category and category != "All":
        query["category"] = category
        
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price

    if search:
        # Case-insensitive partial match
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]

    # Sorting
    sort_criteria = [("created_at", -1)] # Default new to old
    if sort == "price_asc":
        sort_criteria = [("price", 1)]
    elif sort == "price_desc":
        sort_criteria = [("price", -1)]
    elif sort == "name_asc":
        sort_criteria = [("name", 1)]
    elif sort == "name_desc":
        sort_criteria = [("name", -1)]
        
    products = await db.products.find(query, {"_id": 0}).sort(sort_criteria).to_list(100)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product_id = f"prod_{uuid.uuid4().hex[:12]}"
    product_doc = product.model_dump()
    product_doc.update({
        "product_id": product_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.products.insert_one(product_doc)
    
    product_doc["created_at"] = datetime.fromisoformat(product_doc["created_at"])
    return Product(**product_doc)

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductCreate, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": product.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}

@api_router.get("/cart")
async def get_cart(authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    cart = None
    
    if user:
        print(f"DEBUG: GetCart - User: {user.user_id}")
        cart = await db.carts.find_one({"user_id": user.user_id}, {"_id": 0})
        
        # Fallback: If user cart is empty, check if they have a session cart pending
        if not cart or not cart.get("items"):
            session_id = request.headers.get("X-Cart-Session-ID") or request.cookies.get("cart_session_id")
            if session_id:
                print(f"DEBUG: GetCart - User cart empty, checking session: {session_id}")
                session_cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
                if session_cart and session_cart.get("items"):
                    print("DEBUG: GetCart - Found items in session cart, serving that.")
                    cart = session_cart

    else:
        session_id = request.headers.get("X-Cart-Session-ID") or request.cookies.get("cart_session_id")
        print(f"DEBUG: GetCart - Session: {session_id}")
        if session_id:
            cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    
    if not cart:
        print("DEBUG: GetCart - Cart Not Found (Empty)")
        return {"items": []}
    
    print(f"DEBUG: GetCart - Found {len(cart.get('items', []))} items")
    return cart

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, request: Request, response: Response, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization, request)
    
    if user:
        print(f"DEBUG: AddToCart - User: {user.user_id}")
        cart = await db.carts.find_one({"user_id": user.user_id}, {"_id": 0})
        identifier = {"user_id": user.user_id}
    else:
        # Hybrid: Check Header first, then Cookie
        session_id = request.headers.get("X-Cart-Session-ID") or request.cookies.get("cart_session_id")
        if not session_id:
            session_id = f"cart_{uuid.uuid4().hex[:16]}"
            response.set_cookie(
                key="cart_session_id", 
                value=session_id, 
                max_age=7*24*60*60, 
                path="/", 
                secure=False, 
                samesite="lax"
            )
            print(f"DEBUG: AddToCart - New Session: {session_id}")
        else:
            print(f"DEBUG: AddToCart - Existing Session: {session_id}")
            
        cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
        identifier = {"session_id": session_id}
    
    if cart:
        items = cart.get("items", [])
        found = False
        for i, existing_item in enumerate(items):
            if existing_item["product_id"] == item.product_id and existing_item["size"] == item.size:
                items[i]["quantity"] += item.quantity
                found = True
                break
        
        if not found:
            items.append(item.model_dump())
        
        await db.carts.update_one(
            identifier,
            {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        cart_doc = {
            "cart_id": f"cart_{uuid.uuid4().hex[:12]}",
            **identifier,
            "items": [item.model_dump()],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.carts.insert_one(cart_doc)
    
    return {
        "success": True, 
        "session_id": session_id if not user else None
    }

@api_router.delete("/cart/remove/{product_id}/{size}")
async def remove_from_cart(product_id: str, size: str, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    
    if user:
        identifier = {"user_id": user.user_id}
    else:
        session_id = request.headers.get("X-Cart-Session-ID") or request.cookies.get("cart_session_id")
        if not session_id:
            raise HTTPException(status_code=404, detail="Cart not found")
        identifier = {"session_id": session_id}
    
    cart = await db.carts.find_one(identifier, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [item for item in cart.get("items", []) if not (item["product_id"] == product_id and item["size"] == size)]
    
    await db.carts.update_one(
        identifier,
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

@api_router.put("/cart/update")
async def update_cart_item(item: CartItem, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    
    if user:
        identifier = {"user_id": user.user_id}
    else:
        session_id = request.headers.get("X-Cart-Session-ID") or request.cookies.get("cart_session_id")
        if not session_id:
            raise HTTPException(status_code=404, detail="Cart not found")
        identifier = {"session_id": session_id}
    
    cart = await db.carts.find_one(identifier, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    for i, existing_item in enumerate(items):
        if existing_item["product_id"] == item.product_id and existing_item["size"] == item.size:
            items[i]["quantity"] = item.quantity
            break
    
    await db.carts.update_one(
        identifier,
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    print(f"DEBUG: create_order user detected: {user.user_id if user else 'None'}")
    
    body_data = await request.json()
    payment_method = body_data.get("payment_method", "stripe") # Default Stripe

    order_id = f"order_{uuid.uuid4().hex[:12]}"
    order_doc = order.model_dump()
    
    # Use 'confirmed' immediately for COD, 'pending' for Stripe
    status = "confirmed" if payment_method == "cod" else "pending"

    order_doc.update({
        "order_id": order_id,
        "user_id": user.user_id if user else None,
        "session_id": request.cookies.get("cart_session_id") if not user else None,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "payment_method": payment_method
    })
    await db.orders.insert_one(order_doc)
    
    if user:
        await db.carts.delete_one({"user_id": user.user_id})
    else:
        session_id = request.cookies.get("cart_session_id")
        if session_id:
            await db.carts.delete_one({"session_id": session_id})
    
    order_doc["created_at"] = datetime.fromisoformat(order_doc["created_at"])
    return Order(**order_doc)

@api_router.get("/orders")
async def get_orders(authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if user:
        if order.get("user_id") != user.user_id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        session_id = request.cookies.get("cart_session_id")
        if order.get("session_id") != session_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return order

@api_router.post("/payments/checkout")
async def create_checkout(request: Request, authorization: Optional[str] = Header(None)):
    body = await request.json()
    order_id = body.get("order_id")
    origin_url = body.get("origin_url")
    
    if not order_id or not origin_url:
        raise HTTPException(status_code=400, detail="order_id and origin_url required")
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    user = await get_current_user(authorization, request)
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/checkout"
    
    metadata = {
        "order_id": order_id,
        "user_id": user.user_id if user else "guest"
    }
    
    checkout_request = CheckoutSessionRequest(
        amount=float(order["total"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    payment_doc = {
        "payment_id": payment_id,
        "checkout_session_id": session.session_id,
        "order_id": order_id,
        "user_id": user.user_id if user else None,
        "amount": float(order["total"]),
        "currency": "usd",
        "status": "initiated",
        "payment_status": "pending",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(payment_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    payment = await db.payment_transactions.find_one({"checkout_session_id": session_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment["payment_status"] != "paid":
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        await db.payment_transactions.update_one(
            {"checkout_session_id": session_id},
            {"$set": {
                "status": status.status,
                "payment_status": status.payment_status
            }}
        )
        
        if status.payment_status == "paid":
            await db.orders.update_one(
                {"order_id": payment["order_id"]},
                {"$set": {"status": "confirmed"}}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "order_id": payment["order_id"]
        }
    
    return {
        "status": payment["status"],
        "payment_status": payment["payment_status"],
        "order_id": payment["order_id"]
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    webhook_response = await stripe_checkout.handle_webhook(body, signature)
    
    if webhook_response.payment_status == "paid":
        await db.payment_transactions.update_one(
            {"checkout_session_id": webhook_response.session_id},
            {"$set": {
                "status": webhook_response.event_type,
                "payment_status": webhook_response.payment_status
            }}
        )
        
        payment = await db.payment_transactions.find_one({"checkout_session_id": webhook_response.session_id}, {"_id": 0})
        if payment and payment.get("order_id"):
            await db.orders.update_one(
                {"order_id": payment["order_id"]},
                {"$set": {"status": "confirmed"}}
            )
    
    return {"success": True}

@api_router.get("/products/{product_id}/reviews")
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    return reviews

@api_router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, review: ReviewCreate, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    review_doc = review.model_dump()
    review_doc.update({
        "review_id": review_id,
        "product_id": product_id,
        "user_id": user.user_id,
        "user_name": user.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.reviews.insert_one(review_doc)
    
    return {"success": True, "review_id": review_id}

@api_router.get("/admin/orders")
async def get_all_orders(authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}")
async def update_order_status(order_id: str, status: str, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True}

@api_router.get("/")
async def root():
    return {"message": "RARE API"}

# --- Order Actions ---
@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user: raise HTTPException(status_code=401)
    
    order = await db.orders.find_one({"order_id": order_id})
    if not order: raise HTTPException(404, "Order not found")
    
    if order.get("user_id") != user.user_id and user.role != "admin":
         raise HTTPException(403, "Not authorized")

    if order["status"] in ["shipped", "delivered", "cancelled"]:
        raise HTTPException(400, "Cannot cancel order in this state")
        
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "cancelled"}})
    return {"success": True}

@api_router.put("/orders/{order_id}/return")
async def return_order(order_id: str, authorization: Optional[str] = Header(None), request: Request = None):
    user = await get_current_user(authorization, request)
    if not user: raise HTTPException(status_code=401)
    
    await db.orders.update_one(
        {"order_id": order_id}, 
        {"$set": {"status": "return_requested"}}
    )
    return {"success": True}

# --- Support System ---
@api_router.post("/support")
async def create_support_ticket(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization, request)
    if not user: raise HTTPException(status_code=401)
    
    body = await request.json()
    ticket = {
        "ticket_id": f"tkt_{uuid.uuid4().hex[:8]}",
        "user_id": user.user_id,
        "order_id": body.get("order_id"), # Optional
        "subject": body.get("subject"),
        "message": body.get("message"),
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.support.insert_one(ticket)
    return {"success": True}

@api_router.get("/admin/support")
async def get_support_tickets(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(authorization, request)
    if not user or user.role != "admin":
        raise HTTPException(403, "Admin only")
        
    tickets = await db.support.find().sort("created_at", -1).to_list(100)
    
    # Enrich with user details
    for t in tickets:
        u = await db.users.find_one({"user_id": t["user_id"]})
        t["user_email"] = u.get("email") if u else "Unknown"
        t["_id"] = str(t["_id"])
        
    return tickets

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def health_check():
    return {"status": "ok"}

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
