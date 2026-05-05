export function splitSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function normalizePhoneNumber(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function validatePhoneNumber(value) {
  if (/[^0-9]/.test(value)) {
    return "Telefon numarasi sadece rakamlardan olusmalidir.";
  }

  if (value.startsWith("0")) {
    return "Telefon numarasi basinda 0 olmadan 10 haneli olmalidir.";
  }

  if (value.length !== 10) {
    return "Telefon numarasi 10 haneli olmalidir.";
  }

  return "";
}

export function validatePassword(value) {
  if (value.length < 8) return "Sifre en az 8 karakter olmalidir.";
  if (!/[A-Z]/.test(value)) return "Sifre en az bir buyuk harf icermelidir.";
  if (!/[a-z]/.test(value)) return "Sifre en az bir kucuk harf icermelidir.";
  if (!/[0-9]/.test(value)) return "Sifre en az bir rakam icermelidir.";
  if (!/[.!@#$%^&*\-_]/.test(value)) {
    return "Sifre en az bir ozel karakter icermelidir.";
  }
  return "";
}

export function validateEmail(value) {
  if (!value.trim()) return "Email zorunludur.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Gecerli bir email adresi giriniz.";
  }
  return "";
}

export function validateAuthForm(form, mode) {
  const errors = {};

  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;

  if (!form.password) {
    errors.password = "Sifre zorunludur.";
  } else if (mode === "register") {
    const passwordError = validatePassword(form.password);
    if (passwordError) errors.password = passwordError;
  }

  if (mode === "register") {
    if (!form.firstName.trim()) errors.firstName = "First name zorunludur.";
    if (!form.lastName.trim()) errors.lastName = "Last name zorunludur.";

    const phoneError = validatePhoneNumber(form.phoneNumber);
    if (phoneError) errors.phone = phoneError;

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Sifreler eslesmiyor.";
    }
  }

  return errors;
}

export function firstError(errors) {
  return Object.values(errors)[0] || "";
}
