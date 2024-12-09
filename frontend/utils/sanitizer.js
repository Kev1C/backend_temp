/**
 * Sanitizes input strings to prevent XSS attacks and other input-based vulnerabilities.
 * 
 * @param {string} input - The input string to be sanitized.
 * @returns {string} The sanitized input string.
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }
  
    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
  
    // Encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  
    // Trim whitespace
    sanitized = sanitized.trim();
  
    // Limit the length of the input (adjust as needed)
    const MAX_LENGTH = 1000;
    sanitized = sanitized.slice(0, MAX_LENGTH);
  
    return sanitized;
  }
  
  /**
   * Sanitizes numeric input to ensure it's a valid number.
   * 
   * @param {string|number} input - The input to be sanitized.
   * @returns {number} The sanitized number, or 0 if invalid.
   */
  export function sanitizeNumber(input) {
    const num = parseFloat(input);
    return isNaN(num) ? 0 : num;
  }
  
  /**
   * Sanitizes an object by applying sanitizeInput to all string properties
   * and sanitizeNumber to all number properties.
   * 
   * @param {Object} obj - The object to be sanitized.
   * @returns {Object} A new object with all properties sanitized.
   */
  export function sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (typeof value === 'number') {
        sanitized[key] = sanitizeNumber(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }