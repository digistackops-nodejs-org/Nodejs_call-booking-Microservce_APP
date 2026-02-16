const nodemailer = require("nodemailer");
const { SESClient, SendRawEmailCommand } = require("@aws-sdk/client-ses");

// Create SES Client
const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create Nodemailer transporter using SES
const transporter = nodemailer.createTransport({
  SES: { ses, aws: { SendRawEmailCommand } },
});

// Main Send Mail Function
exports.sendMail = async (
  to = "bar@example.com",
  name = "User Name",
  forRole = "user"
) => {
  try {
    const mailOptions = {
      from: `"Admin" <${process.env.SES_FROM_EMAIL}>`,
      to,
      subject:
        forRole === "user"
          ? "Booking Confirmation ✔"
          : "New Booking Alert 🚀",
      text:
        forRole === "user"
          ? "Your booking is confirmed. Somebody from the team will contact you soon."
          : "You have received a new booking. Please login to admin dashboard.",
      html:
        forRole === "user"
          ? getUserTemplate(name)
          : getAdminTemplate(),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("SES Email Error:", error);
    throw error;
  }
};


const getUserTemplate = (name = "User") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>
<body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:8px; text-align:center;">
    <h2 style="color:#198754;">Hello ${name},</h2>
    <p style="font-size:16px; color:#333;">
      ✅ Your booking has been successfully confirmed.
    </p>
    <p style="font-size:14px; color:#666;">
      Our team will contact you shortly with further details.
    </p>
    <hr style="margin:20px 0;" />
    <p style="font-size:12px; color:#999;">
      Thank you for choosing our service.
    </p>
  </div>
</body>
</html>
`;


const getAdminTemplate = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
</head>
<body style="font-family: Arial, sans-serif; background:#eef2ff; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:8px; text-align:center;">
    <h2 style="color:#0d6efd;">New Booking Received 🚀</h2>
    <p style="font-size:16px; color:#333;">
      A new booking has been made.
    </p>
    <p style="font-size:14px; color:#666;">
      Please login to the admin dashboard to view full details.
    </p>
    <hr style="margin:20px 0;" />
    <p style="font-size:12px; color:#999;">
      This is an automated notification.
    </p>
  </div>
</body>
</html>
`;

