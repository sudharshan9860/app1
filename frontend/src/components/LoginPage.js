import React, { useState, useContext, useEffect, useMemo, useRef } from "react";
import { Form } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../components/AuthContext";
import axiosInstance from "../api/axiosInstance";
import "./Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

import {
  faEye,
  faEyeSlash,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);

  const [resetStep, setResetStep] = useState(1);
  const [resetUsername, setResetUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // âœ… Stable particles (no random re-render jumping)
  const particles = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${6 + Math.random() * 10}px`,
      opacity: 0.18 + Math.random() * 0.5,
      duration: `${10 + Math.random() * 18}s`,
      delay: `${Math.random() * 6}s`,
      drift: `${-20 + Math.random() * 60}px`,
    }));
  }, []);

  // âœ… 3D glass UI tilt (parallax)
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1

    const rotateY = (px - 0.5) * 10; // -5..5
    const rotateX = (0.5 - py) * 10; // -5..5

    card.style.transform = `translateY(-3px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const resetTransform = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "translateY(0) rotateX(0deg) rotateY(0deg)";
  };

  // âœ… Password strength
  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: "", colorClass: "" };

    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    // Map to 0..4 bars
    const normalized = Math.min(4, Math.max(1, Math.round((score / 5) * 4)));

    const map = {
      1: { label: "Weak", colorClass: "meter-weak" },
      2: { label: "Okay", colorClass: "meter-ok" },
      3: { label: "Good", colorClass: "meter-good" },
      4: { label: "Strong", colorClass: "meter-strong" },
    };

    return { score: normalized, ...map[normalized] };
  };

  const strength = getPasswordStrength(password);

  // âœ… DO NOT CHANGE backend API behavior
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axiosInstance.login(username, password);
      const {
        access,
        username: user,
        role,
        full_name,
        class_name,
        school,
        school_code,
      } = response;

      login(user, access, role, class_name, full_name, school, school_code);

      if (role === "teacher") {
        navigate("/teacher-dash");
      } else {
        navigate("/quiz-mode");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Invalid username or password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // âœ… DO NOT CHANGE backend API behavior
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(
        "https://autogen.aieducator.com/api/auth/google/",
        { id_token: credentialResponse.credential },
      );

      const { access, user } = res.data;

      login(user.email, access, "student", null);
      navigate("/quiz-mode");
    } catch (err) {
      setError("Google login failed. Try again.");
    }
  };

  const handleRequestOTP = async () => {
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      await axiosInstance.post("/api/auth/password-reset/request/", {
        username: resetUsername,
      });

      setResetMessage("OTP sent via WhatsApp");
      setResetStep(2);
    } catch (err) {
      setResetError(err.response?.data?.error || "Request failed");
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      await axiosInstance.post("/api/auth/password-reset/confirm/", {
        username: resetUsername,
        otp,
        new_password: newPassword,
      });

      setResetMessage("Password reset successful");
      setTimeout(() => {
        setShowReset(false);
        setResetStep(1);
      }, 1500);
    } catch (err) {
      setResetError(err.response?.data?.error || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      className="login-wrapper"
      style={{
        backgroundImage: `url('/images/Login.webp')`,
        backgroundSize: "100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Floating Particles */}
      <div className="particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
              "--drift": p.drift,
            }}
          />
        ))}
      </div>

      <div ref={cardRef} className="login-container-new">
        <div className="login-header">
          <Link to="/" className="back-link">
            {/* <FontAwesomeIcon icon={faArrowLeft} /> */}
            {/* <span>Back</span> */}
          </Link>
          {/* <a
            href="https://www.smartlearners.ai/free-trial"
            className="create-account-link"
          >
            Create an account
          </a> */}
        </div>

        <div className="logo-section-new">
          <img
            src={window.location.hostname.includes("mynelo.in") ? "/images/mynelo-logo.png" : "/images/SmartLearners2.png"}
            alt={window.location.hostname.includes("mynelo.in") ? "MyNelo Logo" : "SmartLearners.AI Logo"}
            className="login-logo-new"
            style={{ width: "30vw", height: "auto", objectFit: "contain", display: "block" }}
          />
        </div>

        <h1 className="login-main-title">Login</h1>

        {error && <div className="error-alert-new">{error}</div>}

        <div className="login-columns">
          <div className="login-left-column">
            <Form onSubmit={handleSubmit} className="login-form-new">
              {/* Floating label inputs need placeholder=" " */}
              <div className="form-group-new">
                <input
                  type="text"
                  placeholder=" "
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input-new"
                  autoFocus
                  autoComplete="username"
                />
                <label className="form-label-new">Email address</label>
              </div>

              <div className="form-group-new">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder=" "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input-new"
                    autoComplete="current-password"
                  />
                  <label className="form-label-new">Password</label>

                  <button
                    type="button"
                    className="password-toggle-new"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                    <span className="toggle-text">
                      {showPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>

                {/* {password?.length > 0 && (
                  <div className="password-meter">
                    <div className="meter-bars">
                      {[1, 2, 3, 4].map((idx) => (
                        <span
                          key={idx}
                          className={`meter-bar ${idx <= strength.score ? strength.colorClass : ""}`}
                        />
                      ))}
                    </div>
                    <span className="meter-label">{strength.label}</span>
                  </div>
                )} */}
              </div>

              <button
                type="submit"
                className="login-button-new"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>
            </Form>

            <div className="cant-login-section">
              <button
                type="button"
                className="cant-login-link"
                onClick={() => setShowReset(true)}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <div className="vertical-divider"></div>

          <div className="login-right-column">
            <div className="google-login-section">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed")}
                text="continue_with"
                shape="rectangular"
                size="large"
                width="280"
              />
            </div>

            <div className="or-divider">
              <span>OR</span>
            </div>

            <a
              href="https://www.smartlearners.ai/free-trial"
              className="register-button-new"
            >
              Register for free trial
            </a>
          </div>
        </div>
        {showReset && (
          <div className="reset-overlay">
            <div className="reset-card">
              <h3>Password Reset</h3>

              {resetError && (
                <div className="error-alert-new">{resetError}</div>
              )}
              {resetMessage && (
                <div className="success-alert">{resetMessage}</div>
              )}

              {resetStep === 1 && (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    className="form-input-new"
                  />

                  <button
                    onClick={handleRequestOTP}
                    className="login-button-new"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Sending..." : "Send OTP"}
                  </button>
                </>
              )}

              {resetStep === 2 && (
                <>
                  <input
                    placeholder="OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="form-input-new"
                  />

                  <input
                    placeholder="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input-new"
                  />

                  <button
                    onClick={handleConfirmReset}
                    className="login-button-new"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}

              <button
                className="register-button-new"
                onClick={() => setShowReset(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="playstore-section">
          <span className="playstore-text">Download our app</span>
          <a
            href="https://play.google.com/store/apps/details?id=com.smartlearners.mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="playstore-badge"
          >
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
              alt="Get it on Google Play"
              height="48"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
