/**
 * ============================================================================
 * SUPPORTDESK CRM — RESPONSE FORMATTER
 * Standardised JSON envelope with CORS support.
 * ============================================================================
 */
const Response = {
  /**
   * Wraps data in a success envelope.
   * @param {*} data - Payload to return.
   * @param {Object|null} meta - Optional pagination / extra metadata.
   */
  success: function (data, meta) {
    const payload = {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
    if (meta) payload.meta = meta;

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  },

  /**
   * Wraps an error message in a failure envelope.
   * @param {string} message - Human-readable error.
   * @param {number} code - HTTP-style status code.
   * @param {string|null} field - Field that caused the error (optional).
   */
  error: function (message, code, field) {
    const payload = {
      success: false,
      error: {
        code: code || 500,
        message: message || 'Internal Server Error',
        field: field || null
      },
      timestamp: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }
};
