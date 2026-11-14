# Phoenix Tech Solutions · Enterprise Project & Intern Management System

An enterprise-grade, responsive, role-based Project and Intern Management System custom engineered for **Phoenix Tech Solutions**.

---

## 🚀 Live Access

- **Web Application Portal:** [http://localhost:5000](http://localhost:5000)
- **API Health Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Project Directory:** `C:\Users\Mahendra2005\.gemini\antigravity\scratch\phoenix-tech-solutions`

---

## 🔐 Authorized Administrator Accounts

In strict accordance with the security specifications, exactly two authorized Admin accounts exist in the entire application:

| Admin Designation | Full Name | Admin ID | Username | Registered Email | Initial Password |
|---|---|---|---|---|---|
| **Chief Executive Officer (CEO)** | Y D Mahendhra | `PTS-CEO-001` | `Mahendhra` | `mahendhra2005@gamil.com` | `ydm@1962` |
| **Chief Operating Officer (COO)** | P Praveen Kumar | `PTS-COO-001` | `Praveen` | `praveenpraba399@gamil.com` | `sasipraveen` |

> **Security Guarantee:**
> - All passwords are encrypted with industry-standard **bcrypt** (salt rounds = 10).
> - Passwords and hashes are never exposed in any API response, database view, log, or Excel export.
> - Registration of new admin accounts is disabled at the database and middleware layers.
> - Database seeding preserves exactly these two accounts and purges all demo accounts.

---

## 🛠️ Technology Stack & Architecture

- **Backend:** Node.js (v20.18.0) & Express.js
- **Database:** MongoDB 9.0 (Running on `127.0.0.1:27017/phoenix_tech_solutions`)
- **ODM:** Mongoose
- **File Storage:** MongoDB GridFS (for profile images and report deliverables)
- **Authentication:** JWT (JSON Web Tokens) with 7-day expiration & bcrypt hashing
- **Excel Export Engine:** ExcelJS (multi-sheet formatted workbooks with column styling)
- **Real-time Notifications:** Socket.IO for live in-app alerts and notifications
- **Automated Email Dispatch:** Nodemailer integration with branded responsive HTML email template for project assignments and delivery audit logs
- **Frontend:** Modern Enterprise Slate with Indigo & Electric Purple accents, Tailwind CSS, and custom glassmorphism

---

## 📋 Key Modules & Features

### 1. Role-Based Authentication Portal
- **Admin Login:** Supports Admin ID, Username, or Email with password hide/show toggle.
- **Intern Login:** Supports Intern ID, Username, or Email.
- **Staff Login:** Inactive in Phase 1 with a "Coming Soon" badge.

### 2. Admin Console & Dashboard Overview
- **8 Dynamic Metric Cards:**
  1. Total Projects (in repository)
  2. Active Projects (in progress & planning)
  3. Completed Projects (signed off)
  4. Total Interns (active directory)
  5. Available Interns (ready for assignment)
  6. Assigned Interns (active on projects)
  7. Pending Reports (awaiting review)
  8. Submitted Reports (cumulative submissions)
- **Active Projects Widget:** Real-time completion progress bars and team member avatars.
- **Pending Reports Widget:** Direct one-click review access for newly submitted deliverables.

### 3. Comprehensive Intern Registration & Profile System
- **Auto-generated Sequential IDs:** `PTS-INT-001`, `PTS-INT-002`, ...
- **20 Supported Intern Designations (Software & Hardware):**
  1. Software Development Intern
  2. Hardware Development Intern
  3. Full Stack Development Intern
  4. Frontend Development Intern
  5. Backend Development Intern
  6. Mobile Application Development Intern
  7. Web Development Intern
  8. AI & ML Intern
  9. Data Science Intern
  10. Cyber Security Intern
  11. IoT Development Intern
  12. Embedded Systems Intern
  13. Robotics Intern
  14. Electronics & Hardware Intern
  15. VLSI Design Intern
  16. Network Engineering Intern
  17. Cloud Computing Intern
  18. DevOps Intern
  19. UI/UX Design Intern
  20. Digital Marketing Intern
  + Custom Designation support
- **Multi-Select Areas of Interest:** Categorized under Software, AI & Data, Hardware & Electronics, Security, Cloud, Design, and Business.
- **Multi-Select Technical Skills:** Categorized under Programming Languages, Frontend, Backend, Databases, Hardware & Embedded, AI/ML, Cyber Security, Cloud/DevOps, and Design Tools.
- **Profile Image Upload:** Stored persistently in MongoDB GridFS.

### 4. Project Management & Assignment System
- Create, View, Edit, and Delete projects with auto-generated Project IDs (`PTS-PRJ-001`, `PTS-PRJ-002`, ...).
- Dedicated Project Details page with objectives, requirements, and assigned team members.
- Dedicated Assign Projects interface: Select project, view available interns, select multiple interns via checkboxes, and assign.
- **Automated Assignment Email:** Automatically dispatches branded HTML email notifications to each assigned intern's registered email address and logs delivery status in MongoDB (`EmailLog`).

### 5. Weekly & Monthly Reporting System
- Automatically calculates weekly reporting cycles dynamically based on calendar months (e.g. Week 1: 1st–7th, Week 2: 8th–14th, Week 3: 15th–21st, Week 4: 22nd–28th, Week 5: 29th–31st).
- Interns submit work summary, completed activities, progress slider (0–100%), challenges, next week plans, and attach files (PDF, Word, Excel, Images).
- Files stored in MongoDB GridFS with direct download links.
- Admins review, approve, reject, or request revisions with comments.

### 6. Excel Export System (ExcelJS)
- Download Interns Directory (`/api/export/interns`)
- Download Projects Directory (`/api/export/projects`)
- Download Project Assignments (`/api/export/assignments`)
- Download Weekly Reports (`/api/export/weekly-reports`)
- Download Monthly Summary (`/api/export/monthly-reports`)
