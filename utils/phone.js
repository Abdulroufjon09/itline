// utils/phone.js
export function normalizePhone(raw) {
  let digits = raw.replace(/\D/g, "");

  // 0901234567 -> 901234567
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // 998901234567 -> 901234567 (keyin qayta +998 qo'shamiz)
  if (digits.length === 12 && digits.startsWith("998")) {
    digits = digits.slice(3);
  }

  // 9989012345678 kabi xato holatlar uchun
  if (digits.length === 13 && digits.startsWith("9989")) {
    digits = digits.slice(3, 12);
  }

  if (digits.length !== 9) {
    throw new Error("Noto'g'ri telefon raqami");
  }

  return "+998" + digits;
}