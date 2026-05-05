import { ui } from "../../styles/ui";

export default function FieldError({ message }) {
  if (!message) return null;
  return <span className={ui.fieldError}>{message}</span>;
}
