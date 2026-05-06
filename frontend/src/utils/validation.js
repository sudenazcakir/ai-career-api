export function splitSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function splitLines(value) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

export function validatePhoneNumber(value) {
  const normalized = normalizePhoneNumber(value);

  if (normalized.startsWith("0")) {
    return "Phone number must be 10 digits and must not start with 0.";
  }

  if (normalized.length !== 10) {
    return "Phone number must be exactly 10 digits.";
  }

  return "";
}

export function validatePassword(value) {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Password must include at least one number.";
  if (!/[^\w\s]/.test(value)) {
    return "Password must include at least one special character.";
  }
  return "";
}

export function validateEmail(value) {
  if (!value.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Email format is invalid.";
  }
  return "";
}

export function validateAuthForm(form, mode) {
  const errors = {};

  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (mode === "register") {
    const passwordError = validatePassword(form.password);
    if (passwordError) errors.password = passwordError;
  }

  const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]*$/;

  if (mode === "register") {
    if (!form.firstName.trim()) {
      errors.firstName = "First name is required.";
    } else if (!NAME_PATTERN.test(form.firstName.trim())) {
      errors.firstName = "Use letters, spaces, hyphens, or apostrophes only.";
    }

    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required.";
    } else if (!NAME_PATTERN.test(form.lastName.trim())) {
      errors.lastName = "Use letters, spaces, hyphens, or apostrophes only.";
    }

    const phoneError = validatePhoneNumber(normalizePhoneNumber(form.phoneNumber));
    if (phoneError) errors.phone = phoneError;

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

export function firstError(errors) {
  return Object.values(errors)[0] || "";
}

export function friendlyErrorMessage(message) {
  if (!message) return "Something went wrong.";

  const normalized = String(message).toLowerCase();
  if (normalized.includes("expected pattern")) {
    return "The server rejected one field format. Please check email and phone number.";
  }

  if (normalized.includes("email is already registered")) {
    return "This email address is already registered.";
  }

  if (normalized.includes("invalid email or password")) {
    return "Email or password is incorrect.";
  }

  if (normalized.includes("database is not connected")) {
    return "Database is not connected. Please check the backend.";
  }

  return message;
}

export function normalizePassportForAI(passport) {
  const ITEM_SEP = "||";
  const FIELD_SEP = "::";
  const normalized = { ...passport };

  if (passport.projects && (passport.projects.includes(ITEM_SEP) || passport.projects.includes(FIELD_SEP))) {
    normalized.projects = passport.projects
      .split(ITEM_SEP)
      .map((item) => {
        const idx = item.indexOf(FIELD_SEP);
        if (idx >= 0) {
          const title = item.slice(0, idx).trim();
          const desc = item.slice(idx + FIELD_SEP.length).trim();
          return [title, desc].filter(Boolean).join(" - ");
        }
        return item.trim();
      })
      .filter(Boolean)
      .join("; ");
  }

  if (passport.certificates && (passport.certificates.includes(ITEM_SEP) || passport.certificates.includes(FIELD_SEP))) {
    normalized.certificates = passport.certificates
      .split(ITEM_SEP)
      .map((item) => {
        const parts = item.split(FIELD_SEP);
        const title = (parts[0] || "").trim();
        const issuer = (parts[1] || "").trim();
        const link = (parts[2] || "").trim();
        return [title, issuer && `(${issuer})`, link].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join("; ");
  }

  return normalized;
}

export function inferExpectedPatternError(form) {
  const namePattern = /^[A-Za-z][A-Za-z\s'-]*$/;

  if (form.firstName && !namePattern.test(form.firstName.trim())) {
    return {
      firstName: "First name contains unsupported characters. Use English letters only.",
    };
  }

  if (form.lastName && !namePattern.test(form.lastName.trim())) {
    return {
      lastName: "Last name contains unsupported characters. Use English letters only.",
    };
  }

  const emailError = validateEmail(form.email || "");
  if (emailError) return { email: emailError };

  const phoneError = validatePhoneNumber(form.phoneNumber || "");
  if (phoneError) return { phone: phoneError };

  const passwordError = validatePassword(form.password || "");
  if (passwordError) return { password: passwordError };

  return {
    form: "The server rejected a field format, but did not say which field.",
  };
}
