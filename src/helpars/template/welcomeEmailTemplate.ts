// export const welcomeEmailTemplate = (fullName: string) => `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Welcome to SmartAutoTech</title>
//     <style>
//         body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
//         .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
//         .header { text-align: center; margin-bottom: 30px; }
//         .logo { font-size: 28px; font-weight: bold; color: #1a73e8; text-decoration: none; }
//         .content { font-size: 16px; }
//         .greeting { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #202124; }
//         .button { display: inline-block; padding: 12px 24px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 25px; }
//         .footer { margin-top: 40px; font-size: 12px; color: #70757a; text-align: center; border-top: 1px solid #e8eaed; padding-top: 20px; }
//     </style>
// </head>
// <body>
//     <div class="container">
//         <div class="header">
//             <div class="logo">SmartAutoTech AI</div>
//         </div>
//         <div class="content">
//             <div class="greeting">Welcome, ${fullName}!</div>
//             <p>Congratulations! Your account has been successfully verified. We are thrilled to have you on board as a Shop Owner.</p>
//             <p>SmartAutoTech is designed to help you streamline your diagnostic process using advanced AI. You can now start adding your technicians, managing your shop, and using our specialized AI tools.</p>
//             <p>To get started, click the button below to log in to your dashboard:</p>
//             <a href="https://regwheat-frontend.vercel.app/login" class="button">Go to Dashboard</a>
//             <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
//             <p>Best regards,<br>The SmartAutoTech Team</p>
//         </div>
//         <div class="footer">
//             &copy; 2026 SmartAutoTech. All rights reserved.
//         </div>
//     </div>
// </body>
// </html>
// `;


export const welcomeEmailTemplate = (fullName: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SmartAutoTech</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="margin: 0; padding: 20px 0; background-color: #f4f7f6; min-height: 100%;">
    <div style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      
      <!-- 🎨 HEADER BANNER -->
      <div style="background-color: #f1f5f9; padding: 45px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a;">
          SmartAutoTech
        </h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; color: #475569; font-weight: bold;">
          Welcome, ${fullName}!
        </p>
      </div>

      <!-- 📱 MAIN CONTENT -->
      <div style="padding: 40px 30px;">
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-top: 0; margin-bottom: 16px;">
          Hello,
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
          Congratulations! Your account has been successfully verified.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
          We’re excited to welcome you to SmartAutoTech as a <strong>Shop Owner</strong>.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
          SmartAutoTech is built to help streamline your shop’s diagnostic workflow with advanced AI-powered tools.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
          Click the button below to log in to your dashboard and get started:
        </p>

        <!-- 🚀 ACTIVATE BUTTON -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://regwheat-frontend-v2.vercel.app/login" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
            Go to Dashboard
          </a>
        </div>

        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 32px; margin-bottom: 0;">
          Best regards,<br>
          The SmartAutoTech Team
        </p>
      </div>

      <!-- 👟 FOOTER -->
      <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 6px 0; font-weight: 600;">
          SmartAutoTech Team
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © SmartAutoTech. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;