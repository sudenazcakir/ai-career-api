import { Link } from "react-router-dom";
import { authBg, ui } from "../styles/ui";

export default function NotFoundPage({ isAuthenticated = false, variant = "public" }) {
  const isPublic = variant === "public";
  const heading = isPublic ? "Page not found" : "This route is not available";
  const headingClass = isPublic
    ? "max-w-full break-words text-[clamp(34px,6vw,56px)] font-black leading-none"
    : "max-w-full break-words text-2xl font-black leading-tight";

  const content = (
    <section className={isPublic ? "min-w-0 rounded-2xl border border-white/50 bg-white/95 p-6 shadow-2xl backdrop-blur" : ui.panel}>
      <p className={ui.eyebrow}>404</p>
      {isPublic ? (
        <h1 className={headingClass}>{heading}</h1>
      ) : (
        <h2 className={headingClass}>{heading}</h2>
      )}
      <p className="mt-3 max-w-2xl break-words text-sm font-semibold leading-6 text-slate-500">
        This page does not exist or the link may have changed. Go back to your
        career workspace or sign in to continue.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link className={`${ui.button} inline-flex items-center justify-center`} to="/dashboard">
          Go to dashboard
        </Link>
        {!isAuthenticated && (
          <Link className={`${ui.buttonGhost} inline-flex items-center justify-center`} to="/login">
            Sign in
          </Link>
        )}
      </div>
    </section>
  );

  if (!isPublic) return content;

  return (
    <main className={`grid min-h-screen min-w-0 place-items-center p-6 ${authBg}`}>
      <div className="w-[min(720px,100%)] min-w-0">{content}</div>
    </main>
  );
}
