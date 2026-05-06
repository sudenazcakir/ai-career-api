import { ui } from "../../styles/ui";

export default function FieldError({ message }) {
  return (
    <span aria-live="polite" className={`block min-h-[18px] ${message ? ui.fieldError : ""}`}>
      {message || ""}
    </span>
  );
}
