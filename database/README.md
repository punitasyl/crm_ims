# Database

Database scripts and migrations for CRM IMS.

## Structure

```
database/
├── migrations/     # Database migration scripts
├── seeds/          # Seed data scripts
└── schemas/        # Database schema definitions
```

## Setup

1. Create the database:
```sql
CREATE DATABASE crm_ims;
```

2. Run migrations:
```bash
npm run migrate
```

3. (Optional) Seed initial data:
```bash
npm run seed
```

## Database Schema

The system uses the following main tables:

- users
- customers
- contacts
- leads
- opportunities
- products
- categories
- warehouses
- inventory
- purchase_orders
- sales_orders
- order_items

