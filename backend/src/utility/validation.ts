// validation.ts
// Contains validation utilities for checking input data, ensuring it meets required formats or business rules.
export function validateRequiredFields(data: any, fields: string[]) {
  const missingFields = fields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}