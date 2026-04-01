import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import { z } from 'zod';

/**
 * Industrial Contact Validation Protocol.
 * Enforces strict E.164 formatting and regional validation.
 */
export const contactNumberSchema = z.string().refine((val) => {
  try {
    return isValidPhoneNumber(val);
  } catch {
    return false;
  }
}, {
  message: "Invalid transmission node format. Please ensure international E.164 compliance.",
});

export const validateContact = (number: string) => {
  try {
    if (!isValidPhoneNumber(number)) return { valid: false, error: "Invalid Node Configuration" };
    const parsed = parsePhoneNumberWithError(number);
    return { valid: true, formatted: parsed.formatInternational() };
  } catch {
    return { valid: false, error: "System Parsing Error" };
  }


};
