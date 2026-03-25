Frontend architecture overview (for documentation)
1) Tech stack
React 18 with Vite.
UI: MUI, Bootstrap, FontAwesome.
Routing: react-router-dom.
Charts: Chart.js + react-chartjs-2, Recharts.
Animations: Framer Motion, CSS keyframes.
Markdown/Math: react-markdown, remark-*, rehype-*, KaTeX.
Media/OCR/3D: react-webcam, tesseract.js, three/vanta.
HTTP: Axios.
Testing: React Testing Library, Jest setup.
2) High‑level structure
Entry: index.js mounts App.
Shell: App.js applies global styles and renders the main Routing.
Routing: routing/Routing.jsx defines route map, nesting, layouts, protected routes via components/PrivateRoute.js.
State: React Contexts under contexts/ for cross‑cutting app state (progress, quests, leaderboard, notifications, current question, timers, tutorial).
Views/Features: components/ contains page components (dashboards, analysis pages, homework flows, modals) and reusable UI building blocks.
Data/Services: api/axiosInstance.js centralizes HTTP client; utils/errorHandling.js normalizes error reporting; utils/SoundManager.js encapsulates audio feedback; hooks/ holds domain hooks like OCR and sound.
Domain models: models/ provide client-side domain structures and helpers for achievements, progress, quests, rewards, streaks, leaderboard, notifications.
Styling: global theme and animations under styles/, component-scoped .css next to components, plus some top-level CSS files used across features.
Assets: images and static files under assets/ and public/.
Telemetry: reportWebVitals.js for performance metrics.
3) Directory responsibilities
src/index.js: bootstraps React app, imports index.css, mounts App.
src/App.js: top-level composition; provides global contexts and the router; includes App.css.
src/routing/Routing.jsx: declares routes, nested screens, redirects; integrates PrivateRoute for auth‑guarded screens.
src/components/:
Pages: StudentDashboard.jsx, TeacherDashboard.jsx, EnhancedTeacherDash.jsx, StudentAnalysis.jsx, Enhanced StudentAnalysis.jsx, ProgressDashboard.jsx, UnifiedSessions.jsx, QuestsPage.jsx, LeaderBoardPage.jsx, etc.
Feature modules: homework/classwork flows (UploadHomework.jsx, UploadClasswork.jsx, modals), chat (ChatBox.jsx, MultilingualChatBox.jsx), analytics (Analytics.jsx, ClassAnalysis.jsx), markdown and math (MarkdownWithMath.jsx, MarkdownViewer.jsx), timers and streaks (StudyTimer.jsx, StudyStreak.jsx/StudyStreaks.jsx), achievements, notifications, route tracking, camera capture, etc.
Cross‑cutting UI: Layout.jsx, headers, loaders, cards, dropdowns, and CSS companions.
Guards: PrivateRoute.js checks auth context and redirects unauthenticated users.
src/contexts/: encapsulates global state with React Contexts; each context file defines provider + reducer/state.
src/api/axiosInstance.js: configures Axios base URL, interceptors (auth headers, error handling), and timeouts.
src/hooks/: feature hooks encapsulating side effects and reusable logic (useOCR, useSoundFeedback).
src/models/: domain helpers/constructors for consistent client-side data handling.
src/utils/: utilities for audio (SoundManager, BaseSounds), errors, and common helpers.
src/styles/: global theming, animation CSS, and shared visual patterns.
src/setupTests.js: Jest/RTL environment setup.
4) Runtime data flow
View triggers action → Context or hook performs side-effects → API call via axiosInstance (and errorHandling) → Response normalized into domain structures (models/) → Context state updates → Components re-render with updated props/state → Optional UI feedback via SoundManager/animations.
Navigation flow: Routing maps URL → component; PrivateRoute consults AuthContext to allow/redirect.
Cross‑feature notifications: events propagate into NotificationContext, shown via NotificationDropdown or page-level UI.
5) State management approach
Global/shared state in Contexts: progress tracking, streaks, quests, leaderboard, notifications, timers, tutorials, current question.
Local/UI state inside components for transient interaction (modals, inputs).
Side effects encapsulated in custom hooks to keep components declarative.
6) Networking and error handling
Central Axios client with base URL and interceptors.
Errors are piped through utils/errorHandling.js to ensure consistent messages, logging, and user‑facing notifications.
Optionally propagate API failures to contexts to reflect degraded states in dashboards.
7) UI and styling conventions
Composition-first React components; page components compose feature components.
Styling split between:
Global theme and animations in styles/.
Feature/component CSS alongside each component file for cohesion.
MUI components for accessible defaults; Bootstrap for layout utilities; FontAwesome for icons.
Animations via Framer Motion and CSS classes for enhanced feedback.
8) Feature highlights and helpers
Learning features: dashboards, analysis (per student/class), quick exercises, results, session details, similar questions.
Engagement features: achievements, quests, leaderboard, motivational quotes, streaks, sound feedback, shooting stars/animations.
Content rendering: Markdown + Math with KaTeX; raw/HTML enabled where safe.
Media: webcam capture; OCR via tesseract.js.
Visualization: charts for progress/analytics.
9) Routing map (illustrative, not exhaustive)
Public: login (LoginPage.js), signup (SignupPage.js), tutorial (Tutorial.jsx).
Private: student dashboards (StudentDash.jsx, StudentDashboard.jsx, ProgressDashboard.jsx), teacher dashboards (TeacherDashboard.jsx, EnhancedTeacherDash.jsx), analysis pages, sessions, quests/leaderboard, homework/classwork upload and details.
Guard: PrivateRoute.js wraps private routes.
10) Testing and quality
setupTests.js configures Jest DOM matchers and RTL.
Component tests focus on rendering, interactions, and context integration.
reportWebVitals.js can be wired to analytics to track performance.
11) Performance considerations
Vite dev/build for fast HMR and optimized bundles.
Prefer code-splitting for large pages and heavy dependencies (charts, OCR, three/vanta).
Virtualize long lists with react-window.
Memoize derived data, stabilize callbacks/values where contexts provide large trees.
12) Security and privacy
Auth tokens handled in Axios interceptors; avoid leaking sensitive data in logs.
Guard private routes; restrict feature access by role if available.
Sanitize any user-generated Markdown/HTML; use rehype-raw cautiously.
13) Environment/config
Vite config in vite.config.js; dev server via npm run dev.
Backend proxy in package.json proxy.
Environment variables via Vite (import.meta.env) for API endpoints/flags.
14) Suggested contribution guidelines
Add new features as folders/files under components/ with co-located CSS.
Lift shared state into a new context under contexts/ if used across pages.
Encapsulate side effects in hooks/.
Centralize new APIs in dedicated modules that import axiosInstance.
Keep domain transformations in models/ for reusability.




