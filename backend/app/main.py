from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
import traceback

from app.database import engine, Base
from app.routers import auth, customers, products, inventory, orders, leads, upload, warehouses, suppliers, purchase_orders, users
from app.config import settings

# Import all models to ensure they are registered with Base before creating tables
# This ensures all tables are created on first startup
from app.models import (
    User, Customer, Contact, Category, Product, Warehouse,
    Inventory, Supplier, PurchaseOrder, PurchaseOrderItem,
    SalesOrder, OrderItem, Lead, Opportunity
)

# Load environment variables
load_dotenv()

# Create database tables automatically on startup
# This will create all tables if they don't exist
print("=" * 50)
print("🚀 Starting CRM IMS Backend...")
print(f"📊 Database URL: {settings.DATABASE_URL[:50]}..." if len(settings.DATABASE_URL) > 50 else f"📊 Database URL: {settings.DATABASE_URL}")
print("🔨 Creating database tables...")

try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print(f"📋 Created {len(Base.metadata.tables)} tables:")
    for table_name in sorted(Base.metadata.tables.keys()):
        print(f"   ✓ {table_name}")
except Exception as e:
    print(f"❌ ERROR: Failed to create database tables!")
    print(f"   Error: {str(e)}")
    print(f"   Type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    # Don't exit - let the app start anyway, but log the error
    # This allows the app to start even if tables already exist

print("=" * 50)

app = FastAPI(
    title="CRM IMS API",
    description="Customer Relationship Management and Inventory Management System API",
    version="1.0.0"
)

# CORS middleware - Allow requests from frontend
# Must be added BEFORE routes to handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(warehouses.router, prefix="/api/warehouses", tags=["Warehouses"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])
app.include_router(purchase_orders.router, prefix="/api/purchase-orders", tags=["Purchase Orders"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])


@app.get("/")
async def root():
    return {"message": "CRM IMS API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Global exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler that ensures CORS headers are sent even on errors."""
    import traceback
    traceback.print_exc()
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin and origin in settings.cors_origins_list:
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
        headers=cors_headers
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with CORS headers."""
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin and origin in settings.cors_origins_list:
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers=cors_headers
    )

