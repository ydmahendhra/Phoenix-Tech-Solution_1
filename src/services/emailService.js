const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }
  return transporter;
};

const sendProjectAssignmentEmail = async ({ intern, project, adminName }) => {
  const emailId = `EML-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const subject = `New Project Assigned – Phoenix Tech Solutions`;
  const assignedDateStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const deadlineStr = project.deadline
    ? new Date(project.deadline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Not Specified';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 20px; color: #e2e8f0; }
        .card { max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { display: flex; align-items: center; border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; }
        .logo-text { font-size: 20px; font-weight: 700; color: #f97316; letter-spacing: 0.5px; }
        .logo-sub { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; }
        .greeting { font-size: 16px; color: #f8fafc; margin-bottom: 16px; }
        .details-box { background: #1e293b; border-radius: 8px; border-left: 4px solid #6366f1; padding: 18px; margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 8px; font-size: 14px; }
        .detail-label { width: 140px; font-weight: 600; color: #94a3b8; }
        .detail-value { color: #f1f5f9; flex: 1; }
        .cta-btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .footer { border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 24px; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div>
            <div class="logo-text">PHOENIX TECH SOLUTIONS</div>
            <div class="logo-sub">Enterprise Project & Intern Management System</div>
          </div>
        </div>
        
        <div class="greeting">Dear <strong>${intern.fullName}</strong>,</div>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          A new project has been officially assigned to you by <strong>${adminName}</strong> at Phoenix Tech Solutions.
        </p>

        <div class="details-box">
          <div class="detail-row"><span class="detail-label">Intern Name:</span><span class="detail-value">${intern.fullName}</span></div>
          <div class="detail-row"><span class="detail-label">Intern ID:</span><span class="detail-value">${intern.internId}</span></div>
          <div class="detail-row"><span class="detail-label">Project Name:</span><span class="detail-value">${project.projectName}</span></div>
          <div class="detail-row"><span class="detail-label">Project ID:</span><span class="detail-value">${project.projectId}</span></div>
          <div class="detail-row"><span class="detail-label">Description:</span><span class="detail-value">${project.description || 'N/A'}</span></div>
          <div class="detail-row"><span class="detail-label">Assigned Date:</span><span class="detail-value">${assignedDateStr}</span></div>
          <div class="detail-row"><span class="detail-label">Project Deadline:</span><span class="detail-value">${deadlineStr}</span></div>
          <div class="detail-row"><span class="detail-label">Assigned By:</span><span class="detail-value">${adminName}</span></div>
        </div>

        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
          Please log in to your Phoenix Tech Solutions Intern Dashboard to view complete objectives, specifications, and start preparing your weekly work deliverables.
        </p>

        <center>
          <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="cta-btn">Access Intern Portal &rarr;</a>
        </center>

        <div class="footer">
          <strong>Best Regards,</strong><br>
          Phoenix Tech Solutions<br>
          Project Management Team & Executive Board
        </div>
      </div>
    </body>
    </html>
  `;

  let deliveryStatus = 'MOCKED_SUCCESS';
  let errorMessage = '';

  try {
    const mailer = getTransporter();
    if (mailer) {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || '"Phoenix Tech Solutions" <notifications@phoenixtechsolutions.com>',
        to: intern.email,
        subject,
        html: htmlContent
      });
      deliveryStatus = 'SENT';
      console.log(`[Email] Live email successfully dispatched to ${intern.email}`);
    } else {
      // SMTP credentials not configured yet, record as mocked success so workflow is uninterrupted
      deliveryStatus = 'MOCKED_SUCCESS';
      console.log(`[Email Mock] Transporter unconfigured. Recorded simulated dispatch to: ${intern.email}`);
    }
  } catch (error) {
    deliveryStatus = 'FAILED';
    errorMessage = error.message;
    console.error(`[Email Error] Failed dispatch to ${intern.email}: ${error.message}`);
  }

  // Record log in MongoDB
  const log = await EmailLog.create({
    emailId,
    recipient: intern.email,
    recipientName: intern.fullName,
    internId: intern.internId,
    projectId: project.projectId,
    projectName: project.projectName,
    subject,
    deliveryStatus,
    errorMessage,
    sentAt: new Date()
  });

  return log;
};

module.exports = {
  sendProjectAssignmentEmail,
  getTransporter
};