`// full-detailed-documentation.`

I gathered the routes and scanned components to map page-by-page API usage, the solve/concepts/auto-score flows, and role-based features. I’ll present a concise, structured doc you can paste into frontend.md or keep separate.

## Component/page to API mapping

### Auth and global
- Auth flow (used by `components/LoginPage.js`, `components/PrivateRoute.js`, contexts using `axiosInstance`)
  - POST `/api/token/` (login)
  - GET `/api/token/verify/` (verify)
  - POST `/api/logout/` (logout)
  - POST `/api/token/refresh/` (refresh, handled internally)
- Notifications (in `contexts/NotificationContext.js`, surfaced via UI)
  - POST `/notifications/{id}/read/`

### Student journey

- Login (`/login` → `components/LoginPage.js`)
  - Uses `axiosInstance.login` → POST `/api/token/`

- Student Dashboard (`/student-dash` → `components/StudentDash.jsx`)
  - GET `/classes/` (class list)
  - POST `/subjects/` (subjects for class)
  - POST `/chapters/` (chapters for class+subject)
  - POST `/question-images/` (generate questions by flags: `solved`, `exercise`, `external`, `worksheets`)
    - External set discovery and worksheets discovery also call `/question-images/` with different flags

- Solve Question (`/solvequestion` → `components/SolveQuestion.jsx`)
  - POST `/anssubmit/` (unified endpoint for all three actions; form-data)
    - Actions:
      - Concepts Required (Explain): send `explain=true`
      - Solved Solution (Solve): send `solve=true`
      - Auto-Correct (Submit + Correct): send `submit=true` and upload `ans_img` images
    - Common payload fields: `class_id`, `subject_id`, `topic_ids`, `question`, `ques_img` or `question_img_base64`, `subtopic`, `question_id`, study time fields
    - Uses `axiosInstance.uploadFile` when uploading images and plain POST otherwise

