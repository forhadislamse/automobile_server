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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Welcome to ${shopName}!</h2>
      <p style="font-size: 16px; color: #555;">Hello,</p>
      <p style="font-size: 16px; color: #555;"> You have been invited by <strong>${shopName}</strong> to join their team as an assistant on the SmartAutoTech platform.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px dashed #007bff; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #888;">Use the following passkey to login:</p>
        <h3 style="margin: 10px 0; color: #007bff; letter-spacing: 2px;">${passkey}</h3>
      </div>
      <p style="font-size: 16px; color: #555;">You can login using your email and the passkey above at:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://regwheat-frontend.vercel.app/login" style="background-color: #007bff; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Dashboard</a>
      </div>
      <p style="font-size: 14px; color: #999; text-align: center;">If you did not expect this invitation, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; SmartAutoTech. All rights reserved.</p>
    </div>
  `;
};

