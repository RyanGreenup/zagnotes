/**
 * Generates a UUID v4
 * @returns A new UUID string
 */
export function generateUUID(): string {
  return require('crypto').randomUUID()
}

/**
 * Gets the current timestamp in milliseconds
 * @returns Current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now()
}