- Result Page (`/resultpage` → `components/ResultPage.jsx`)
  - POST `/auto-score/` (auto-score the student answer if API did not return a score)
    - Input: `student_answer`, `question`, `expected_solution`, `total_marks`
    - Fallback client-side scoring if API not available
  - Displays AI outputs from `/anssubmit/` response:
    - `ai_explaination` steps, `concepts`, `comment`, `gap_analysis`, `error_type`, `time_analysis`, `question_image_base64`, `student_answer_base64`, `score/obtained_marks`

- Similar Questions (`/similar-questions` → `components/SimilarQuestions.jsx`)
  - POST `/similarquestion/` with original question and context

- Progress Dashboard (`/progress-dashboard` → `components/ProgressDashboard.jsx`)
  - Displays progress context data (no direct API calls found here)
  - Related components fetch:
    - `components/Analytics.jsx`: GET `/average-score/`
    - `components/RecentSessions.jsx`: GET `/sessiondata/`
    - `components/UnifiedSessions.jsx`:
      - GET `/sessiondata/`
      - GET `/student-classwork-submissions/`
      - GET `/homework-submission/`

- Leaderboard (`/leaderboard` → `components/LeaderBoardPage.jsx`)
  - GET `/leaderboard/`
  - Context can POST `/leaderboard/update` when needed (see `contexts/LeaderboardContext.js`)

- Homework flows
  - Homework page (`/homework` → `components/HomeworkSubmissionForm.jsx`)
    - POST `/homework-submission/` (form-data) for manual homework submissions
  - Upload Homework component (`components/UploadHomework.jsx`)
    - GET `/homework-list/`
    - POST `auto-homework-submission/` (form-data) to batch submit/auto-process homework

- Classwork flows
  - Upload Classwork (`components/UploadClasswork.jsx`)
    - GET `/classwork-list/`
    - POST `auto-classwork-submission/` (form-data, PDFs) to auto-process classwork
  - Quick Exercise for classwork/homework (`components/QuickExerciseComponent.jsx`) used also inside Teacher Dash
    - GET `/classes/`
    - POST `/subjects/`
    - POST `/chapters/`
    - POST `/question-images/` (generate question sets)
    - GET `/classwork-list/`, GET `/homework-list/` (view previous)
    - GET `/classwork-submission/?classwork_code=...` (view selected classwork report)
    - GET `/homework-submission/?homework_code=...` (view selected homework report)
    - POST `/classwork-submission/` (upload form-data: PDFs + questions for classwork)

### Teacher journey

- Teacher Dashboard (`/teacher-dash` → `components/EnhancedTeacherDash.jsx`)
  - GET `/teacher-dashboard/` (initial teacher data)
  - Homework creation: `TeacherDashboard` pane → POST `/homework/` (from `handleAssignmentSubmit`)
  - Classwork creation: Quick exercise pane in classwork mode → POST `/classwork/`
  - Upload Homework: `UploadHomework` (see above)
  - Upload Classwork: `UploadClasswork` (see above)
  - Teacher worksheet management in `components/TeacherDashboard.jsx` (referenced but rendered inside `EnhancedTeacherDash`)
    - POST `/worksheets/` (create)
    - GET `/worksheetslist/` (list)
    - GET `/worksheet-questions/?worksheet_name=...` (fetch questions)
    - POST `/worksheet-delete/` (delete)
    - Also uses class/subject/chapter APIs and `/subjects/`, `/chapters/`, `/classes/`

