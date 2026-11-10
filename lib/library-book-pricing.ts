export const LIBRARY_BOOK_PRICE_PAISE = 4900;

export const PAID_LIBRARY_CATEGORIES = [
  "government-exam",
  "competitive-exam",
  "ssc-and-banking",
  "ssc",
  "banking",
  "cat",
] as const;

export function isPaidLibraryBook(
  categoryId?: string | null,
): boolean {
  return PAID_LIBRARY_CATEGORIES.some(
    (category) => category === categoryId,
  );
}

export function getLibraryBookPricePaise(
  categoryId?: string | null,
): number {
  return isPaidLibraryBook(categoryId)
    ? LIBRARY_BOOK_PRICE_PAISE
    : 0;
}

export function getLibraryBookPrice(
  categoryId?: string | null,
): string {
  return isPaidLibraryBook(categoryId) ? "₹49" : "Free";
}