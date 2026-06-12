PIXS Printing Shop
A full-stack e-commerce platform for a custom printing business specializing in screen printing and custom merchandise.

🏪 About PIXS
PIXS Printing Shop is a Philippine-based online custom printing service that allows customers to design and order personalized products with screen printing technology.

What We Do
Custom Screen Printing - High-quality screen printing for various apparel and merchandise
Custom Merchandise - T-shirts, polo shirts, tote bags, and other branded items
Design Services - Customers can upload their own designs or work with templates
Bulk Orders - Catering to corporate events, teams, organizations, and businesses
Products Offered
Category	Examples
Apparel	T-shirts, Polo shirts, Hoodies, Jackets
Bags	Tote bags, Drawstring bags, Laptop sleeves
Accessories	Caps, Bandanas, Lanyards
Office	ID lanyards, Custom stickers, Promotional items
Events	Team shirts, Event merchandise, Souvenirs
🎯 Our Goals
Accessible Custom Printing - Make professional screen printing available to everyone
Easy Online Ordering - Simple, intuitive process from design to delivery
Quality Products - Deliver premium quality prints with fast turnaround
Affordable Pricing - Competitive rates for individuals and businesses
Seamless Experience - From browsing to doorstep delivery
💡 Key Features
For Customers
Product Catalog - Browse products by category with variants (size, color)
Design Upload - Upload artwork/designs for custom printing
Screenplate Setup - Professional color separation for multi-color prints
Cart & Checkout - Easy ordering with address management
Order Tracking - Real-time order status updates
Multiple Addresses - Save and manage delivery addresses
Multiple Contacts - Store multiple contact numbers
For Admin/Staff
Dashboard - Overview of orders, customers, and sales
Order Management - Process, update, and track orders
Screenplate Queue - Manage screen printing workflow
Customer Management - View and manage customer accounts
Refund Processing - Handle refund requests
🛠 Tech Stack
Backend
Framework: Laravel 11 (PHP 8.2+)
Database: MySQL 8.0
Authentication: Laravel Sanctum (API tokens)
Payment: Xendit (Payment gateway)
File Storage: Local/S3 compatible
Frontend
Framework: React 18 + TypeScript
Build Tool: Vite
Routing: React Router v6
State Management: Zustand
Styling: Tailwind CSS
Animations: Framer Motion
Forms: React Hook Form + Zod
Libraries Used
Address: @aivangogh/ph-address (Philippine address dropdowns)
Payments: react-google-recaptcha (Spam protection)
UI Components: Lucide React, React Icons, React Select
📁 Project Structure
PIXS-PRINTING/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/    # API Controllers
│   │   │   └── Admin/           # Admin controllers
│   │   ├── Models/              # Eloquent models
│   │   └── Services/            # Business logic
│   ├── database/
│   │   └── migrations/          # Database schema
│   ├── routes/                  # API routes
│   └── config/                  # App configurations
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/           # Auth-related components
│   │   │   ├── common/         # Common components
│   │   │   └── Footer/         # Footer component
│   │   ├── pages/              # Page components
│   │   │   ├── Auth/          # Authentication pages
│   │   │   ├── Settings/      # User settings
│   │   │   └── Transactions/ # Checkout pages
│   │   ├── views/              # View components (auth views)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities (axios, etc.)
│   │   ├── store/             # Zustand stores
│   │   └── context/           # React contexts
│   └── public/                 # Static assets
│
└── agents/                     # AI Agent configurations
    └── skills/                 # Custom agent skills
🔄 Order Flow
1. Customer browses products
2. Selects product, variants, colors
3. Uploads design or chooses from templates
4. Adds to cart with screenplate setup
5. Proceeds to checkout
6. Selects delivery method and address
7. Pays via Xendit (GCash, Card, Bank Transfer)
8. Order created with PENDING status
9. Xendit callback confirms payment
10. Staff processes order (SCREENPLATE → PRINTING → SHIPPING)
11. Order delivered to customer
🔐 Security Features
Authentication: Token-based auth with Sanctum
Password: Bcrypt hashing with UTF-8 support
Verification: 6-digit code via email for sensitive actions
Validation: Zod (frontend) + Laravel validation (backend)
Rate Limiting: Protection against spam/abuse
📧 Contact Information
Email: support@pixsprinting.com
Phone: +63 9XX XXX XXXX
Address: Philippines
🚀 Getting Started
Prerequisites
PHP 8.2+
Node.js 18+
MySQL 8.0
Composer
Backend Setup
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
Frontend Setup
cd frontend
npm install
npm run dev
📝 License
This project is proprietary software for PIXS Printing Shop.

🤝 Contributing
Contact the development team for collaboration inquiries.

Built with ❤️ for custom printing needs3