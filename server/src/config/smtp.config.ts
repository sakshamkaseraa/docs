// src/config/smtp.config.ts
import nodemailer from 'nodemailer';
import env from './env.config';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT), // convert string → number
  secure: false,               // false for STARTTLS on 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  debug: true,                 // show SMTP protocol logs in console
});

export default transporter;
