/**
 * ============================================================================
 * SUPPORTDESK CRM — INPUT VALIDATION
 * Throws descriptive errors when validation fails.
 * ============================================================================
 */
const Validator = {
  /**
   * Ensures all required fields are present and non-empty.
   */
  requireFields: function (params, fields) {
    if (!params) throw new Error('Request body is empty');
    for (const f of fields) {
      if (params[f] === undefined || params[f] === null || String(params[f]).trim() === '') {
        throw new Error(`Missing required field: ${f}`);
      }
    }
  },

  /**
   * Validates a value against an allowed list.
   */
  isValidEnum: function (value, allowed, fieldName) {
    if (!allowed.includes(value)) {
      throw new Error(`Invalid ${fieldName || 'value'}: "${value}". Allowed: ${allowed.join(', ')}`);
    }
  },

  /**
   * Basic email format check.
   */
  isValidEmail: function (email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(String(email))) {
      throw new Error(`Invalid email format: ${email}`);
    }
  },

  /**
   * Minimum string length check.
   */
  minLength: function (value, min, fieldName) {
    if (String(value).length < min) {
      throw new Error(`${fieldName || 'Field'} must be at least ${min} characters`);
    }
  }
};
