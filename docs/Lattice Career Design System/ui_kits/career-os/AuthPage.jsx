/* global React */

const AuthPage = ({ onSignIn }) => {
  const [mode, setMode] = React.useState("signin");
  const [form, setForm] = React.useState({ email: "ada@lattice.work", pw: "••••••••" });

  return (
    <main className="lat-auth">
      <section className="lat-auth-left lat-dot-grid">
        <div className="lat-auth-brand">
          <img src="../../assets/logo-wordmark.svg" alt="Lattice" height={28}/>
        </div>
        <div className="lat-auth-pitch">
          <span className="lat-eyebrow">Career Operating System</span>
          <h1 className="lat-display-lg" style={{ marginTop: 14, maxWidth: 480 }}>
            <em className="lat-italic-serif">A career,</em> cell by cell.
          </h1>
          <p className="lat-body" style={{ marginTop: 18, maxWidth: 460, color: "var(--c-graphite)" }}>
            Build a Career Passport once. Match it against live roles, surface skill gaps, and walk a roadmap that opens more doors with each milestone.
          </p>
        </div>
        <div className="lat-auth-trio">
          {[
            ["01","Profile"],
            ["02","Matches"],
            ["03","Roadmap"],
          ].map(([n,l]) => (
            <div key={n} className="lat-auth-trio-item">
              <span className="lat-mono-xs">{n}</span>
              <strong>{l}</strong>
            </div>
          ))}
        </div>
        <span className="lat-auth-numeral">86</span>
      </section>

      <section className="lat-auth-right">
        <div className="lat-auth-form">
          <h2 className="lat-display-md" style={{ marginBottom: 4 }}>
            {mode === "signin" ? "Welcome back." : "Create account."}
          </h2>
          <p className="lat-body-sm" style={{ marginBottom: 24, color: "var(--c-slate)" }}>
            {mode === "signin"
              ? "Sign in to continue your career match."
              : "Set up your profile in under a minute."}
          </p>

          <div className="lat-toggle-pair">
            <button className={mode === "signin" ? "is-on" : ""} onClick={() => setMode("signin")}>Sign in</button>
            <button className={mode === "signup" ? "is-on" : ""} onClick={() => setMode("signup")}>Sign up</button>
          </div>

          <form onSubmit={e => { e.preventDefault(); onSignIn?.(); }} className="lat-form-stack">
            {mode === "signup" && (
              <div className="lat-row-2-tight">
                <label className="lat-field">
                  <span className="lat-label">First name</span>
                  <input className="lat-input" placeholder="Ada" />
                </label>
                <label className="lat-field">
                  <span className="lat-label">Last name</span>
                  <input className="lat-input" placeholder="Tunç" />
                </label>
              </div>
            )}
            <label className="lat-field">
              <span className="lat-label">Email</span>
              <input className="lat-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})}/>
            </label>
            <label className="lat-field">
              <span className="lat-label">Password</span>
              <input className="lat-input" type="password" value={form.pw} onChange={e => setForm({...form, pw: e.target.value})}/>
            </label>
            <button type="submit" className="lat-btn lat-btn-primary lat-btn-block">
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="lat-body-sm" style={{ marginTop: 18, color: "var(--c-slate)" }}>
            By continuing you agree to Lattice's Terms and Privacy.
          </p>
        </div>
      </section>
    </main>
  );
};

window.AuthPage = AuthPage;
