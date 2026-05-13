import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiCamera, FiEdit2, FiLogOut, FiTrash2, FiX } from "react-icons/fi";
import CareerMatrixPanel from "../components/account/CareerMatrixPanel";
import PassportForm from "../components/forms/PassportForm";
import PhoneField from "../components/forms/PhoneField";
import { getCareerMatrix } from "../services/careerService";
import { ui } from "../styles/ui";
import { buildCareerMatrix } from "../utils/careerMatrix";
import { normalizePhoneNumber } from "../utils/validation";

function parseProjectsForDisplay(str) {
  if (!str?.trim()) return [];
  if (str.includes("||") || str.includes("::")) {
    return str
      .split("||")
      .map((item) => {
        const idx = item.indexOf("::");
        return idx >= 0
          ? { title: item.slice(0, idx).trim(), description: item.slice(idx + 2).trim() }
          : { title: "", description: item.trim() };
      })
      .filter((p) => p.title || p.description);
  }
  return [{ title: "", description: str.trim() }];
}

function parseCertificatesForDisplay(str) {
  if (!str?.trim()) return [];
  if (str.includes("||") || str.includes("::")) {
    return str
      .split("||")
      .map((item) => {
        const parts = item.split("::");
        return {
          title: (parts[0] || "").trim(),
          issuer: (parts[1] || "").trim(),
          link: (parts[2] || "").trim(),
        };
      })
      .filter((c) => c.title || c.issuer);
  }
  return [{ title: str.trim(), issuer: "", link: "" }];
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createAvatarDataUrl(file) {
  const originalDataUrl = await readFileAsDataUrl(file);

  try {
    const image = await loadImage(originalDataUrl);
    const size = 320;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return originalDataUrl;

    canvas.width = size;
    canvas.height = size;

    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = Math.max((image.naturalWidth - sourceSize) / 2, 0);
    const sourceY = Math.max((image.naturalHeight - sourceSize) / 2, 0);

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      size,
      size
    );

    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return originalDataUrl;
  }
}

export default function ProfilePage({
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
    setAccountForm(user);
  }, [user]);

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

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const photo = await createAvatarDataUrl(file);
      const nextForm = { ...accountForm, photo };
      setAccountForm(nextForm);
      await updateUser(nextForm);
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = "";
    }
  }

  async function removePhoto() {
    const nextForm = { ...accountForm, photo: "" };
    setAccountForm(nextForm);
    await updateUser(nextForm);
  }

  function submitPassport(event) {
    event.preventDefault();
    savePassport(passport)
      .then(() => setIsPassportModalOpen(false))
      .catch((error) => console.error(error));
  }

  return (
    <div className="grid gap-4">
      <section className={ui.accountHero}>
        <div className="grid w-max gap-2">
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
          {accountForm.photo && (
            <button
              className="inline-flex h-7 items-center justify-center gap-1 rounded-[6px] border border-[#E8E3D7] bg-transparent px-2 text-[11px] font-medium text-[#6B6B72] transition-colors hover:border-[var(--c-danger,#A6261A)] hover:text-[var(--c-danger,#A6261A)] disabled:opacity-50"
              disabled={isBusy}
              onClick={removePhoto}
              type="button"
            >
              <FiTrash2 size={11} strokeWidth={1.5} />
              Remove
            </button>
          )}
        </div>
        <div className="min-w-0">
          <p className={ui.eyebrow}>My account</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-[#0E0E10]">
            {user.firstName} {user.lastName}
          </h2>
          <p className="mt-1 text-[13px] text-[#6B6B72]">{user.email}</p>
        </div>
        <button className={ui.buttonSecondary} disabled={isBusy} type="button" onClick={signOut}>
          <FiLogOut size={14} strokeWidth={1.5} />
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
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">Personal details</h2>
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
            <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">Professional profile</h2>
            <p className={ui.muted}>
              Open the editor when you want to update your career data.
            </p>
          </div>
          <button
            className={ui.buttonCobalt}
            disabled={isBusy}
            type="button"
            onClick={() => setIsPassportModalOpen(true)}
          >
            <FiEdit2 size={14} strokeWidth={1.5} />
            Edit passport
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

        {parseProjectsForDisplay(passport.projects).length > 0 && (
          <div className="mt-4">
            <p className={ui.eyebrow}>Projects</p>
            <div className="mt-2 grid gap-2">
              {parseProjectsForDisplay(passport.projects).map((p, i) => (
                <div key={i} className="rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
                  {p.title && <p className="text-[13px] font-semibold text-[#0E0E10]">{p.title}</p>}
                  {p.description && <p className={`${ui.muted} mt-0.5`}>{p.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {parseCertificatesForDisplay(passport.certificates).length > 0 && (
          <div className="mt-4">
            <p className={ui.eyebrow}>Certificates</p>
            <div className="mt-2 grid gap-2">
              {parseCertificatesForDisplay(passport.certificates).map((c, i) => (
                <div key={i} className="rounded-[8px] border border-[#E8E3D7] bg-[#F6F3EC] p-3">
                  {c.title && <p className="text-[13px] font-semibold text-[#0E0E10]">{c.title}</p>}
                  {c.issuer && <p className={`${ui.muted} mt-0.5`}>{c.issuer}</p>}
                  {c.link && (
                    <a
                      href={c.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-[12px] text-[#1E3FFF] underline"
                    >
                      {c.link}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {isPassportModalOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-80 grid place-items-center bg-[rgba(14,14,16,0.45)] p-5"
          role="presentation"
          onMouseDown={() => setIsPassportModalOpen(false)}
        >
          <section
            aria-modal="true"
            className={ui.modalWindow}
            role="dialog"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={ui.modalHead}>
              <div>
                <p className={ui.eyebrow}>Career Passport</p>
                <h2 className="text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">Edit professional profile</h2>
              </div>
              <button
                aria-label="Close passport editor"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#6B6B72] transition-colors hover:bg-[#F6F3EC] hover:text-[#0E0E10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3FFF]"
                disabled={isBusy}
                type="button"
                onClick={() => setIsPassportModalOpen(false)}
              >
                <FiX size={16} strokeWidth={1.5} />
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
        </div>,
        document.body
      )}
    </div>
  );
}
