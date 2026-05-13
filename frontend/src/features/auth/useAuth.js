import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { emptyPassport, emptyUser, pages } from "../../constants/appData";
import { setUnauthorizedHandler } from "../../services/api";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
  updatePassport,
} from "../../services/authService";
import {
  friendlyErrorMessage,
  inferExpectedPatternError,
  normalizePhoneNumber,
  validateAuthForm,
} from "../../utils/validation";

const protectedPaths = pages.map((p) => p.path);
const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

function isProtectedPath(pathname) {
  return protectedPaths.includes(pathname);
}

function getSafeRedirect(searchParams) {
  const redirect = searchParams.get("redirect");
  if (!redirect || !redirect.startsWith("/")) return DEFAULT_AUTHENTICATED_PATH;
  const redirectPath = redirect.split("?")[0];
  if (!isProtectedPath(redirectPath)) return DEFAULT_AUTHENTICATED_PATH;
  return redirect;
}

export function getLoginPathFor(pathname, search = "") {
  const target = isProtectedPath(pathname)
    ? `${pathname}${search}`
    : DEFAULT_AUTHENTICATED_PATH;
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function useAuth({ runAction, setStatus }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState(emptyUser);
  const [authErrors, setAuthErrors] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [passport, setPassport] = useState(emptyPassport);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAuthMode = location.pathname === "/login" ? "login" : "register";
  const redirectPath = getSafeRedirect(searchParams);
  const destinationPath = isProtectedPath(location.pathname)
    ? `${location.pathname}${location.search}`
    : redirectPath;

  function applyAuthSession(data) {
    localStorage.setItem("authToken", data.token);
    setUser(data.user);
    setPassport(data.user.passport || emptyPassport);
    setShowOnboarding(!data.user.passportCompleted);
  }

  // Session check on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAuthChecked(true);
      return;
    }
    getCurrentUser()
      .then((data) => {
        setUser(data.data);
        setPassport(data.data.passport || emptyPassport);
        setShowOnboarding(!data.data.passportCompleted);
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        setUser(null);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  // Wire up 401 handler so any API call can sign the user out
  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem("authToken");
      setUser(null);
      setShowOnboarding(false);
      setStatus("Session expired. Please sign in again.");
      navigate(getLoginPathFor(location.pathname, location.search), { replace: true });
    });
  }, [location.pathname, location.search, navigate]);

  function changeAuthMode(nextMode) {
    setAuthErrors({});
    navigate(
      `${nextMode === "login" ? "/login" : "/register"}${location.search}`,
      { replace: true }
    );
  }

  async function submitAuth(event) {
    event.preventDefault();
    const normalizedAuthForm = {
      ...authForm,
      phoneNumber: normalizePhoneNumber(authForm.phoneNumber),
    };
    const nextErrors = validateAuthForm(normalizedAuthForm, currentAuthMode);
    setAuthErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload =
      currentAuthMode === "login"
        ? { email: normalizedAuthForm.email, password: normalizedAuthForm.password }
        : normalizedAuthForm;

    try {
      setIsSubmitting(true);
      const data =
        currentAuthMode === "login"
          ? await loginUser(payload)
          : await registerUser(payload);
      applyAuthSession(data);
      if (data.user.passportCompleted) {
        navigate(destinationPath, { replace: true });
      }
      setStatus(currentAuthMode === "login" ? "Signed in" : "Account created");
    } catch (error) {
      if (error.errors) {
        setAuthErrors(error.errors);
        return;
      }
      if (String(error.message || "").toLowerCase().includes("expected pattern")) {
        const inferredErrors = inferExpectedPatternError(normalizedAuthForm);
        setAuthErrors(inferredErrors);
        return;
      }
      setStatus(friendlyErrorMessage(error.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateUser(nextUser) {
    return runAction("Updating account", async () => {
      const data = await updateCurrentUser(nextUser);
      setUser(data.data);
      setStatus("Account updated");
    });
  }

  function savePassport(nextPassport = passport) {
    return runAction("Saving Career Passport", async () => {
      const data = await updatePassport({ passport: nextPassport, completed: true });
      setUser(data.data);
      setPassport(data.data.passport || nextPassport);
      setShowOnboarding(false);
      navigate(destinationPath, { replace: true });
      setStatus("Career Passport saved");
    });
  }

  function skipPassport() {
    savePassport(passport).then((success) => {
      if (success) setStatus("You can complete Career Passport later");
    });
  }

  function signOut() {
    localStorage.removeItem("authToken");
    setUser(null);
    navigate("/login", { replace: true });
    setStatus("Signed out");
  }

  return {
    authChecked,
    user,
    setUser,
    authForm,
    setAuthForm,
    authErrors,
    setAuthErrors,
    showOnboarding,
    passport,
    setPassport,
    isSubmitting,
    currentAuthMode,
    destinationPath,
    submitAuth,
    updateUser,
    savePassport,
    skipPassport,
    signOut,
    changeAuthMode,
  };
}
