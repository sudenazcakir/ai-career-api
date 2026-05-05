import FieldError from "../components/common/FieldError";
import PhoneField from "../components/forms/PhoneField";
import { FiAlertCircle } from "react-icons/fi";
import { authBg } from "../styles/ui";
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
  const hasInlineError = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "password",
    "confirmPassword",
  ].some((field) => authErrors[field]);
  const visibleStatus = status && status !== "System ready" && !hasInlineError;

  return (
    <main className={`relative min-h-screen min-w-0 overflow-hidden text-white lg:flex ${authBg}`}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.28),rgba(2,6,23,0.1)_45%,rgba(2,6,23,0.26))]" />

      <section className="relative hidden min-h-screen w-[50%] min-w-0 shrink-0 flex-col px-[5vw] py-[clamp(46px,7vh,76px)] lg:flex">
        <div className="max-w-[600px]">
          <p className="mb-4 text-xs font-black uppercase text-teal-100">
            AI Career OS
          </p>
          <h1 className="max-w-[560px] text-balance text-[clamp(40px,4.6vw,62px)] font-black leading-[1.08]">
            Build a smarter career profile.
          </h1>
          <p className="mt-6 max-w-[520px] text-pretty text-[17px] font-semibold leading-8 text-teal-50/88">
            Create your Career Passport once, then match it with live job data,
            recommendations, and skill roadmaps.
          </p>
        </div>

        <div className="mt-auto grid max-w-[520px] grid-cols-3 gap-3 pb-2">
          {["Profile", "Matches", "Roadmap"].map((item) => (
            <div
              className="border-t border-white/30 pt-3 text-xs font-black uppercase text-white/80"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="relative ml-auto grid h-screen w-[50%] min-w-0 items-center justify-items-center overflow-hidden border-l border-white/10 bg-slate-950/24 px-10 py-[clamp(22px,4.6vh,46px)] shadow-2xl backdrop-blur-sm max-lg:w-full max-lg:bg-slate-950/48 max-sm:px-5 lg:ml-0">
        <div className="w-full max-w-[470px]">
            <div className="mb-5 text-center">
              <p className="mb-2 text-xs font-black uppercase text-teal-200 lg:hidden">
                AI Career OS
              </p>
              <h2 className="text-[clamp(30px,4vw,42px)] font-black leading-tight">
                {isRegister ? "Create account" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm font-semibold text-white/55">
                {isRegister
                  ? "Enter your details to build your career profile."
                  : "Please enter your details."}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                className={`min-h-11 rounded-full text-sm font-black transition ${
                  isRegister
                    ? "bg-white text-slate-950 shadow-lg"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthErrors({});
                }}
              >
                Sign Up
              </button>
              <button
                className={`min-h-11 rounded-full text-sm font-black transition ${
                  !isRegister
                    ? "bg-white text-slate-950 shadow-lg"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthErrors({});
                }}
              >
                Sign In
              </button>
            </div>

            <form className="grid gap-4" noValidate onSubmit={submitAuth}>
              {isRegister && (
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <label className="grid gap-2 text-sm font-black text-white">
                    First name
                    <input
                      className="min-h-11 border-0 border-b border-white/20 bg-transparent px-0 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-teal-200"
                      placeholder="First name"
                      value={authForm.firstName}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, firstName: event.target.value })
                      }
                    />
                    <FieldError message={authErrors.firstName} />
                  </label>
                  <label className="grid gap-2 text-sm font-black text-white">
                    Last name
                    <input
                      className="min-h-11 border-0 border-b border-white/20 bg-transparent px-0 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-teal-200"
                      placeholder="Last name"
                      value={authForm.lastName}
                      onChange={(event) =>
                        setAuthForm({ ...authForm, lastName: event.target.value })
                      }
                    />
                    <FieldError message={authErrors.lastName} />
                  </label>
                </div>
              )}

              <label className="grid gap-2 text-sm font-black text-white">
                Email
                <input
                  className="min-h-11 border-0 border-b border-white/20 bg-transparent px-0 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-teal-200"
                  inputMode="email"
                  placeholder="name@example.com"
                  type="text"
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
                    setAuthForm({
                      ...authForm,
                      phoneNumber: normalizePhoneNumber(phoneNumber),
                    })
                  }
                  error={authErrors.phone}
                  variant="darkCompact"
                />
              )}

              <label className="grid gap-2 text-sm font-black text-white">
                Password
                <input
                  className="min-h-11 border-0 border-b border-white/20 bg-transparent px-0 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-teal-200"
                  placeholder="Password"
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, password: event.target.value })
                  }
                />
                <FieldError message={authErrors.password} />
              </label>

              {isRegister && (
                <label className="grid gap-2 text-sm font-black text-white">
                  Confirm password
                  <input
                    className="min-h-11 border-0 border-b border-white/20 bg-transparent px-0 text-base font-semibold text-white outline-none placeholder:text-white/35 focus:border-teal-200"
                    placeholder="Repeat password"
                    type="password"
                    value={authForm.confirmPassword}
                    onChange={(event) =>
                      setAuthForm({
                        ...authForm,
                        confirmPassword: event.target.value,
                      })
                    }
                  />
                  <FieldError message={authErrors.confirmPassword} />
                </label>
              )}

              <button
                className="mt-3 min-h-[52px] rounded-xl bg-black px-4 py-3 text-base font-black text-white shadow-xl transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBusy}
                formNoValidate
                type="submit"
              >
                {isBusy ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
              </button>
            </form>

            {visibleStatus && (
              <p className="pointer-events-none absolute bottom-8 left-10 right-10 flex min-w-0 items-center justify-center gap-2 break-words text-center text-sm font-medium text-white max-sm:left-5 max-sm:right-5">
                <FiAlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {status}
              </p>
            )}
          </div>
      </section>
    </main>
  );
}
