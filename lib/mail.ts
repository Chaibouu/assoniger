import nodemailer from 'nodemailer';
import appConfig from "@/settings";

const domain = process.env.NEXT_PUBLIC_APP_URL;
const transporter = nodemailer.createTransport(appConfig.mailOptions)

export const sendTwoFactorTokenEmail = async (
  email: string,
  token: string
) => {
  const mailOptions = {
    from: 'contact@sahelcoders.com',
    to: email,
    subject: '2FA Code',
    html: `<p>Your 2FA code: ${token}</p>`
  };
  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
) => {
  const resetLink = `${domain}/auth/new-password?token=${token}`

  const mailOptions = {
    from: 'contact@sahelcoders.com',
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset password.</p>`
  };
  await transporter.sendMail(mailOptions);
};

export const sendVerificationEmail = async (
  email: string, 
  token: string
) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  const mailOptions = {
    from: 'contact@sahelcoders.com',
    to: email,
    subject: 'Confirm your email',
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`
  };

  await transporter.sendMail(mailOptions);
};
