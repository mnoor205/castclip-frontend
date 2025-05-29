import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, text, html }: { to: string, subject: string, text?: string, html?: string }) {
  const info = await transporter.sendMail({
    from: `"CastClip" <${process.env.SMTP_USER}>`, // Sender address
    to, // Recipient
    subject,
    text,
    html,
  });
  return info;
}
