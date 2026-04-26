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
<div style="font-family: 'Segoe UI', sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
  <div style="
    max-width: 600px;
    margin: auto;
    background: #ffffff;
    border-radius: 12px;
    padding: 40px 30px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  ">
    
    <h1 style="color: #1a73e8; font-size: 28px; margin-bottom: 10px;">
      Resend OTP Verification
    </h1>

    <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
      Here is your new verification code to continue your request:
    </p>

    <div style="
      display: inline-block;
      background: #f3f4f6;
      padding: 16px 32px;
      border-radius: 10px;
      font-size: 36px;
      font-weight: bold;
      color: #ef4444;
      letter-spacing: 6px;
      margin-bottom: 20px;
    ">
      ${otp}
    </div>

    <!-- ⏰ EXPIRY BAR -->
            <div style="background: #fff5f5; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #fed7d7; margin-bottom: 30px;">
                <div style="background: linear-gradient(to right, #48bb78 0%, #48bb78 60%, #e53e3e 60%, #e53e3e 100%); height: 6px; border-radius: 3px; margin-bottom: 10px;"></div>
                <p style="color: #c53030; font-size: 14px; margin: 0; font-weight: 500;">
                    ⏰ Expires in <strong>5 minutes</strong>
                </p>
            </div>

    <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
      If you did not request this code, you can safely ignore this email.
    </p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">


    <p style="color: #9ca3af; font-size: 12px;">
      Best regards,<br/>
      <span style="font-weight: 600; color: #1a73e8;">The SmartAutoTech Team</span>
    </p>

  </div>
</div>
`;




















