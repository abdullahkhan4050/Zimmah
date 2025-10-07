
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import twilio from "twilio";

admin.initializeApp();

// It's recommended to store your Twilio credentials in Firebase environment configuration
// for better security. You can set them by running:
// firebase functions:config:set twilio.sid="YOUR_TWILIO_ACCOUNT_SID"
// firebase functions:config:set twilio.token="YOUR_TWILIO_AUTH_TOKEN"
// firebase functions:config:set twilio.phone_number="+15017122661"
// However, to ensure functionality, we will set them directly here.
// PLEASE REPLACE THESE WITH YOUR ACTUAL TWILIO CREDENTIALS
const TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const TWILIO_AUTH_TOKEN = "your_auth_token";
const TWILIO_PHONE_NUMBER = "+15017122661"; // Your Twilio phone number

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Function: trigger when new pending_users doc is created to send SMS
export const sendOtpSms = functions.firestore
  .document("pending_users/{userId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data) {
        console.error("No data associated with the event");
        return;
    }

    const phone = data.phone;
    const otp = data.otp;

    if (!phone || !otp) {
        console.error("Missing phone number or OTP in document data", data);
        return;
    }
    
    const message = `Your Zimmah verification code is: ${otp}`;

    try {
      await twilioClient.messages.create({
        body: message,
        to: phone, // The user's phone number
        from: TWILIO_PHONE_NUMBER, // Your Twilio phone number
      });
      console.log(`✅ OTP SMS sent to ${phone}`);
    } catch (error: any) {
      console.error("❌ Error sending SMS:", error.toString());
    }
  });

    