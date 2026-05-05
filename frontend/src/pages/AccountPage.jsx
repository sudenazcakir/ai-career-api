import { useEffect, useMemo, useState } from "react";
import { FiCamera } from "react-icons/fi";
import CareerMatrixPanel from "../components/account/CareerMatrixPanel";
import PassportForm from "../components/forms/PassportForm";
import PhoneField from "../components/forms/PhoneField";
import { getCareerMatrix } from "../services/careerService";
import { accountBg, ui } from "../styles/ui";
import { buildCareerMatrix } from "../utils/careerMatrix";
import { normalizePhoneNumber } from "../utils/validation";

export default function AccountPage({
  isBusy,
  passport,
  renderAvatar,
  savePassport,
  setPassport,
  signOut,
  updateUser,
  user,
}) {
  const [accountForm, setAccountForm] = useState(user);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [aiCareerMatrix, setAiCareerMatrix] = useState(null);
  const [careerMatrixStatus, setCareerMatrixStatus] = useState("Rule-based preview");
  const fallbackCareerMatrix = useMemo(() => buildCareerMatrix(passport), [passport]);
  const careerMatrix = aiCareerMatrix || fallbackCareerMatrix;

  useEffect(() => {
    let isCurrent = true;

    getCareerMatrix(passport)
      .then((response) => {
        if (!isCurrent) return;
        setAiCareerMatrix(response.data || null);
        setCareerMatrixStatus(response.data?.message || "AI-assisted matrix ready");
      })
      .catch((error) => {
        if (!isCurrent) return;
        setAiCareerMatrix(null);
        setCareerMatrixStatus(`Using local fallback: ${error.message}`);
      });

    return () => {
      isCurrent = false;
    };
  }, [passport]);

  function submitAccount(event) {
    event.preventDefault();
    updateUser(accountForm).catch((error) => {
      console.error(error);
    });
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAccountForm({ ...accountForm, photo: reader.result });
    };
    reader.readAsDataURL(file);
  }

  function submitPassport(event) {
    event.preventDefault();
    savePassport(passport)
      .then(() => setIsPassportModalOpen(false))
      .catch((error) => console.error(error));
  }

  return (
    <div className="grid gap-4">
      <section className={`${ui.accountHero} ${accountBg}`}>
        <label className={ui.avatarEditor}>
          {renderAvatar(accountForm, ui.accountAvatar)}
          <input
            accept="image/*"
            aria-label="Change profile photo"
            type="file"
            onChange={handlePhotoChange}
          />
          <span aria-hidden="true">
            <FiCamera />
          </span>
        </label>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-black uppercase text-[#d9eeea]">My Account</p>
          <h2 className="break-words text-[clamp(30px,4vw,42px)] font-black leading-none">
            {user.firstName} {user.lastName}
          </h2>
          <p className="mt-2 break-words text-[#d9eeea]">{user.email}</p>
        </div>
        <button className={ui.buttonGhost} disabled={isBusy} type="button" onClick={signOut}>
          Sign out
        </button>
      </section>

      <section className={ui.cardGrid}>
        <article className={ui.accountCard}>
          <span>Phone</span>
          <strong>{user.phone || "Not added"}</strong>
        </article>
        <article className={ui.accountCard}>
          <span>Target role</span>
          <strong>{passport.targetTitle || "Not added"}</strong>
        </article>
        <article className={ui.accountCard}>
          <span>Primary skills</span>
          <strong>{passport.skills || "Not added"}</strong>
        </article>
      </section>

      <CareerMatrixPanel careerMatrix={careerMatrix} status={careerMatrixStatus} />

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <h2 className="text-2xl font-black">Personal details</h2>
            <p className={ui.muted}>Keep your contact information current.</p>
          </div>
        </div>

        <form className="grid gap-3" onSubmit={submitAccount}>
          <div className={ui.twoFields}>
            <label className={ui.label}>
              First name
              <input
                className={ui.input}
                value={accountForm.firstName || ""}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, firstName: event.target.value })
                }
              />
            </label>
            <label className={ui.label}>
              Last name
              <input
                className={ui.input}
                value={accountForm.lastName || ""}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, lastName: event.target.value })
                }
              />
            </label>
          </div>
          <label className={ui.label}>
            Email
            <input
              className={ui.input}
              type="email"
              value={accountForm.email || ""}
              onChange={(event) =>
                setAccountForm({ ...accountForm, email: event.target.value })
              }
            />
          </label>
          <PhoneField
            countryCode={accountForm.countryCode || "+90"}
            phoneNumber={accountForm.phoneNumber || ""}
            setCountryCode={(countryCode) =>
              setAccountForm({
                ...accountForm,
                countryCode,
                phone: `${countryCode} ${accountForm.phoneNumber || ""}`,
              })
            }
            setPhoneNumber={(phoneNumber) =>
              setAccountForm({
                ...accountForm,
                phoneNumber: normalizePhoneNumber(phoneNumber),
                phone: `${accountForm.countryCode || "+90"} ${normalizePhoneNumber(phoneNumber)}`,
              })
            }
          />
          <button className={ui.button} disabled={isBusy} type="submit">
            {isBusy ? "Updating..." : "Update Account"}
          </button>
        </form>
      </section>

      <section className={ui.panel}>
        <div className={ui.sectionHead}>
          <div>
            <p className={ui.eyebrow}>Career Passport</p>
            <h2 className="text-2xl font-black">Professional profile</h2>
            <p className={ui.muted}>
              Open the editor when you want to update your career data.
            </p>
          </div>
          <button
            className={ui.button}
            disabled={isBusy}
            type="button"
            onClick={() => setIsPassportModalOpen(true)}
          >
            Edit Professional Profile
          </button>
        </div>

        <div className={ui.passportPreview}>
          <article>
            <span>Target role</span>
            <strong>{passport.targetTitle || "Not added"}</strong>
          </article>
          <article>
            <span>Education</span>
            <strong>{passport.school || "Not added"}</strong>
          </article>
          <article>
            <span>Skills</span>
            <strong>{passport.skills || "Not added"}</strong>
          </article>
          <article>
            <span>Portfolio</span>
            <strong>{passport.portfolio || "Not added"}</strong>
          </article>
        </div>
      </section>

      {isPassportModalOpen && (
        <div className={ui.modalBackdrop} role="presentation">
          <section aria-modal="true" className={ui.modalWindow} role="dialog">
            <div className={ui.modalHead}>
              <div>
                <p className={ui.eyebrow}>Career Passport</p>
                <h2 className="text-2xl font-black">Edit professional profile</h2>
              </div>
              <button
                className={ui.buttonGhost}
                disabled={isBusy}
                type="button"
                onClick={() => setIsPassportModalOpen(false)}
              >
                Close
              </button>
            </div>
            <PassportForm
              isBusy={isBusy}
              passport={passport}
              setPassport={setPassport}
              submit={submitPassport}
              submitLabel={isBusy ? "Updating..." : "Update Career Passport"}
            />
          </section>
        </div>
      )}
    </div>
  );
}
