import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import sgMail from "@sendgrid/mail";

admin.initializeApp();

// Set SendGrid API Key from Firebase environment
// In your terminal, run: firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
sgMail.setApiKey(functions.config().sendgrid.key);

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

    if (!email || !otp) {
        console.error("Missing email or OTP in document data", data);
        return;
    }

    const msg = {
      to: email,
      from: "verification@zimmah.com", // This must be a verified sender in SendGrid
      subject: "Your Zimmah Verification Code",
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `<strong>Your verification code is: ${otp}</strong>. It will expire in 10 minutes.`,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (error) {
      console.error("❌ Error sending email:", error);
    }
  });
