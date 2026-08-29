# Desi Dine 🍛

**Authentic Pakistani Cuisine – Full Stack Restaurant Ordering System**

A complete full-stack restaurant web application built for **CloudExify Summer Internship 2026 – Project 4**.

This project includes a customer-facing ordering panel and a secure admin dashboard, powered by Supabase (Auth + PostgreSQL).

---

## 📌 Project Information

| Field              | Details                                      |
|--------------------|----------------------------------------------|
| Project Name       | Desi Dine                                    |
| Type               | Full Stack Application (User + Admin Panel)  |
| Tech Stack         | HTML, CSS, Bootstrap 5, Vanilla JavaScript, Supabase |
| Theme              | Pakistani Restaurant                         |
| Deployment         | Vercel                                       |
| Internship         | CloudExify Summer Internship 2026            |

---

## ✨ Features

### Customer Panel
- User Registration & Login (Supabase Auth)
- Browse menu with category filters and search
- Add to cart with quantity control
- Cart persistence using sessionStorage
- Place orders (saved live to Supabase)
- View personal order history with live status

### Admin Panel
- Secure Admin-only access (Role-based)
- Dashboard with live stats (Orders Today, Revenue, Pending Orders, Menu Items)
- View all customer orders
- Update order status (Pending → Preparing → Ready → Completed)
- Full Menu Management (Add, Edit, Delete, Toggle Availability)

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Bootstrap 5, Vanilla JavaScript
- **Backend:** Supabase (Authentication + PostgreSQL + Row Level Security)
- **Deployment:** Vercel

---

## 📁 File Structure
restaurant-app/
├── index.html          # Customer panel
├── admin.html          # Admin dashboard
├── login.html
├── register.html
├── css/
│   └── style.css
├── js/
│   ├── supabase.js
│   ├── auth.js
│   ├── menu.js
│   ├── cart.js
│   ├── orders.js
│   └── admin.js
├── assets/
├── vercel.json
├──screenshot/
   ├──webview
   ├──mobileview
└── README.md

---

## 🚀 How to Run Locally

1. Clone the repository
2. Open the folder in VS Code
3. Use Live Server to open `login.html` or `register.html`

---

## 🔐 Test Credentials

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@desidine.pk      | Admin@12345  |
| Customer | customer@desidine.pk   | Customer@12345|

> Note: Replace with your actual working credentials before submission.

---

## 🌐 Live Demo

**Live Vercel Link:**  
`https://your-vercel-link.vercel.app`

---

## 📷 Screenshots

- Mobile view
- Web view



---

## 👩‍💻 Developer

- **Name:** [Umm-e-Aimen]
- **Registration Number:** [CX-INT-2026-GEN-0483
- **Restaurant Concept:** Pakistani (Desi Dine)
- **Internship:** CloudExify Summer Internship 2026 – Month 2

---

## 📝 Notes

- All prices are in Pakistani Rupees (PKR)
- Images are loaded from external sources (Unsplash)
- Role-based access is implemented using Supabase profiles table
- Only Admin can manage menu and update order status

---

**© 2026 – Built for CloudExify Internship**