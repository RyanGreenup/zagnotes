
/**
 * Format an error into a standard error response
 * @param error The error object
 * @param operation Description of the operation that failed
 * @returns Standardized error response
 */
export function formatErrorResponse(error: unknown, operation: string): DbResponse {
  return {
    success: false,
    message: `Error ${operation}: ${error instanceof Error ? error.message : String(error)}`,
  };
}
