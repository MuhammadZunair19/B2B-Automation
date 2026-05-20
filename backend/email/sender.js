import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_APP_PASSWORD
      }
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD) {
    throw new Error('SMTP credentials are missing. Copy backend/.env.example to backend/.env and fill it in.');
  }

  const info = await getTransporter().sendMail({
    from: `"${process.env.SENDER_NAME || 'Your Name'}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text
  });

  return info;
}
