const bcrypt = require('bcryptjs');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { prisma } = require('../lib/prisma');
const { sendRegistrationOtpEmail, sendEmailChangeOtpEmail } = require('./emailService');

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const OTP_EXPIRY_MINUTES = 10;
const BCRYPT_ROUNDS = 10;

function generateOtp() {
  const { randomInt } = require('crypto');
  return randomInt(100000, 999999).toString();
}

// ─── Email OTPs (via Resend through emailService) ────────────────────────────

async function sendEmailOtp(toEmail, otp) {
  await sendEmailChangeOtpEmail(toEmail, otp);
}

async function sendRegistrationEmailOtp(toEmail, otp) {
  await sendRegistrationOtpEmail(toEmail, otp);
}

// ─── SMS OTP (AWS SNS — for agent phone verification) ────────────────────────

async function sendSmsOtp(toPhone, otp) {
  const command = new PublishCommand({
    PhoneNumber: toPhone,
    Message: `TravelSphere: Your verification code is ${otp}. Expires in ${OTP_EXPIRY_MINUTES} minutes. Do not share.`,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
      'AWS.SNS.SMS.SenderID': { DataType: 'String', StringValue: 'TRVSPH' },
    },
  });
  await snsClient.send(command);
}

// ─── OTP DB helpers ───────────────────────────────────────────────────────────

async function createOtpRecord(userId, type, otp, newValue) {
  await prisma.otpVerification.deleteMany({ where: { userId, type, used: false } });
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await prisma.otpVerification.create({ data: { userId, type, otpHash, newValue, expiresAt } });
}

async function verifyOtpRecord(userId, type, otp, newValue) {
  const record = await prisma.otpVerification.findFirst({
    where: { userId, type, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new Error('OTP has expired or was not found. Please request a new one.');
  if (record.newValue !== newValue) throw new Error('The value being verified does not match the OTP request.');
  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) throw new Error('Incorrect OTP. Please try again.');
  await prisma.otpVerification.update({ where: { id: record.id }, data: { used: true } });
  return { ok: true };
}

async function createRegistrationOtp(email, otp) {
  await prisma.registrationOtp.deleteMany({ where: { email, used: false } });
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await prisma.registrationOtp.create({ data: { email, otpHash, expiresAt } });
}

async function verifyRegistrationOtp(email, otp) {
  const record = await prisma.registrationOtp.findFirst({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw new Error('OTP has expired or was not found. Please request a new one.');
  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) throw new Error('Incorrect OTP. Please try again.');
  await prisma.registrationOtp.update({ where: { id: record.id }, data: { used: true } });
  return { ok: true };
}

module.exports = {
  generateOtp,
  sendEmailOtp,
  sendSmsOtp,
  sendRegistrationEmailOtp,
  createOtpRecord,
  verifyOtpRecord,
  createRegistrationOtp,
  verifyRegistrationOtp,
};
