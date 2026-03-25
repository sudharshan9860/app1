import React, { useContext, useEffect, useState, useRef } from "react";
import { NotificationContext } from "../contexts/NotificationContext"; // adjust path
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Share2,
  CheckCircle,
  XCircle,
  List,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus,
  BookOpen,
  Sun,
  Moon,
  Filter,
  X,
  Info,
} from "lucide-react";
import MarkdownWithMath from "./MarkdownWithMath";
import { Modal, Button, Form, Badge, Tooltip, OverlayTrigger } from "react-bootstrap";

const ChatRoom = () => {
  const {
    groups,
    groupInvitations,
    groupMessages,
    createGroup,
    inviteToGroup,
    respondToGroupInvite,
    sendGroupMessage,
  } = useContext(NotificationContext);

  const { username, fullName } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedGroup, setSelectedGroup] = useState(groups && groups[0] ? groups[0] : null);
  const [messageText, setMessageText] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteInput, setInviteInput] = useState(""); // comma separated usernames
  const messagesEndRef = useRef(null);

  // Question sharing states
  const [lastSession, setLastSession] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionsToShare, setSelectedQuestionsToShare] = useState([]);
  const [showQuestionList, setShowQuestionList] = useState(false);

  // UI/UX enhancement states
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showShareConfirmModal, setShowShareConfirmModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    groups: true,
    invites: true,
    questions: false,
    create: true
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load last session from localStorage
  useEffect(() => {
    const loadLastSession = () => {
      try {
        const savedSession = localStorage.getItem(`lastSession_${username}`);
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          // Check if session is recent (within last 7 days)
          const sessionDate = new Date(sessionData.timestamp);
          const daysSinceSession = (new Date() - sessionDate) / (1000 * 60 * 60 * 24);

          if (daysSinceSession <= 7 && sessionData.questionList && sessionData.questionList.length > 0) {
            setLastSession(sessionData);
            setAvailableQuestions(sessionData.questionList);
            console.log("Last session loaded for chat sharing:", sessionData);
          }
        }
      } catch (error) {
        console.error("Error loading last session:", error);
      }
    };

    if (username) {
      loadLastSession();
    }
  }, [username]);

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // if groups change and no group selected, select first
    if ((!selectedGroup || !selectedGroup.id) && groups && groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [groups]); // eslint-disable-line

  useEffect(() => {
    // scroll to bottom when messages change
    scrollToBottom();
  }, [groupMessages, selectedGroup]); // eslint-disable-line

  // Toggle dark mode - dispatches custom event to prevent forced reflow
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());

    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('darkModeChange', {
      detail: { isDarkMode: newMode }
    }));
  };

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filtered questions based on search
  const filteredQuestions = availableQuestions.filter(q =>
    q.question?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    try {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    } catch (_) {}
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }
    setIsLoading(true);
    // parse invite list
    const invitees = inviteInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    createGroup(newGroupName, invitees);
    setNewGroupName("");
    setInviteInput("");
    setShowCreateGroupModal(false);
    setIsLoading(false);
  };

  const handleSendMessage = () => {
    if (!selectedGroup || !messageText.trim()) return;
    sendGroupMessage(selectedGroup.id, messageText.trim());
    setMessageText("");
  };

  const handleAcceptInvite = (group) => {
    respondToGroupInvite(group.id, "accept");
    // UI update will be driven by context (group_joined)
  };

  const handleIgnoreInvite = (group) => {
    respondToGroupInvite(group.id, "ignore");
  };

  const handleInviteMore = (group) => {
    const invitees = prompt("Enter comma-separated usernames to invite:");
    if (!invitees) return;
    const list = invitees.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length) inviteToGroup(group.id, list);
  };

  // Toggle question selection
  const handleQuestionToggle = (index) => {
    setSelectedQuestionsToShare((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Initiate share questions (show confirmation modal)
  const initiateShareQuestions = () => {
    if (!selectedGroup || selectedQuestionsToShare.length === 0) {
      alert("Please select at least one question to share");
      return;
    }
    setShowShareConfirmModal(true);
  };

  // Share selected questions with the group (after confirmation)
  const handleShareQuestions = () => {
    setIsLoading(true);

    // Get selected question data
    const questionsToShare = selectedQuestionsToShare.map((index) => availableQuestions[index]);

    // Create a message with question data
    const messageData = {
      type: "shared_questions",
      questions: questionsToShare,
      session_metadata: {
        class_id: lastSession.class_id,
        subject_id: lastSession.subject_id,
        subject_name: lastSession.subject_name,
        topic_ids: lastSession.topic_ids,
        chapter_names: lastSession.chapter_names,
        subtopic: lastSession.subtopic,
        worksheet_id: lastSession.worksheet_id,
      },
      shared_by: username,
    };

    // Send as a special message
    sendGroupMessage(selectedGroup.id, JSON.stringify(messageData));

    // Reset selection
    setSelectedQuestionsToShare([]);
    setShowQuestionList(false);
    setShowShareConfirmModal(false);
    setIsLoading(false);
    setSearchQuery(""); // Clear search
  };

  // Handle clicking on a shared question message
  const handleSharedQuestionClick = (messageData) => {
    try {
      const data = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;

      if (data.type === "shared_questions" && data.questions && data.questions.length > 0) {
        // Navigate to SolveQuestion with the first question and the full list
        const firstQuestion = data.questions[0];

        navigate("/solvequestion", {
          state: {
            question: firstQuestion.question,
            question_id: firstQuestion.question_id || firstQuestion.id,
            questionNumber: 1,
            questionList: data.questions,
            class_id: data.session_metadata.class_id,
            subject_id: data.session_metadata.subject_id,
            subject_name: data.session_metadata.subject_name,
            topic_ids: data.session_metadata.topic_ids,
            chapter_names: data.session_metadata.chapter_names,
            subtopic: data.session_metadata.subtopic,
            worksheet_id: data.session_metadata.worksheet_id,
            image: firstQuestion.image,
            context: firstQuestion.context,
            selectedQuestions: data.questions,
            sharedBy: data.shared_by,
          },
        });
      }
    } catch (error) {
      console.error("Error handling shared question:", error);
    }
  };

  const messagesForSelected = selectedGroup ? (groupMessages[selectedGroup.id] || []) : [];

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-[#0B1120] text-white' : 'bg-[#F8FAFC]'}`}>
      {/* Sidebar */}
      <div className={`w-80 flex-shrink-0 border-r overflow-y-auto flex flex-col ${
        isDarkMode ? 'bg-[#0B1120] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-[#0B1120] flex items-center gap-2">
              <Users size={20} className="text-[#00A0E3]" />
              Study Rooms
            </h3>
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 bg-[#00A0E3] text-white text-[11px] rounded-full">
                {fullName}
              </span>
            </div>
          </div>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</Tooltip>}
          >
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-amber-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </OverlayTrigger>
        </div>

        {/* Groups Section - Collapsible */}
        <div className="border-b border-gray-100">
          <div
            className="flex justify-between items-center px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('groups')}
          >
            <h4 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2">
              <Users size={14} className="text-[#00A0E3]" />
              Your Groups
              <span className="inline-block px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-[10px] rounded-full ml-1">
                {groups?.length || 0}
              </span>
            </h4>
            {collapsedSections.groups ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
          </div>
          {!collapsedSections.groups && (
            <div className="px-3 pb-3">
              <ul className="space-y-1">
                {groups && groups.length ? (
                  groups.map((g) => (
                    <li
                      key={g.id}
                      className={`rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                        selectedGroup && selectedGroup.id === g.id
                          ? 'bg-[#00A0E3]/10 border border-[#00A0E3]/30'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedGroup(g)}
                    >
                      <div className="flex items-center gap-3">
                        <Users size={16} className="text-[#00A0E3] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#0B1120] truncate">{g.name}</div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Info size={10} />
                            {g.code}
                          </div>
                        </div>
                        {selectedGroup && selectedGroup.id === g.id && (
                          <CheckCircle size={14} className="text-[#00A0E3] flex-shrink-0" />
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center py-6">
                    <Users size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No groups yet</p>
                    <small className="text-gray-300">Create your first group below!</small>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Create Group Button */}
        <div className="px-4 py-3 border-b border-gray-100">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00A0E3] text-white text-sm font-medium rounded-lg hover:bg-[#0080B8] transition-colors"
            onClick={() => setShowCreateGroupModal(true)}
          >
            <UserPlus size={16} />
            Create New Group
          </button>
        </div>

        {/* Pending Invites Section - Collapsible */}
        <div className="border-b border-gray-100">
          <div
            className="flex justify-between items-center px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('invites')}
          >
            <h4 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2">
              <UserPlus size={14} className="text-[#00A0E3]" />
              Pending Invites
              {groupInvitations && groupInvitations.length > 0 && (
                <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full ml-1">
                  {groupInvitations.length}
                </span>
              )}
            </h4>
            {collapsedSections.invites ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
          </div>
          {!collapsedSections.invites && (
            <div className="px-4 pb-3">
              {groupInvitations && groupInvitations.length ? (
                groupInvitations.map((inv, idx) => (
                  <div key={idx} className="bg-[#F8FAFC] rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={14} className="text-amber-500" />
                      <div>
                        <div className="text-sm font-medium text-[#0B1120]">{inv.group.name}</div>
                        <div className="text-[11px] text-gray-400">by {inv.inviter?.fullname || inv.inviter?.username || "Unknown"}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                        onClick={() => handleAcceptInvite(inv.group)}
                      >
                        <CheckCircle size={12} />
                        Accept
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-500 text-xs rounded-lg hover:bg-red-50 transition-colors"
                        onClick={() => handleIgnoreInvite(inv.group)}
                      >
                        <X size={12} />
                        Ignore
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <UserPlus size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No pending invites</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Sharing Section - Enhanced */}
        <div className="border-b border-gray-100">
          <div
            className="flex justify-between items-center px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('questions')}
          >
            <h4 className="text-sm font-semibold text-[#0B1120] flex items-center gap-2">
              <BookOpen size={14} className="text-[#00A0E3]" />
              Share Questions
              {selectedQuestionsToShare.length > 0 && (
                <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full ml-1">
                  {selectedQuestionsToShare.length} selected
                </span>
              )}
            </h4>
            {collapsedSections.questions ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
          </div>
          {!collapsedSections.questions && (
            <div className="px-4 pb-3">
              {lastSession && availableQuestions.length > 0 ? (
                <>
                  <div className="bg-[#F8FAFC] rounded-lg p-3 mb-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-[#0B1120]">
                      <BookOpen size={12} className="text-[#00A0E3]" />
                      <span><strong>Subject:</strong> {lastSession.subject_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#0B1120]">
                      <HelpCircle size={12} className="text-[#00A0E3]" />
                      <span><strong>Total:</strong> {availableQuestions.length} questions</span>
                    </div>
                  </div>

                  {/* Question List */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {filteredQuestions.length > 0 ? (
                      filteredQuestions.map((q, index) => {
                        const originalIndex = availableQuestions.indexOf(q);
                        return (
                          <div
                            key={originalIndex}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
                              selectedQuestionsToShare.includes(originalIndex)
                                ? 'bg-[#00A0E3]/10 border border-[#00A0E3]/30'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => handleQuestionToggle(originalIndex)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedQuestionsToShare.includes(originalIndex)}
                              onChange={() => handleQuestionToggle(originalIndex)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 accent-[#00A0E3]"
                            />
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="inline-block px-1.5 py-0.5 bg-[#00A0E3] text-white text-[10px] rounded font-medium flex-shrink-0">Q{originalIndex + 1}</span>
                              <div className="text-xs text-[#0B1120] min-w-0">
                                <MarkdownWithMath content={q.question?.substring(0, 100) || 'Question'}/>
                                {q.question?.length > 100 && '...'}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <Search size={24} className="text-gray-200 mx-auto mb-1" />
                        <p className="text-xs text-gray-400">No questions match your search</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {selectedQuestionsToShare.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedQuestionsToShare([])}
                      >
                        <X size={12} />
                        Clear
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          selectedGroup
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={initiateShareQuestions}
                        disabled={!selectedGroup}
                      >
                        <Share2 size={12} />
                        Share {selectedQuestionsToShare.length}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <BookOpen size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No recent questions</p>
                  <small className="text-gray-300">Solve some questions first to share with your group!</small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          isDarkMode ? 'bg-[#0B1120] border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-bold text-[#0B1120]">{selectedGroup ? selectedGroup.name : "Select a group"}</h3>
          {selectedGroup && (
            <button
              className="px-4 py-1.5 border border-[#00A0E3] text-[#00A0E3] text-sm rounded-lg hover:bg-[#00A0E3] hover:text-white transition-colors"
              onClick={() => handleInviteMore(selectedGroup)}
            >
              Invite
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-[#F8FAFC]'}`} id="chatMessages">
          {selectedGroup ? (
            messagesForSelected.length ? (
              messagesForSelected.map((m, i) => {
                const isSystem = m.type === "group_system_message";
                const fromMe = m.sender && m.sender.username === username;

                // Check if this is a shared questions message
                let isSharedQuestion = false;
                let sharedData = null;
                try {
                  const parsed = JSON.parse(m.message);
                  if (parsed.type === "shared_questions") {
                    isSharedQuestion = true;
                    sharedData = parsed;
                  }
                } catch (e) {
                  // Not a JSON message, regular text
                }

                return (
                  <div key={i} className={`flex ${isSystem ? 'justify-center' : fromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${
                      isSystem
                        ? 'bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full'
                        : fromMe
                          ? 'bg-[#00A0E3] text-white rounded-2xl rounded-br-sm px-4 py-2.5'
                          : 'bg-white border border-gray-200 text-[#0B1120] rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm'
                    }`}>
                      {!isSystem && (
                        <div className="flex justify-between items-center gap-4 mb-1">
                          <strong className={`text-xs ${fromMe ? 'text-white/80' : 'text-[#0B1120]'}`}>
                            {m.sender?.fullname || m.sender?.username}
                          </strong>
                          <span className={`text-[10px] ${fromMe ? 'text-white/60' : 'text-gray-400'}`}>
                            {new Date(m.timestamp).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {isSharedQuestion && sharedData ? (
                        <div
                          className="bg-blue-50 border-2 border-[#00A0E3] rounded-lg p-3 cursor-pointer hover:bg-blue-100 hover:scale-[1.02] transition-all"
                          onClick={() => handleSharedQuestionClick(m.message)}
                        >
                          <div className="flex items-center gap-2 mb-2 text-base font-bold text-[#0080B8]">
                            <HelpCircle size={18} />
                            <span>Shared Questions</span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2 space-y-0.5">
                            <div><strong>Subject:</strong> {sharedData.session_metadata.subject_name}</div>
                            <div><strong>Questions:</strong> {sharedData.questions.length}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Shared by: {sharedData.shared_by}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[13px] text-[#0080B8] font-medium">
                            <CheckCircle size={14} />
                            <span>Click to start solving</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">{m.message}</div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No messages yet -- say hi</div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Select a group to see messages</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className={`px-4 py-3 border-t flex gap-2 ${isDarkMode ? 'bg-[#0B1120] border-gray-700' : 'bg-white border-gray-200'}`}>
          <input
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/30 focus:border-[#00A0E3] transition-colors ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-[#F8FAFC] border-gray-200 text-[#0B1120] placeholder-gray-400'
            }`}
            placeholder={selectedGroup ? "Type a message..." : "Select a group to send messages"}
            disabled={!selectedGroup}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <button
            className={`p-2.5 rounded-xl transition-colors ${
              !selectedGroup || !messageText.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#00A0E3] text-white hover:bg-[#0080B8]'
            }`}
            disabled={!selectedGroup || !messageText.trim()}
            onClick={handleSendMessage}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Create Group Modal */}
      <Modal show={showCreateGroupModal} onHide={() => setShowCreateGroupModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="flex items-center gap-2">
            <Users size={20} className="text-[#00A0E3]" />
            Create New Group
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Group Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Invite Members (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="username1, username2, username3"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
              />
              <Form.Text className="text-gray-400">
                Enter usernames separated by commas
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateGroupModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim() || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Share Questions Confirmation Modal */}
      <Modal show={showShareConfirmModal} onHide={() => setShowShareConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="flex items-center gap-2">
            <Share2 size={20} className="text-[#00A0E3]" />
            Confirm Share Questions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <p className="font-semibold text-[#0B1120]">You are about to share:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-[#0B1120]">
              <li><strong>{selectedQuestionsToShare.length}</strong> question(s)</li>
              <li>Subject: <strong>{lastSession?.subject_name}</strong></li>
              <li>Group: <strong>{selectedGroup?.name}</strong></li>
            </ul>
            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 text-[#0080B8] rounded-lg text-sm">
              <Info size={16} className="flex-shrink-0" />
              All group members will be able to solve these questions.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShareConfirmModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleShareQuestions}
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share Questions'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChatRoom;
