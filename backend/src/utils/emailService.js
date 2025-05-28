/**
 * @file emailService.js
 * @description Placeholder for email sending functionality.
 * In a real application, this would integrate with an email service provider
 * like SendGrid, Mailgun, AWS SES, etc.
 */

/**
 * Sends an email (placeholder implementation).
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} textBody - The plain text body of the email.
 * @param {string} [htmlBody] - Optional HTML body of the email.
 * @returns {Promise<{message: string}>} - A promise that resolves with a success message.
 */
async function sendSupportEmail(to, subject, textBody, htmlBody) {
  console.log("\n--- Sending Support Email (Placeholder) ---");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Text Body:", textBody);
  if (htmlBody) {
    console.log("HTML Body:", htmlBody);
  }
  console.log("--- Email Sent (Placeholder) ---\n");

  // Simulate successful email sending
  return Promise.resolve({ message: "Email sent successfully (placeholder)" });
}

module.exports = { sendSupportEmail };
