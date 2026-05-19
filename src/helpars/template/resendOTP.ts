// export const resendOTPTemplate = (otp: number) => `
// <div style="font-family: 'Segoe UI', sans-serif; background: #f3f4f6; padding: 40px;">
//   <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
//     <h1 style="color: #1e3a8a; font-size: 28px;">Resend OTP</h1>
//     <p style="color: #374151; font-size: 16px; margin: 10px 0;">
//       Here is your new OTP code to complete the process.
//     </p>
//     <div style="font-size: 36px; font-weight: bold; color: #ef4444; margin: 20px 0;">
//       ${otp}
//     </div>
//     <p style="color: #6b7280; font-size: 14px;">
//       This OTP will expire in <strong>5 minutes</strong>.
//     </p>
//     <p style="color: #9ca3af; font-size: 12px; margin-bottom: 20px;">
//       If you did not request this, please ignore this email. For assistance, contact support.
//     </p>
//     <hr style="margin: 30px 0; border-color: #e5e7eb;">
//     <p style="color: #9ca3af; font-size: 12px;">
//       Best Regards,<br/>
//       <span style="font-weight: bold; color: #1e3a8a;">knastachia@team.com</span><br/>
//       <a href="mailto:support@booksy.buzz.com" style="color: #1e3a8a; text-decoration: none; font-weight: bold;">Contact Support</a>
//     </p>
//   </div>
// </div>
// `; 



export const resendOTPTemplate = (otp: number) => `
<div style="margin: 0; padding: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; min-height: 100%;">
  <div style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      
      <!-- 🎨 HEADER BANNER -->
      <div style="background-color: #f1f5f9; padding: 45px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a;">
          SmartAutoTech
        </h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; color: #475569; font-weight: bold;">
          Resend OTP Verification
        </p>
      </div>

      <!-- 📱 MAIN CONTENT -->
      <div style="padding: 40px 30px;">
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-top: 0; margin-bottom: 16px;">
          Hello,
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
          Here is your new verification code to continue your request:
        </p>

        <!-- 🔑 OTP DISPLAY CARD -->
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #cbd5e1; margin: 28px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
            Verification Code
          </p>
          <div style="display: inline-block; font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace; background-color: #ffffff; padding: 12px 28px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${otp}
          </div>
        </div>

        <!-- ⏰ EXPIRY BAR -->
        <div style="background-color: #fff5f5; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #fed7d7; margin-bottom: 30px;">
            <p style="color: #c53030; font-size: 14px; margin: 0; font-weight: bold;">
                ⏰ Expires in <strong>5 minutes</strong>
            </p>
        </div>

        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 32px; margin-bottom: 0;">
          If you did not request this code, you can safely ignore this email.
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
`;