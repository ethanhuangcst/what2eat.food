export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export type RegisterField =
  | "name"
  | "email"
  | "age"
  | "password"
  | "password_confirm"
  | "photo";

export type RegisterClientInput = {
  name: string;
  email: string;
  age: string;
  password: string;
  confirmPassword: string;
};

const FIELD_ORDER: RegisterField[] = [
  "name",
  "email",
  "age",
  "password",
  "password_confirm",
  "photo",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterClient(input: RegisterClientInput): Partial<Record<RegisterField, string>> {
  const errors: Partial<Record<RegisterField, string>> = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const ageRaw = input.age.trim();
  const password = input.password;
  const confirm = input.confirmPassword;

  if (!name) errors.name = "eat.errors.name_required";
  if (!email) errors.email = "eat.errors.email_required";
  else if (!EMAIL_RE.test(email)) errors.email = "eat.errors.email_invalid";
  if (ageRaw) {
    const age = Number(ageRaw);
    if (!Number.isFinite(age) || age < 13 || age > 120) errors.age = "eat.errors.age_out_of_range";
  }
  if (!password) errors.password = "eat.errors.password_required";
  else if (password.length < 8) errors.password = "eat.errors.password_too_short";
  if (!confirm) errors.password_confirm = "eat.errors.password_required";
  else if (confirm.length < 8) errors.password_confirm = "eat.errors.password_too_short";
  else if (password !== confirm) errors.password_confirm = "eat.errors.password_mismatch";

  return errors;
}

export function firstRegisterField(
  errors: Partial<Record<RegisterField, string>>,
): RegisterField | undefined {
  return FIELD_ORDER.find((field) => errors[field]);
}

export function mapApiErrorToField(key: string): {
  field?: RegisterField;
  errorKey: string;
  formLevel: boolean;
} {
  const eatKey = key.startsWith("errors.") ? `eat.errors.${key.slice("errors.".length)}` : key;

  switch (key) {
    case "errors.name_required":
      return { field: "name", errorKey: "eat.errors.name_required", formLevel: false };
    case "errors.email_required":
      return { field: "email", errorKey: "eat.errors.email_required", formLevel: false };
    case "errors.email_invalid":
      return { field: "email", errorKey: "eat.errors.email_invalid", formLevel: false };
    case "errors.email_taken":
      return { field: "email", errorKey: "eat.errors.email_taken", formLevel: false };
    case "errors.password_required":
      return { field: "password", errorKey: "eat.errors.password_required", formLevel: false };
    case "errors.password_too_short":
      return { field: "password", errorKey: "eat.errors.password_too_short", formLevel: false };
    case "errors.password_mismatch":
      return { field: "password_confirm", errorKey: "eat.errors.password_mismatch", formLevel: false };
    case "errors.age_required":
      return { field: "age", errorKey: "eat.errors.age_required", formLevel: false };
    case "errors.age_out_of_range":
      return { field: "age", errorKey: "eat.errors.age_out_of_range", formLevel: false };
    case "errors.photo_too_large":
      return { field: "photo", errorKey: "eat.errors.photo_too_large", formLevel: false };
    case "errors.csrf":
      return { errorKey: "eat.errors.csrf", formLevel: true };
    case "errors.session_expired":
      return { errorKey: "eat.errors.session_expired", formLevel: true };
    default:
      return {
        errorKey: eatKey.startsWith("eat.errors.") ? eatKey : "eat.errors.network",
        formLevel: true,
      };
  }
}
