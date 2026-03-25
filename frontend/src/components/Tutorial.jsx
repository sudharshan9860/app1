import React, { useEffect, useState } from "react";
import Joyride from "react-joyride";
import { useTutorial } from "../contexts/TutorialContext";

const Tutorial = ({ steps, onComplete }) => {
  const {
    showTutorial,
    setShowTutorial,
    currentStep,
    setCurrentStep,
    currentPage,
    exitTutorialFlow,
  } = useTutorial();

  const [isButtonVisible, setIsButtonVisible] = useState(false);

  useEffect(() => {
    setIsButtonVisible(showTutorial);
  }, [showTutorial]);

  const handleClose = () => {
    console.log("Tutorial closed manually");
    setShowTutorial(false);
    setIsButtonVisible(false);
    exitTutorialFlow();
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={showTutorial}
        continuous
        showProgress
        showSkipButton
        stepIndex={currentStep}
        disableCloseOnEsc={false}
        disableOverlayClose={false}
        disableScrolling={false}
        debug={false}
        styles={{
          options: {
            primaryColor: "#00A0E3",
            zIndex: 10001,
          },
        }}
        callback={(data) => {
          const { status, index, type } = data;

          console.log("Tutorial callback:", {
            status,
            index,
            type,
            currentPage,
            showTutorial,
            currentStep,
          });

          if (type === "step:after") {
            setCurrentStep(index + 1);
          }

          if (["close", "skipped", "finished"].includes(status)) {
            console.log(`Tutorial ${status} for page ${currentPage}`);
            setShowTutorial(false);
            setIsButtonVisible(false);
            if (status === "finished") {
              onComplete?.();
            } else {
              exitTutorialFlow();
            }
          }
        }}
      />
    </>
  );
};

export default Tutorial;
