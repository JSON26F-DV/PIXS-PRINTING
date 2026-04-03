/**
 * SafeTerminal Utility
 * Defensive Programming Guards for PIXS Industrial Projection
 */

export const SafeTerminal = {
  /**
   * Ensures the input is an array, returns empty array if not.
   */
  array: <T>(data: any): T[] => {
    try {
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Ensures the input is a valid object, returns empty object if not.
   */
  object: <T extends object>(data: any): T => {
    try {
      return typeof data === "object" && data !== null && !Array.isArray(data) ? (data as T) : ({} as T);
    } catch {
      return {} as T;
    }
  },

  /**
   * Safe JSON parsing from LocalStorage with fallback.
   */
  parseJson: <T>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      
      // If fallback is an array, ensure parsed is an array
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      
      return parsed as T;
    } catch (e) {
      console.error(`Defensive Guard: Failed to parse ${key}`, e);
      return fallback;
    }
  },

  /**
   * String length limiter for defensive rendering.
   */
  limit: (str: string | undefined | null, length: number): string => {
    if (!str) return "";
    return str.length > length ? `${str.substring(0, length)}...` : str;
  }
};
