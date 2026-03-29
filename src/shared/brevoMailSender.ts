import axios from 'axios';
import config from "../config";

const emailSender = async (email: string, html: string, subject: string) => {
  if (!config.brevoMail.api_key) {
    throw new Error('Missing Brevo API key in configuration');
  }

  const senderEmail = config.brevoMail.email || "i.rforhad@gmail.com";
  const senderName = config.brevoMail.sender_name || "Regwheat support";

  try {
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: email
        }
      ],
      htmlContent: html,
      subject: subject
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'accept': 'application/json',
        'api-key': config.brevoMail.api_key,
        'content-type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('Brevo API Error:', {
        status: error.response.status,
        message: error.response.data?.message || 'Unknown Brevo error',
        errorCode: error.response.data?.code
      });
      
      // Specifically handle the "account not activated" error to guide the user
      if (error.response.data?.message?.includes('not yet activated')) {
        throw new Error(`Brevo SMTP account not activated. Please log in to your Brevo dashboard and ensure your account is validated for sending emails.`);
      }
    }
    
    throw new Error(error.response?.data?.message || 'Failed to send email');
  }
};

export default emailSender;
