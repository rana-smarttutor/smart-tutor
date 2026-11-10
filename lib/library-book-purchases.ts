import "server-only";

import { getMongoDatabase } from "@/lib/mongodb";

export type LibraryBookPurchase = {
  studentId: string;
  bookPathname: string;
  amountPaise: number;
  currency: "INR";
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: "paid";
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const COLLECTION = "digital_library_book_purchases";

export async function getLibraryBookPurchaseCollection() {
  const database = await getMongoDatabase();

  return database.collection<LibraryBookPurchase>(COLLECTION);
}

export async function prepareLibraryBookPurchaseIndexes() {
  const collection = await getLibraryBookPurchaseCollection();

  await collection.createIndex(
    { studentId: 1, bookPathname: 1 },
    {
      unique: true,
      name: "unique_student_library_book_purchase",
    },
  );

  await collection.createIndex(
    { razorpayOrderId: 1 },
    {
      unique: true,
      name: "unique_library_book_razorpay_order",
    },
  );

  await collection.createIndex(
    { razorpayPaymentId: 1 },
    {
      unique: true,
      name: "unique_library_book_razorpay_payment",
    },
  );
}

export async function hasPurchasedLibraryBook(
  studentId: string,
  bookPathname: string,
): Promise<boolean> {
  if (!studentId || !bookPathname) {
    return false;
  }

  const collection = await getLibraryBookPurchaseCollection();

  const purchase = await collection.findOne(
    {
      studentId,
      bookPathname,
      status: "paid",
      amountPaise: 4900,
      currency: "INR",
    },
    {
      projection: { _id: 1 },
    },
  );

  return Boolean(purchase);
}