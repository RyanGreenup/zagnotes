
/**
 * Generate a UUID in the format used by the notes system
 * Creates a 32-character hexadecimal string without dashes
 * @returns A UUID string
 */
export function generateNoteUuid(): string {
  "use server";
  // Implementation of a simple UUID generator without external dependencies
  const hex = "0123456789abcdef";
  let uuid = "";

  // Generate 32 hex characters (128 bits)
  for (let i = 0; i < 32; i++) {
    uuid += hex[Math.floor(Math.random() * 16)];
  }

  return uuid;
}

