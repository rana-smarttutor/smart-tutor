# Smart Tutors: Owner & Administrator Manual

Welcome to the Smart Tutors management platform. This manual provides a comprehensive guide for institute owners and administrators to effectively manage the Smart Tutors ecosystem, from student admissions to course delivery and AI-powered mentoring.

---

## Table of Contents

1. [Initial Platform Setup](#1-initial-platform-setup)
2. [Managing User Accounts](#2-managing-user-accounts)
3. [Course & Curriculum Management](#3-course--curriculum-management)
4. [Digital Library Operations](#4-digital-library-operations)
5. [Communication & Notice Board](#5-communication--notice-board)
6. [Assessments & Results](#6-assessments--results)
7. [Student Performance Analytics](#7-student-performance-analytics)
8. [SmartTutors AI Assistant](#8-smarttutors-ai-assistant)
9. [System Health & Maintenance](#9-system-health--maintenance)
10. [Testing & Verification Accounts](#10-testing--verification-accounts)

---

## 1. Initial Platform Setup

### Database Initialization (Bootstrap)
Before your first launch, the system needs to be initialized with the standard course library and institute identity.
*   **Step:** Navigate to your environment configuration and set the `MONGODB_BOOTSTRAP_KEY`.
*   **Action:** An administrator must trigger the bootstrap process (usually via a protected API call or during the first-time setup phase) to seed the database with required templates.

---

## 2. Managing User Accounts

The platform supports three distinct roles: **Admin**, **Educator**, and **Student**.

### Creating New Accounts
1.  Log in as an **Admin**.
2.  Navigate to the **Accounts** section in the sidebar.
3.  Click **"Add New User"**.
4.  Provide the student/staff name, email, and initial password.
5.  **Role Assignment:** 
    *   **Student:** Can access courses, tests, and the AI assistant.
    *   **Educator:** Can manage batches, create tests, and post results.
    *   **Admin:** Full access to institute governance and user control.

### Account Oversight
Admins can monitor account status (Active/Pending) and update user details or reset passwords directly from the Account Directory.

---

## 3. Course & Curriculum Management

Smart Tutors uses a **Standardized Course Library** to ensure consistency across the institute's branches.

### Adding/Editing Courses
1.  Navigate to **Courses** in the Admin dashboard.
2.  **Standardized Selection:** You must pick a course title from the pre-approved list (e.g., "Class 10 Board Preparation", "UPSC Foundation").
3.  **Details:** Once a course is selected, you can customize the **Summary**, **Description**, **Schedule**, and **Key Highlights**.
4.  **Public Visibility:** Changes made here are reflected immediately on the public "Courses" page for prospective parents and students.

---

## 4. Digital Library Operations

The Digital Library is your repository for textbooks, faculty notes, and mock papers.

### Uploading Materials
1.  Go to the **Library** section.
2.  Click **"Upload New Book"**.
3.  Upload the PDF file and provide a title, author/faculty name, and category.
4.  **Storage:** Files are securely stored on Vercel Blob via an integrated connection, ensuring your server remains fast and lightweight.
5.  **Access Control:** You can specify which roles (Students, Educators) can see specific resources.

---

## 5. Communication & Notice Board

Keep students and staff informed through the centralized Message Center.

### Sending Notices
1.  Go to **Messages** in the dashboard.
2.  Compose a new notice (e.g., "Holiday Announcement" or "Batch Timing Change").
3.  **Audience Filtering:** You can send a message to:
    *   The entire institute.
    *   Specific roles (e.g., only Students).
    *   Individual users for personalized feedback.
4.  **Live Updates:** Notices appear instantly in the recipient's "Recent notices" panel.

---

## 6. Assessments & Results

### Creating Tests
1.  Educators can use the **Test Studio** to create multiple-choice assessments.
2.  Define the title, summary, and add questions with options.
3.  **Assignment:** Assign the test to specific students or entire batches.

### Grading & Publishing
1.  When a student submits a test, it appears in the **Results** section.
2.  Educators review the submission, enter a score, and provide **Mentor Feedback**.
3.  **Automatic Notification:** Once you "Publish" a result, the student receives a direct notification on their dashboard.

---

## 7. Student Performance Analytics

The Performance Analytics system allows faculty to provide data-driven feedback and track student progress over time.

### Creating Performance Reports
1.  Navigate to the **Analytics Hub** in the sidebar (available for Educators and Admins).
2.  **Report Creator:** Use the form to enter:
    *   **Core Metrics:** Average Score, Batch Rank, Attendance, and Accuracy.
    *   **Feedback:** Strong/Weak subjects, Chapters needing focus.
    *   **Recommendations:** Personalized study advice and improvement plans.
3.  **Heuristics (Custom Cutoffs):**
    *   Click **"Configure Heuristics"** to set your own performance levels.
    *   Define thresholds for "Outstanding", "Excellent", "Good", etc.
    *   These settings dynamically update the colors and "Smart Badges" on the student's dashboard.

### Student Experience
*   Students see their reports under the **Performance** tab.
*   **Visualizations:** Interactive charts show marks trends, subject comparisons, and accuracy analysis.
*   **Downloads:** Students can click **"Download PDF"** to get a professional, institution-branded report for their parents.
*   **WhatsApp Sharing:** A quick share button allows sending a summary of the report to parent WhatsApp numbers.

---

## 8. SmartTutors AI Assistant

The AI Assistant is a key differentiator for your institute, providing 24/7 academic support.

*   **Student Support:** Students can ask the AI for study plans, subject explanations, or help with uploaded materials.
*   **Institute Info:** The AI is pre-trained to answer questions about your institute's location, contact details, and courses.
*   **Tutoring:** It specializes in board exams and competitive preparation (UPSC, JEE, NEET).

---

## 9. System Health & Maintenance

### Monitoring Connectivity
*   Admins can check the **API Scope** and **Mongo Status** indicators on their dashboard to ensure all systems (Database, Auth, AI) are operational.
*   The "Live Clock" ensures all campus activities are synchronized with the server time.

---

## 10. Testing & Verification

Test accounts are created during database bootstrap. Ask your technical lead for the current set of demo credentials.

### Verification Steps:
1.  **Faculty:** Log in, go to "Analytics Hub", and create a report for a student.
2.  **Student:** Log in, go to "Performance", and verify the charts and PDF download functionality.

---

## 11. Production Deployment

### Deploying to Vercel
1. Connect your Git repository to [Vercel](https://vercel.com).
2. Configure the following **Environment Variables** in the Vercel dashboard:

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name |
| `MONGODB_BOOTSTRAP_KEY` | Secret key for bootstrap endpoint |
| `SESSION_SECRET` | Random 64-char string for session signing |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `RAZORPAY_KEY_ID` | Razorpay payment gateway key |
| `RAZORPAY_KEY_SECRET` | Razorpay payment gateway secret |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |

3. Deploy — the included `vercel.json` handles routing, headers, and CORS.

### Running Tests
```bash
# Unit tests (validation, auth)
npm test

# API health checks (requires server running)
npm run test:api

# Load test (20 concurrent users × 10 requests each)
npm run test:stress

# Security audit (XSS, injection, path traversal, CORS)
npm run test:security
```

---

**Support Contact:**
For technical issues or advanced configuration, please contact your technical lead.
