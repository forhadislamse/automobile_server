import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  frontend_url: process.env.FRONTEND_BASE_URL,
  jwt: {
    jwt_secret: process.env.JWT_SECRET,
    expires_in: process.env.EXPIRES_IN,
    refresh_token_secret: process.env.REFRESH_TOKEN_SECRET,
    refresh_token_expires_in: process.env.REFRESH_TOKEN_EXPIRES_IN,
    reset_pass_secret: process.env.RESET_PASS_TOKEN,
    reset_pass_token_expires_in: process.env.RESET_PASS_TOKEN_EXPIRES_IN,
  },
  reset_pass_link: process.env.RESET_PASS_LINK,
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
    smtp_server: process.env.smtp_server,
    smtp_port: process.env.smtp_port,
    smtp_user: process.env.smtp_user,
    smtp_pass: process.env.smtp_pass,
  },
  brevoMail: {
    api_key: process.env.BREVO_API_KEY,
    email: process.env.BREVO_EMAIL,
    sender_name: process.env.BREVO_SENDER_NAME,
  },
  stripe: {
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    secret_key: process.env.STRIPE_SECRET_KEY,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    admin_account: process.env.STRIPE_ADMIN_ACCOUNT_ID,
  },
  client: {
    url:
      process.env.FRONTEND_BASE_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:3000",
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
   digitalOcean: {
        endpoint: process.env.DO_SPACE_ENDPOINT,
        originEndpoint: process.env.DO_SPACE_ORIGIN_ENDPOINT,
        accessKey: process.env.DO_SPACE_ACCESS_KEY,
        secretKey: process.env.DO_SPACE_SECRET_KEY,
        bucket: process.env.DO_SPACE_BUCKET,
    },
    ai: {
        openai_api_key: process.env.OPENAI_API_KEY,
        model_name: process.env.AI_MODEL_NAME || "gpt-4o-mini",
    }
  
};
