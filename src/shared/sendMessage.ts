// Your AccountSID and Auth Token from console.twilio.com
import twilio from "twilio";
import config from "../config";

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendMessage = async (body: string, to: string) => {
  console.log("msg body", body, to);
  try {
    const message = await client.messages.create({
      body,
      to,
      from: config.twilio.twilioPhoneNumber,
    });
    console.log("Message sent:", message.sid);
    console.log(message, "msg");
  } catch (err: any) {
    console.error("Failed to send OTP message:", err.message);
    throw err; // Re-throwing to be handled by your higher-level error handler
  }
};
