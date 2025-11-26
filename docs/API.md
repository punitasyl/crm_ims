# API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Customers
- `GET /customers` - Get all customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Inventory
- `GET /inventory` - Get all inventory
- `POST /inventory/adjust` - Adjust inventory levels

### Orders
- `GET /orders` - Get all orders
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order by ID

### Leads
- `GET /leads` - Get all leads
- `POST /leads` - Create lead
- `PUT /leads/:id/convert` - Convert lead to opportunity

