const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_AUTH    = process.env.RESEND_FROM_AUTH    || 'TravelSphere <auth@travelsphere.sbs>';
const FROM_ORDER   = process.env.RESEND_FROM_ORDER   || 'TravelSphere <orders@travelsphere.sbs>';
const FROM_SUPPORT = process.env.RESEND_FROM_SUPPORT || 'TravelSphere <support@travelsphere.sbs>';

console.log('[emailService] Loaded | KEY:', process.env.RESEND_API_KEY ? '✓ set' : '✗ MISSING');
console.log('  auth→', FROM_AUTH, '| orders→', FROM_ORDER, '| support→', FROM_SUPPORT);

// ─── Base layout ─────────────────────────────────────────────────────────────

function baseLayout(contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TravelSphere</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0d9488 0%,#0891b2 100%);border-radius:16px 16px 0 0;padding:28px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display:inline-flex;align-items:center;gap:10px;">
                  <div style="width:38px;height:38px;background:rgba(255,255,255,0.25);border-radius:10px;display:inline-block;text-align:center;line-height:38px;font-size:20px;">✈️</div>
                  <span style="color:white;font-size:22px;font-weight:700;letter-spacing:-0.5px;vertical-align:middle;margin-left:8px;">TravelSphere</span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:white;padding:36px;">
          ${contentHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 36px;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;text-align:center;">
            © ${new Date().getFullYear()} TravelSphere. All rights reserved.
          </p>
          <p style="margin:0;color:#cbd5e1;font-size:11px;text-align:center;">
            You're receiving this because you have an account on TravelSphere.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Shared blocks ────────────────────────────────────────────────────────────

function otpBlock(otp) {
  return `
  <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:2px solid #86efac;border-radius:14px;padding:28px;text-align:center;margin:24px 0;">
    <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
    <div style="font-size:42px;font-weight:800;letter-spacing:14px;color:#047857;font-family:'Courier New',monospace;line-height:1;">${otp}</div>
    <p style="margin:10px 0 0;color:#6b7280;font-size:12px;">Expires in <strong>10 minutes</strong></p>
  </div>`;
}

function divider() {
  return `<div style="height:1px;background:#e2e8f0;margin:24px 0;"></div>`;
}

function infoRow(label, value) {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
      <span style="color:#94a3b8;font-size:13px;">${label}</span>
    </td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;">
      <span style="color:#0f172a;font-size:13px;font-weight:600;">${value}</span>
    </td>
  </tr>`;
}

function primaryButton(text, url) {
  return `
  <div style="text-align:center;margin:28px 0 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0891b2);color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.3px;">
      ${text}
    </a>
  </div>`;
}

// ─── Send helper ──────────────────────────────────────────────────────────────

async function send({ from, to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[email] ✗ No RESEND_API_KEY — skipping:', subject, '→', to);
    return;
  }
  console.log(`[email] Sending "${subject}" → ${to} (from: ${from})`);
  const { data, error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) {
    console.error(`[email] ✗ Resend error for "${subject}" → ${to}:`, JSON.stringify(error));
    throw new Error(error.message);
  }
  console.log(`[email] ✓ Delivered "${subject}" → ${to} (id: ${data?.id})`);
}

// ─── 1. Registration OTP ──────────────────────────────────────────────────────

async function sendRegistrationOtpEmail(to, otp) {
  const html = baseLayout(`
    <h2 style="margin:0 0 6px;color:#0f172a;font-size:24px;font-weight:700;">Verify your email</h2>
    <p style="margin:0 0 4px;color:#64748b;font-size:15px;">Welcome to TravelSphere! Use the code below to complete your signup.</p>
    ${otpBlock(otp)}
    <p style="color:#94a3b8;font-size:13px;margin:0;">If you didn't create a TravelSphere account, you can safely ignore this email.</p>
  `);
  await send({
    from: FROM_AUTH,
    to,
    subject: 'Your TravelSphere signup code',
    html,
    text: `Welcome to TravelSphere!\n\nYour signup verification code is: ${otp}\n\nExpires in 10 minutes.`,
  });
}

// ─── 2. Email change OTP ──────────────────────────────────────────────────────

async function sendEmailChangeOtpEmail(to, otp) {
  const html = baseLayout(`
    <h2 style="margin:0 0 6px;color:#0f172a;font-size:24px;font-weight:700;">Verify your new email</h2>
    <p style="margin:0 0 4px;color:#64748b;font-size:15px;">We received a request to change the email on your TravelSphere account.</p>
    ${otpBlock(otp)}
    <p style="color:#94a3b8;font-size:13px;margin:0;">If you didn't request this change, your existing email remains unchanged — no action needed.</p>
  `);
  await send({
    from: FROM_AUTH,
    to,
    subject: 'TravelSphere — Verify your new email address',
    html,
    text: `Your TravelSphere email change verification code is: ${otp}\n\nExpires in 10 minutes.`,
  });
}

// ─── 3. Welcome email (after successful registration) ─────────────────────────

async function sendWelcomeEmail(to, name) {
  const html = baseLayout(`
    <h2 style="margin:0 0 6px;color:#0f172a;font-size:24px;font-weight:700;">Welcome aboard, ${name}! 🎉</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;">Your TravelSphere account is ready. Start exploring handpicked travel packages across India.</p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;">
          <span style="color:#0d9488;font-size:16px;margin-right:10px;">✈️</span>
          <span style="color:#334155;font-size:14px;font-weight:600;">Browse 500+ curated travel packages</span>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <span style="color:#0d9488;font-size:16px;margin-right:10px;">🗓️</span>
          <span style="color:#334155;font-size:14px;font-weight:600;">Track all your bookings in one place</span>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <span style="color:#0d9488;font-size:16px;margin-right:10px;">💬</span>
          <span style="color:#334155;font-size:14px;font-weight:600;">Chat with expert travel agents</span>
        </td></tr>
        <tr><td style="padding:8px 0;">
          <span style="color:#0d9488;font-size:16px;margin-right:10px;">🤖</span>
          <span style="color:#334155;font-size:14px;font-weight:600;">Plan trips with our AI assistant</span>
        </td></tr>
      </table>
    </div>
    ${primaryButton('Explore Packages', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/packages`)}
  `);
  await send({
    from: FROM_AUTH,
    to,
    subject: `Welcome to TravelSphere, ${name}!`,
    html,
    text: `Welcome to TravelSphere, ${name}!\n\nYour account is ready. Start exploring travel packages at travelsphere.sbs`,
  });
}

// ─── 4. Booking confirmation ──────────────────────────────────────────────────

async function sendBookingConfirmationEmail({ to, customerName, packageTitle, travelDate, totalAmount, bookingId, travelers = 1, packageSlug }) {
  const formattedDate = new Date(travelDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const formattedAmount = `₹${Number(totalAmount).toLocaleString('en-IN')}`;
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/bookings`;

  const html = baseLayout(`
    <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:12px;padding:20px 24px;margin:0 0 24px;border-left:4px solid #10b981;">
      <p style="margin:0 0 4px;color:#065f46;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Booking Confirmed ✓</p>
      <h2 style="margin:0;color:#0f172a;font-size:22px;font-weight:700;">${packageTitle}</h2>
    </div>

    <p style="margin:0 0 20px;color:#334155;font-size:15px;">Hi <strong>${customerName}</strong>, your booking is confirmed and payment received. Get ready for an amazing trip!</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      ${infoRow('📅 Travel Date', formattedDate)}
      ${infoRow('👥 Travelers', `${travelers} ${travelers === 1 ? 'person' : 'people'}`)}
      ${infoRow('💰 Amount Paid', formattedAmount)}
      ${infoRow('🆔 Booking ID', `<code style="font-family:monospace;background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px;">${bookingId}</code>`)}
    </table>

    ${divider()}

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;color:#92400e;font-size:13px;">
        <strong>📌 Next steps:</strong> Our team will reach out to confirm your travel details and itinerary within 24 hours.
      </p>
    </div>

    ${primaryButton('View My Booking', dashboardUrl)}

    ${divider()}
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Need help? Reply to this email or visit your dashboard.</p>
  `);

  await send({
    from: FROM_ORDER,
    to,
    subject: `Booking Confirmed — ${packageTitle} 🎉`,
    html,
    text: `Hi ${customerName},\n\nYour booking for "${packageTitle}" is confirmed!\n\nTravel Date: ${formattedDate}\nTravelers: ${travelers}\nAmount Paid: ${formattedAmount}\nBooking ID: ${bookingId}\n\nView your booking: ${dashboardUrl}\n\nTravelSphere Team`,
  });
}

// ─── 5. Booking status update ─────────────────────────────────────────────────

async function sendBookingStatusEmail({ to, customerName, packageTitle, status, message }) {
  const statusConfig = {
    confirmed:   { emoji: '✅', color: '#10b981', bg: '#f0fdf4', label: 'Confirmed' },
    cancelled:   { emoji: '❌', color: '#ef4444', bg: '#fef2f2', label: 'Cancelled' },
    in_progress: { emoji: '🚀', color: '#0891b2', bg: '#f0f9ff', label: 'Trip Started' },
    completed:   { emoji: '🎉', color: '#8b5cf6', bg: '#faf5ff', label: 'Completed' },
  };
  const cfg = statusConfig[status] || { emoji: 'ℹ️', color: '#64748b', bg: '#f8fafc', label: status };
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/bookings`;

  const html = baseLayout(`
    <div style="background:${cfg.bg};border-radius:12px;padding:20px 24px;margin:0 0 24px;border-left:4px solid ${cfg.color};">
      <p style="margin:0 0 4px;color:${cfg.color};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${cfg.emoji} Booking ${cfg.label}</p>
      <h2 style="margin:0;color:#0f172a;font-size:20px;font-weight:700;">${packageTitle}</h2>
    </div>
    <p style="margin:0 0 20px;color:#334155;font-size:15px;">Hi <strong>${customerName}</strong>, ${message || `your booking status has been updated to <strong>${cfg.label}</strong>.`}</p>
    ${primaryButton('View Booking', dashboardUrl)}
  `);

  await send({
    from: FROM_ORDER,
    to,
    subject: `${cfg.emoji} Booking ${cfg.label} — ${packageTitle}`,
    html,
    text: `Hi ${customerName},\n\nYour booking for "${packageTitle}" is now ${cfg.label}.\n\n${message || ''}\n\nView: ${dashboardUrl}`,
  });
}

// ─── 6. Agent application approved/rejected ───────────────────────────────────

async function sendAgentApplicationEmail({ to, name, status }) {
  const approved = status === 'approved';
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/login`;

  const html = baseLayout(approved ? `
    <h2 style="margin:0 0 6px;color:#0f172a;font-size:24px;font-weight:700;">Congratulations, ${name}! 🎉</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;">Your application to become a TravelSphere travel agent has been <strong style="color:#10b981;">approved</strong>. You can now log in and start managing packages.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;"><span style="color:#065f46;font-size:14px;">✓ List and manage travel packages</span></td></tr>
        <tr><td style="padding:6px 0;"><span style="color:#065f46;font-size:14px;">✓ Accept bookings and earn commissions</span></td></tr>
        <tr><td style="padding:6px 0;"><span style="color:#065f46;font-size:14px;">✓ Access your agent dashboard</span></td></tr>
      </table>
    </div>
    ${primaryButton('Go to Agent Dashboard', loginUrl)}
  ` : `
    <h2 style="margin:0 0 6px;color:#0f172a;font-size:24px;font-weight:700;">Application Update</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;">Hi <strong>${name}</strong>, after reviewing your application we're unable to approve it at this time. You're welcome to reapply after 30 days.</p>
    <p style="color:#94a3b8;font-size:13px;margin:0;">If you have questions, reply to this email and our team will help.</p>
  `);

  await send({
    from: FROM_SUPPORT,
    to,
    subject: approved ? '🎉 Agent Application Approved — TravelSphere' : 'Agent Application Update — TravelSphere',
    html,
    text: approved
      ? `Congratulations ${name}! Your TravelSphere agent application is approved. Log in at: ${loginUrl}`
      : `Hi ${name}, your TravelSphere agent application was not approved at this time. You may reapply after 30 days.`,
  });
}

module.exports = {
  sendRegistrationOtpEmail,
  sendEmailChangeOtpEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusEmail,
  sendAgentApplicationEmail,
};
