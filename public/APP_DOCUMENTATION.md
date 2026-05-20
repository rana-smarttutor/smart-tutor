# Smart Tutors Academy - App Capabilities & Routes

## Overview
Smart Tutors Academy is a comprehensive educational platform designed to provide disciplined preparation, sharp mentoring, and academic momentum. It serves school boards (CBSE/ICSE/SSC), UPSC foundation, JEE, NEET, and other competitive exams.

## User Roles
1.  **Student**: Access to courses, mock tests, digital library, and personal dashboard.
2.  **Educator**: Manage courses, upload materials, and interact with students.
3.  **Admin**: System-wide management, MongoDB status monitoring, and institute-level configurations.

## Application Routes

### Public Pages
-   `/`: **Home Page** - Landing page featuring institute metrics, recognized certifications, and entrance to the platform.
-   `/login`: **Authentication Page** - Secure gateway for all users.
-   `/contact`: **Contact Us** - Direct communication channel for admissions and inquiries.
-   `/courses`: **Course Catalog** - Browse through available educational programs.
-   `/digital-library`: **Resource Center** - Access to study materials (requires authentication for full access).
-   `/mock-test`: **Testing Arena** - Portal for taking mock examinations.

### Protected Dashboard
-   `/dashboard`: **User Hub** - Role-specific dashboard providing quick access to relevant tools and data.

### API Routes (Backend)
-   **Authentication**:
    -   `POST /api/auth/login`: Handles user authentication.
    -   `POST /api/auth/logout`: Clears user session.
    -   `GET /api/auth/session`: Retrieves current session state.
-   **Content Management**:
    -   `GET/POST /api/courses`: Fetch or create courses.
    -   `GET /api/courses/details`: Specific course information.
    -   `GET /api/digital-library`: Retrieve library items.
    -   `POST /api/upload-material`: Endpoint for educators to upload educational resources.
-   **Academics & Analytics**:
    -   `GET /api/tests`: List available tests.
    -   `GET/POST /api/mock-test`: Manage mock test sessions.
    -   `POST /api/test-submissions`: Handle student test answers.
    -   `GET/POST/PATCH /api/performance`: Manage student performance reports and faculty heuristics.
-   **Communication**:
    -   `GET/POST /api/messages`: Internal messaging system.
    -   `POST /api/smarttutors-chat`: AI-powered chatbot (integrates with Gemini/OpenAI).
-   **Administration**:
    -   `GET /api/admin/mongo-status`: Check database connectivity.
    -   `POST /api/admin/bootstrap`: System initialization endpoint.
    -   `GET/POST /api/institute`: Manage institute data.
    -   `GET /api/users`: User management endpoint.

## Key Capabilities

### 1. Student Performance Analytics
- **Data Visualization:** Interactive line, bar, and pie charts using `Recharts` for cross-device consistency.
- **Faculty Control:** Manual entry for weekly/monthly reports with custom teacher remarks.
- **Custom Heuristics:** Educators can define performance cutoffs (e.g., Outstanding, Weak) to drive dashboard alerts.
- **Professional Reports:** High-fidelity PDF generation with institution branding for parent sharing.
- **WhatsApp Integration:** Instant sharing of performance summaries.

### 2. AI-Powered Mentoring
- Integrated AI chatbot (`SmartTutorsAIChatbot`) providing 24/7 academic support.
- Powered by advanced LLMs to answer student queries and provide guidance.

### 3. Mock Test Engine
- Dynamic test generation and submission.
- Real-time performance tracking and feedback.
- Interactive "Mock Test Game" for engaging learning.

### 4. Digital Resource Management
- Centralized library for PDFs and study materials.
- Support for various file formats (PDF, Word) with parsing capabilities.

### 5. Results-Driven Analytics
- Real-time metrics tracking (Students mentored, Satisfaction rate, etc.).
- Placed students wall to showcase success stories.

### 6. Multi-Role Dashboard
- Tailored interfaces for Students, Educators, and Admins.
- Secure session management using custom auth logic.

## PWA & Mobile Readiness
- **Progressive Web App**: The app is PWA-ready with a manifest configuration.
- **Installable**: Can be installed on Android, iOS, and Desktop as a standalone application.
- **Android Integration**: Designed for easy conversion into a dedicated Android app (WebView-based or Hybrid).
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewing.

## Android App Development Notes
For the separate Android project:
- **Base URL**: `https://smarttutors.co.in` (or your deployment URL).
- **Primary Tooling**: Recommended to use Trusted Web Activity (TWA) or a high-performance WebView wrapper.
- **Deep Linking**: Configured to handle app routes directly from the web.
- **Permissions**: May require internet, camera (for uploading material), and storage access.
