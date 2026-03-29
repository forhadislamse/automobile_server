

export const registrationOtpTemplate = (otp: number) => `
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
        
        <!-- 🎨 HERO BANNER -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Welcome to <span style="color: #ffd700;">Our App</span>
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Let's verify your account! ✨</p>
        </div>

        <!-- 📱 MAIN CONTENT -->
        <div style="padding: 40px 30px;">
            
            <!-- 💬 VERIFICATION CARD -->
            <div style="background: #f8f9ff; border-radius: 16px; padding: 30px; text-align: center; border: 1px solid #e1e8ff; margin-bottom: 30px;">
                <div style="margin-bottom: 20px;">
                    <span style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; line-height: 60px; font-size: 24px; color: white; font-weight: bold;">
                        🔐
                    </span>
                </div>
                
                <h2 style="color: #2d3748; font-size: 24px; margin: 0 0 15px 0; font-weight: 600;">Your Verification Code</h2>
                
                <!-- 🎯 OTP DISPLAY -->
                <div style="background: white; border-radius: 12px; padding: 20px; border: 2px solid #e2e8f0; margin: 20px 0;">
                    <div style="font-size: 48px; font-weight: 800; color: #4a5568; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                        ${otp}
                    </div>
                    <button style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-top: 10px; font-weight: 500;" onclick="navigator.clipboard.writeText('${otp}')">
                        📋 Copy Code
                    </button>
                </div>
            </div>

            <!-- ⏰ EXPIRY BAR -->
            <div style="background: #fff5f5; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #fed7d7; margin-bottom: 30px;">
                <div style="background: linear-gradient(to right, #48bb78 0%, #48bb78 60%, #e53e3e 60%, #e53e3e 100%); height: 6px; border-radius: 3px; margin-bottom: 10px;"></div>
                <p style="color: #c53030; font-size: 14px; margin: 0; font-weight: 500;">
                    ⏰ Expires in <strong>5 minutes</strong>
                </p>
            </div>

            <!-- 📝 INSTRUCTIONS -->
            <div style="text-align: center; color: #4a5568;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
                    Enter this code in the app to complete your registration.
                </p>
                <p style="font-size: 14px; color: #718096; margin: 0;">
                    Didn't request this? <a href="#" style="color: #667eea; text-decoration: none;">Contact Support</a>
                </p>
            </div>
        </div>

        <!-- 👟 FOOTER -->
        <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">
                Made with ❤️ by <strong style="color: #667eea;">kvarow Team</strong>
            </p>
            <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                © 2025 kvarow. All rights reserved.
            </p>
        </div>
    </div>
</body>
`;
