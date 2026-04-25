import emailSender from '../src/shared/emailSender';
import { welcomeEmailTemplate } from '../src/helpars/template/welcomeEmailTemplate';

async function testEmail() {
  const testEmail = 'xidar33939@pertok.com'; // You can change this to your email for testing
  const name = 'Forhad';
  
  console.log('Sending test welcome email...');
  try {
    const html = welcomeEmailTemplate(name);
    await emailSender(testEmail, html, 'Test Welcome Email');
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Test email failed:', error);
  }
}

testEmail();
