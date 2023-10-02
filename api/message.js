import nodemailer from "nodemailer";
export default function handler(request, response) {
  const { name, email, message } = request.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email_name,
      pass: process.env.email_password
    }
  });

  const mailOptions = {
    from: email,
    to: process.env.email_name,
    subject: "CodingWithSandy - Inquiry",
    text: `
        From: ${name}

        ${message}
      `
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      return response.json({ error: "There was an error sending your email. Contact site administrator." });
    } else {
      return response.json({ success: "Thank you for contacting me. I will respond as soon as possible!" });
    }
  });
}
