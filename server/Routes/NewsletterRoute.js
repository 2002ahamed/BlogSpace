import express from "express";
import nodemailer from "nodemailer";
const router = express.Router();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// API endpoint to handle newsletter subscription
router.post("/newsletter", async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  // Email options
  const mailOptions = {
    from: `"Nafish|BlogSpace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to Nafish|BlogSpace Newsletter!",
    text: `Thank you for subscribing to our newsletter!\n\nYou're now part of our community. Stay tuned for the latest stories, updates, and insights delivered straight to your inbox.\n\nBest,\nThe Nafish|BlogSpace Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <h2 style="color: #1e3a8a;">Welcome to Nafish|BlogSpace!</h2>
        <p style="color: #334155;">Thank you for subscribing to our newsletter!</p>
        <p style="color: #334155;">You're now part of our community. Stay tuned for the latest stories, updates, and insights delivered straight to your inbox.</p>
        <p style="color: #334155;">Best,<br>The Nafish|BlogSpace Team</p>
        <hr style="border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #64748b;">If you did not subscribe to this newsletter, please ignore this email or contact us at <a href="mailto:nafish.ruet21@gmail.com">nafish.ruet21@gmail.com</a>.</p>
      </div>
    `,
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Subscription successful" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

export default router;