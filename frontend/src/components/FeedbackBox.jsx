import React, { useState, useRef, useContext, useEffect, useCallback } from "react";
import { X, Image, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useAlert } from './AlertBox';
import { AuthContext } from './AuthContext';
import axiosInstance from "../api/axiosInstance";

const AUTO_SHOW_DELAY_MS = 2 * 60 * 1000; // 2 minutes
const FEEDBACK_SHOWN_KEY = 'feedback_modal_shown_session';

const REACTIONS = [
  { emoji: "\u{1F624}", label: "Frustrated", value: 1, color: "#ef4444" },
  { emoji: "\u{1F615}", label: "Confused", value: 2, color: "#f97316" },
  { emoji: "\u{1F610}", label: "Okay", value: 3, color: "#eab308" },
  { emoji: "\u{1F60A}", label: "Good", value: 4, color: "#22c55e" },
  { emoji: "\u{1F929}", label: "Amazing", value: 5, color: "#00A0E3" },
];

const FeedbackBox = ({ isOpen = false, onClose = () => {} }) => {
  const { username } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();

  const [step, setStep] = useState(1);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState(null);
  const [autoShowOpen, setAutoShowOpen] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  // Check feedback status and auto-show modal after 2 mins if user hasn't submitted feedback
  useEffect(() => {
    // Skip if already shown this session
    if (sessionStorage.getItem(FEEDBACK_SHOWN_KEY)) {
      return;
    }

    const checkFeedbackStatus = async () => {
      try {
        const response = await axiosInstance.get('/api/user-info/');
        const feedbackStatus = response.data?.feedback_status;

        if (feedbackStatus === false) {
          // User hasn't submitted feedback - show after 2 minutes
          timerRef.current = setTimeout(() => {
            // Double-check it wasn't shown while waiting
            if (!sessionStorage.getItem(FEEDBACK_SHOWN_KEY)) {
              sessionStorage.setItem(FEEDBACK_SHOWN_KEY, 'true');
              setAutoShowOpen(true);
            }
          }, AUTO_SHOW_DELAY_MS);
        }
      } catch (error) {
        console.error('Error fetching user info for feedback status:', error);
      }
    };

    checkFeedbackStatus();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    setAutoShowOpen(false);
    onClose();
  }, [onClose]);

  const isModalOpen = isOpen || autoShowOpen;

  // Reset state when closing
  useEffect(() => {
    if (!isModalOpen) {
      const timer = setTimeout(() => {
        setStep(1);
        setSelectedReaction(null);
        setFeedbackText("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsSuccess(false);
        setHoveredReaction(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // Focus textarea when entering step 2
  useEffect(() => {
    if (step === 2 && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [step]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      showAlert("Please upload an image file", "warning");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showAlert("Image must be under 12MB", "warning");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReactionSelect = (reaction) => {
    setSelectedReaction(reaction);
    // Auto-advance after selection with slight delay for animation
    setTimeout(() => setStep(2), 400);
  };

  const handleSubmit = async () => {
    if (!selectedReaction) return;

    // For low ratings, require feedback text
    if (selectedReaction.value <= 2 && !feedbackText.trim()) {
      showAlert("Please tell us what went wrong", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("message", feedbackText.trim());
      formData.append("rating", selectedReaction.value.toString());

      if (selectedFile) {
        formData.append("feedback_image", selectedFile, selectedFile.name);
      }

      await axiosInstance.post("feedback/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsSuccess(true);
      setStep(3);

      // Clear the auto-show timer since user submitted feedback
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 2500);

    } catch (error) {
      console.error("Error submitting feedback:", error);
      showAlert("Failed to submit feedback. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipToSubmit = () => {
    if (selectedReaction?.value <= 2) {
      showAlert("Please share what went wrong so we can improve", "warning");
      return;
    }
    handleSubmit();
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "How's your experience?";
      case 2: return selectedReaction?.value <= 2
        ? "What went wrong?"
        : "Want to share more?";
      case 3: return "Thank you!";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Your feedback helps us improve";
      case 2: return selectedReaction?.value <= 2
        ? "Help us understand the issue"
        : "Optional but appreciated";
      case 3: return "Your feedback means a lot to us";
      default: return "";
    }
  };

  return (
    <>
      <AlertContainer />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-all duration-300 ${
          isModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={handleClose}
      />

      {/* Main Container */}
      <div
        className={`fixed top-1/2 left-1/2 w-[50vw] max-w-[94vw] max-h-[90vh] bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl z-[9999] overflow-hidden transition-all duration-300 ${
          isModalOpen
            ? 'opacity-100 visible -translate-x-1/2 -translate-y-1/2 scale-100'
            : 'opacity-0 invisible -translate-x-1/2 -translate-y-1/2 scale-90'
        } max-sm:w-[94vw] max-sm:max-w-[380px] max-sm:rounded-2xl`}
      >
        {/* Decorative gradient orb */}
        <div
          className="absolute -top-[100px] -right-[100px] w-[250px] h-[250px] rounded-full blur-[80px] opacity-35 transition-colors duration-500 pointer-events-none z-0"
          style={{
            background: selectedReaction?.color || '#00A0E3'
          }}
        />

        {/* Header */}
        <div className="flex justify-between items-start px-6 pt-6 pb-4 relative z-[2]">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#0B1120] tracking-tight leading-tight mb-1">{getStepTitle()}</h3>
            <p className="text-sm text-gray-500 font-medium">{getStepSubtitle()}</p>
          </div>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/5 text-gray-500 hover:bg-black/10 hover:text-[#0B1120] hover:rotate-90 transition-all flex-shrink-0"
            onClick={handleClose}
            aria-label="Close feedback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 px-6 pb-5 relative z-[2]">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s ? 'w-7' : 'w-2'
              }`}
              style={{
                backgroundColor: step >= s ? (selectedReaction?.color || '#00A0E3') : 'rgba(0,0,0,0.12)'
              }}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="relative z-[1] overflow-hidden pt-[3vh]">
          {/* Step 1: Reaction Selection */}
          <div className={`px-6 pb-6 transition-all duration-300 ${
            step === 1 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0'
          }`}>
            <div className="flex justify-between gap-2.5 py-2 pb-4 max-sm:gap-1.5">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.value}
                  className={`flex-1 flex flex-col items-center gap-2.5 py-4 px-2.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 max-sm:py-3.5 max-sm:px-1.5 max-sm:rounded-xl ${
                    selectedReaction?.value === reaction.value
                      ? 'scale-105 text-white'
                      : 'bg-black/[0.04] border-transparent hover:bg-[#00A0E3]/10'
                  }`}
                  onClick={() => handleReactionSelect(reaction)}
                  onMouseEnter={() => setHoveredReaction(reaction)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  style={{
                    ...(selectedReaction?.value === reaction.value
                      ? { backgroundColor: reaction.color, borderColor: reaction.color }
                      : hoveredReaction?.value === reaction.value
                        ? { borderColor: reaction.color, transform: 'scale(1.08) translateY(-4px)' }
                        : {}
                    )
                  }}
                  aria-label={reaction.label}
                >
                  <span className="text-4xl leading-none transition-transform duration-300 max-sm:text-[28px]">
                    {reaction.emoji}
                  </span>
                  <span className={`text-[11px] font-semibold uppercase tracking-wide transition-colors max-sm:text-[9px] ${
                    selectedReaction?.value === reaction.value ? 'text-white' : 'text-gray-500'
                  }`}>
                    {reaction.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Details */}
          <div className={`px-6 pb-6 transition-all duration-300 ${
            step === 2 ? 'block opacity-100 translate-x-0' : 'hidden opacity-0'
          }`}>
            {/* Selected reaction badge */}
            {selectedReaction && (
              <div
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-3xl border text-sm font-semibold mb-4"
                style={{ backgroundColor: `${selectedReaction.color}15`, borderColor: `${selectedReaction.color}40` }}
              >
                <span>{selectedReaction.emoji}</span>
                <span style={{ color: selectedReaction.color }}>{selectedReaction.label}</span>
              </div>
            )}

            {/* Textarea */}
            <div className="relative mb-3.5">
              <textarea
                ref={textareaRef}
                className="w-full p-3.5 border-2 border-black/10 rounded-xl bg-black/[0.02] text-[15px] text-[#0B1120] resize-none min-h-[110px] focus:outline-none focus:border-[#00A0E3] focus:bg-white focus:ring-4 focus:ring-[#00A0E3]/10 transition-all placeholder:text-gray-400"
                placeholder={
                  selectedReaction?.value <= 2
                    ? "Tell us what happened..."
                    : "Share your thoughts, suggestions, or report a bug..."
                }
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
              <div className="flex justify-end pt-2">
                <span className="text-xs text-gray-400 font-medium">{feedbackText.length}/500</span>
              </div>
            </div>

            {/* Image upload area */}
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isSubmitting}
              />

              {previewUrl ? (
                <div className="relative inline-block">
                  <img src={previewUrl} alt="Attachment preview" className="max-w-[140px] max-h-[100px] object-cover rounded-xl border-2 border-black/10" />
                  <button
                    className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-red-500 border-2 border-white rounded-full text-white text-[11px] cursor-pointer hover:scale-110 transition-transform"
                    onClick={clearSelectedFile}
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  className="flex items-center justify-center gap-2.5 w-full py-3 px-4.5 bg-transparent border-2 border-dashed border-black/15 rounded-xl text-gray-500 text-sm font-medium cursor-pointer hover:border-[#00A0E3] hover:text-[#00A0E3] hover:bg-[#00A0E3]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Image className="w-4 h-4" />
                  <span>Add screenshot</span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center gap-3 pt-1">
              <button
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-black/5 text-gray-600 hover:bg-black/10 hover:text-[#0B1120] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex gap-2.5">
                {selectedReaction?.value > 2 && (
                  <button
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-black/5 text-gray-600 hover:bg-black/10 hover:text-[#0B1120] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSkipToSubmit}
                    disabled={isSubmitting}
                  >
                    Skip
                  </button>
                )}
                <button
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                  onClick={handleSubmit}
                  disabled={isSubmitting || (selectedReaction?.value <= 2 && !feedbackText.trim())}
                  style={{
                    backgroundColor: selectedReaction?.color || '#00A0E3'
                  }}
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Success */}
          <div className={`px-6 pb-6 transition-all duration-300 ${
            step === 3 ? 'flex items-center justify-center opacity-100 translate-x-0' : 'hidden opacity-0'
          }`}>
            <div className="text-center py-5 pb-10 relative">
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-5 shadow-lg animate-bounce"
                style={{ backgroundColor: selectedReaction?.color || '#22c55e' }}
              >
                <Check className="w-8 h-8" />
              </div>
              <div className="text-5xl mb-4">{selectedReaction?.emoji}</div>
              <p className="text-[15px] text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                We've received your feedback and will use it to make things better.
              </p>

              {/* Confetti particles */}
              <div className="absolute top-1/2 left-1/2 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-sm animate-ping"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '1s',
                      transform: `translate(${(Math.random() - 0.5) * 200}px, ${-Math.random() * 100}px) rotate(${Math.random() * 360}deg)`,
                      backgroundColor: REACTIONS[i % 5].color
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackBox;
