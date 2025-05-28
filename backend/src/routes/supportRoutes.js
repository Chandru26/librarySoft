const express = require('express');
const router = express.Router();
const { sendSupportEmail } = require('../utils/emailService'); // Adjust path as needed
require('dotenv').config();

// POST /api/support/contact
router.post('/contact', async (req, res) => {
  const { email, subject, message } = req.body;

  // Basic validation
  if (!email || !subject || !message) {
    return res.status(400).json({ message: 'Email, subject, and message are required.' });
  }

  const supportEmailAddress = process.env.SUPPORT_EMAIL_ADDRESS;
  if (!supportEmailAddress) {
    console.error('SUPPORT_EMAIL_ADDRESS is not defined in environment variables.');
    return res.status(500).json({ message: 'Support system configuration error.' });
  }

  const emailSubjectToSupport = `Support Request from ${email}: ${subject}`;
  const emailTextBodyToSupport = `User Email: ${email}\n\nMessage:\n${message}`;

  try {
    // Send the email to the configured support address
    await sendSupportEmail(supportEmailAddress, emailSubjectToSupport, emailTextBodyToSupport);

    // Optionally, send a confirmation email to the user (also using the placeholder)
    const userConfirmationSubject = "We've Received Your Support Request";
    const userConfirmationTextBody = `Hello ${email.split('@')[0]},\n\nThank you for contacting support. We have received your message titled "${subject}" and will get back to you shortly.\n\nBest regards,\nSupport Team`;
    await sendSupportEmail(email, userConfirmationSubject, userConfirmationTextBody);


    res.status(200).json({ message: 'Your support request has been received (placeholder).' });
  } catch (error) {
    console.error('Error processing support request:', error);
    res.status(500).json({ message: 'Failed to send support request.' });
  }
});

module.exports = router;
