// src/config/env.config.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  HOST: process.env.HOST!,
  PORT: process.env.PORT!,

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  USER: process.env.USER!,
  PASSWORD: process.env.PASSWORD!,
  DB_HOST: process.env.DB_HOST!,
  DB_PORT: process.env.DB_PORT!,
  DATABASE: process.env.DATABASE!,

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: process.env.SMTP_PORT!,        // ← ensure this matches your .env.development
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD!,

  // JWT
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  ACCESS_TOKEN_EXPIRATION: process.env.ACCESS_TOKEN_EXPIRATION!,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION!,
  VERIFY_EMAIL_SECRET: process.env.VERIFY_EMAIL_SECRET!,
  PASSWORD_RESET_SECRET: process.env.PASSWORD_RESET_SECRET!,
  PASSWORD_RESET_EXPIRATION: process.env.PASSWORD_RESET_EXPIRATION!,

  // Frontend
  FRONT_END_URL: process.env.FRONT_END_URL!,
};

export default env;
