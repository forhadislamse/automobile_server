// export const technicianInvitationTemplate = (shopName: string, passkey: string) => {
//   return `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
//       <h2 style="color: #333; text-align: center;">Welcome to ${shopName}!</h2>
//       <p style="font-size: 16px; color: #555;">Hello,</p>
//       <p style="font-size: 16px; color: #555;"> You have been invited by <strong>${shopName}</strong> to join their team as an assistant on the SmartAutoTech platform.</p>
//       <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #007bff; text-align: center;">
//         <p style="margin: 0; font-size: 14px; color: #888;">Use the following passkey to login:</p>
//         <h3 style="margin: 10px 0; color: #007bff; letter-spacing: 2px;">${passkey}</h3>
//       </div>
//       <p style="font-size: 16px; color: #555;">You can login using your email and the passkey above at:</p>
//       <div style="text-align: center; margin: 30px 0;">
//         <a href="https://regwheat-frontend.vercel.app/login" style="background-color: #007bff; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
//       </div>
//       <p style="font-size: 14px; color: #999; text-align: center;">If you did not expect this invitation, please ignore this email.</p>
//       <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
//       <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; 2026 SmartAutoTech</p>
//     </div>
//   `;
// };


export const technicianInvitationTemplate = (shopName: string, passkey: string) => {
  return `
  <div style="margin: 0; padding: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; min-height: 100%;">
    <div style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      
      <!-- 🎨 HEADER BANNER -->
      <div style="background-color: #f1f5f9; padding: 45px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          SmartAutoTech
        </h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; color: #475569; font-weight: bold;">
          Welcome to ${shopName}!
        </p>
      </div>

      <!-- 📱 MAIN CONTENT -->
      <div style="padding: 40px 30px;">
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-top: 0; margin-bottom: 16px;">
          Hello,
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
          You have been invited to join the <strong>${shopName}</strong> team on the SmartAutoTech platform. Activate your account to access your diagnostic dashboard and begin using SmartAutoTech’s AI-powered diagnostic tools designed for professional automotive technicians.
        </p>

        <!-- 🔑 PASSKEY CARD -->
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; text-align: center; border: 1px dashed #cbd5e1; margin: 28px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
            Your Temporary Passkey
          </p>
          <div style="display: inline-block; font-size: 28px; font-weight: bold; color: #0f172a; letter-spacing: 3px; font-family: 'Courier New', Courier, monospace; background-color: #ffffff; padding: 12px 28px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${passkey}
          </div>
        </div>

        <!-- 🚀 ACTIVATE BUTTON -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://automobile-frontend-six.vercel.app/login" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
            Activate Your Account
          </a>
        </div>

        <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 32px; margin-bottom: 0;">
          If you did not expect this invitation, please ignore this email.
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
};

