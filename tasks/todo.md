# Plan: Remake Student Fee Payment Receipt Format

## Goal
Redesign the fee receipt popup to match the new professional design. The receipt appears when clicking "Receipt" in student, parent, and admin dashboards.

## File to Modify
- `components/student-fee-receipts-view.tsx` — rewrite the `downloadInvoiceReceipt()` function HTML (lines 55–243)

## Design Spec

### Header
- Full-width `stpl.jpeg` banner image (entire receipt width)
- Address info below the banner (not side-by-side)

### Student Details (2-column grid)
Fields available on FeeInvoice:
1. Student Name (`studentName`) ✓
2. Parent Name (`parentName`) ✓
3. Class / Board (`classCourse`) ✓
4. Enrollment No (derived from `studentId`) ✓
5. Academic Year (`academicYear`) ✓
6. Mobile No (`mobileNo`) ✓
7. Payment Mode (`paymentMode`) ✓

**Removed** (not on FeeInvoice / user said remove): Email, Address, Batch Timing, Course Duration, Admission Type

### Fee Details Table
Columns: Sr No | Particulars | Month | Due Date | Amount (₹) | Paid (₹) | Balance (₹)
- Dark navy (#00072d) header
- Amount in words below table

### Payment Summary
- Status badge (PAID/PARTIAL/UNPAID/OVERDUE) with color pill
- Total Paid, Balance Due, Due Date, Print Date

### Payment History Table
Columns: # | Date | Amount (₹) | Mode | Transaction Ref | Bank
- Gray header

### Footer
- Left: Terms + "FEES NOT REFUNDABLE" + thank you
- Right: Signature block with founder-sign.png
- **NO QR code**

## Steps
1. Rewrite `receiptHtml` in `downloadInvoiceReceipt()` with new design
2. Add `numberToWords()` helper for amount-in-words
3. Map all FeeInvoice fields to new layout
4. Remove QR code entirely
5. Verify receipt renders correctly
