# Garment Production System API — DestajoPro

Production REST API for garment manufacturing operations. Automates production orders, cutting/batching, payroll calculation and inventory control. Powers destajopro.com

**Live:** https://destajopro.com | **Stack:** Node.js + Express + PostgreSQL + Sequelize + JWT

## 🚀 Features
- **Production Management:** Orders, cutting, batching, progress tracking
- **Payroll Automation:** Piece-rate (destajo) calculation with transactional integrity
- **Inventory Control:** Stock management with optimized PostgreSQL queries
- **Secure Auth:** JWT + HttpOnly Cookies + RBAC (3 roles: admin, supervisor, operator)
- **Deployment:** 【entity-AWS¦canonical_name=AWS】 EC2 + RDS + CI/CD + CloudWatch

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js, JavaScript, Sequelize ORM
- **Database:** PostgreSQL (migrations, indexes, transactions)
- **Auth:** JWT, HttpOnly Cookies, RBAC, bcrypt
- **DevOps:** 【entity-AWS¦canonical_name=AWS】 EC2, RDS, GitHub Actions, PM2

## 📦 Installation

```bash
git clone https://github.com/Charly-Cr/BACKEND-SISTEMA-CONFECCION.git
cd BACKEND-SISTEMA-CONFECCION
npm install
cp .env.example .env
# configure DB credentials
npx sequelize-cli db:migrate
npm run dev

Environment Variables

DB_HOST=localhost
DB_USER=postgres
DB_PASS=***
DB_NAME=garment_db
JWT_SECRET=***
NODE_ENV=development

Impact
Reduced manual processing time by 70% for production & payroll workflows
Designed optimized schemas with indexes and transactions for payroll integrity
Deployed and maintained on AWS for high availability

Author
Charly Cruz — Backend Developer | Lima, Peru
GitHub: @Charly-Cr