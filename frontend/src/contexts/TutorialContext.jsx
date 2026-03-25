import React, { createContext, useState, useContext, useEffect } from "react";

const TutorialContext = createContext();

export const TutorialProvider = ({ children }) => {
  // Tutorial never starts automatically - only when user clicks the button
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPage, setCurrentPage] = useState("");
  const [activeTutorialPage, setActiveTutorialPage] = useState(""); // Track which page tutorial is active for
  const [completedPages, setCompletedPages] = useState(
    JSON.parse(localStorage.getItem("completedTutorialPages") || "[]")
  );
  const [tutorialFlow, setTutorialFlow] = useState("manual"); // Changed from "active" to "manual"

  // Save completed pages to localStorage (optional - for tracking purposes only)
  useEffect(() => {
    localStorage.setItem(
      "completedTutorialPages",
      JSON.stringify(completedPages)
    );
  }, [completedPages]);

  // Note: tutorialFlow is no longer persisted to localStorage
  // Tutorial always starts in "manual" mode on page load

  // Function to mark a page as completed or uncompleted
  const markPageCompleted = (pageName, completed = true) => {
    if (completed) {
      // Add to completed pages if not already there
      if (!completedPages.includes(pageName)) {
        // console.log(`Marking page ${pageName} as completed`);
        setCompletedPages([...completedPages, pageName]);
      }
    } else {
      // Remove from completed pages
      // console.log(`Marking page ${pageName} as not completed`);
      setCompletedPages(completedPages.filter((page) => page !== pageName));
    }
  };

  // Function to reset the tutorial (clear all tutorial state)
  const resetTutorial = () => {
    setShowTutorial(false);
    setCurrentStep(0);
    setCurrentPage("");
    setActiveTutorialPage("");
    setCompletedPages([]);
    setTutorialFlow("manual");
    localStorage.removeItem("completedTutorialPages");
    localStorage.removeItem("hasCompletedTutorial");
    // console.log("Tutorial state reset to defaults");
  };

  // Function to start tutorial from toggle button (deprecated - use startTutorialForPage)
  const startTutorialFromToggle = () => {
    console.log("startTutorialFromToggle is deprecated, use startTutorialForPage instead");
    setShowTutorial(true);
    setCurrentStep(0);
    setCurrentPage("studentDash");
    setActiveTutorialPage("studentDash");
    setTutorialFlow("manual");
  };

  // Function to start tutorial for a specific page ONLY (no flow to other pages)
  const startTutorialForPage = (pageName) => {
    console.log(`Starting tutorial for page: ${pageName} (manual mode - no auto-flow)`);
    setShowTutorial(true);
    setCurrentStep(0);
    setCurrentPage(pageName);
    setActiveTutorialPage(pageName); // Set the specific page that tutorial is active for
    setTutorialFlow("manual"); // Manual mode - no automatic flow
  };

  // Function to restart tutorial for a specific page
  const restartTutorialForPage = (pageName) => {
    console.log(`Restarting tutorial for page: ${pageName}`);
    setShowTutorial(true);
    setCurrentStep(0);
    setCurrentPage(pageName);
    setActiveTutorialPage(pageName);
    setTutorialFlow("manual");
    // Remove the page from completed pages if it's there (for tracking purposes)
    if (completedPages.includes(pageName)) {
      setCompletedPages(completedPages.filter((page) => page !== pageName));
    }
  };

  // Function to check if tutorial should be shown for a page
  const shouldShowTutorialForPage = (pageName) => {
    // In manual mode, only show tutorial for the specific page that was clicked
    if (tutorialFlow === "manual") {
      const shouldShow = showTutorial && activeTutorialPage === pageName;
      // Only log when tutorial state changes, not on every render
      return shouldShow;
    }

    // Legacy support for old "active" flow mode (deprecated)
    if (tutorialFlow === "active") {
      // Reduced logging for legacy mode

      // If we're in StudentDash, always show tutorial
      if (pageName === "studentDash") {
        const shouldShow = showTutorial && !completedPages.includes(pageName);
        // console.log(`StudentDash tutorial check: ${shouldShow}`);
        return shouldShow;
      }

      // For QuestionListModal, show if StudentDash is completed
      if (pageName === "questionListModal") {
        const shouldShow =
          showTutorial && completedPages.includes("studentDash");
        // console.log(`QuestionListModal tutorial check: ${shouldShow}`);
        return shouldShow;
      }

      // For SolveQuestion, show if QuestionListModal is completed
      if (pageName === "solveQuestion") {
        const shouldShow =
          showTutorial && completedPages.includes("questionListModal");
        // console.log(`SolveQuestion tutorial check: ${shouldShow}`);
        return shouldShow;
      }
    }

    // Default fallback - don't show
    // console.log(`Default tutorial check for ${pageName}: false`);
    return false;
  };

  // Function to continue the tutorial flow (disabled in manual mode)
  const continueTutorialFlow = (fromPage, toPage) => {
    // console.log(`Attempting to continue tutorial flow from ${fromPage} to ${toPage}`);
    // console.log(`Current tutorial flow state:`, tutorialFlow);

    // In manual mode, do NOT auto-continue to other pages
    if (tutorialFlow === "manual") {
      // console.log(`Manual mode: Tutorial will NOT auto-continue to ${toPage}`);
      setShowTutorial(false); // Stop tutorial when leaving the page
      setActiveTutorialPage(""); // Clear active page
      return;
    }

    // Legacy "active" mode support (deprecated)
    if (tutorialFlow === "active") {
      markPageCompleted(fromPage);
      setCurrentPage(toPage);
      setCurrentStep(0); // Reset step count for the new page
      setShowTutorial(true); // Ensure tutorial is shown for the next page
      // console.log(`Tutorial flow continued to ${toPage} (legacy mode)`);
    } else {
      // console.log(`Cannot continue tutorial flow: flow is ${tutorialFlow}`);
    }
  };

  // Function to exit the tutorial flow
  const exitTutorialFlow = () => {
    // console.log("Tutorial flow: exiting flow");
    setShowTutorial(false);
    setActiveTutorialPage(""); // Clear active tutorial page
    setTutorialFlow("manual"); // Reset to manual mode
    setCurrentStep(0);
  };

  // Function to complete the entire tutorial
  const completeTutorialFlow = () => {
    // console.log("Tutorial flow: completing tutorial");
    setShowTutorial(false);
    setActiveTutorialPage(""); // Clear active tutorial page
    setTutorialFlow("manual"); // Reset to manual mode
    setCurrentStep(0);
  };

  const value = {
    showTutorial,
    setShowTutorial,
    currentStep,
    setCurrentStep,
    currentPage,
    setCurrentPage,
    activeTutorialPage,
    setActiveTutorialPage,
    markPageCompleted,
    resetTutorial,
    restartTutorialForPage,
    shouldShowTutorialForPage,
    completedPages,
    continueTutorialFlow,
    exitTutorialFlow,
    completeTutorialFlow,
    startTutorialFromToggle,
    startTutorialForPage,
    tutorialFlow,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};
