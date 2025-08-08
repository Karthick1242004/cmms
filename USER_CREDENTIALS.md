# 🔐 User Login Credentials

This document contains all user login credentials for the CMMS Dashboard system.

## 🎯 **SUPER ADMINISTRATORS**

**Primary Super Admin**
- **Name:** Karthick
- **Email:** `karthick1242004@gmail.com`
- **Password:** `12345678`
- **Role:** Super Administrator
- **Employee ID:** SUPER-ADMIN-001
- **Department:** Quality Assurance
- **Position:** Super Administrator

## 📋 Departments & User Structure

### 🏭 Quality Assurance Department
**Department Head (Department Admin)**
- **Name:** Dr. Emily Chen
- **Email:** `emily.chen@company.com`
- **Password:** `manager123`
- **Role:** Department Admin
- **Employee ID:** QA001
- **Position:** QA Department Head

**Team Lead**
- **Name:** David Kumar
- **Email:** `david.kumar@company.com`
- **Password:** `lead123`
- **Role:** Normal User (Team Lead)
- **Employee ID:** QA002
- **Position:** QA Team Lead

**Team Members**
- **Name:** Sarah Williams
- **Email:** `sarah.williams@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** QA003
- **Position:** Quality Inspector

- **Name:** James Johnson
- **Email:** `james.johnson@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** QA004
- **Position:** Quality Analyst

- **Name:** Lisa Martinez
- **Email:** `lisa.martinez@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** QA005
- **Position:** Compliance Specialist

---

### 🔧 Production Engineering Department
**Department Head (Department Admin)**
- **Name:** Michael Rodriguez
- **Email:** `michael.rodriguez@company.com`
- **Password:** `manager123`
- **Role:** Department Admin
- **Employee ID:** PE001
- **Position:** Production Engineering Head

**Team Lead**
- **Name:** Jennifer Brown
- **Email:** `jennifer.brown@company.com`
- **Password:** `lead123`
- **Role:** Normal User (Team Lead)
- **Employee ID:** PE002
- **Position:** Process Engineering Lead

**Team Members**
- **Name:** Robert Davis
- **Email:** `robert.davis@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** PE003
- **Position:** Production Engineer

- **Name:** Amanda Wilson
- **Email:** `amanda.wilson@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** PE004
- **Position:** Manufacturing Specialist

- **Name:** Daniel Taylor
- **Email:** `daniel.taylor@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** PE005
- **Position:** Process Optimization Analyst

---

### 💻 Information Technology Department
**Department Head (Department Admin)**
- **Name:** Alex Thompson
- **Email:** `alex.thompson@company.com`
- **Password:** `manager123`
- **Role:** Department Admin
- **Employee ID:** IT001
- **Position:** IT Department Head

**Team Lead**
- **Name:** Rachel Garcia
- **Email:** `rachel.garcia@company.com`
- **Password:** `lead123`
- **Role:** Normal User (Team Lead)
- **Employee ID:** IT002
- **Position:** Software Development Lead

**Team Members**
- **Name:** Christopher Lee
- **Email:** `christopher.lee@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** IT003
- **Position:** Full Stack Developer

- **Name:** Michelle White
- **Email:** `michelle.white@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** IT004
- **Position:** System Administrator

- **Name:** Kevin Anderson
- **Email:** `kevin.anderson@company.com`
- **Password:** `user123`
- **Role:** Normal User
- **Employee ID:** IT005
- **Position:** Cybersecurity Specialist

---

## 🔑 Quick Login Guide

### Super Administrators (Full System Access)
```
karthick1242004@gmail.com / 12345678 (Super Admin - Quality Assurance)
```

### Department Admins (Full Department Access)
```
emily.chen@company.com / manager123 (Quality Assurance)
michael.rodriguez@company.com / manager123 (Production Engineering)
alex.thompson@company.com / manager123 (Information Technology)
```

### Team Leads (Normal User with Lead Responsibilities)
```
david.kumar@company.com / lead123 (Quality Assurance)
jennifer.brown@company.com / lead123 (Production Engineering)
rachel.garcia@company.com / lead123 (Information Technology)
```

### Normal Users (Basic Access)
```
sarah.williams@company.com / user123 (Quality Assurance)
james.johnson@company.com / user123 (Quality Assurance)
lisa.martinez@company.com / user123 (Quality Assurance)
robert.davis@company.com / user123 (Production Engineering)
amanda.wilson@company.com / user123 (Production Engineering)
daniel.taylor@company.com / user123 (Production Engineering)
christopher.lee@company.com / user123 (Information Technology)
michelle.white@company.com / user123 (Information Technology)
kevin.anderson@company.com / user123 (Information Technology)
```

## 📝 Access Levels

- **Super Administrator:** Full system access, can manage all departments, employees, assets, and system settings
- **Department Admin:** Full access to department resources, can manage department assets, employees, and settings
- **Team Lead (Normal User):** Normal user access with team leadership responsibilities and specialized roles
- **Normal User:** Basic access to view and interact with department resources, submit tickets, and view assigned tasks

## 🛡️ Security Notes

- All passwords are hashed in the database using bcrypt
- Original passwords are stored here for testing purposes only
- In production, users should be required to change default passwords
- Consider implementing password complexity requirements
- Enable two-factor authentication for department admins

---

**Last Updated:** January 2025
**Generated By:** CMMS Database Seeding Script
