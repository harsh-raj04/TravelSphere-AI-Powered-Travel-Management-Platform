const bcrypt = require("bcryptjs");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { prisma } = require("../lib/prisma");

// ─── AWS Clients ──────────────────────────────────────────────────────────────
// Credentials are auto-loaded from process.env.AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN set in the backend .env file.

const sesClient = new SESClient({ region: process.env.AWS_REGION || "ap-south-1" });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || "ap-south-1" });

const OTP_EXPIRY_MINUTES = 10;
const BCRYPT_ROUNDS = 10;

// ─── generateOtp ─────────────────────────────────────────────────────────────
/**
 * Returns a cryptographically-acceptable random 6-digit string, zero-padded.
 * We use Math.random here for simplicity; for stronger guarantees swap to
 * crypto.randomInt(100000, 999999).toString() (Node 14.10+).
 */
function generateOtp() {
  const { randomInt } = require("crypto");
  return randomInt(100000, 999999).toString();
}

// ─── sendEmailOtp ─────────────────────────────────────────────────────────────
/**
 * Sends a 6-digit OTP to `toEmail` via AWS SES.
 * Throws if SES returns an error so the caller can return 502.
 */
async function sendEmailOtp(toEmail, otp) {
  const from = process.env.COGNITO_VERIFICATION_FROM || process.env.SES_SUPPORT_FROM;

  const command = new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: {
        Data: "TravelSphere — Verify your new email",
        Charset: "UTF-8",
      },
      Body: {
        Text: {
          Data: [
            `Your TravelSphere email verification code is:`,
            ``,
            `  ${otp}`,
            ``,
            `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
            `If you did not request this change, please ignore this email.`,
          ].join("\n"),
          Charset: "UTF-8",
        },
        Html: {
          Data: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px;
              border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #0d9488, #047857); padding: 24px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px;">TravelSphere</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 14px;">
        Email Verification
      </p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; margin: 0 0 20px; font-size: 15px;">
        Use the code below to verify your new email address.
        It expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
      </p>
      <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px;
                  padding: 20px; text-align: center; margin: 0 0 24px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px;
                     color: #065f46; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        If you did not request a change, please ignore this email.
        Your existing email remains unchanged.
      </p>
    </div>
  </div>
</body>
</html>`,
          Charset: "UTF-8",
        },
      },
    },
  });

  await sesClient.send(command);
}

// ─── sendSmsOtp ───────────────────────────────────────────────────────────────
/**
 * Sends a 6-digit OTP via AWS SNS SMS to `toPhone` (E.164 format, e.g. +91XXXXXXXXXX).
 * Throws on SNS failure so the caller can return 502.
 */
async function sendSmsOtp(toPhone, otp) {
  const command = new PublishCommand({
    PhoneNumber: toPhone,
    Message: `TravelSphere: Your phone verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
    MessageAttributes: {
      "AWS.SNS.SMS.SMSType": {
        DataType: "String",
        StringValue: "Transactional",
      },
      "AWS.SNS.SMS.SenderID": {
        DataType: "String",
        StringValue: "TRVSPH",
      },
    },
  });

  await snsClient.send(command);
}

// ─── createOtpRecord ──────────────────────────────────────────────────────────
/**
 * Deletes any previous pending records for the same userId+type, then creates
 * a new OtpVerification row with a bcrypt hash of `otp`.
 */
async function createOtpRecord(userId, type, otp, newValue) {
  // Clear any existing unused OTPs for this user+type
  await prisma.otpVerification.deleteMany({
    where: { userId, type, used: false },
  });

  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.create({
    data: { userId, type, otpHash, newValue, expiresAt },
  });
}

// ─── verifyOtpRecord ──────────────────────────────────────────────────────────
/**
 * Finds the latest non-expired, non-used record for userId+type, bcrypt-compares
 * the provided `otp`, verifies `newValue` matches what was stored, and marks it used.
 *
 * Throws a descriptive Error on any failure; caller should translate to HTTP 400.
 * Returns { ok: true } on success.
 */
async function verifyOtpRecord(userId, type, otp, newValue) {
  const record = await prisma.otpVerification.findFirst({
    where: {
      userId,
      type,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("OTP has expired or was not found. Please request a new one.");
  }

  if (record.newValue !== newValue) {
    throw new Error("The value being verified does not match the OTP request.");
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    throw new Error("Incorrect OTP. Please try again.");
  }

  // Mark as used so it cannot be replayed
  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { ok: true };
}

module.exports = {
  generateOtp,
  sendEmailOtp,
  sendSmsOtp,
  createOtpRecord,
  verifyOtpRecord,
};
