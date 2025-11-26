# 🏢 CRM IMS - Customer Relationship Management & Inventory Management System

<div align="center">

**Modern web system for managing customer relationships and warehouse operations with tile management support**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white)](https://mui.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

</div>

---

## 📋 Project Description

**CRM IMS** is a comprehensive management system for companies working with tiles and ceramic materials. The system combines CRM capabilities (customer management, leads, sales) and IMS (inventory management, warehouses, procurement).

### 🎯 Key Features

- **Customer Management** — complete customer base lifecycle management
- **Product Management** — product catalog with images and specifications
- **Inventory Management** — automatic stock management with unit conversion support (pieces/m²)
- **Orders** — creation and tracking of sales and purchase orders
- **Lead Management** — sales funnel from lead to deal closure
- **Role-Based Access Control** — 5 access levels with detailed permissions
- **Automatic Unit Conversion** — conversion between pieces and square meters

---

## 🚀 Technology Stack

### Backend
- **FastAPI** — modern web framework for building APIs
- **SQLAlchemy** — ORM for database operations
- **SQLite** — lightweight database
- **JWT** — authentication and authorization
- **Pydantic** — data validation
- **Python 3.10+**

### Frontend
- **Next.js 14** — React framework with App Router
- **TypeScript** — typed JavaScript
- **Material-UI (MUI)** — UI components
- **Zustand** — state management
- **Axios** — HTTP client
- **React Hook Form** — form handling

---

## ✨ Main Features

### 📦 Product Management Module
- Create and edit products
- Image upload
- Size specification (length × width in mm)
- Category management
- Automatic tile area calculation

### 📊 Inventory Management Module
- Stock tracking by warehouse
- Automatic unit conversion (pieces ↔ m²)
- Product reservation
- Change history
- Stock adjustment

### 🛒 Orders Module
- Sales order creation
- Purchase order creation
- Order status tracking
- Automatic cost calculation
- Unit of measurement support

### 👥 Customer Management Module
- Complete customer information
- Contact management
- Interaction history
- Customer statuses

### 🎯 Lead Management Module
- Lead creation and tracking
- Sales funnel
- Lead to customer conversion
- Opportunity management

### 🏭 Warehouse Management Module
- Warehouse creation and management
- Stock tracking by warehouse
- Product transfers

### 👤 Role-Based Access Control System

The system supports 5 roles with different access levels:

| Role | Description | Main Permissions |
|------|-------------|------------------|
| **ADMIN** | Administrator | Full access to all functions, user management |
| **MANAGER** | Manager | Sales management, customers, report viewing |
| **SALES** | Salesperson | Order creation, customer and lead management |
| **WAREHOUSE** | Warehouse Worker | Inventory management, procurement, warehouses |
| **VIEWER** | Viewer | Read-only access without editing capabilities |

---

## 📁 Project Structure

```
CRM_IMS/
├── backend/                 # Backend API (FastAPI)
│   ├── app/
│   │   ├── core/           # Core components (security, dependencies)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API routes
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── database.py    # Database configuration
│   │   └── main.py         # Application entry point
│   ├── uploads/            # Uploaded files
│   ├── requirements.txt    # Python dependencies
│   └── create_admin.py     # Admin creation script
│
├── frontend/                # Frontend (Next.js)
│   ├── src/
│   │   ├── app/            # Application pages
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities and API client
│   │   └── store/         # Zustand store
│   └── package.json       # Node.js dependencies
│
├── database/               # Database scripts
│   ├── migrations/         # Migrations
│   └── seeds/             # Seed data
│
└── docs/                  # Documentation
    ├── API.md             # API documentation
    └── ROLES.md           # Role descriptions
```

---

## 🛠️ Installation & Setup

### Requirements

- **Python 3.10+**
- **Node.js 18+**
- **npm** or **yarn**

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd CRM_IMS
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Create Administrator

```bash
python create_admin.py
```

The script will prompt for:
- Username
- Email
- First name
- Last name
- Password

### Step 4: Start Backend Server

```bash
# Start with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
- **API Documentation (Swagger)**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Step 5: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Step 6: Start Frontend

```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## 📖 Usage

### First Login

1. Open `http://localhost:3000`
2. Log in with the administrator credentials created in Step 3
3. After login, you'll be redirected to the main page (Dashboard)

### Main Operations

#### Product Management
1. Navigate to **"Products"** section
2. Click **"Add Product"**
3. Fill in product information (name, price, dimensions)
4. Upload product image
5. Save

#### Create Order
1. Navigate to **"Orders"** section
2. Click **"Create Order"**
3. Select a customer
4. Add products to the order
5. Select unit of measurement (pieces or m²) — the system will automatically recalculate quantities
6. Save the order

#### Inventory Management
1. Navigate to **"Inventory"** section
2. Select product and warehouse
3. Choose adjustment type (addition, deduction, set)
4. Enter quantity in selected unit of measurement
5. The system will automatically recalculate values when switching units

---

## 🔐 API Documentation

After starting the backend server, full API documentation is available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Main Endpoints

#### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — User login
- `GET /api/auth/me` — Get current user information
- `POST /api/auth/forgot-password` — Password recovery
- `POST /api/auth/change-password` — Change password

#### Customers
- `GET /api/customers` — List customers (with pagination)
- `POST /api/customers` — Create customer
- `GET /api/customers/{id}` — Get customer
- `PUT /api/customers/{id}` — Update customer
- `DELETE /api/customers/{id}` — Delete customer

#### Products
- `GET /api/products` — List products
- `POST /api/products` — Create product
- `POST /api/products/{id}/upload-image` — Upload image
- `PUT /api/products/{id}` — Update product
- `DELETE /api/products/{id}` — Delete product

#### Inventory
- `GET /api/inventory` — List inventory records
- `POST /api/inventory/adjust` — Adjust stock
- `PUT /api/inventory/{id}` — Update record

#### Orders
- `GET /api/orders` — List orders
- `POST /api/orders` — Create order
- `PUT /api/orders/{id}/status` — Update order status

Detailed documentation is available in [docs/API.md](docs/API.md)

---

## 🎨 Implementation Features

### Automatic Unit Conversion

The system automatically converts quantities between pieces and square meters based on tile dimensions:

- **Area of 1 tile** = (length × width) / 1,000,000 m²
- **Pieces per 1 m²** = 1 / area_of_1_tile
- **Unit conversion** happens automatically in real-time when switching units

### Role-Based Access Control

All endpoints are protected by role checks. The system uses JWT tokens for authentication and checks access permissions at the API level.

### File Upload

The system supports product image uploads with automatic saving to the `backend/uploads/products/` directory.

---

## 🧪 Development

### Development Mode

Both Backend and Frontend support hot-reload for convenient development:

```bash
# Backend (in backend directory)
uvicorn app.main:app --reload

# Frontend (in frontend directory)
npm run dev
```

### Code Structure

- **Backend**: Follows Clean Architecture principles with layer separation (models, routers, schemas)
- **Frontend**: Uses component-based approach with reusable components
- **Typing**: Full typing with TypeScript and Pydantic

---

## 📝 License

This project is created for portfolio purposes. All rights reserved.

---

## 👨‍💻 Author

Developed to demonstrate full-stack development skills.

---

## 🌐 Deployment

This project can be deployed to free hosting platforms. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy Options

- **Railway** (Recommended) - Free tier with $5 credits/month
- **Render** - Free tier with limitations
- **Vercel** - Excellent for Next.js frontend

### Quick Start

1. **Backend**: Deploy to Railway or Render
2. **Frontend**: Deploy to Vercel
3. Set environment variables (see DEPLOYMENT.md)
4. Update CORS settings with your frontend URL

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🔮 Future Plans

- [ ] Reports and analytics system
- [ ] Integration with external accounting systems
- [ ] Mobile application
- [ ] Notification system
- [ ] Data export to Excel/PDF
- [ ] Multi-language support

---

<div align="center">

**Thank you for your attention! 🚀**

If you have any questions or suggestions, please create an issue in the repository.

</div>
