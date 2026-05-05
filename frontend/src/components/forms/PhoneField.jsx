import { countryCodes } from "../../constants/appData";
import { ui } from "../../styles/ui";
import { normalizePhoneNumber } from "../../utils/validation";
import FieldError from "../common/FieldError";

export default function PhoneField({
  countryCode,
  error,
  phoneNumber,
  setCountryCode,
  setPhoneNumber,
  variant = "default",
}) {
  const isDark = variant === "dark" || variant === "darkCompact";
  const isCompact = variant === "darkCompact";
  const labelClass = isDark ? "grid gap-2 text-sm font-black text-white" : ui.label;
  const controlClass = isDark
    ? `${
        isCompact ? "min-h-11" : "min-h-12"
      } border-0 border-b border-white/20 bg-transparent px-0 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-teal-200`
    : ui.input;
  const selectClass = isDark
    ? `${controlClass} font-black [&>option]:text-slate-950`
    : ui.input;

  return (
    <label className={labelClass}>
      Phone
      <div className="grid min-w-0 grid-cols-[112px_minmax(0,1fr)] gap-2 max-sm:grid-cols-1">
        <select
          className={selectClass}
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
        >
          {countryCodes.map((country) => (
            <option key={country.code} value={country.code}>
              {country.label}
            </option>
          ))}
        </select>
        <input
          className={controlClass}
          inputMode="tel"
          maxLength={10}
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(normalizePhoneNumber(event.target.value))}
        />
      </div>
      <FieldError message={error} />
    </label>
  );
}
