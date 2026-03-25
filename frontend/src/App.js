// src/App.js
import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./components/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ProgressProvider } from "./contexts/ProgressContext";
import { LeaderboardProvider } from "./contexts/LeaderboardContext";
import { QuestProvider } from "./contexts/QuestContext";
import { CurrentQuestionProvider } from "./contexts/CurrentQuestionContext";
// import { UserTypeProvider } from "./contexts/UserTypeContext";
import AppRoutes from "./routing/Routing";
import ChatBox from "./components/ChatBox";
import FeedbackBox from "./components/FeedbackBox";
import "./styles/theme.css";
import { TutorialProvider } from "./contexts/TutorialContext";
import { TimerProvider } from "./contexts/TimerContext";
import { MascotProvider } from "./contexts/MascotContext";
import MascotPreloader from "./components/MascotPreloader";
import { JeeModeProvider } from './contexts/JeeModeContext';
import { ChatProvider } from './contexts/ChatContext';
import RouteTracker from "./components/RouteTracker";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store/store";

// Marketing pages where we don't want to show ChatBox/FeedbackBox
// const MARKETING_PAGES = [
//   "/", "/about", "/features", "/courses", "/contact",
//   "/students", "/schools", "/privacy", "/terms", "/refund",
//   "/get-started", "/free-trial", "/payment-success",
//   "/login", "/signup"
// ];

// Wrapper component to use location hook
function AppContent() {
  const location = useLocation();
  const hideChat = ["/login", "/signup"].includes(location.pathname);

  return (
    <>
      <RouteTracker />
      <AppRoutes />
      {!hideChat && <ChatBox />}
    </>
  );
}

function App() {
  return (
    <ReduxProvider store={store}>
    <HelmetProvider>
      {/* <UserTypeProvider> */}
        <JeeModeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ProgressProvider>
                <TimerProvider>
                  <LeaderboardProvider>
                    <QuestProvider>
                      <TutorialProvider>
                        <MascotProvider>
                          <CurrentQuestionProvider>
                            <ChatProvider>
                              <Router
                                future={{
                                  v7_startTransition: true,
                                  v7_relativeSplatPath: true,
                                }}
                              >
                                <MascotPreloader />
                                <AppContent />
                              </Router>
                            </ChatProvider>
                          </CurrentQuestionProvider>
                        </MascotProvider>
                      </TutorialProvider>
                    </QuestProvider>
                  </LeaderboardProvider>
                </TimerProvider>
              </ProgressProvider>
            </NotificationProvider>
          </AuthProvider>
        </JeeModeProvider>
      {/* </UserTypeProvider> */}
    </HelmetProvider>
    </ReduxProvider>
  );
}
export default App;