### Analytics and reports

- Analytics (`/analytics` → `components/Analytics.jsx`)
  - GET `/average-score/`

- Gap Analysis Report (`/gap-analysis-report` → `components/StudentGapAnalysisReport.js`)
  - POST `/gap-analysis-report/` (by session)
  - GET `/allsessionsdata/`

- Sessions (`RecentSessions`, `UnifiedSessions`)
  - GET `/sessiondata/`
  - GET `/student-classwork-submissions/`
  - GET `/homework-submission/`

### Multilingual Chat (separate FastAPI service)
- `components/MultilingualChatBox.jsx` talks to `FASTAPI_CHATBOT_URL`
  - GET `/health`
  - POST `/login`
  - GET/POST `/student-info`
  - POST `/chat`
  - POST `/process-audio`
  - DELETE `/chat-history`
- Not using `axiosInstance` base URL; this is a parallel service

## Solve, Concepts Required, and Auto-Score flows

- Entry points: Student selects/generates questions in `StudentDash.jsx` (via `/question-images/`) and navigates to `SolveQuestion.jsx`.

- SolveQuestion actions (single endpoint `/anssubmit/`):
  - Concepts Required (Explain)
    - Trigger: “Concepts-Required” button
    - Payload flags: `explain=true` plus context (`class_id`, `subject_id`, `topic_ids`, `question`, `ques_img`/`question_img_base64`, `subtopic`, `question_id`, study-time fields)
    - Response: AI concepts array, explanations, examples, comments
    - Navigates to `ResultPage` with `actionType: "explain"`
  - Solved Solution (Solve)
    - Trigger: “Solved-Solution” button
    - Payload flags: `solve=true` plus context (same as above)
    - Response: solution steps (`ai_explaination`), diagrams as base64 if any
    - Navigates to `ResultPage` with `actionType: "solve"`
  - Auto-Correct (Submit + Correct)
    - Trigger: “Auto-Correct” button (requires at least one `ans_img`)
    - Uploads images with `axiosInstance.uploadFile` to `/anssubmit/`
    - Response: includes `student_answer` text extraction, `obtained_marks` or `score`, `comment`, `gap_analysis`, `error_type`, `time_analysis`, `concepts_used`/`concepts_required`
    - Navigates to `ResultPage` with `actionType: "correct"`
  - All actions pass study time; progress/quests are updated via contexts.

- Auto-Score on ResultPage
  - If `/anssubmit/` did not return `score/obtained_marks`, `ResultPage.jsx` computes it:
    - POST `/auto-score/` with `student_answer`, `question`, `expected_solution` and `total_marks`
    - If unavailable, uses local keyword-based fallback scoring

## Role-based features and page access

- Student
  - Accessible pages:
    - `/login`, `/signup`
    - `/student-dash`: generate questions (GET `/classes/`; POST `/subjects/`, `/chapters/`, `/question-images/`)
    - `/solvequestion`: send explain/solve/submit/correct to `/anssubmit/`
    - `/resultpage`: view AI results; may call `/auto-score/`
    - `/similar-questions`: POST `/similarquestion/`
    - `/progress-dashboard`: displays analytics; related components call `/average-score/`, `/sessiondata/`
    - `/leaderboard`: GET `/leaderboard/`
    - `/quests`: internal quests context
    - `/homework`: Homework submission UI: POST `/homework-submission/`
    - `/gap-analysis-report`: POST `/gap-analysis-report/`, GET `/allsessionsdata/`
  - Other capabilities:
    - View recent/unified sessions (`/sessiondata/`, `/homework-submission/`, `/student-classwork-submissions/`)
    - Notifications: mark read via `/notifications/{id}/read/`

