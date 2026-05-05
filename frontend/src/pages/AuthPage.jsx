import FieldError from "../components/common/FieldError";
import PhoneField from "../components/forms/PhoneField";
import { authBg, ui } from "../styles/ui";
import { normalizePhoneNumber } from "../utils/validation";

export default function AuthPage({
  authForm,
  authErrors,
  authMode,
  isBusy,
  setAuthForm,
  setAuthErrors,
  setAuthMode,
  submitAuth,
  status,
}) {
  const isRegister = authMode === "register";

  return (
    <main className={`grid min-h-screen min-w-0 grid-cols-[minmax(0,0.95fr)_minmax(520px,0.85fr)] items-center gap-8 p-10 max-xl:grid-cols-[minmax(0,0.9fr)_minmax(460px,0.9fr)] max-lg:grid-cols-1 max-lg:items-start max-lg:p-6 max-sm:p-4 ${authBg}`}>
      <section className="flex min-w-0 flex-col justify-center self-stretch p-6 text-white max-lg:max-w-[760px] max-lg:self-auto max-sm:p-1">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-[#d9eeea]">AI Career OS</p>
        <h1 className="max-w-[760px] text-balance text-[clamp(40px,5.6vw,72px)] font-black leading-[1.08] tracking-[-0.04em] max-sm:text-[clamp(34px,11vw,46px)]">
          Build a smarter career profile before you search.
        </h1>
        <p className="mt-5 max-w-[640px] text-pretty break-words text-[clamp(15px,1.5vw,18px)] leading-7 text-[#d9eeea] max-sm:leading-6">
          Create your Career Passport once, then match it with live job data,
          recommendations, and skill roadmaps.
        </p>
      </section>

      <section className="min-w-0 self-center rounded-2xl border border-white/50 bg-white/95 p-5 shadow-2xl backdrop-blur max-lg:w-full max-sm:p-4">
        <div className="mb-3.5 grid grid-cols-2 gap-2">
          <button
            className={isRegister ? ui.button : ui.buttonGhost}
            type="button"
            onClick={() => {
              setAuthMode("register");
              setAuthErrors({});
            }}
          >
            Sign Up
          </button>
          <button
            className={!isRegister ? ui.button : ui.buttonGhost}
            type="button"
            onClick={() => {
              setAuthMode("login");
              setAuthErrors({});
            }}
          >
            Sign In
          </button>
        </div>

        <form className={ui.formStack} onSubmit={submitAuth}>
          {isRegister && (
            <div className={ui.twoFields}>
              <label className={ui.label}>
                First name
                <input
                  className={ui.input}
                  placeholder="Can"
                  required
                  value={authForm.firstName}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, firstName: event.target.value })
                  }
                />
                <FieldError message={authErrors.firstName} />
              </label>
              <label className={ui.label}>
                Last name
                <input
                  className={ui.input}
                  placeholder="Gere"
                  required
                  value={authForm.lastName}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, lastName: event.target.value })
                  }
                />
                <FieldError message={authErrors.lastName} />
              </label>
            </div>
          )}

          <label className={ui.label}>
            Email
            <input
              className={ui.input}
              placeholder="name@example.com"
              required
              type="email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm({ ...authForm, email: event.target.value })
              }
            />
            <FieldError message={authErrors.email} />
          </label>

          {isRegister && (
            <PhoneField
              countryCode={authForm.countryCode}
              phoneNumber={authForm.phoneNumber}
              setCountryCode={(countryCode) =>
                setAuthForm({ ...authForm, countryCode })
              }
              setPhoneNumber={(phoneNumber) =>
                setAuthForm({ ...authForm, phoneNumber: normalizePhoneNumber(phoneNumber) })
              }
              error={authErrors.phone}
            />
          )}

          <label className={ui.label}>
            Password
            <input
              className={ui.input}
              placeholder={isRegister ? "Test.1234" : "Password"}
              required
              type="password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm({ ...authForm, password: event.target.value })
              }
            />
            <FieldError message={authErrors.password} />
          </label>

          {isRegister && (
            <label className={ui.label}>
              Confirm password
              <input
                className={ui.input}
                placeholder="Repeat password"
                required
                type="password"
                value={authForm.confirmPassword}
                onChange={(event) =>
                  setAuthForm({ ...authForm, confirmPassword: event.target.value })
                }
              />
              <FieldError message={authErrors.confirmPassword} />
            </label>
          )}

          <button className={ui.button} disabled={isBusy} type="submit">
            {isBusy ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="mt-3 min-w-0 break-words rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
          {status}
        </p>
      </section>
    </main>
  );
}
