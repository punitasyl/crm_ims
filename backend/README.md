# CRM IMS Backend API

FastAPI backend for the CRM IMS system.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
# Create database
createdb crm_ims

# Run migrations (when using Alembic)
alembic upgrade head
```

5. Create an admin user:
```bash
python create_admin.py
```
This will prompt you to enter:
- Username
- Email
- First name
- Last name
- Password

6. Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the run script:
```bash
python run.py
```

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (OAuth2)
- `GET /api/auth/me` - Get current user info

### Customers
- `GET /api/customers` - Get all customers (with pagination)
- `GET /api/customers/{id}` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer
- `GET /api/customers/{id}/contacts` - Get customer contacts
- `GET /api/customers/{id}/orders` - Get customer orders

### Products
- `GET /api/products` - Get all products (with pagination)
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/category/{category_id}` - Get products by category

### Inventory
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/warehouse/{warehouse_id}` - Get inventory by warehouse
- `GET /api/inventory/product/{product_id}` - Get inventory by product
- `POST /api/inventory/adjust` - Adjust inventory
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/reports` - Get inventory reports

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}/status` - Update order status
- `DELETE /api/orders/{id}` - Delete order

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/{id}` - Get lead by ID
- `POST /api/leads` - Create lead
- `PUT /api/leads/{id}` - Update lead
- `DELETE /api/leads/{id}` - Delete lead
- `PUT /api/leads/{id}/convert` - Convert lead to opportunity

## Database Models

- User
- Customer
- Contact
- Lead
- Opportunity
- Product
- Category
- Warehouse
- Inventory
- PurchaseOrder
- SalesOrder
- OrderItem

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The token is obtained from the `/api/auth/login` endpoint.

## Technology Stack

- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL
- Pydantic (Validation)
- Python-JOSE (JWT)
- Passlib (Password hashing)
