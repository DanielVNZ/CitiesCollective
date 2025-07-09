import nodemailer from 'nodemailer';

// Create transporter for Google Workspace SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER || 'support@citiescollective.space',
    pass: process.env.EMAIL_PASSWORD, // App password from Google Workspace
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates in development
  },
});

export async function sendPasswordResetEmail(email: string, resetToken: string, username: string) {
  // Verify connection first
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return { success: false, error };
  }

  const resetUrl = `${process.env.NEXTAUTH_URL || 'https://citiescollective.space'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Cities Collective" <${process.env.EMAIL_USER || 'support@citiescollective.space'}>`,
    to: email,
    subject: 'Reset Your Password - Cities Collective',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏙️ Cities Collective</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${username}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            We received a request to reset your password for your Cities Collective account. 
            If you didn't make this request, you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons. 
            If you need to reset your password after that, please request a new reset link.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button above doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #667eea; font-size: 14px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent from a notification-only address that cannot accept incoming email. 
            Please do not reply to this message.
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you have any questions, please contact us at 
            <a href="mailto:support@citiescollective.space" style="color: #667eea;">support@citiescollective.space</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Reset Your Password - Cities Collective
      
      Hello ${username}!
      
      We received a request to reset your password for your Cities Collective account. 
      If you didn't make this request, you can safely ignore this email.
      
      To reset your password, click the link below:
      ${resetUrl}
      
      Important: This link will expire in 1 hour for security reasons. 
      If you need to reset your password after that, please request a new reset link.
      
      If you have any questions, please contact us at support@citiescollective.space
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
} 