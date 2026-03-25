import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  BarChart3,
  Trophy,
  User,
  GraduationCap,
  Menu,
  X,
  Home,
  MessageCircle,
  Pencil,
  Bot,
  Bell,
  Phone,
  FileText,
  ClipboardList,
  BookOpen,
  Upload,
  PenLine,
  LayoutGrid,
  PieChart,
  TrendingUp,
} from "lucide-react";
import "./Layout.css";
import { AuthContext } from "./AuthContext";
import NotificationDropdown from "./NotificationDropdown";
import SoundConfigModal from "./SoundConfigModal";
import { soundManager } from "../utils/SoundManager";
import FeedbackBox from "./FeedbackBox";
import TrialModal from "./TrialModal";
import axiosInstance from "../api/axiosInstance";

const ICON_MAP = {
  home: Home,
  robot: Bot,
  "graduation-cap": GraduationCap,
  trophy: Trophy,
  "chart-line": BarChart3,
  "comment-dots": MessageCircle,
  user: User,
  "file-text": FileText,
  "clipboard-list": ClipboardList,
  "book-open": BookOpen,
  upload: Upload,
  "pen-line": PenLine,
  "layout-grid": LayoutGrid,
  "pie-chart": PieChart,
  "trending-up": TrendingUp,
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const { username, logout, role, fullName, schoolCode } =
    useContext(AuthContext);

  const [showSoundConfig, setShowSoundConfig] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const trialDismissed =
    sessionStorage.getItem(`trial_dismissed_${username}`) === "true";

  const [fetchedFullName, setFetchedFullName] = useState("");
  useEffect(() => {
    if (!fullName && username) {
      axiosInstance
        .get("/api/user-info/", { credentials: "include" })
        .then((res) => {
          const name = res.data.fullname || res.data.full_name || "";
          if (name) {
            setFetchedFullName(name);
            localStorage.setItem("fullName", name);
          }
        })
        .catch(() => {});
    }
  }, [fullName, username]);

  const sanitize = (val) =>
    !val || val === "undefined" || val.trim() === "" ? "" : val.trim();
  const displayName =
    sanitize(fullName) || sanitize(fetchedFullName) || sanitize(username) || "";

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [phoneMissing, setPhoneMissing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullname: "",
    phone_number: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (role === "student" && username) {
      axiosInstance
        .get("api/auth/edit-profile/")
        .then((res) => {
          const phone = res.data.phone_number || "";
          setProfileData({
            fullname: res.data.fullname || "",
            phone_number: phone,
          });
          if (!phone.trim()) {
            setPhoneMissing(true);
            setShowEditProfile(true);
          }
        })
        .catch(() => {});
    }
  }, [role, username]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await axiosInstance.get("api/auth/edit-profile/");
      setProfileData({
        fullname: res.data.fullname || "",
        phone_number: res.data.phone_number || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePhone = (phone) => {
    const trimmed = phone.trim();
    if (!trimmed) return "Phone number is required";
    if (!/^\d{10}$/.test(trimmed))
      return "Phone number must be exactly 10 digits";
    return "";
  };

  const updateProfile = async () => {
    const error = validatePhone(profileData.phone_number);
    if (error) {
      setPhoneError(error);
      return;
    }
    try {
      await axiosInstance.post("api/auth/edit-profile/", profileData);
      setPhoneMissing(false);
      setShowEditProfile(false);
      localStorage.setItem("fullName", profileData.fullname);
      window.location.reload();
    } catch (error) {
      console.error("Profile update failed", error);
    }
  };

  const getCurrentTab = () => {
    if (currentLocation.pathname !== "/teacher-dash") return null;
    if (currentLocation.state?.activeTab)
      return currentLocation.state.activeTab;
    const params = new URLSearchParams(currentLocation.search);
    return params.get("tab") || "homework";
  };

  const handleNavigation = (link) => {
    if (role === "teacher" && link.tabName) {
      navigate(`/teacher-dash?tab=${link.tabName}`, {
        state: { activeTab: link.tabName },
      });
    } else {
      navigate(link.path);
    }
    setIsSidebarOpen(false);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate("/");
  };

  const studentLinks = [
    { path: "/student-dash", label: "Dashboard", icon: "home" },
    // { path: '/ai-assistant', label: 'AI Assistant', icon: 'robot' },
    {
      path: "/jee-dashboard",
      label: "JEE Preparation",
      icon: "graduation-cap",
      isJEE: true,
    },
    { path: "/quiz-mode", label: "Test Prep", icon: "trophy" },
    // { path: '/analytics', label: 'Analytics', icon: 'chart-line' },
  ];

  const teacherLinks = [
    { path: "/ai-assistant", label: "AI Assistant", icon: "robot" },
    {
      path: "/teacher-dash?tab=exam-correction",
      label: "Exam Correction",
      icon: "file-text",
      tabName: "exam-correction",
    },
    {
      path: "/teacher-dash?tab=question-paper",
      label: "Question Paper",
      icon: "clipboard-list",
      tabName: "question-paper",
    },
    { path: "/student-dash", label: "Dashboard", icon: "home" },
    {
      path: "/teacher-dash?tab=exercise",
      label: "Homework",
      icon: "book-open",
      tabName: "exercise",
    },
    {
      path: "/teacher-dash?tab=upload-homework",
      label: "Upload Homework",
      icon: "upload",
      tabName: "upload-homework",
    },
    {
      path: "/teacher-dash?tab=classwork",
      label: "Classwork",
      icon: "pen-line",
      tabName: "classwork",
    },
    {
      path: "/teacher-dash?tab=homework",
      label: "Worksheets",
      icon: "layout-grid",
      tabName: "homework",
    },
    {
      path: "/teacher-dash?tab=class",
      label: "Class Analysis",
      icon: "pie-chart",
      tabName: "class",
    },
    {
      path: "/teacher-dash?tab=student",
      label: "Student Analysis",
      icon: "user",
      tabName: "student",
    },
    {
      path: "/teacher-dash?tab=progress",
      label: "Progress",
      icon: "trending-up",
      tabName: "progress",
    },
  ];

  const navigationLinks = role === "teacher" ? teacherLinks : studentLinks;

  const getUserInitials = () => {
    const name = displayName || username || "U";
    // Guard: skip if still contains "undefined"
    if (!name || name.toLowerCase().includes("undefined")) return "U";
    const names = name.trim().split(" ").filter(Boolean);
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const renderIcon = (link) => {
    const IconComponent = ICON_MAP[link.icon];
    if (IconComponent)
      return <IconComponent size={20} className="min-w-[24px]" />;
    return null;
  };

  // ── School Logo Map ─────────────────────────────────────────────
  // Add more school codes and their logo paths here as needed.
  const SCHOOL_LOGO_MAP = {
    ELP: "/images/mynelo-logo1.png", // MyNELO logo for ELPRO school
    // ABC: "/images/abc-school-logo.png",  ← add more schools here
  };

  const sidebarLogo =
    SCHOOL_LOGO_MAP[schoolCode] || "/images/SmartLearners2.png";
  // Falls back to default SmartLearners logo if school code is not mapped.

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile menu toggle */}
      <button
        className="fixed top-4 left-4 z-[1001] md:hidden w-12 h-12 rounded-2xl bg-[#0B1120] text-white flex items-center justify-center shadow-lg shadow-black/20"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 bottom-0 w-72 bg-[#0B1120] z-[1000]
        flex flex-col overflow-hidden transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        shadow-2xl border-r border-white/5
      `}
      >
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-[-20%] w-60 h-60 bg-blue-600/10 rounded-full blur-[60px] pointer-events-none animate-pulse" />
        <div
          className="absolute bottom-0 right-[-20%] w-60 h-60 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none animate-pulse"
          style={{ animationDelay: "700ms" }}
        />

        {/* Brand Container */}
        {/* Brand Container - 12yr Exp UI/UX Pattern */}
        <div className="relative flex flex-col items-center justify-center pt-2 pb-2 px-2 mb-0">
          {/* Floating Notification */}
          <div className="absolute top-4 right-4 z-20">
            <NotificationDropdown />
          </div>

          {/* Mobile close */}
          <button
            className="md:hidden absolute top-4 left-4 text-slate-400 hover:text-white transition-colors z-20"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>

          {/* Conditional Logo Rendering */}
          {(window.location.hostname === "mynelo.in" || window.location.hostname === "www.mynelo.in") ? (
            /* MyNELO logo with glowing white backdrop so dark text stays visible */
            <div
              className="relative z-10 flex items-center justify-center"
              style={{
                borderRadius: "16px",
                
              }}
            >
              <img
                src="/images/mynelo-logo1.png"
                alt="MyNelo"
                style={{ width: "25vw", height: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
          ) : (
            /* Default SmartLearners logo */
            <img
              src="/images/SmartLearners2.png"
              alt="SmartLearners"
              className="w-[150px] h-auto object-contain relative z-10"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-0 overflow-y-auto scrollbar-thin scrollbar-thumb-black/30">
          <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
            {navigationLinks.map((link) => {
              const currentTab = getCurrentTab();
              const isActive =
                role === "teacher" && link.tabName
                  ? currentTab === link.tabName
                  : currentLocation.pathname === link.path;

              return (
                <li key={link.path}>
                  <button
                    className={`
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer
                      transition-all duration-300 font-bold text-sm relative overflow-hidden group
                      ${
                        isActive
                          ? "bg-[#00A0E3] text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                    onClick={() => handleNavigation(link)}
                  >
                    <div
                      className={`relative z-10 ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform duration-300`}
                    >
                      {renderIcon(link)}
                    </div>
                    <span
                      className={`flex-1 whitespace-nowrap text-left relative z-10 ${isActive ? "" : "group-hover:translate-x-1"} transition-transform duration-300`}
                    >
                      {link.label}
                    </span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </li>
              );
            })}

            {/* Feedback */}
            <li>
              <button
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer
                  transition-all duration-300 font-bold text-sm relative overflow-hidden group
                  ${
                    showFeedback
                      ? "bg-[#00A0E3] text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
                onClick={() => setShowFeedback(!showFeedback)}
              >
                <div
                  className={`relative z-10 ${showFeedback ? "scale-110" : "group-hover:scale-110"} transition-transform duration-300`}
                >
                  <MessageCircle size={20} className="min-w-[24px]" />
                </div>
                <span
                  className={`flex-1 text-left relative z-10 ${showFeedback ? "" : "group-hover:translate-x-1"} transition-transform duration-300`}
                >
                  Feedback
                </span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 pb-6 mt-auto relative z-10">
          {role === "student" && (
            <div
              className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 mb-3 cursor-pointer hover:border-white/10 hover:-translate-y-0.5 transition-all group"
              onClick={() => {
                fetchProfile();
                setPhoneError("");
                setShowEditProfile(true);
              }}
              title="Edit Profile"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-[2px] flex-shrink-0">
                <div className="w-full h-full rounded-full bg-[#0B1120] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate m-0">
                  {displayName &&
                  !displayName.toLowerCase().includes("undefined")
                    ? displayName
                    : username}
                </p>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold m-0">
                  {role === "teacher" ? "Teacher" : "Student"}
                </p>
              </div>
              <Pencil
                size={13}
                className="text-white/30 group-hover:text-white/60 transition-colors"
              />
            </div>
          )}

          {role === "teacher" && (
            <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-[2px] flex-shrink-0">
                <div className="w-full h-full rounded-full bg-[#0B1120] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {getUserInitials()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate m-0">
                  {displayName}
                </p>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold m-0">
                  Teacher
                </p>
              </div>
            </div>
          )}

          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-bold transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-72 min-h-screen flex flex-col transition-all bg-[#F8FAFC]">
        {children}
      </main>

      <SoundConfigModal
        show={showSoundConfig}
        onHide={() => setShowSoundConfig(false)}
      />
      <FeedbackBox
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
      {role === "student" && !trialDismissed && window.location.hostname !== 'mynelo.in' && window.location.hostname !== 'www.mynelo.in' && <TrialModal />}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => {
            if (!phoneMissing) setShowEditProfile(false);
          }}
        >
          <div
            className="bg-white rounded-2xl p-8 w-[90%] max-w-[420px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#00A0E3] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {getUserInitials()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 m-0">
                  {phoneMissing ? "Complete Your Profile" : "Edit Profile"}
                </h3>
                <p className="text-sm text-gray-500 m-0">
                  {phoneMissing
                    ? "One quick step before you start"
                    : "Update your personal details"}
                </p>
              </div>
              {!phoneMissing && (
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="text-gray-400 hover:text-gray-600 bg-transparent border-none text-xl cursor-pointer p-1"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {phoneMissing && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-sm text-gray-800 leading-relaxed">
                Please enter your mobile number to continue learning and get
                updates and support on WhatsApp.
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 mb-1.5">
                  <User size={14} className="text-[#00A0E3]" />
                  Full Name
                </label>
                <input
                  value={profileData.fullname}
                  onChange={(e) =>
                    setProfileData({ ...profileData, fullname: e.target.value })
                  }
                  disabled={profileLoading}
                  className="w-full rounded-xl border-[1.5px] border-gray-200 py-2.5 px-3.5 text-[0.95rem] outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 mb-1.5">
                  <Phone size={14} className="text-[#00A0E3]" />
                  Phone Number{" "}
                  {phoneMissing && <span className="text-red-500">*</span>}
                </label>
                <input
                  value={profileData.phone_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setProfileData({ ...profileData, phone_number: val });
                    if (phoneError) setPhoneError("");
                  }}
                  disabled={profileLoading}
                  placeholder="Enter your 10-digit mobile number"
                  maxLength={10}
                  className={`w-full rounded-xl border-[1.5px] py-2.5 px-3.5 text-[0.95rem] outline-none transition-all focus:ring-2 focus:ring-[#00A0E3]/10 ${phoneError ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#00A0E3]"}`}
                />
                {phoneError && (
                  <p className="text-red-500 text-xs mt-1.5">{phoneError}</p>
                )}
              </div>

              <div className="flex gap-2.5 mt-2">
                {!phoneMissing && (
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 py-2.5 px-5 rounded-xl border-[1.5px] border-gray-200 bg-white cursor-pointer font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={updateProfile}
                  className="flex-1 py-2.5 px-5 rounded-xl border-none bg-[#00A0E3] text-white cursor-pointer font-semibold text-sm shadow-lg shadow-[#00A0E3]/30 hover:bg-[#0080B8] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
