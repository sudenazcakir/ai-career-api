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
}) {
  return (
    <label className={ui.label}>
      Phone
      <div className="grid min-w-0 grid-cols-[112px_minmax(0,1fr)] gap-2 max-sm:grid-cols-1">
        <select
          className={ui.input}
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
          className={ui.input}
          required
          inputMode="tel"
          maxLength={10}
          minLength={10}
          pattern="[0-9]{10}"
          placeholder="5551234567"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(normalizePhoneNumber(event.target.value))}
        />
      </div>
      <FieldError message={error} />
    </label>
  );
}
