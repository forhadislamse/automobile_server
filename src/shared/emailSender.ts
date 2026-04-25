import nodemailer from "nodemailer";
import config from "../config";

const emailSender = async (email: string, html: string, subject: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: config.emailSender.email, 
      pass: config.emailSender.app_pass, 
    },
  });

  const info = await transporter.sendMail({
    from: `"SmartAutoTech Support" <${config.emailSender.email}>`,
    to: email,
    subject: subject,
    html,
  });

  console.log("Email sent successfully:", info.messageId);
};

export default emailSender;
