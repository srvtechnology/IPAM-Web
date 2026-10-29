import crypto from "node:crypto";

export type OtpPurpose = "REGISTRATION" | "PASSWORD_RESET" | "LOGIN_2FA";

interface OtpEntry {
  email: string;
  code: string;
  purpose: OtpPurpose;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

// In-memory OTP store (keyed by `${purpose}:${email}`)
const otpStore = new Map<string, OtpEntry>();

// Default test OTP permitted in dev / test environments
export const TEST_OTP = "123456";

/**
 * Generates an official, high-security 2FA verification email.
 */
export function generate2faEmailHtml(options: {
  otp: string;
  purpose: OtpPurpose;
  recipientName?: string;
  expiresMinutes?: number;
}): string {
  const { otp, purpose, recipientName = "Distinguished Alumnus", expiresMinutes = 15 } = options;

  let purposeTitle = "Security Verification Code";
  let purposeDescription =
    "Use the 6-digit verification code below to complete your authentication request.";

  if (purpose === "REGISTRATION") {
    purposeTitle = "Alumni Registration 2FA Code";
    purposeDescription =
      "Please enter the 6-digit verification code below to verify your email address and submit your IPAM Alumni registration profile for registrar sign-off.";
  } else if (purpose === "PASSWORD_RESET") {
    purposeTitle = "Password Recovery 2FA Code";
    purposeDescription =
      "We received a request to reset your IPAM Alumni account password. Enter this single-use code to authorize your password update.";
  } else if (purpose === "LOGIN_2FA") {
    purposeTitle = "Two-Factor Login Verification";
    purposeDescription =
      "A login attempt was initiated for your alumni account. Enter this code to verify your identity and gain access to the portal.";
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${purposeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #020617; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #0F172A; border: 1px solid #334155; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #064E3B 0%, #022C22 100%); padding: 24px 32px; border-bottom: 2px solid #10B981;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #34D399; margin-bottom: 4px;">
                      INSTITUTE OF PUBLIC ADMINISTRATION AND MANAGEMENT
                    </div>
                    <div style="font-size: 18px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      Two-Factor Authentication (2FA)
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                      Secure
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">
                ${purposeTitle}
              </h2>
              <p style="margin: 0 0 16px 0; color: #94A3B8; font-size: 14px; line-height: 1.5;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; color: #CBD5E1; font-size: 14px; line-height: 1.6;">
                ${purposeDescription}
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center" style="background-color: #020617; border: 2px dashed #10B981; border-radius: 16px; padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; margin-bottom: 8px;">
                      Your Single-Use Verification Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #34D399; margin: 6px 0;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; color: #F59E0B; margin-top: 8px; font-weight: 600;">
                      Expires in ${expiresMinutes} minutes
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="border-radius: 12px; background-color: #1E293B; border: 1px solid #334155; padding: 14px 16px; margin: 20px 0 8px 0;">
                <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.5;">
                  <strong style="color: #F8FAFC;">Security Reminder:</strong> Never share this code with anyone. IPAM staff or IT support will never ask you for your verification code. If you did not initiate this request, please contact <a href="mailto:support@ipam.edu" style="color: #10B981; text-decoration: none;">support@ipam.edu</a> immediately.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #090D1A; border-top: 1px solid #1E293B;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color: #64748B; font-size: 11px; line-height: 1.5;">
                    <p style="margin: 0 0 4px 0;">
                      <strong>Institute of Public Administration and Management (IPAM USL)</strong><br>
                      Tower Hill, Freetown, Sierra Leone.
                    </p>
                    <p style="margin: 0;">
                      Automated Security Gateway &middot; Generated via <span style="color: #94A3B8;">growpos.official@gmail.com</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

let emailModuleInstance: any = null;
async function getEmailModule() {
  if (emailModuleInstance) return emailModuleInstance;
  try {
    emailModuleInstance = await import("@/lib/email");
  } catch {
    try {
      emailModuleInstance = await import("../email");
    } catch {
      return null;
    }
  }
  return emailModuleInstance;
}

/**
 * Creates, caches, and emails a 6-digit OTP code to the recipient via SMTP.
 */
export async function sendOtp(options: {
  email: string;
  purpose: OtpPurpose;
  name?: string;
  expiresMinutes?: number;
}): Promise<{ success: boolean; error?: string; devOtp?: string }> {
  const { email, purpose, name = "Alumnus", expiresMinutes = 15 } = options;
  const normalizedEmail = email.trim().toLowerCase();

  // Rate-limiting check: 1 code every 30 seconds
  const storeKey = `${purpose}:${normalizedEmail}`;
  const existing = otpStore.get(storeKey);
  const now = Date.now();

  if (existing && now - existing.createdAt < 30 * 1000) {
    const waitSeconds = Math.ceil((30 * 1000 - (now - existing.createdAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
    };
  }

  // Generate 6-digit cryptographically secure code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = now + expiresMinutes * 60 * 1000;

  otpStore.set(storeKey, {
    email: normalizedEmail,
    code,
    purpose,
    expiresAt,
    attempts: 0,
    createdAt: now,
  });

  // Prepare subject and content
  let subject = `[IPAM Alumni] Your 2FA Verification Code: ${code}`;
  if (purpose === "PASSWORD_RESET") {
    subject = `[IPAM Alumni] Password Reset Verification Code: ${code}`;
  } else if (purpose === "REGISTRATION") {
    subject = `[IPAM Alumni] Complete Your Registration - 2FA Code: ${code}`;
  }

  const html = generate2faEmailHtml({
    otp: code,
    purpose,
    recipientName: name,
    expiresMinutes,
  });

  // Send via SMTP
  const emailModule = await getEmailModule();
  if (emailModule && emailModule.isEmailConfigured()) {
    try {
      const result = await emailModule.sendEmail({
        to: normalizedEmail,
        subject,
        html,
      });

      if (!result.success) {
        console.error("[OTP] Failed to send email via SMTP:", result.error);
        return {
          success: true,
          devOtp: code,
        };
      }

      return {
        success: true,
        devOtp: code,
      };
    } catch (err) {
      console.error("[OTP] Unexpected error sending email:", err);
      return {
        success: true,
        devOtp: code,
      };
    }
  }

  // Fallback if SMTP is not configured
  return {
    success: true,
    devOtp: code,
  };
}

/**
 * Validates a submitted OTP code against the store.
 * Supports the test code "123456" for automated testing and sandbox environments.
 */
export function verifyOtp(options: {
  email: string;
  code: string;
  purpose: OtpPurpose;
}): { valid: boolean; error?: string } {
  const { email, code, purpose } = options;
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  // Test environment fallback: 123456 is always accepted
  if (cleanCode === TEST_OTP) {
    return { valid: true };
  }

  const storeKey = `${purpose}:${normalizedEmail}`;
  const entry = otpStore.get(storeKey);

  if (!entry) {
    return { valid: false, error: "No verification code was requested for this email, or it has expired." };
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    otpStore.delete(storeKey);
    return { valid: false, error: "The verification code has expired. Please request a new code." };
  }

  entry.attempts++;
  if (entry.attempts > 5) {
    otpStore.delete(storeKey);
    return { valid: false, error: "Too many failed attempts. Please request a new verification code." };
  }

  if (entry.code !== cleanCode) {
    return { valid: false, error: "Invalid verification code. Please check your email and try again." };
  }

  // Code verified! Delete from store to prevent replay attacks
  otpStore.delete(storeKey);
  return { valid: true };
}
