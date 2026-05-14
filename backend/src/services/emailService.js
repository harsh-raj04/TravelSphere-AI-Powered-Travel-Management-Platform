const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function sendBookingConfirmationEmail({ to, customerName, packageTitle, travelDate, totalAmount, bookingId }) {
  if (!process.env.AWS_SES_FROM_EMAIL) {
    console.log('[email] No SES config — skipping email to', to);
    return;
  }
  try {
    await ses.send(new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: `Booking Confirmed — ${packageTitle}` },
        Body: {
          Text: {
            Data: `Hi ${customerName},\n\nYour booking for ${packageTitle} on ${new Date(travelDate).toLocaleDateString('en-IN')} is confirmed.\nTotal: ₹${Number(totalAmount).toLocaleString('en-IN')}\nBooking ID: ${bookingId}\n\nThanks,\nTravelSphere Team`,
          },
        },
      },
    }));
    console.log('[email] Confirmation sent to', to);
  } catch (err) {
    console.error('[email] Failed to send:', err.message);
  }
}

module.exports = { sendBookingConfirmationEmail };
