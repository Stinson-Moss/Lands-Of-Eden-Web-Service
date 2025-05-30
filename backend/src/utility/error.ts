export function handleError(error: any) {
  console.error('Error:', error);
  return {
    error: true,
    message: error.message || 'An error occurred',
    details: error
  };
}

export function isDatabaseError(error: any): error is { code: string } {
  return error && typeof error.code === 'string';
}

export function handleDatabaseError(error: any) {
  if (isDatabaseError(error)) {
    switch (error.code) {
      case 'ER_DUP_ENTRY':
        return {
          error: true,
          message: 'A record with this information already exists',
          code: error.code
        };
      case 'ER_NO_REFERENCED_ROW':
        return {
          error: true,
          message: 'Referenced record does not exist',
          code: error.code
        };
      default:
        return {
          error: true,
          message: 'Database error occurred',
          code: error.code
        };
    }
  }
  return handleError(error);
} 