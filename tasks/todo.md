# Fee Section Rework — Plan

## Goal
Add proper payment status management (paid/unpaid/partial) with transaction detail tracking for non-cash payments, and enhance receipts with all payment details.

---

## Step 1: Extend Types — Add Transaction Detail Fields

**File: `lib/types.ts`**

- Add `PaymentTransaction` type:
  ```ts
  export type PaymentTransaction = {
    paidAmount: number;
    paidDate: string;
    paymentMode: "Cash" | "UPI" | "Bank Transfer" | "Card" | "Online Payment" | "Cheque";
    transactionId?: string;       // UPI ref, NEFT/RTGS ref, card auth code
    chequeNumber?: string;        // if Cheque
    bankName?: string;            // bank name
    accountLast4?: string;        // last 4 digits of account
    notes?: string;
    recordedBy: string;           // admin/educator who recorded it
    recordedAt: string;           // ISO timestamp
  };
  ```

- Extend `FeeInvoice` type:
  - Add `transactions: PaymentTransaction[]` (payment history log)
  - Keep existing `paidAmount`, `status`, `paymentMode` as computed/display fields

- Extend `FeeInstallment` type:
  - Add `transactions: PaymentTransaction[]`

---

## Step 2: Update Data Store — Persist & Compute Transaction Data

**File: `lib/data-store.ts`**

- Update `createFeeInvoice()` to accept and store `transactions[]`
- Update `updateFeeInvoice()` to:
  - Accept new `transaction` payload (append to `transactions[]`)
  - Auto-compute `paidAmount` = sum of all transaction `paidAmount`s
  - Auto-compute `status` based on paidAmount vs amount (0=paid, <amount=partial, unpaid)
  - Auto-set `paymentMode` from latest transaction
- Update `updateFeeInstallmentPlan()` similarly for installment-level transactions
- Fix `getStudentDirectory()` to compute `feesStatus` from actual invoice data instead of hardcoded `"none"`

---

## Step 3: Update API Routes — Accept Transaction Details

**File: `app/api/invoices/[invoiceId]/route.ts`**

- Extend PATCH to accept a `transaction` object (not just raw `paidAmount`/`status`)
- Auto-compute status and paidAmount server-side from transactions

**File: `app/api/fee-installments/[planId]/route.ts`**

- Extend PATCH to accept transaction details per installment

---

## Step 4: Add "Record Payment" UI to Invoice Manager

**File: `components/invoice-manager.tsx`**

- Add a "Record Payment" button in the action column for unpaid/partial invoices (admin only)
- Add a `RecordPaymentModal` with:
  - Paid Amount (₹) — pre-fills remaining balance
  - Payment Date — defaults to today
  - Payment Mode dropdown (Cash, UPI, Bank Transfer, Card, Online Payment, Cheque)
  - **Conditional fields shown only when mode is NOT "Cash":**
    - Transaction ID / Reference Number
    - Bank Name
    - Cheque Number (only when Cheque selected)
    - Account Last 4 Digits
  - Notes
- On submit: PATCH invoice with new transaction, auto-compute status

---

## Step 5: Enhance Receipt HTML with Transaction Details

**File: `components/invoice-manager.tsx` — `downloadReceipt()`**

- Add a "Payment Details" section in the receipt HTML:
  - For each transaction: Date, Amount, Mode, Transaction ID (if non-cash), Bank, Cheque No (if cheque)
  - For partial: show total paid, balance due
  - For unpaid: show "Payment Pending"
- Add payment status badge to receipt header (PAID / PARTIAL / UNPAID / OVERDUE)
- Show transaction reference numbers prominently for non-cash payments

---

## Step 6: Add "Record Payment" to Fee Installment Manager

**File: `components/fee-installment-manager.tsx`**

- Add inline "Record Payment" button per installment row
- Reuse same transaction detail modal pattern (Cash vs non-cash conditional fields)
- Auto-compute installment status and plan totals

---

## Step 7: Fix Student Directory Fee Status

**File: `lib/data-store.ts` — `getStudentDirectory()`**

- Query `feeInvoices` collection per student
- Compute `feesStatus`:
  - `"paid"` if all invoices have status "paid"
  - `"partial"` if any invoice has status "partial" or mix of paid/unpaid
  - `"unpaid"` if all invoices are unpaid/overdue
  - `"none"` if no invoices exist

---

## Files to Modify
1. `lib/types.ts` — new PaymentTransaction type, extend FeeInvoice & FeeInstallment
2. `lib/data-store.ts` — transaction logic, student directory fee status
3. `app/api/invoices/[invoiceId]/route.ts` — accept transaction payloads
4. `app/api/fee-installments/[planId]/route.ts` — accept installment transactions
5. `components/invoice-manager.tsx` — Record Payment UI + enhanced receipt
6. `components/fee-installment-manager.tsx` — Record Payment UI per installment

## Verification
- `npm run build` (or `next build`) to verify no type errors
- Manual: create invoice → record partial payment → verify status changes to "partial"
- Manual: record full payment → verify status changes to "paid"
- Manual: download receipt → verify transaction details appear
- Manual: non-cash payment → verify transaction ID/bank fields appear
- Manual: student directory → verify feesStatus computed correctly
