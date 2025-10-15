const twilio = require('twilio');
const sendEmail = require('./sendEmail');

const sendSMS = async (options) => {
  // Check if Twilio credentials are provided
  if (process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid' && 
      process.env.TWILIO_AUTH_TOKEN && 
      process.env.TWILIO_PHONE_NUMBER) {
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const message = await client.messages.create({
        body: options.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: options.to
      });

      console.log(`SMS sent: ${message.sid}`);
      return message;
    } catch (error) {
      console.error('Error sending SMS:', error);
      // Fallback to email if SMS fails
      await sendEmailNotification(options);
    }
  } else {
    // If Twilio is not configured, send email instead
    console.log('Twilio not configured. Sending email notification instead.');
    await sendEmailNotification(options);
  }
};

// Helper function to send email notification
async function sendEmailNotification(options) {
  // If email is provided, use it, otherwise try to extract from phone
  const email = options.email || (options.user ? options.user.email : null);
  
  if (!email) {
    console.log('No email available for notification');
    return;
  }
  
  await sendEmail({
    email: email,
    subject: 'Notification from Enquiry Management System',
    message: options.message,
    html: `<p>${options.message}</p>`
  });
  
  console.log(`Email notification sent to ${email}`);
}

module.exports = sendSMS;