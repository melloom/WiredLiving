
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { siteConfig } from '@/config/site';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Configure transporter (use environment variables for credentials in production)
    // Try both secure: true (465) and secure: false (587) if needed
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // Hostinger supports TLS on 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `WiredLiving Contact <${process.env.SMTP_USER}>`,
      to: siteConfig.author.email,
      subject: `[Contact Form] ${subject}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage:\n${message}`,
      html: `<p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Subject:</b> ${subject}</p><p><b>Message:</b><br/>${message.replace(/\n/g, '<br/>')}</p>`
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info);
      return NextResponse.json({ success: true });
    } catch (mailError) {
      console.error('Nodemailer error:', mailError);
      return NextResponse.json({ error: 'Email sending failed', details: mailError instanceof Error ? mailError.message : mailError }, { status: 500 });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
