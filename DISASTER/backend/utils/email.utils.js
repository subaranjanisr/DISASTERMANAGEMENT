// ============================================================
// Email Utility — Send transactional emails
// ============================================================

const nodemailer = require('nodemailer');

/**
 * Send an email via Nodemailer
 * @param {object} options  { to, subject, text, html }
 */
const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `SAFEGUARD <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Send Password Reset Email
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, Arial, sans-serif; background:#0a0e1a; padding:40px;">
      <div style="max-width:520px; margin:0 auto; background:#12182b; border-radius:16px; padding:40px; color:#e2e8f0;">
        <div style="text-align:center; margin-bottom:32px;">
          <span style="font-size:40px;">🛡️</span>
          <h1 style="color:#667eea; margin:8px 0; font-size:24px;">SAFEGUARD</h1>
        </div>
        <h2 style="color:#ffffff; margin-bottom:16px;">Reset Your Password</h2>
        <p style="color:#94a3b8; line-height:1.6;">
          Hello ${user.firstName},<br><br>
          You requested a password reset. Click the link below to set a new password. 
          This link expires in <strong style="color:#f59e0b;">10 minutes</strong>.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="${resetUrl}" 
             style="background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; 
                    text-decoration:none; padding:14px 32px; border-radius:8px; 
                    font-weight:600; display:inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color:#64748b; font-size:13px;">
          If you didn't request this, please ignore this email. Your account remains secure.
        </p>
        <hr style="border-color:#1e2a45; margin:24px 0;">
        <p style="color:#475569; font-size:12px; text-align:center;">
          © ${new Date().getFullYear()} SAFEGUARD. All rights reserved.
        </p>
      </div>
    </body>
    </html>`;

    await sendEmail({
        to: user.email,
        subject: '🔐 SAFEGUARD - Password Reset Request',
        text: `Your password reset link: ${resetUrl}`,
        html,
    });
};

/**
 * Send Welcome Email after successful registration
 */
const sendWelcomeEmail = async (user) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Inter, Arial, sans-serif; background:#0a0e1a; padding:40px;">
      <div style="max-width:520px; margin:0 auto; background:#12182b; border-radius:16px; padding:40px; color:#e2e8f0;">
        <div style="text-align:center; margin-bottom:32px;">
          <span style="font-size:40px;">🛡️</span>
          <h1 style="color:#667eea; margin:8px 0; font-size:24px;">Welcome to SAFEGUARD</h1>
        </div>
        <h2 style="color:#ffffff;">Hello, ${user.firstName}! 🎉</h2>
        <p style="color:#94a3b8; line-height:1.6;">
          Your account has been created successfully as a 
          <strong style="color:#667eea; text-transform:capitalize;">${user.role}</strong>.
        </p>
        ${user.role === 'student' ? `
        <div style="background:#1e2a45; border-radius:12px; padding:20px; margin:20px 0;">
          <p style="margin:4px 0; color:#94a3b8;"><strong style="color:#e2e8f0;">Student ID:</strong> ${user.studentId}</p>
          <p style="margin:4px 0; color:#94a3b8;"><strong style="color:#e2e8f0;">Institution:</strong> ${user.institution || 'N/A'}</p>
        </div>` : ''}
        <p style="color:#94a3b8; line-height:1.6;">
          Start your journey toward becoming disaster-ready. Complete drills, earn badges, 
          and protect your community!
        </p>
        <hr style="border-color:#1e2a45; margin:24px 0;">
        <p style="color:#475569; font-size:12px; text-align:center;">
          © ${new Date().getFullYear()} SAFEGUARD. Every life matters.
        </p>
      </div>
    </body>
    </html>`;

    await sendEmail({
        to: user.email,
        subject: '🛡️ Welcome to SAFEGUARD - Your Safety Journey Begins!',
        text: `Welcome ${user.firstName}! Your SAFEGUARD account is ready. Student ID: ${user.studentId || 'N/A'}`,
        html,
    });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendWelcomeEmail };
