// export const forgotPasswordTemplate = (otp: number) => `
// <body style="margin:0; padding:0; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height:100vh;">
    
//     <div style="max-width:420px; margin:40px auto; background:white; border-radius:24px; box-shadow:0 20px 40px rgba(0,0,0,0.1); overflow:hidden;">
        
//         <!-- Beautiful Header -->
//         <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:40px 30px; text-align:center; color:white; position:relative; overflow:hidden;">
//             <!-- Decorative Elements -->
//             <div style="position:absolute; top:-20px; right:-20px; width:80px; height:80px; background:#5a67d8; border-radius:50%; opacity:0.3;"></div>
//             <div style="position:absolute; bottom:-20px; left:-20px; width:60px; height:60px; background:#764ba2; border-radius:50%; opacity:0.3;"></div>
            
//             <!-- Lock Icon -->
//             <div style="width:70px; height:70px; background:white; border-radius:20px; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(0,0,0,0.2);">
//                 <span style="font-size:32px;">🔓</span>
//             </div>
            
//             <h1 style="margin:0 0 8px; font-size:28px; font-weight:700; letter-spacing:-0.5px;">Reset Your Password</h1>
//             <p style="margin:0; font-size:16px; opacity:0.9; font-weight:300;">Enter the code below to continue</p>
//         </div>
        
//         <!-- OTP Section -->
//         <div style="padding:50px 40px; text-align:center;">
//             <!-- OTP Box -->
//             <div style="background:linear-gradient(145deg, #f8f9ff, #f0f2ff); border:2px solid #e1e5ff; border-radius:16px; padding:30px; margin-bottom:25px; box-shadow:0 8px 25px rgba(102, 126, 234, 0.1);">
//                 <div style="font-size:52px; font-weight:800; color:#2d3748; letter-spacing:12px; margin:0; font-family:'SF Mono', 'Roboto Mono', monospace; text-shadow:0 2px 4px rgba(0,0,0,0.05);">
//                     ${otp}
//                 </div>
//             </div>
            
//             <!-- Timer -->
//             <div style="background:#f7fafc; border-radius:12px; padding:15px 20px; margin-bottom:30px;">
//                 <p style="margin:0; color:#718096; font-size:14px; font-weight:500;">
//                     <span style="color:#667eea; font-weight:600;">⏰ Valid for 5 minutes</span>
//                 </p>
//             </div>
            
//             <!-- Instructions -->
//             <div style="max-width:280px; margin:0 auto;">
//                 <p style="color:#4a5568; margin:0 0 8px; font-size:15px; font-weight:500; line-height:1.5;">Copy this 6-digit code and enter it in the app</p>
//                 <p style="color:#a0aec6; margin:0; font-size:13px; line-height:1.4;">Didn't request this? <span style="color:#e53e3e;">Ignore this email</span></p>
//             </div>
//         </div>
        
//         <!-- Beautiful Footer -->
//         <div style="padding:30px 40px; background:#f8fafc; border-top:1px solid #e2e8f0; text-align:center;">
//             <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:15px;">
//                 <div style="width:20px; height:2px; background:#667eea;"></div>
//                 <span style="color:#a0aec6; font-size:12px; font-weight:500;">SECURE RESET</span>
//                 <div style="width:20px; height:2px; background:#667eea;"></div>
//             </div>
//             <p style="color:#a0aec6; font-size:13px; margin:0; line-height:1.4;">
//                 Your security is our priority. This code expires automatically.
//             </p>
//         </div>
        
//     </div>
    
//     <!-- Mobile Responsive Spacer -->
//     <div style="height:40px;"></div>
// </body>
// `;

export const forgotPasswordTemplate = (otp: number) => `
<div style="margin: 0; padding: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; min-height: 100%;">
  <div style="width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      
      <!-- 🎨 HEADER BANNER -->
      <div style="background-color: #f1f5f9; padding: 45px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a;">
          SmartAutoTech
        </h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; color: #475569; font-weight: bold;">
          Reset Your Password
        </p>
      </div>

      <!-- 📱 MAIN CONTENT -->
      <div style="padding: 40px 30px;">
        
        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-top: 0; margin-bottom: 16px;">
          Hello,
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
          Use the verification code below to reset your password:
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
          If you did not request a password reset, you can safely ignore this email.
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
