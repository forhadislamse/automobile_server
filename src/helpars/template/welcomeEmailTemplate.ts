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
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f7f6; 
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: #ffffff; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1a73e8; 
            text-decoration: none; 
        }
        .content { 
            font-size: 16px; 
        }
        .greeting { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 20px; 
            color: #202124; 
        }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #1a73e8; 
            color: #ffffff; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
            margin-top: 25px; 
        }
        .footer { 
            margin-top: 40px; 
            font-size: 12px; 
            color: #70757a; 
            text-align: center; 
            border-top: 1px solid #e8eaed; 
            padding-top: 20px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SmartAutoTech</div>
        </div>
        <div class="content">
            <div class="greeting">Welcome, ${fullName}!</div>

            <p>Congratulations! Your account has been successfully verified.</p>

            <p>We’re excited to welcome you to SmartAutoTech as a <strong>Shop Owner</strong>.</p>

            <p>
                SmartAutoTech is built to help streamline your shop’s diagnostic workflow
                with advanced AI-powered tools.
            </p>

            <p>Click the button below to log in to your dashboard and get started:</p>

            <a href="https://regwheat-frontend-v2.vercel.app/login" class="button">
                Go to Dashboard
            </a>



            <p>
                Best regards,<br>
                The SmartAutoTech Team
            </p>
        </div>

        <div class="footer">
            &copy; SmartAutoTech. All rights reserved.
        </div>
    </div>
</body>
</html>
`;