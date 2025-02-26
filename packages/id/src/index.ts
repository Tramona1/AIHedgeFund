import { nanoid } from 'nanoid';

// Define ID types
export type ID = string;

// Define ID prefixes for different entities
export enum IDPrefix {
  USER = 'user_',
  STOCK_UPDATE = 'update_',
  AI_TRIGGER = 'trigger_',
}

// Generate a new ID with the specified prefix and optional length
export function generateId(prefix: IDPrefix, length: number = 12): ID {
  return `${prefix}${nanoid(length)}`;
}

// Validate if an ID has the expected format and prefix
export function validateId(id: string, prefix: IDPrefix): boolean {
  return id.startsWith(prefix) && id.length > prefix.length;
}

// Extract the base ID without the prefix
export function extractBaseId(id: string, prefix: IDPrefix): string | null {
  if (!validateId(id, prefix)) {
    return null;
  }
  return id.substring(prefix.length);
}

// Default export
export default {
  generateId,
  validateId,
  extractBaseId,
  IDPrefix,
}; 