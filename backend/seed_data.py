import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_products():
    existing = await db.products.count_documents({})
    if existing > 0:
        print("Products already exist. Skipping seed.")
        return
    
    products = [
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "MIDNIGHT HOODIE",
            "description": "Premium heavyweight cotton blend hoodie. Oversized fit with dropped shoulders. Limited edition embroidered logo. Not for the ordinary.",
            "price": 89.00,
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1648320397369-85ab3fa368bc?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Hoodies",
            "stock": 50,
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "ELECTRIC JACKET",
            "description": "Technical nylon jacket with reflective details. Water-resistant shell. Adjustable drawstrings. Statement piece for the bold.",
            "price": 149.00,
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1489972536996-943907ea1cd8?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1551028719-00167b16eac5?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Jackets",
            "stock": 30,
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "VOID SWEATSHIRT",
            "description": "Minimalist crewneck sweatshirt. 100% organic cotton. Invisible seams. For those who understand less is more.",
            "price": 69.00,
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1499971442178-8c10fdf5f6ac?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Sweatshirts",
            "stock": 75,
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "OBSIDIAN TEE",
            "description": "Heavy weight cotton tee. Boxy fit. Raw hem detail. Perfect for layering or making statements.",
            "price": 45.00,
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "images": [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "T-Shirts",
            "stock": 100,
            "featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "CARGO PANTS BLACK",
            "description": "Technical cargo pants with multiple pockets. Tapered fit. Reinforced knees. Built for the modern explorer.",
            "price": 119.00,
            "sizes": ["28", "30", "32", "34", "36"],
            "images": [
                "https://images.unsplash.com/photo-1624378515195-6bbdb73dff1a?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Pants",
            "stock": 40,
            "featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "REBEL BOMBER",
            "description": "MA-1 style bomber jacket. Satin shell with custom lining. Patch details. Classic silhouette, RARE attitude.",
            "price": 179.00,
            "sizes": ["S", "M", "L", "XL"],
            "images": [
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?crop=entropy&cs=srgb&fm=jpg&q=85",
                "https://images.unsplash.com/photo-1544022613-e87ca75a784a?crop=entropy&cs=srgb&fm=jpg&q=85"
            ],
            "category": "Jackets",
            "stock": 25,
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result = await db.products.insert_many(products)
    print(f"Seeded {len(result.inserted_ids)} products")
    
    admin_user = await db.users.find_one({"email": "admin@rare.com"})
    if not admin_user:
        admin_doc = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@rare.com",
            "name": "RARE Admin",
            "picture": None,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        print("Created admin user")

if __name__ == "__main__":
    asyncio.run(seed_products())
    print("Database seeded successfully!")
