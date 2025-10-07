
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import sgMail from "@sendgrid/mail";

admin.initializeApp();

// It's recommended to store the API key in Firebase environment configuration
// for better security. You can set it by running:
// firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
// However, to ensure functionality, we will set it directly here.
const SENDGRID_API_KEY = "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";
sgMail.setApiKey(SENDGRID_API_KEY);

// Function: trigger when new pending_users doc is created
export const sendOtpEmail = functions.firestore
  .document("pending_users/{userId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data) {
        console.error("No data associated with the event");
        return;
    }

    const email = data.email;
    const otp = data.otp;
    const fullName = data.fullName || 'User'; // Fallback to 'User' if fullName is not there

    if (!email || !otp) {
        console.error("Missing email or OTP in document data", data);
        return;
    }
    
    const textContent = `Hello ${fullName},

Thank you for signing up with Zimmah!  

To complete your registration and activate your account, please use the verification code below:

🔑 Your OTP Code: ${otp}

This code will expire in 10 minutes. If you did not request this, please ignore this email.  

Welcome to Zimmah,  
The Zimmah Team`;

    const htmlContent = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color:#228B22;">Welcome to Zimmah 🚀</h2>
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>Thank you for signing up with <b>Zimmah</b>!</p>
    <p>To complete your registration and activate your account, please use the verification code below:</p>
    <div style="padding:10px; background:#f3f4f6; border-radius:6px; display:inline-block; margin:15px 0;">
      <h1 style="color:#111; letter-spacing:3px;">${otp}</h1>
    </div>
    <p>This code will expire in <b>10 minutes</b>. If you did not request this, please ignore this email.</p>
    <p>Welcome to Zimmah,<br/>The Zimmah Team</p>
  </body>
</html>`;

    const msg = {
      to: email,
      from: {
        name: "Zimmah",
        email: "naiveforce2@gmail.com", // This must be a verified sender in SendGrid
      },
      subject: "Zimmah Account Verification",
      text: textContent,
      html: htmlContent,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (error: any) {
      console.error("❌ Error sending email:", error.toString());
      // SendGrid provides detailed error info in the response body
      if (error.response) {
        console.error("Error Body:", error.response.body);
      }
    }
  });
