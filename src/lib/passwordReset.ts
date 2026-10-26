export const PASSWORD_RESET_SENT_MESSAGE =
  'If an account exists for this email, a password-reset message has been sent.';

export type PasswordResetResult = {
  status: 'sent' | 'invalid' | 'error';
  message: string;
};

const ENUMERATION_SAFE_CODES = new Set([
  'auth/user-not-found',
  'auth/user-disabled',
  'auth/invalid-credential',
]);

export function validatePasswordResetEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter the email address for your account.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function passwordResetFailureMessage(code: string | undefined): string | null {
  if (code && ENUMERATION_SAFE_CODES.has(code)) return null;
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Unable to send the reset message. Check your connection and try again.';
  }
  return 'Unable to send the reset message. Please try again.';
}

function errorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export async function submitPasswordReset(
  email: string,
  sendReset: (normalizedEmail: string) => Promise<void>
): Promise<PasswordResetResult> {
  const validationError = validatePasswordResetEmail(email);
  if (validationError) {
    return { status: 'invalid', message: validationError };
  }

  try {
    await sendReset(email.trim());
    return { status: 'sent', message: PASSWORD_RESET_SENT_MESSAGE };
  } catch (err: unknown) {
    const failure = passwordResetFailureMessage(errorCode(err));
    if (failure === null) {
      return { status: 'sent', message: PASSWORD_RESET_SENT_MESSAGE };
    }
    return { status: 'error', message: failure };
  }
}
