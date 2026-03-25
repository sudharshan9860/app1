import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';
import CameraCapture from './CameraCapture';
import QuestionListModal from './QuestionListModal'; // Import the modal
import { AuthContext } from './AuthContext';
import MarkdownWithMath from './MarkdownWithMath';
import { useAlert } from './AlertBox';

// ViewQuestionsModal Component with Delete Functionality
const ViewQuestionsModal = ({ show, onHide, worksheetName, questions, loading }) => {
  const { showAlert } = useAlert();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [localQuestions, setLocalQuestions] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update local questions when props change
  useEffect(() => {
    setLocalQuestions(questions);
    setSelectedQuestionIds(new Set()); // Reset selections when questions change
  }, [questions]);

  if (!show) return null;

  // Toggle selection of a question
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Select/Deselect all questions
  const toggleSelectAll = () => {
    if (selectedQuestionIds.size === localQuestions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      const allIds = new Set(localQuestions.map(q => q.id));
      setSelectedQuestionIds(allIds);
    }
  };

  // Handle delete selected questions
  const handleDeleteSelected = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    try {
      const formData = new FormData();
      // Append each ID separately - this is what getlist() expects
      const idsArray = Array.from(selectedQuestionIds);
      idsArray.forEach(id => {
        formData.append("worksheet_question_ids", id);
      });
      
      // Use POST method as your backend expects POST, not DELETE
      const response = await axiosInstance.post('/worksheet-delete/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Remove deleted questions from local state
        const updatedQuestions = localQuestions.filter(
          q => !selectedQuestionIds.has(q.id)
        );
        setLocalQuestions(updatedQuestions);
        setSelectedQuestionIds(new Set());
        
        // Show success message
        showAlert(`Successfully deleted ${idsArray.length} question(s)`, "success");
      } else {
        showAlert('Failed to delete questions. Please try again.', "error");
      }
    } catch (error) {
      console.error('Error deleting questions:', error);
      showAlert('An error occurred while deleting questions. Please try again.', "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Confirmation Modal Component
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;
    
    const questionCount = selectedQuestionIds.size;
    
    return (
      <div 
        className="delete-confirm-overlay" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}
        onClick={() => setShowDeleteConfirm(false)}
      >
        <div 
          className="delete-confirm-modal"
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transform: 'scale(1)',
            animation: 'modalSlideIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              padding: '12px',
              marginRight: '12px'
            }}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#dc2626" 
                strokeWidth="2"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
              color: '#111827'
            }}>
              Confirm Deletion
            </h3>
          </div>
          
          <p style={{
            margin: '0 0 20px 0',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Are you sure you want to delete {questionCount === 1 
              ? 'this question' 
              : `these ${questionCount} questions`}? This action cannot be undone.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#374151',
                fontWeight: '500',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.5 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              style={{
                padding: '8px 16px',
                backgroundColor: isDeleting ? '#fca5a5' : '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {isDeleting ? (
                <>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></span>
                  Deleting...
                </>
              ) : (
                <>Delete {questionCount === 1 ? 'Question' : `${questionCount} Questions`}</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={onHide}>
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-[90%] max-w-[1200px] max-h-[85vh] flex flex-col overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-[#00A0E3] to-[#0080B8] text-white relative overflow-hidden">
          <h2 className="text-2xl font-bold m-0 flex items-center gap-3 z-[1] relative">
            Worksheet Questions
            {worksheetName && <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-white/30">{worksheetName}</span>}
          </h2>
          <button className="bg-white/20 border border-white/30 rounded-xl w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-200 z-[1] relative hover:bg-white/30" onClick={onHide}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Action Bar */}
        {localQuestions.length > 0 && !loading && (
          <div className="px-5 py-2.5 border-b border-gray-200 flex justify-between items-center bg-gray-50" style={{
            padding: '10px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={toggleSelectAll}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid',
                  borderColor: selectedQuestionIds.size === localQuestions.length && localQuestions.length > 0 ? '#00A0E3' : '#d1d5db',
                  borderRadius: '4px',
                  backgroundColor: selectedQuestionIds.size === localQuestions.length && localQuestions.length > 0 ? '#00A0E3' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}>
                  {selectedQuestionIds.size === localQuestions.length && localQuestions.length > 0 && (
                    <svg 
                      width="10" 
                      height="10" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#fff" 
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                Select All
              </button>
              
              {selectedQuestionIds.size > 0 && (
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {selectedQuestionIds.size} selected
                </span>
              )}
            </div>

            {selectedQuestionIds.size > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: isDeleting ? '#fca5a5' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Selected
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#00A0E3] rounded-full animate-spin"></div>
              <p className="text-gray-500 text-base font-medium animate-pulse">Loading questions...</p>
            </div>
          ) : localQuestions.length === 0 ? (
            <div className="text-center py-20 text-gray-500 text-lg">
              <p>No questions found for this worksheet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(500px,1fr))] gap-6">
              {localQuestions.map((question, index) => (
                <div 
                  key={question.id} 
                  className={`question-card ${selectedQuestionIds.has(question.id) ? 'selected' : ''}`}
                  onClick={() => toggleQuestionSelection(question.id)}
                  style={{
                    position: 'relative',
                    border: selectedQuestionIds.has(question.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: selectedQuestionIds.has(question.id) ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedQuestionIds.has(question.id)) {
                      e.currentTarget.style.borderColor = '#9ca3af';
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedQuestionIds.has(question.id)) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  {/* Selection Checkbox */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid',
                      borderColor: selectedQuestionIds.has(question.id) ? '#00A0E3' : '#d1d5db',
                      borderRadius: '4px',
                      backgroundColor: selectedQuestionIds.has(question.id) ? '#00A0E3' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {selectedQuestionIds.has(question.id) && (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#fff" 
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-100">
                    <span className="text-white px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#00A0E3] to-[#0080B8] shadow-md">Question {index + 1}</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="text-[15px] leading-[1.8] text-gray-700 break-words whitespace-pre-wrap">
                      <MarkdownWithMath content={question.question_text} />
                    </div>

                    {question.question_image && (
                      <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200 relative overflow-hidden">
                        <img
                          src={`data:image/jpeg;base64,${question.question_image}`}
                          alt={`Question ${index + 1} diagram`}
                          className="max-w-full h-auto rounded-lg shadow-md transition-transform duration-300 cursor-pointer hover:scale-105"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-5 bg-white border-t-2 border-gray-100 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-5 text-sm text-gray-500 font-semibold">
            Total Questions: {localQuestions.length}
            {selectedQuestionIds.size > 0 && (
              <span style={{ marginLeft: '15px', color: '#00A0E3' }}>
                | Selected: {selectedQuestionIds.size}
              </span>
            )}
          </div>
          <button className="bg-gradient-to-r from-[#00A0E3] to-[#0080B8] text-white border-none px-7 py-3 rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0" onClick={onHide}>
            Close
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal />
      </div>
    </div>
  );
};

// Main TeacherDashboard Component
const TeacherDashboard = ({ user, assignments, submissions, onAssignmentSubmit }) => {
  const { showAlert, AlertContainer } = useAlert();
  const [homework_code, setHomeworkCode] = useState("");
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [worksheetFile, setWorksheetFile] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [submissionType, setSubmissionType] = useState("worksheet");
  const [imageSourceType, setImageSourceType] = useState("upload"); // "upload" or "camera"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // New fields for worksheet upload - matching backend API structure
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [worksheetName, setWorksheetName] = useState('');

  // New state for question preview modal
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [worksheetUploadData, setWorksheetUploadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [worksheets, setWorksheets] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [worksheetToDelete, setWorksheetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload progress & batch processing state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState(''); // 'submitting' | 'processing' | ''
  const [batchId, setBatchId] = useState(null);

  // Auto-upload state: file uploads to cloud immediately on selection
  const [worksheetFileUrl, setWorksheetFileUrl] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(null);

  // New state for viewing worksheet questions
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewWorksheetName, setViewWorksheetName] = useState('');
  const [viewQuestions, setViewQuestions] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  const { username } = useContext(AuthContext);

  // Function to open view modal and fetch questions
  const openViewModal = async (worksheetName) => {
    setShowViewModal(true);
    setViewWorksheetName(worksheetName);
    setViewLoading(true);
    setViewQuestions([]);

    try {
      const response = await axiosInstance.get(`/worksheet-questions/?worksheet_name=${worksheetName}`);
      console.log('Fetched questions:', response.data.worksheet_questions);
      
      // Extract questions from the response
      if (response.data && response.data.worksheet_questions) {
        setViewQuestions(response.data.worksheet_questions);
      } else {
        setViewQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching worksheet questions:', error);
      setError('Failed to fetch worksheet questions');
      setViewQuestions([]);
    } finally {
      setViewLoading(false);
    }
  };

  // Function to close view modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setViewWorksheetName('');
    setViewQuestions([]);
  };

  // Fetch classes on component mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const classResponse = await axiosInstance.get("/classes/");
        const classesData = classResponse.data.data;
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes", error);
      }
    }
    fetchClasses();
  }, []);

  const openDeleteModal = (name) => {
    setWorksheetToDelete(name);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setWorksheetToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!worksheetToDelete) return;
    try {
      setIsDeleting(true);
      // API expects worksheet_name in array form
      const formData = new FormData();
      formData.append("worksheet_names", [worksheetToDelete]);
      await axiosInstance.post('/worksheet-delete/', formData);
      setWorksheets((prev) => prev.filter((w) => w.worksheet_name !== worksheetToDelete));
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting worksheet:', err);
      setError(err.message || 'Failed to delete worksheet');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch subjects when class is selected
  useEffect(() => {
    async function fetchSubjects() {
      if (selectedClass) {
        try {
          const subjectResponse = await axiosInstance.post("/subjects/", {
            class_id: selectedClass,
          });
          setSubjects(subjectResponse.data.data);
          // Reset dependent fields
          setSelectedSubject("");
          setChapters([]);
          setSelectedChapter("");
          setWorksheetName("");
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjects([]);
        }
      }
    }
    fetchSubjects();
  }, [selectedClass]);

  // Fetch chapters when subject is selected
  useEffect(() => {
    async function fetchChapters() {
      if (selectedSubject && selectedClass) {
        try {
          const chapterResponse = await axiosInstance.post("/chapters/", {
            subject_id: selectedSubject,
            class_id: selectedClass,
          });
          setChapters(chapterResponse.data.data);
          // Reset dependent fields
          setSelectedChapter("");
          setWorksheetName("");
        } catch (error) {
          console.error("Error fetching chapters:", error);
          setChapters([]);
        }
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  // Auto-generate worksheet name when class, subject, and chapter are selected
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedChapter && submissionType === 'worksheet') {
      const classData = classes.find(cls => cls.class_code === selectedClass);
      const subjectData = subjects.find(sub => sub.subject_code === selectedSubject);
      const chapterData = chapters.find(chap => chap.topic_code === selectedChapter);
      
      if (classData && subjectData && chapterData) {
        const generatedName = `${classData.class_name}_${subjectData.subject_name}_${chapterData.name}_Worksheet`;
        setWorksheetName(generatedName);
      }
    }
  }, [selectedClass, selectedSubject, selectedChapter, submissionType, classes, subjects, chapters]);

  // Function to display questions from the uploaded worksheet response
  const displayWorksheetQuestions = (uploadResponse) => {
    try {
      console.log("Processing worksheet upload response:", uploadResponse);
      
      // Extract questions from saved_worksheets array
      const savedWorksheets = uploadResponse.saved_worksheets || [];
      
      // Process questions to match QuestionListModal format
      const questionsWithImages = savedWorksheets.map((worksheet, index) => ({
        question: worksheet.question_text,
        question_image: worksheet.question_image,
        level: "Medium", // Default level since not provided
        id: worksheet.id,
        question_id: worksheet.question_id,
        worksheet_name: worksheet.worksheet_name,
        has_diagram: worksheet.has_diagram,
        index: index // Add index for selection tracking
      }));

      console.log("Processed questions for modal:", questionsWithImages);
      setQuestionList(questionsWithImages);
      setSelectedQuestions([]); // Reset selected questions
      setIsPreviewMode(true); // Set to preview mode
      setShowQuestionList(true);
    } catch (error) {
      console.error("Error processing worksheet questions:", error);
      setError("Failed to process worksheet questions for preview");
    }
  };

  // Poll batch status until processing completes
  const pollBatchStatus = async (batchIdToPoll) => {
    const POLL_INTERVAL = 3000; // 3 seconds
    const MAX_POLLS = 100; // ~5 minutes max
    let pollCount = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          pollCount++;
          if (pollCount > MAX_POLLS) {
            reject(new Error('Worksheet processing timed out. Please check back later.'));
            return;
          }

          const response = await axiosInstance.get(`/backend/api/worksheets/batch/${batchIdToPoll}/status/`);
          const data = response.data;
          console.log('Batch status:', data);

          if (data.status === 'completed') {
            resolve(data);
          } else if (data.status === 'failed') {
            reject(new Error(data.error || 'Worksheet processing failed'));
          } else {
            // Still processing - poll again
            setTimeout(poll, POLL_INTERVAL);
          }
        } catch (error) {
          console.error('Error polling batch status:', error);
          reject(error);
        }
      };

      poll();
    });
  };

  // Separate function to handle worksheet upload via presigned URL flow
  const handleWorksheetUpload = async (preview = true) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess('');
      setUploadProgress(0);

      // Validation for worksheet assignments
      if (!selectedClass || !selectedSubject || !selectedChapter || !worksheetName.trim()) {
        setError('Please fill in all worksheet fields');
        return;
      }

      if (preview) {
        // File must already be uploaded to cloud (auto-upload on selection)
        if (!worksheetFileUrl) {
          setError('Please upload a worksheet file first');
          return;
        }

        // === STEP 1: Submit metadata + file URL to backend ===
        setUploadStep('submitting');
        const submitPayload = {
          file_url: worksheetFileUrl,
          class_code: selectedClass,
          subject_code: selectedSubject,
          topic_code: selectedChapter,
          worksheet_name: worksheetName.trim(),
        };

        if (dueDate) {
          submitPayload.due_date = new Date(dueDate).toISOString();
        }

        const submitResponse = await axiosInstance.post('/backend/api/worksheets/submit/', submitPayload);
        console.log('Worksheet submit response:', submitResponse.data);

        const currentBatchId = submitResponse.data.batch_id;
        setBatchId(currentBatchId);

        // Store upload data for final submission
        setWorksheetUploadData({
          selectedClass,
          selectedSubject,
          selectedChapter,
          worksheetName: worksheetName.trim(),
          dueDate
        });

        // === STEP 2: Poll for processing status ===
        setUploadStep('processing');
        const result = await pollBatchStatus(currentBatchId);

        console.log('Worksheet processing complete:', result);
        setUploadStep('');
        setSuccess(`Successfully processed worksheet! Extracted ${result.total_questions || result.saved_worksheets?.length || 0} questions. Please select questions to include.`);

        // Display questions for selection
        displayWorksheetQuestions(result);

      } else {
        // Final submission - send selected questions to the original worksheets endpoint
        const formData = new FormData();
        formData.append('preview', 'false');

        const selectedQuestionsData = selectedQuestions.map(questionData => ({
          id: questionData.id,
          question_id: questionData.question_id,
          question_text: questionData.question,
          worksheet_name: questionData.worksheet_name,
          has_diagram: questionData.has_diagram
        }));

        formData.append('selected_questions', JSON.stringify(selectedQuestionsData));
        formData.append('class_code', selectedClass);
        formData.append('subject_code', selectedSubject);
        formData.append('topic_code', selectedChapter);
        formData.append('worksheet_name', worksheetName.trim());

        if (dueDate) {
          formData.append('due_date', new Date(dueDate).toISOString());
        }

        const response = await axiosInstance.post('/worksheets/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          setSuccess(`Successfully created worksheet assignment with ${selectedQuestions.length} selected questions!`);

          // Reset worksheet form after final submission
          setSelectedClass('');
          setSelectedSubject('');
          setSelectedChapter('');
          setWorksheetName('');
          setWorksheetFile(null);
          setWorksheetFileUrl(null);
          setFileUploadProgress(0);
          setFileUploadError(null);
          setDueDate('');
          setSelectedQuestions([]);
          setWorksheetUploadData(null);
          setBatchId(null);

          const worksheetInput = document.getElementById('worksheet-file');
          if (worksheetInput) worksheetInput.value = '';

          setShowQuestionList(false);
        } else {
          setError(response.data.error || 'Failed to process worksheet');
        }
      }

    } catch (error) {
      console.error('Error uploading worksheet:', error);
      setUploadStep('');
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to upload and process worksheet'
      );
    } finally {
      setIsSubmitting(false);
      setUploadStep('');
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');

    // Handle worksheet upload separately
    if (submissionType === 'worksheet') {
      await handleWorksheetUpload(true); // true = preview mode
      return;
    }

    setIsSubmitting(true);

    // Validation for non-worksheet assignments
    if (!homework_code.trim() || !title.trim() || !dueDate) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    // Validation for image assignments
    if (submissionType === 'image' && !imageFile) {
      setError('Please upload an image for image assignments');
      setIsSubmitting(false);
      return;
    }

    try {
      // Handle regular assignment creation (homework/classwork)
      let formData;
      if (submissionType === "image" && imageFile) {
        // Use FormData for image and other fields
        formData = new FormData();
        formData.append('homework_code', homework_code.trim());
        formData.append('title', title.trim());
        formData.append('teacherId', user.username);
        formData.append('classId', user.id);
        formData.append('due_date', new Date(dueDate).toISOString());
        formData.append('date_assigned', new Date().toISOString());
        formData.append('image', imageFile);
      } else {
        // For text-only assignments, send JSON
        formData = {
          homework_code: homework_code.trim(),
          title: title.trim(),
          teacherId: user.username,
          classId: user.id,
          due_date: new Date(dueDate).toISOString(),
          date_assigned: new Date().toISOString(),
        };
      }

      // Send to backend through parent callback
      if (submissionType === "image" && imageFile) {
        await onAssignmentSubmit(formData, true); // true = isFormData
      } else {
        await onAssignmentSubmit(formData, false);
      }
      setSuccess('Assignment created successfully!');

      // Reset form
      setTitle("");
      setImageFile(null);
      setDueDate("");
      setSubmissionType("worksheet");
      setHomeworkCode("");
      setImageSourceType("upload");

      // Reset file inputs
      const imageInput = document.getElementById('assignment-image');
      if (imageInput) imageInput.value = '';

    } catch (error) {
      setError(error.response?.data?.message || "Failed to create assignment");
      console.error("Error creating assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCapturedImage = (capturedImageBlob) => {
    // Convert blob to File object
    const file = new File([capturedImageBlob], 'captured-image.jpg', { type: 'image/jpeg' });
    setImageFile(file);
  };

  const handleWorksheetFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf' // .pdf
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid document file (.doc, .docx, or .pdf)');
      e.target.value = '';
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    setWorksheetFile(file);
    setWorksheetFileUrl(null);
    setFileUploadError(null);
    setFileUploadProgress(0);
    setError(null);

    // Auto-upload: immediately get presigned URL and upload to cloud
    try {
      setFileUploading(true);

      // Step 1: Get presigned URL
      const presignResponse = await axiosInstance.get('/backend/api/worksheets/presigned-url/', {
        params: {
          file_name: file.name,
          content_type: file.type,
        },
      });

      const { upload_url, file_url } = presignResponse.data;

      // Step 2: Upload file directly to cloud storage
      await axios.put(upload_url, file, {
          headers: {
            'Content-Type': file.type,
            'x-amz-acl': 'public-read',   // ADD THIS LINE
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setFileUploadProgress(percent);
            }
          },
        });

      setWorksheetFileUrl(file_url);
      setFileUploadProgress(100);
    } catch (err) {
      console.error('Error auto-uploading worksheet file:', err);
      setFileUploadError('Failed to upload file to cloud. Please try again.');
      setWorksheetFile(null);
      setWorksheetFileUrl(null);
      const worksheetInput = document.getElementById('worksheet-file');
      if (worksheetInput) worksheetInput.value = '';
    } finally {
      setFileUploading(false);
    }
  };

  // Handle question preview modal actions
  const handleQuestionClick = (question, index, image) => {
    // For teacher dashboard, we might just want to view the question
    // You can implement navigation to a preview/edit mode if needed
    console.log('Teacher viewing question:', { question, index, image });
  };

  const handleMultipleSelectSubmit = async (selectedQuestionsData) => {
    // Handle multiple selection for final worksheet submission
    console.log('Teacher selected questions:', selectedQuestionsData);
    setSelectedQuestions(selectedQuestionsData);
    setShowQuestionList(false);
    setIsPreviewMode(false);
    
    // Submit the final worksheet with selected questions
    await handleWorksheetUpload(false); // false = final submission mode
  };

  const getSubmissionCount = (assignmentId) => {
    return submissions.filter((s) => s.assignmentId === assignmentId).length;
  };

  const mappedAssignments = assignments.map((a, idx) => {
    const data = a.data || {};
    return {
      id: data.homework_code || idx, // fallback to idx if no code
      title: data.title,
      imageUrl: data.attachment, // or null
      createdAt: data.date_assigned ? new Date(data.date_assigned) : new Date(),
      dueDate: data.due_date ? new Date(data.due_date) : new Date(),
    };
  });

  useEffect(() => {
    async function fetchdata() {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/worksheetslist/");
        console.log(response.data);
        setWorksheets(response.data);
      } catch (error) {
        console.error("Error fetching worksheets:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchdata();
  }, []);

  return (
    <>
      <AlertContainer />
      <div className="w-full max-w-full p-0 m-0">
      {/* Assignment Creation Form */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 m-6 shadow-lg border border-gray-100 transition-all duration-300 max-w-full hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-start gap-4 mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#00A0E3] to-[#0080B8] rounded-xl text-white shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Assignment</h2>
            <p className="text-gray-500 text-[0.95rem] leading-relaxed">Create a homework assignment for your students</p>
          </div>
        </div>
        
        <div className="w-full">
          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Assignment Type Selection - Always show first */}
            {/* <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700 text-sm tracking-wide">Assignment Type</label>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  className={`btn-primary`}
                  onClick={() => setSubmissionType("worksheet")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Upload Worksheet
                </button>
              </div>
            </div> */}

            {/* Common fields for Text and Image assignment types only */}
            {submissionType !== 'worksheet' && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="homework_code" className="font-semibold text-gray-700 text-sm tracking-wide">Homework Code</label>
                  <input
                    id="homework_code"
                    type="text"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={homework_code}
                    onChange={(e) => setHomeworkCode(e.target.value)}
                    placeholder="Enter homework code"
                    required
                  />
                </div>          
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="title" className="font-semibold text-gray-700 text-sm tracking-wide">Assignment Title</label>
                  <input
                    id="title"
                    type="text"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="due-date" className="font-semibold text-gray-700 text-sm tracking-wide">Due Date</label>
                  <input
                    id="due-date"
                    type="datetime-local"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}


            {submissionType === "image" && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-700 text-sm tracking-wide">Image Source</label>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border-2 rounded-xl font-medium text-sm cursor-pointer transition-all duration-300 ${imageSourceType === "upload" ? 'bg-[#00A0E3] text-white border-[#00A0E3] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-[#00A0E3] hover:text-[#00A0E3] hover:-translate-y-0.5'}`}
                      onClick={() => setImageSourceType("upload")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Image
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border-2 rounded-xl font-medium text-sm cursor-pointer transition-all duration-300 ${imageSourceType === "camera" ? 'bg-[#00A0E3] text-white border-[#00A0E3] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-[#00A0E3] hover:text-[#00A0E3] hover:-translate-y-0.5'}`}
                      onClick={() => setImageSourceType("camera")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Take Photo
                    </button>
                  </div>
                </div>

                {imageSourceType === "upload" ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="assignment-image" className="font-semibold text-gray-700 text-sm tracking-wide">Upload Assignment Image</label>
                    <input
                      id="assignment-image"
                      type="file"
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {imageFile && (
                      <div className="mt-4 rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Assignment preview"
                          className="w-full h-[150px] object-contain block"
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => setImageFile(null)}
                          style={{
                            marginTop: '10px',
                            padding: '5px 10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-gray-700 text-sm tracking-wide">Capture Assignment Image</label>
                    <div style={{
                      border: '2px dashed #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <CameraCapture onImageCapture={handleCapturedImage} />
                      {imageFile && (
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                          <p style={{ color: '#10b981', fontWeight: '500' }}>
                            ✓ Image captured successfully
                          </p>
                          <button
                            type="button"
                            onClick={() => setImageFile(null)}
                            style={{
                              marginTop: '5px',
                              padding: '5px 10px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Clear Captured Image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {submissionType === "worksheet" && (
              <>
                {/* <div className="flex flex-col gap-2">
                  <label htmlFor="due-date-worksheet" className="font-semibold text-gray-700 text-sm tracking-wide">Due Date (Optional)</label>
                  <input
                    id="due-date-worksheet"
                    type="datetime-local"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Due date is optional for worksheet processing
                  </div>
                </div> */}

                <div className="flex flex-col gap-2">
                  <label htmlFor="class-select" className="font-semibold text-gray-700 text-sm tracking-wide">Class *</label>
                  <select
                    id="class-select"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.class_code} value={cls.class_code}>
                        {cls.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="subject-select" className="font-semibold text-gray-700 text-sm tracking-wide">Subject *</label>
                  <select
                    id="subject-select"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedClass}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.subject_code} value={subject.subject_code}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="chapter-select" className="font-semibold text-gray-700 text-sm tracking-wide">Topic/Chapter *</label>
                  <select
                    id="chapter-select"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    disabled={!selectedSubject}
                    required
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.topic_code} value={chapter.topic_code}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="worksheet-name" className="font-semibold text-gray-700 text-sm tracking-wide">Worksheet Name *</label>
                  <input
                    id="worksheet-name"
                    type="text"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    value={worksheetName}
                    onChange={(e) => setWorksheetName(e.target.value)}
                    placeholder="Worksheet name will be auto-generated"
                    required
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Auto-generated format: ClassName_SubjectName_ChapterName_Worksheet
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="worksheet-file" className="font-semibold text-gray-700 text-sm tracking-wide">Upload Worksheet File *</label>
                  <input
                    id="worksheet-file"
                    type="file"
                    className="px-4 py-3.5 border-2 border-gray-200 rounded-xl text-[0.95rem] transition-all duration-300 bg-white focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
                    accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                    onChange={handleWorksheetFileChange}
                    required
                  />
                  {worksheetFile && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-700">📄 {worksheetFile.name}</span>
                        <span className="text-sm text-gray-400">({(worksheetFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        {worksheetFileUrl && (
                          <span style={{ color: '#10b981', fontWeight: '500', marginLeft: '8px' }}>
                            Uploaded
                          </span>
                        )}
                      </div>
                      {/* File upload progress bar */}
                      {fileUploading && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '4px'
                          }}>
                            <span>Uploading to cloud...</span>
                            <span>{fileUploadProgress}%</span>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              borderRadius: '2px',
                              backgroundColor: '#00A0E3',
                              transition: 'width 0.3s ease',
                              width: `${fileUploadProgress}%`
                            }} />
                          </div>
                        </div>
                      )}
                      {fileUploadError && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                          {fileUploadError}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={fileUploading}
                        onClick={() => {
                          setWorksheetFile(null);
                          setWorksheetFileUrl(null);
                          setFileUploadProgress(0);
                          setFileUploadError(null);
                          const worksheetInput = document.getElementById('worksheet-file');
                          if (worksheetInput) worksheetInput.value = '';
                        }}
                        style={{
                          marginTop: '5px',
                          padding: '5px 10px',
                          backgroundColor: fileUploading ? '#9ca3af' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: fileUploading ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Supported formats: Word documents (.doc, .docx) and PDF files (Max: 10MB)
                  </div>
                </div>
              </>
            )}

            {/* Upload Progress Bar (submit steps only - file upload progress shown in file preview) */}
            {isSubmitting && submissionType === 'worksheet' && uploadStep && (
              <div className="flex flex-col gap-2" style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <span>
                    {uploadStep === 'submitting' && 'Step 1/2: Submitting worksheet...'}
                    {uploadStep === 'processing' && 'Step 2/2: Processing questions...'}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '3px',
                    backgroundColor: uploadStep === 'processing' ? '#f59e0b' : '#00A0E3',
                    transition: 'width 0.3s ease',
                    width: uploadStep === 'submitting' ? '40%' : '80%',
                    animation: uploadStep === 'processing' ? 'pulse 1.5s ease-in-out infinite' : 'none'
                  }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="px-8 py-4 bg-[#00A0E3] hover:bg-[#0080B8] text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all duration-300 mt-2 hover:-translate-y-0.5 hover:shadow-lg"
              disabled={isSubmitting || (submissionType === 'worksheet' && (fileUploading || !worksheetFileUrl))}
            >
              {isSubmitting ? (
                submissionType === 'worksheet' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    {uploadStep === 'submitting' && 'Submitting worksheet...'}
                    {uploadStep === 'processing' && 'Processing worksheet (this may take a moment)...'}
                    {!uploadStep && (isPreviewMode ? "Processing Worksheet..." : "Creating Assignment...")}
                  </>
                ) : (
                  "Creating..."
                )
              ) : (
                submissionType === 'worksheet'
                  ? (fileUploading ? "Uploading file..." : "📤 Process & Preview Worksheet")
                  : "Create Assignment"
              )}
            </button>
          </form>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-[6vh] mb-[7vh] p-[2vh]">
        <h3 className="mb-5 text-2xl font-semibold text-gray-800 border-b-2 border-gray-100 pb-2.5">Available Worksheets</h3>
        
        {loading ? (
          <div className="text-center p-10 text-gray-500">
            <p>Loading worksheets...</p>
          </div>
        ) : worksheets.length === 0 ? (
          <div className="text-center p-10 text-gray-500">
            <p>No worksheets available</p>
          </div>
        ) : (
          <div className="max-h-screen overflow-y-auto border border-gray-200 rounded p-2.5">
            <ul className="list-none m-0 p-0">
              {worksheets.map((worksheet, index) => (
                <li key={index} className="flex items-center px-4 py-3 mb-2 bg-gray-50 rounded-md transition-all duration-300 cursor-default hover:bg-gray-100 hover:translate-x-1 last:mb-0 max-md:flex-col max-md:items-start">
                  <span className="font-semibold text-gray-500 mr-3 min-w-[30px]">{index + 1}.</span>
                  <span className="flex-1 text-gray-800 text-[0.95rem] break-words">{worksheet.worksheet_name}</span>
                  <button className="px-4 py-1.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white border-none rounded text-sm cursor-pointer transition-colors duration-200 ml-2.5 active:scale-[0.98]" onClick={() => openViewModal(worksheet.worksheet_name)}>
                    View
                  </button>
                  <button className="px-4 py-1.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white border-none rounded text-sm cursor-pointer transition-colors duration-200 ml-2.5 active:scale-[0.98]" onClick={() => openDeleteModal(worksheet.worksheet_name)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Question Preview Modal */}
      <QuestionListModal
        show={showQuestionList}
        onHide={() => {
          setShowQuestionList(false);
          setSelectedQuestions([]);
          setIsPreviewMode(true);
        }}
        questionList={questionList}
        onQuestionClick={handleQuestionClick}
        isMultipleSelect={isPreviewMode} // Enable multiple selection in preview mode
        onMultipleSelectSubmit={handleMultipleSelectSubmit}
      />

      {/* View Questions Modal */}
      <ViewQuestionsModal
        show={showViewModal}
        onHide={closeViewModal}
        worksheetName={viewWorksheetName}
        questions={viewQuestions}
        loading={viewLoading}
      />

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-[1000]" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl p-[5vh] w-auto max-w-[50vw] shadow-2xl">
            <h4 className="m-0 mb-2 text-xl text-gray-900">Confirm Deletion</h4>
            <p className="m-0 mb-4 text-gray-600">Are you sure you want to delete "{worksheetToDelete}"?</p>
            <div className="flex justify-end gap-2.5">
              <button className="px-3.5 py-2 bg-gray-200 text-gray-900 border-none rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</button>
              <button className="px-3.5 py-2 bg-red-500 text-white border-none rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TeacherDashboard;