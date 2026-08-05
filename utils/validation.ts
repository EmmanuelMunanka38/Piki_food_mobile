export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone);
}

const EMAIL_LOCAL_PART = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const EMAIL_DOMAIN_PART = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254 || email.includes(' ')) return false;
  const atIndex = email.lastIndexOf('@');
  if (atIndex <= 0 || atIndex >= email.length - 1) return false;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length > 64 || !EMAIL_LOCAL_PART.test(local)) return false;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((l) => !EMAIL_DOMAIN_PART.test(l) || l.length === 0)) return false;
  const tld = labels[labels.length - 1];
  return tld.length >= 2;
}

const TANZANIA_PREFIX = '255';

export function isValidTanzanianPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-+]/g, '');
  if (digits.startsWith(TANZANIA_PREFIX)) {
    return /^255\d{9}$/.test(digits);
  }
  return /^\d{9}$/.test(digits);
}

export function normalizeTanzanianPhone(input: string): string {
  let digits = input.replace(/[\s-+]/g, '');
  if (digits.startsWith(TANZANIA_PREFIX)) {
    digits = digits.slice(TANZANIA_PREFIX.length);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.replace(/\D/g, '').slice(0, 9);
}

export function isValidOTP(code: string): boolean {
  return /^\d{4}$/.test(code);
}

export function isValidPrice(price: number): boolean {
  return price > 0 && Number.isFinite(price);
}
