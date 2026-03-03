const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const { SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP credentials are missing');
  }

  const createTransporter = (config) => {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      ...config
    });
  };

  let transporter = createTransporter({ port: 465, secure: true });

  try {
    await transporter.verify();
  } catch (err) {
    transporter = createTransporter({
      port: 587,
      secure: false,
      requireTLS: true,
      tls: {
        servername: 'smtp.gmail.com'
      }
    });
    await transporter.verify();
  }

  return await transporter.sendMail({
    from: `SAVES Booking <${SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    attachments
  });
};

module.exports = sendEmail;
