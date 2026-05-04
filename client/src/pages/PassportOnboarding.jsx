import PassportForm from "../components/forms/PassportForm";
import { onboardingBg, ui } from "../styles/ui";

export default function PassportOnboarding({
  isBusy,
  passport,
  savePassport,
  setPassport,
  skipPassport,
  user,
}) {
  function submit(event) {
    event.preventDefault();
    savePassport(passport).catch((error) => console.error(error));
  }

  return (
    <main className="mx-auto min-w-0 w-[min(1180px,calc(100%-32px))] py-[30px] pb-[46px] max-sm:w-[calc(100%-24px)]">
      <header className={`mb-[18px] flex min-w-0 items-start justify-between gap-[18px] overflow-hidden rounded-xl border border-[#cad7db] p-[26px] text-white shadow-sm max-lg:flex-col max-sm:p-4 ${onboardingBg}`}>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-black uppercase text-[#d9eeea]">Career Passport</p>
          <h1 className="max-w-[860px] break-words text-[clamp(32px,5vw,54px)] font-black leading-[0.98] tracking-[-0.04em]">
            Welcome, {user.firstName}. Let's build your professional profile.
          </h1>
          <p className="mt-3 max-w-[760px] break-words text-[#d9eeea]">
            Add your education, skills, experience, goals, and portfolio details.
            You can edit everything later from My Account.
          </p>
        </div>
        <button className={ui.buttonGhost} disabled={isBusy} type="button" onClick={skipPassport}>
          Skip now
        </button>
      </header>

      <PassportForm
        isBusy={isBusy}
        passport={passport}
        setPassport={setPassport}
        submit={submit}
        submitLabel={isBusy ? "Saving..." : "Save Career Passport"}
      />
    </main>
  );
}
