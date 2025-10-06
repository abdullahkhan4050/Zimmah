"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
admin.initializeApp();
// Set SendGrid API Key directly.
// IMPORTANT: For better security, it's recommended to store this key in Firebase environment configuration.
// Run: firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
// And then use: sgMail.setApiKey(functions.config().sendgrid.key);
mail_1.default.setApiKey("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");
// Function: trigger when new pending_users doc is created
exports.sendOtpEmail = functions.firestore
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
        await mail_1.default.send(msg);
        console.log(`✅ OTP email sent to ${email}`);
    }
    catch (error) {
        console.error("❌ Error sending email:", error.toString());
        if (error.response) {
            console.error("Error Body:", error.response.body);
        }
    }
});
//# sourceMappingURL=index.js.map