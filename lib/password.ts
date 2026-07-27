import "server-only";

import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

const BCRYPT_HASH_PATTERN =
  /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isBcryptPassword(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value);
}

function comparePlainTextPassword(
  enteredPassword: string,
  storedPassword: string,
): boolean {
  const enteredBuffer = Buffer.from(enteredPassword, "utf8");
  const storedBuffer = Buffer.from(storedPassword, "utf8");

  if (enteredBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(enteredBuffer, storedBuffer);
}

/**
 * Supports both password states currently present in MongoDB:
 *
 * 1. Old plain-text passwords
 * 2. Bcrypt password hashes
 */
export async function verifyPassword(
  enteredPassword: string,
  storedPassword: string,
): Promise<boolean> {
  if (!enteredPassword || !storedPassword) {
    return false;
  }

  if (isBcryptPassword(storedPassword)) {
    try {
      return await bcrypt.compare(
        enteredPassword,
        storedPassword,
      );
    } catch {
      return false;
    }
  }

  return comparePlainTextPassword(
    enteredPassword,
    storedPassword,
  );
}

/**
 * Hashes new plain-text passwords.
 * Existing bcrypt hashes are returned unchanged to avoid double hashing.
 */
export async function hashPassword(
  password: string,
): Promise<string> {
  if (isBcryptPassword(password)) {
    return password;
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}