- Teacher
  - Accessible pages:
    - `/teacher-dash`:
      - GET `/teacher-dashboard/`
      - Homework creation: POST `/homework/`
      - Classwork creation: POST `/classwork/`
      - Upload Homework: GET `/homework-list/`, POST `auto-homework-submission/`
      - Upload Classwork: GET `/classwork-list/`, POST `auto-classwork-submission/`
      - Classwork report fetch: GET `/classwork-submission/?classwork_code=...`
      - Homework report fetch: GET `/homework-submission/?homework_code=...`
      - Worksheets management (via `TeacherDashboard.jsx`):
        - POST `/worksheets/`, GET `/worksheetslist/`, GET `/worksheet-questions/?worksheet_name=...`, POST `/worksheet-delete/`
      - Reuses the question generation APIs (`/classes/`, `/subjects/`, `/chapters/`, `/question-images/`)
  - Other capabilities:
    - View analytics (class, student), reuse session data endpoints in analysis components
    - Notifications management where relevant

- Shared/guarded
  - `PrivateRoute.js` protects all non-public routes based on `AuthContext.isAuthenticated`
  - Auth APIs: login, verify, refresh, logout

## API inventory by feature

- Core taxonomy/data
  - GET `/classes/`
  - POST `/subjects/` { class_id }
  - POST `/chapters/` { class_id, subject_id }
- Question generation
  - POST `/question-images/` { classid, subjectid, topicid[], flags: solved|exercise|external|worksheets, subtopic?, worksheet_name? }
- Solving/correction
  - POST `/anssubmit/` (form-data or JSON depending on action)
  - POST `/auto-score/`
  - POST `/similarquestion/`
- Assignments
  - Homework:
    - POST `/homework/` (create by teacher)
    - GET `/homework-list/`
    - POST `auto-homework-submission/` (form-data upload)
    - GET `/homework-submission/?homework_code=...`
  - Classwork:
    - POST `/classwork/` (create by teacher)
    - GET `/classwork-list/`
    - POST `auto-classwork-submission/` (form-data upload)
    - POST `/classwork-submission/` (form-data upload with PDFs and questions)
    - GET `/classwork-submission/?classwork_code=...`
  - Worksheets (teacher):
    - POST `/worksheets/`
    - GET `/worksheetslist/`
    - GET `/worksheet-questions/?worksheet_name=...`
    - POST `/worksheet-delete/`
- Analytics and reports
  - GET `/average-score/`
  - GET `/sessiondata/`
  - GET `/student-classwork-submissions/`
  - GET `/homework-submission/` (list or summary)
  - POST `/gap-analysis-report/`
  - GET `/allsessionsdata/`
- Leaderboard
  - GET `/leaderboard/`
  - POST `/leaderboard/update`
- Notifications
  - POST `/notifications/{id}/read/`
- Auth
  - POST `/api/token/`
  - GET `/api/token/verify/`
  - POST `/api/logout/`
  - POST `/api/token/refresh/`
- Chat (separate FastAPI service)
  - GET `/health`, POST `/login`, GET/POST `/student-info`, POST `/chat`, POST `/process-audio`, DELETE `/chat-history`

## Data passed on Solve flows (field quick reference)

Sent from `SolveQuestion.jsx` to `/anssubmit/`:
- Always: `class_id`, `subject_id`, `topic_ids`, `question`, `subtopic`, `question_id`, `study_time_seconds`, `study_time_minutes`
- For Explain: `explain=true`
- For Solve: `solve=true`
- For Auto-Correct: `submit=true`, `ans_img` (one or more Files)
- For question image: `ques_img` (when available) OR `question_img_base64` (when fetched and converted)

Returned (consumed in `ResultPage.jsx`):
- `ai_explaination` (steps), `solution` (optional), `concepts`, `concepts_used`, `comment`
- `gap_analysis`, `error_type`, `time_analysis`
- `student_answer`/`student_answer_base64`, `question_image_base64`
- `score` or `obtained_marks` and `total_marks`/`question_marks`

