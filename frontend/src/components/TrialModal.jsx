import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCrown,
  faRocket,
  faClock,
  faGift,
  faArrowRight,
  faShieldAlt,
  faBolt,
  faInfinity,
} from "@fortawesome/free-solid-svg-icons";
import "./TrialModal.css";
import { AuthContext } from './AuthContext';
import axiosInstance from "../api/axiosInstance";

const FEATURES = [
  { icon: faBolt, text: "Unlimited AI-powered learning" },
  { icon: faShieldAlt, text: "Personalized study plans" },
  { icon: faInfinity, text: "Access to all courses" },
  { icon: faRocket, text: "Priority support" },
];

const TrialModal = ({
  userData = null,
}) => {
  const { username, fullName, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [totalTrialDays, setTotalTrialDays] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPaid, setIsPaid] = useState(null); // null = loading, true/false = loaded
  const [trialExpiryDate, setTrialExpiryDate] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axiosInstance.get('/api/user-info/', {
          credentials: 'include',
        });

        const data = response.data;
        setIsPaid(data.paid === true);
        setUserInfo(data);

        // Use trial_expiry from API to calculate remaining days
        const expiryValue = data.trial_expiry || data.trial_expiry_date;
        if (expiryValue) {
          setTrialExpiryDate(expiryValue);

          // Strip time — compare dates only to avoid off-by-one
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const expiry = new Date(expiryValue);
          const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());

          const remaining = Math.round((expiryDay - today) / (1000 * 60 * 60 * 24));

          if (remaining <= 0) {
            setIsExpired(true);
            setDaysRemaining(0);
            setTotalTrialDays(0);
          } else {
            setDaysRemaining(remaining);
            setTotalTrialDays(remaining);
            setIsExpired(false);

            // For active trials, check if already dismissed this session
            const sessionKey = `trial_dismissed_${data.username || username}`;
            if (sessionStorage.getItem(sessionKey)) {
              setDismissed(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setIsPaid(false);
      }
    };
    fetchUserInfo();
  }, [username]);

  // Lock body scroll and interaction when trial is expired
  useEffect(() => {
    if (isExpired && isPaid === false) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
      // Allow only the modal itself to receive events
      const modal = document.querySelector('.trial-modal');
      const backdrop = document.querySelector('.trial-backdrop');
      if (modal) modal.style.pointerEvents = 'auto';
      if (backdrop) backdrop.style.pointerEvents = 'auto';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [isExpired, isPaid]);

  const handleClose = () => {
    if (isExpired) return; // Can't close if expired
    setIsClosing(true);
    const sessionKey = `trial_dismissed_${userInfo?.username || username}`;
    sessionStorage.setItem(sessionKey, 'true');
    setTimeout(() => {
      setIsClosing(false);
      setDismissed(true);
    }, 250);
  };

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      alert('Please login first to proceed.');
      navigate('/login');
      return;
    }

    // Unlock body so navigation works (expired state locks it)
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';

    window.location.href = 'https://smartlearners.ai/get-started';
  };

  const getTrialMessage = () => {
    if (isExpired) {
      return {
        title: "Your Free Trial Has Ended",
        subtitle: "Upgrade now to continue your learning journey",
        urgent: true
      };
    }
    if (daysRemaining <= 2) {
      return {
        title: `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left!`,
        subtitle: "Don't lose your progress - upgrade today",
        urgent: true
      };
    }
    return {
      title: `${daysRemaining} days remaining`,
      subtitle: "You're on your free trial",
      urgent: false
    };
  };

  const trialMessage = getTrialMessage();

  // Don't show if still loading or user has paid
  if (isPaid === null || isPaid === true) return null;
  // Expired trial — always block, never dismiss
  // Active trial — show once per session, then dismiss
  if (!isExpired && dismissed) return null;

  return (
    <>
      {/* Full-screen blocker — covers sidebar, content, everything */}
      <div
        className={`trial-backdrop ${isClosing ? 'closing' : ''} ${isExpired ? 'expired-blocker' : ''}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`trial-modal ${isClosing ? 'closing' : ''} ${isExpired ? 'expired' : ''}`}>
        {/* Decorative elements */}
        <div className="trial-glow trial-glow-1" />
        <div className="trial-glow trial-glow-2" />

        {/* Close button - only if not expired */}
        {!isExpired && (
          <button className="trial-close" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}

        {/* Header */}
        <div className="trial-header">
          <div className={`trial-icon-wrap ${trialMessage.urgent ? 'urgent' : ''}`}>
            {isExpired ? (
              <FontAwesomeIcon icon={faClock} className="trial-icon" />
            ) : (
              <FontAwesomeIcon icon={faGift} className="trial-icon" />
            )}
          </div>

          <div className="trial-badge">
            <FontAwesomeIcon icon={faCrown} />
            <span>Premium</span>
          </div>

          <h2 className="trial-title">{trialMessage.title}</h2>
          <p className="trial-subtitle">{trialMessage.subtitle}</p>
        </div>

        {/* Progress bar - only show if not expired */}
        {!isExpired && totalTrialDays > 0 && (
          <div className="trial-progress-wrap">
            <div className="trial-progress-bar">
              <div
                className="trial-progress-fill"
                style={{ width: `${(daysRemaining / totalTrialDays) * 100}%` }}
              />
            </div>
            <div className="trial-progress-labels">
              <span>{daysRemaining} days left</span>
              {/* <span>{totalTrialDays} days total</span> */}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="trial-features">
          <p className="trial-features-title">
            {isExpired ? "Unlock these features:" : "What you get with Premium:"}
          </p>
          <ul className="trial-features-list">
            {FEATURES.map((feature, index) => (
              <li key={index} className="trial-feature-item">
                <div className="trial-feature-icon">
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Section */}
        <div className="trial-cta">
          <button className="trial-upgrade-btn" onClick={handleUpgrade}>
            <span>Upgrade to Premium</span>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>

          {!isExpired && (
            <button className="trial-later-btn" onClick={handleClose}>
              Maybe later
            </button>
          )}

          {/* <p className="trial-guarantee">
            <FontAwesomeIcon icon={faShieldAlt} />
            <span>30-day money-back guarantee</span>
          </p> */}
        </div>

        {/* Floating particles for visual interest */}
        <div className="trial-particles">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="trial-particle"
              style={{
                '--delay': `${i * 0.5}s`,
                '--x': `${20 + (i * 15)}%`,
                '--duration': `${3 + (i * 0.5)}s`
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default TrialModal;
