# Smart Tutors: The Complete Academic Empowerment Platform

Smart Tutors is a production-grade educational ecosystem designed for a Vashi-based institute. It bridges the gap between traditional coaching and digital-first learning through a sophisticated Next.js architecture, MongoDB persistence, and an integrated AI mentoring system.

---

## 🌟 Key Features

### 🏛️ Public Engagement
- **Dynamic Landing Page**: Polished storytelling with animated reveals, institute branding, and achievement showcases.
- **Interactive Course Catalog**: Real-time course feed from MongoDB with smart client-side caching for instant browsing.
- **Achiever Section**: Animated "Placed Students" wall to build parental trust and institutional credibility.
- **Growth Metrics**: Real-time counters for student success, active enrollments, book downloads, and platform visitors.

### 🎓 Role-Aware Workspaces
- **Student Dashboard**: Personalized view of study priorities, revision schedules, notices, and test results.
- **Educator Desk**: High-visibility console for managing batches, issuing assessments, and coordinating learner feedback.
- **Admin Command Center**: Total oversight of institute operations, including user account management and standardized curriculum control.

### 🤖 SmartTutors AI Assistant
- **24/7 Mentoring**: Expert guidance on study plans and exam preparation (UPSC, Boards, JEE/NEET).
- **Document Analysis**: Students can upload study materials for the AI to analyze and provide contextual tutoring.
- **Context-Aware Sessions**: The AI remembers student profiles to provide personalized academic advice.

### 📚 Digital Resource Center
- **Cloud-Backed Library**: Integrated Vercel Blob storage for textbooks and revision guides.
- **Seamless Distribution**: Role-based access control for distributing materials to specific batches or individuals.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 & Vanilla CSS
- **Database**: MongoDB (Native Node Driver)
- **Cloud Storage**: Vercel Blob Integration
- **State Management**: React Hooks & Context
- **Deployment**: Vercel-optimized

---

## 🚀 Getting Started

### 1. Environment Configuration
Copy `example.env` to `.env.local` and provide your credentials:

```bash
MONGODB_URI=your-mongodb-uri
MONGODB_DB=smart_tutor
MONGODB_BOOTSTRAP_KEY=your-secure-key
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### 2. Database Initialization
Before running the app, bootstrap your MongoDB cluster with the standard dataset:
1. Start the development server: `npm run dev`
2. Initialize the database via the bootstrap route (see `OWNER_MANUAL.md` for details).

### 3. Development
```bash
npm install
npm run dev
```

---

## 📖 Documentation

- **[Owner & Admin Manual](./OWNER_MANUAL.md)**: A non-technical guide for institute owners to manage students, courses, and library content.
- **[Team Guide](./docs/TEAM_GUIDE.md)**: Project conventions, architecture patterns, and contribution rules for developers.
- **[Agent Instructions](./AGENTS.md)**: Specialized guidelines for AI-assisted development and maintenance.

---

## 🔐 Security & Integrity

- **Role-Based Access Control (RBAC)**: Secure API routes and dashboard sections.
- **User Integrity**: Enforced unique IDs and normalized email keys.
- **Data Protection**: Environment-protected secrets and session-based authentication.

---

## 📞 Contact & Support

**Smart Tutors Academy**
- **Location**: Sector 17, Vashi, Navi Mumbai
- **Phone**: +91 88504 47887
- **Email**: info@smarttutors.co.in
- **Website**: [smarttutors.co.in](https://smarttutors.co.in)

---
*Built with passion for academic excellence and student empowerment.*
