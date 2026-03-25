import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axiosInstance from '../api/axiosInstance';
import QuestionListModal from './QuestionListModal';
import MarkdownWithMath from "./MarkdownWithMath";
import { useAlert } from './AlertBox';
import { getImageSrc } from '../utils/imageUtils';

const QuickExerciseComponent = ({ onCreateHomework, mode = "homework" }) => {
  const { showAlert, AlertContainer } = useAlert();
  // State for dropdown data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [worksheets, setWorksheets] = useState([]);

  // State for selections
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [questionType, setQuestionType] = useState("");
  const [questionLevel, setQuestionLevel] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState("");
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for homework form
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkCode, setHomeworkCode] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // State for classwork PDF upload
  const [classworkTitle, setClassworkTitle] = useState("");
  const [classworkCode, setClassworkCode] = useState("");
  const [classworkDescription, setClassworkDescription] = useState("");
  const [classworkDueDate, setClassworkDueDate] = useState("");
  const [classworkPDFs, setClassworkPDFs] = useState([]);
  const [isClassworkSubmitting, setIsClassworkSubmitting] = useState(false);
  const [classworkError, setClassworkError] = useState(null);
  const [showClassworkForm, setShowClassworkForm] = useState(false);

  // State for previous classwork submissions modal
  const [showPreviousClasswork, setShowPreviousClasswork] = useState(false);
  const [previousClassworkData, setPreviousClassworkData] = useState([]);
  const [isLoadingPreviousClasswork, setIsLoadingPreviousClasswork] = useState(false);
  const [previousClassworkError, setPreviousClassworkError] = useState(null);

  // State for classwork list modal
  const [showClassworkListModal, setShowClassworkListModal] = useState(false);
  const [classworkList, setClassworkList] = useState([]);
  const [isLoadingClassworkList, setIsLoadingClassworkList] = useState(false);
  const [classworkListError, setClassworkListError] = useState(null);

  // State for previous homework submissions modal
  const [showPreviousHomework, setShowPreviousHomework] = useState(false);
  const [previousHomeworkData, setPreviousHomeworkData] = useState([]);
  const [isLoadingPreviousHomework, setIsLoadingPreviousHomework] = useState(false);
  const [previousHomeworkError, setPreviousHomeworkError] = useState(null);

  // State for homework list modal
  const [showHomeworkListModal, setShowHomeworkListModal] = useState(false);
  const [homeworkList, setHomeworkList] = useState([]);
  const [homeworkListData, setHomeworkListData] = useState([]); // Store full homework data with counts
  const [isLoadingHomeworkList, setIsLoadingHomeworkList] = useState(false);
  const [homeworkListError, setHomeworkListError] = useState(null);

  // Fetch classes on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const classResponse = await axiosInstance.get("/classes/");
        const classesData = classResponse.data.data;
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes", error);
      }
    }
    fetchData();
  }, []);

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
          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedExercises([]);
          setSelectedWorksheet("");
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
          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedExercises([])
          setSelectedWorksheet("");
        } catch (error) {
          console.error("Error fetching chapters:", error);
          setChapters([]);
        }
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  // Fetch subtopics or worksheets when selection changes based on question type
  useEffect(() => {
    async function fetchDataForType() {
      if (!selectedClass || !selectedSubject || selectedChapters.length === 0) return;

      if (questionType === "external") {
        try {
          const response = await axiosInstance.post("/question-images/", {
            classid: selectedClass,
            subjectid: selectedSubject,
            topicid: selectedChapters[0],
            external: true,
          });
          if (response.data && response.data.subtopics) {
            setSubTopics(response.data.subtopics);
          } else {
            setSubTopics([]);
          }
        } catch (error) {
          console.error("Error fetching subtopics:", error);
          setSubTopics([]);
        }
      } else if (questionType === "worksheets") {
        try {
          const response = await axiosInstance.post("/question-images/", {
            classid: selectedClass,
            subjectid: selectedSubject,
            topicid: selectedChapters[0],
            worksheets: true,
          });
          setWorksheets(response.data?.worksheets || []);
        } catch (error) {
          console.error("Error fetching worksheets:", error);
          setWorksheets([]);
        }
      }
    }
    fetchDataForType();
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  // Reset dependent fields when question type changes
  useEffect(() => {
    if (questionType !== "external") {
      setQuestionLevel("");
      setSelectedExercises([]); // Reset multiple exercises
    }
    if (questionType !== "worksheets") setSelectedWorksheet("");
  }, [questionType]);

  // Fetch classwork list
  const fetchClassworkList = async () => {
    setIsLoadingClassworkList(true);
    setClassworkListError(null);
    setClassworkList([]);

    try {
      const response = await axiosInstance.get("/classwork-list/");
      console.log("Classwork list:", response.data);

      if (response.data && response.data.homework_codes && Array.isArray(response.data.homework_codes)) {
        setClassworkList(response.data.homework_codes);
      } else if (response.data && Array.isArray(response.data)) {
        setClassworkList(response.data);
      } else {
        setClassworkListError("No classwork codes found or invalid response format.");
      }
      setShowClassworkListModal(true);
    } catch (error) {
      console.error("Error fetching classwork list:", error);
      setClassworkListError(error.response?.data?.message || "Failed to fetch classwork list.");
      setClassworkList([]);
      setShowClassworkListModal(true);
    } finally {
      setIsLoadingClassworkList(false);
    }
  };

  // Handle classwork selection from list modal
  const handleClassworkSelection = async (classworkCode) => {
    setShowClassworkListModal(false);
    setIsLoadingPreviousClasswork(true);
    setPreviousClassworkError(null);

    try {
      const response = await axiosInstance.get(`/classwork-submission/?classwork_code=${classworkCode}`);
      console.log("Previous classwork submissions for:", classworkCode, response.data);

      if (response.data) {
        if (Array.isArray(response.data)) {
          setPreviousClassworkData(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setPreviousClassworkData(response.data.data);
        } else if (response.data.submissions && Array.isArray(response.data.submissions)) {
          setPreviousClassworkData(response.data.submissions);
        } else {
          setPreviousClassworkData([response.data]);
        }
      } else {
        setPreviousClassworkData([]);
      }
      setShowPreviousClasswork(true);
    } catch (error) {
      console.error("Error fetching classwork submissions:", error);
      setPreviousClassworkError(error.response?.data?.message || "Failed to fetch classwork submissions.");
      setPreviousClassworkData([]);
      setShowPreviousClasswork(true);
    } finally {
      setIsLoadingPreviousClasswork(false);
    }
  };



  // Fetch homework list for analysis reports
  const fetchHomeworkList = async () => {
    setIsLoadingHomeworkList(true);
    setHomeworkListError(null);
    setHomeworkList([]);
    setHomeworkListData([]);

    try {
      const response = await axiosInstance.get("/homework-list/");
      console.log("Homework list:", response.data);

      if (response.data && response.data.homework_codes && Array.isArray(response.data.homework_codes)) {
        // Check if it's the new format (array of objects) or old format (array of strings)
        if (response.data.homework_codes.length > 0 && typeof response.data.homework_codes[0] === 'object') {
          // New format: array of objects with homework_code, submissions_count, non_submitted_count
          setHomeworkListData(response.data.homework_codes);
          setHomeworkList(response.data.homework_codes.map(item => item.homework_code));
        } else {
          // Old format: array of strings
          setHomeworkList(response.data.homework_codes);
          setHomeworkListData(response.data.homework_codes.map(code => ({
            homework_code: code,
            submissions_count: null,
            non_submitted_count: null
          })));
        }
      } else {
        setHomeworkListError("No homework codes found or invalid response format.");
      }
      setShowHomeworkListModal(true);
    } catch (error) {
      console.error("Error fetching homework list:", error);
      setHomeworkListError(error.response?.data?.message || "Failed to fetch homework list.");
      setHomeworkList([]);
      setHomeworkListData([]);
      setShowHomeworkListModal(true);
    } finally {
      setIsLoadingHomeworkList(false);
    }
  };

  // Handle homework selection from list modal
  const handleHomeworkSelection = async (homeworkCode) => {
    setShowHomeworkListModal(false);
    setIsLoadingPreviousHomework(true);
    setPreviousHomeworkError(null);

    try {
      const response = await axiosInstance.get(`/homework-submission/?homework_code=${homeworkCode}`);
      console.log("Previous homework submissions for:", homeworkCode, response.data);

      if (response.data && Array.isArray(response.data)) {
        setPreviousHomeworkData(response.data);
      } else if (response.data && response.data.submissions && Array.isArray(response.data.submissions)) {
        setPreviousHomeworkData(response.data.submissions);
      } else {
        setPreviousHomeworkData([response.data]);
      }
      setShowPreviousHomework(true);
    } catch (error) {
      console.error("Error fetching homework submissions for report:", error);
      setPreviousHomeworkError(error.response?.data?.message || "Failed to fetch homework submissions for report.");
      setPreviousHomeworkData([]);
      setShowPreviousHomework(true);
    } finally {
      setIsLoadingPreviousHomework(false);
    }
  };


  // Determine if generate button should be enabled
  const isGenerateButtonEnabled = () => {

    if (questionType === "worksheets") return selectedWorksheet !== "";
    if (questionType === "external") return selectedExercises.length > 0;
    if (questionType!=="") return true;
    return false;
    if (
      selectedClass === "" ||
      selectedSubject === "" ||
      selectedChapters.length === 0 ||
      questionType === "" ||
      isLoading
    ) {

    }
    return false;
  };

  // Handle form submission to generate questions
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isGenerateButtonEnabled()) {
      console.error("Please select all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare request data based on question type
      const requestData = {
        classid: Number(selectedClass),
        subjectid: Number(selectedSubject),
        topicid: selectedChapters,
        solved: questionType === "solved",
        exercise: questionType === "exercise",
        subtopic: questionType === "external" ? selectedExercises : null,
        worksheet_name: questionType === "worksheets" ? selectedWorksheet : null,

      };

      console.log("Requesting questions with:", requestData);

      const response = await axiosInstance.post("/question-images/", requestData);
      console.log("Questions response:", response.data);

      // Process questions if they exist
      if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
        console.log("Questions found:", response.data);
        const questionsWithImages = response.data.questions.map((question) => ({
          ...question,
          question: question.question,
          image: question.question_image
            ? `${question.question_image}`
            : null,
        }));

        setQuestionList(questionsWithImages);
        setSelectedQuestions([]); // Reset selected questions
        setShowQuestionList(true);
      } else {
        // If no questions array in the response, try to map the subtopics to exercises
        // This is a fallback if the API behaves differently than expected
        console.log("No questions found in response, creating manual questions");

        // Get the selected subtopic's index in the subtopics array
        const subtopicIndex = subTopics.findIndex(st => st === questionLevel);
        const exerciseNumber = subtopicIndex !== -1 ? subtopicIndex + 1 : 1;

        // Create a single mock question representing the exercise
        const mockQuestions = selectedExercises.map((exercise) => {
          const subtopicIndex = subTopics.findIndex(st => st === exercise);
          const exerciseNumber = subtopicIndex !== -1 ? subtopicIndex + 1 : 1;

          return {
            question: `Exercise ${exerciseNumber} from Chapter ${selectedChapters.map(c =>
              chapters.find(ch => ch.topic_code === c)?.name || c).join(", ")}`,
            question_image: null,
            subtopic: exercise
          };
        });


        setQuestionList(mockQuestions);
        setSelectedQuestions([]); // Reset selected questions
        setShowQuestionList(true);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      showAlert(`Failed to generate questions: ${error.response?.data?.message || error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle question selection from modal
  const handleMultipleSelectSubmit = (selectedQuestionsData) => {
    console.log("Selected questions:", selectedQuestionsData);
    setSelectedQuestions(selectedQuestionsData);
    setShowQuestionList(false);
    setShowHomeworkForm(true);

    // Generate a default homework code
    const timestamp = new Date().getTime().toString().slice(-6);
    setHomeworkCode(`HW-${timestamp}`);

    // Generate a default title based on subject and chapter
    const subjectName = subjects.find(s => s.subject_code === selectedSubject)?.subject_name || "Subject";
    const chapterName = chapters.find(c => c.topic_code === selectedChapters[0])?.name || "Chapter";

    // Get exercise number from subtopic
    const exerciseNumbers = selectedExercises.map((exercise) => {
      const subtopicIndex = subTopics.findIndex(st => st === exercise);
      return subtopicIndex !== -1 ? subtopicIndex + 1 : "";
    }).filter(num => num !== "").join(", ");

    const exerciseText = exerciseNumbers ? `Exercises ${exerciseNumbers}` : "Selected Exercises";
    setHomeworkTitle(`${subjectName} - ${chapterName} ${exerciseText}`);
  };

  // Handle homework submission
  const handleHomeworkSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!homeworkTitle.trim() || !homeworkCode.trim() || !dueDate) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      // Create the questions text for the description
      const questionsText = selectedQuestions.map((q, idx) =>
        `Question ${idx + 1}: ${q.question}`
      ).join('\n\n');
      console.log("Questions text:", questionsText);
      // Combine user description with questions
      const fullDescription = homeworkDescription.trim()
        ? `${homeworkDescription}\n\n${questionsText}`
        : questionsText;

      // Create assignment object
      const assignment = {
        homework_code: homeworkCode.trim(),
        title: homeworkTitle.trim(),
        description: selectedQuestions,
        imageUrl: selectedQuestions.length > 0 && selectedQuestions[0].image ? selectedQuestions[0].image : null,
        teacherId: selectedClass, // Using selectedClass as teacherId
        classId: selectedClass,
        due_date: new Date(dueDate).toISOString(),
        date_assigned: new Date().toISOString(),
        questions: selectedQuestions,
      };

      // Submit assignment
      await onCreateHomework(assignment);

      // Reset form and state
      setShowHomeworkForm(false);
      setHomeworkTitle("");
      setHomeworkCode("");
      setHomeworkDescription("");
      setDueDate("");
      setSelectedQuestions([]);

      // Show success message

    } catch (error) {
      setError(error.response?.data?.message || "Failed to create assignment");
      console.error("Error creating homework assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle multiple PDF file upload for classwork with 30MB limit per file
  const handleClassworkPDFChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) {
      return; // Don't clear existing files if no new files selected
    }

    // Validate all new files
    const validFiles = [];
    const errors = [];

    files.forEach((file, index) => {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        errors.push(`File ${index + 1} (${file.name}) is not a PDF file.`);
        return;
      }

      // Check file size (30MB = 30 * 1024 * 1024 bytes)
      const maxSize = 30 * 1024 * 1024; // 30MB in bytes
      if (file.size > maxSize) {
        errors.push(`File ${index + 1} (${file.name}) is larger than 30MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setClassworkError(errors.join(' '));
      e.target.value = null; // Reset the input
      return;
    }

    setClassworkError(null); // Clear any previous errors
    // Append new files to existing ones
    setClassworkPDFs(prevFiles => [...prevFiles, ...validFiles]);
    e.target.value = null; // Reset the input to allow selecting the same files again
  };

  // Remove individual file from selection
  const removeClassworkPDF = (indexToRemove) => {
    setClassworkPDFs(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  // Classwork submission handler (after questions are selected)
  const handleClassworkSubmit = async (e) => {
    e.preventDefault();
    setClassworkError(null);
    setIsClassworkSubmitting(true);

    if (!classworkTitle.trim() || !classworkCode.trim() || !classworkDueDate || !classworkPDFs || classworkPDFs.length === 0) {
      setClassworkError("Please fill in all required fields.");
      setIsClassworkSubmitting(false);
      return;
    }

    if (!classworkPDFs || classworkPDFs.length === 0) {
      setClassworkError("Please upload at least one PDF file of student work.");
      setIsClassworkSubmitting(false);
      return;
    }

    if (!selectedQuestions || selectedQuestions.length === 0) {
      setClassworkError("Please select at least one question.");
      setIsClassworkSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();

      // Append multiple PDF files
      classworkPDFs.forEach((pdf, index) => {
        formData.append('pdf_response', pdf);
      });

      // Append classwork information
      formData.append('class_work_code', classworkCode.trim());
      formData.append('worksheet_name', classworkTitle.trim());
      formData.append('due-time', classworkDueDate.trim());

      // Append questions data
      formData.append('questions', JSON.stringify(selectedQuestions));
      formData.append('title', classworkTitle.trim());

      // Make API call to classwork-submission endpoint
      const response = await axiosInstance.post('/classwork-submission/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form and state
      setClassworkTitle("");
      setClassworkCode("");
      setClassworkDescription("");
      setClassworkDueDate("");
      setClassworkPDFs([]);
      setSelectedQuestions([]);
      setShowClassworkForm(false);

      showAlert(`Classwork PDF Processing Started for ${classworkPDFs.length} file(s)`, "success");
    } catch (error) {
      setClassworkError(error.response?.data?.error || "Failed to upload classwork");
      console.error("Error uploading classwork:", error);
    } finally {
      setIsClassworkSubmitting(false);
    }
  };

  // Render the homework form
  const renderHomeworkForm = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-[#0B1120] mb-4">Create Homework Assignment</h3>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleHomeworkSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0B1120] mb-1">Homework Code</label>
              <input
                type="text"
                value={homeworkCode}
                onChange={(e) => setHomeworkCode(e.target.value)}
                placeholder="Enter a unique code"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0B1120] mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Assignment Title</label>
            <input
              type="text"
              value={homeworkTitle}
              onChange={(e) => setHomeworkTitle(e.target.value)}
              placeholder="Enter assignment title"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Additional Instructions (Optional)</label>
            <textarea
              rows={3}
              value={homeworkDescription}
              onChange={(e) => setHomeworkDescription(e.target.value)}
              placeholder="Enter any additional instructions"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
            />
          </div>

          <div>
            <h5 className="text-sm font-semibold text-[#0B1120] mb-2">Selected Questions ({selectedQuestions.length})</h5>
            <ul className="space-y-2">
              {selectedQuestions.map((q, idx) => (
                <li key={idx} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-[#00A0E3]">{idx + 1}.</span>
                  <div className="flex-1">
                    <MarkdownWithMath content={q.question} />
                    {q.image && (
                      <div className="mt-1">
                        <img src={getImageSrc(q.question_image)} alt={`Question ${idx + 1}`} className="max-h-24 rounded" />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setShowHomeworkForm(false);
                setShowQuestionList(true);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-[#0B1120] rounded-lg px-4 py-2 font-medium transition-colors"
            >
              Back to Questions
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Homework Assignment'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render classwork PDF upload form
  const renderClassworkForm = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-[#0B1120] mb-4">Create Classwork PDF & Submit Questions</h3>
      {classworkError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{classworkError}</div>}
      <form onSubmit={handleClassworkSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Classwork Code</label>
            <input
              type="text"
              value={classworkCode}
              onChange={(e) => setClassworkCode(e.target.value)}
              placeholder="Enter a unique code"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Duration in hours</label>
            <input
              type="number"
              value={classworkDueDate}
              onChange={(e) => setClassworkDueDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0B1120] mb-1">Classwork Title</label>
          <input
            type="text"
            value={classworkTitle}
            onChange={(e) => setClassworkTitle(e.target.value)}
            placeholder="Enter classwork title"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0B1120] mb-1">Additional Instructions (Optional)</label>
          <textarea
            rows={3}
            value={classworkDescription}
            onChange={(e) => setClassworkDescription(e.target.value)}
            placeholder="Enter any additional instructions"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
          />
        </div>

        {/* Multiple PDF upload with 30MB limit per file */}
        <div>
          <label className="block text-sm font-medium text-[#0B1120] mb-1">Upload Student Work PDFs (Max 30MB per file)</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleClassworkPDFChange}
            multiple
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#00A0E3] file:text-white file:text-sm file:cursor-pointer"
          />
          {classworkPDFs.length > 0 && (
            <div className="mt-2">
              <div className="text-green-600 text-sm mb-2">
                Selected {classworkPDFs.length} file(s):
              </div>
              <div className="max-h-[150px] overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {classworkPDFs.map((pdf, index) => (
                  <div key={index} className="flex justify-between items-center p-1 px-2 bg-gray-50 rounded text-sm">
                    <span>
                      <span className="text-green-600 mr-1">&bull;</span> {pdf.name} ({(pdf.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeClassworkPDF(index)}
                      className="text-red-500 hover:text-red-700 text-lg font-bold px-1"
                      title="Remove file"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Select multiple PDF files. Each file must be under 30MB.
          </p>
        </div>

        {/* Preview selected questions */}
        <div>
          <h5 className="text-sm font-semibold text-[#0B1120] mb-2">Selected Questions ({selectedQuestions.length})</h5>
          <ul className="space-y-2">
            {selectedQuestions.map((q, idx) => (
              <li key={idx} className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="font-semibold text-[#00A0E3]">{idx + 1}.</span>
                <div className="flex-1">
                  <MarkdownWithMath content={q.question} />
                  {q.image && (
                    <div className="mt-1">
                      <img src={getImageSrc(q.question_image)} alt={`Question ${idx + 1}`} className="max-h-24 rounded" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => {
              setShowClassworkForm(false);
              setShowQuestionList(true);
            }}
            className="bg-gray-200 hover:bg-gray-300 text-[#0B1120] rounded-lg px-4 py-2 font-medium transition-colors"
          >
            Back to Questions
          </button>
          <button
            type="submit"
            disabled={isClassworkSubmitting || classworkPDFs.length === 0}
            className="bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
          >
            {isClassworkSubmitting ? "Uploading..." : `Upload ${classworkPDFs.length} PDF(s) & Questions`}
          </button>
        </div>
      </form>
    </div>
  );


  // Format subtopic display names
  const getSubtopicDisplayName = (subtopic, index) => {
    return `Exercise ${index + 1}`;
  };

  // Helper for grade badge colors
  const getGradeBgColor = (grade) => {
    if (grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  // Render Previous Classwork Modal
  const renderPreviousClassworkModal = () => {
    if (!showPreviousClasswork) return null;
    return (
      <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl my-8">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[#0B1120]">Previous Classwork Submissions</h3>
            <button onClick={() => setShowPreviousClasswork(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {previousClassworkError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{previousClassworkError}</div>
            ) : previousClassworkData.length === 0 ? (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">No previous classwork submissions found.</div>
            ) : (
              <div className="space-y-6">
                {previousClassworkData.map((submission, index) => (
                  <div key={submission.id || index} className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-[#00A0E3] text-white p-4 rounded-t-xl">
                      <div className="flex justify-between items-center">
                        <h5 className="font-semibold">Classwork Code: {submission.class_code || 'N/A'}</h5>
                        <div className="flex gap-2">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-white/20">
                            {submission.assignment_type || 'classwork'}
                          </span>
                          {submission.total_class_minutes && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-white/20">
                              {submission.total_class_minutes} mins
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Processing Summary */}
                      {submission.processing_summary && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h6 className="text-[#00A0E3] font-semibold mb-2">Processing Summary</h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <small className="text-gray-500">Processed At:</small>
                              <p className="text-sm">{new Date(submission.processing_timestamp || submission.processing_summary.timestamp).toLocaleString()}</p>
                            </div>
                            <div>
                              <small className="text-gray-500">Total Pages:</small>
                              <p className="text-sm">{submission.processing_summary.total_pages || 0}</p>
                            </div>
                            <div>
                              <small className="text-gray-500">Files Processed:</small>
                              <p className="text-sm">{submission.processing_summary.files_processed || 0}</p>
                            </div>
                            <div>
                              <small className="text-gray-500">Students Evaluated:</small>
                              <p className="text-sm">{submission.processing_summary.students_evaluated || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Class Analytics */}
                      {submission.class_analytics && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h6 className="text-[#00A0E3] font-semibold mb-2">Class Analytics</h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <small className="text-gray-500">Average Score:</small>
                              <h5 className="text-lg font-bold">{submission.class_analytics.average_score || 0}%</h5>
                            </div>
                            <div>
                              <small className="text-gray-500">Highest Score:</small>
                              <h5 className="text-lg font-bold">{submission.class_analytics.highest_score || 0}%</h5>
                            </div>
                            <div>
                              <small className="text-gray-500">Lowest Score:</small>
                              <h5 className="text-lg font-bold">{submission.class_analytics.lowest_score || 0}%</h5>
                            </div>
                            <div>
                              <small className="text-gray-500">Total Students:</small>
                              <h5 className="text-lg font-bold">{submission.class_analytics.total_students || 0}</h5>
                            </div>
                          </div>

                          {/* Grade Distribution */}
                          {submission.class_analytics.grade_distribution && (
                            <div className="mt-3">
                              <small className="text-gray-500">Grade Distribution:</small>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {Object.entries(submission.class_analytics.grade_distribution).map(([grade, count]) => (
                                  <span key={grade} className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getGradeBgColor(grade)}`}>
                                    {grade}: {count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Performance Distribution */}
                      {submission.performance_distribution && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h6 className="text-[#00A0E3] font-semibold mb-2">Performance Distribution</h6>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(submission.performance_distribution).map(([range, count]) => (
                              <div key={range} className="flex items-center gap-2">
                                <small className="text-gray-500">{range}%:</small>
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{count} students</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Student Results */}
                      {submission.student_results && submission.student_results.length > 0 && (
                        <div>
                          <h6 className="text-[#00A0E3] font-semibold mb-2">Student Results</h6>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-2 border border-gray-200">Roll Number</th>
                                  <th className="text-left p-2 border border-gray-200">Grade</th>
                                  <th className="text-left p-2 border border-gray-200">Marks Obtained</th>
                                  <th className="text-left p-2 border border-gray-200">Total Marks</th>
                                  <th className="text-left p-2 border border-gray-200">Percentage</th>
                                  <th className="text-left p-2 border border-gray-200">Questions Attempted</th>
                                </tr>
                              </thead>
                              <tbody>
                                {submission.student_results.map((student, sIndex) => (
                                  <tr key={sIndex} className="hover:bg-gray-50">
                                    <td className="p-2 border border-gray-200">{student.roll_number}</td>
                                    <td className="p-2 border border-gray-200">
                                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getGradeBgColor(student.grade)}`}>
                                        {student.grade}
                                      </span>
                                    </td>
                                    <td className="p-2 border border-gray-200">{student.total_marks_obtained || 0}</td>
                                    <td className="p-2 border border-gray-200">{student.total_max_marks || 0}</td>
                                    <td className="p-2 border border-gray-200">{student.overall_percentage || 0}%</td>
                                    <td className="p-2 border border-gray-200">{student.questions ? student.questions.length : 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Detailed Question Analysis for Each Student */}
                          {submission.student_results.some(s => s.questions && s.questions.length > 0) && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-[#00A0E3] font-medium text-sm">View Detailed Question Analysis</summary>
                              <div className="mt-2 space-y-3">
                                {submission.student_results.map((student, sIndex) => (
                                  student.questions && student.questions.length > 0 && (
                                    <div key={sIndex} className="bg-white rounded-lg border border-gray-100">
                                      <div className="p-2 bg-gray-50 rounded-t-lg">
                                        <strong className="text-sm">Roll Number: {student.roll_number}</strong>
                                      </div>
                                      <div className="p-2 overflow-x-auto">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-gray-50">
                                              <th className="text-left p-1 border border-gray-200">Q.No</th>
                                              <th className="text-left p-1 border border-gray-200">Score</th>
                                              <th className="text-left p-1 border border-gray-200">Max</th>
                                              <th className="text-left p-1 border border-gray-200">Error Type</th>
                                              <th className="text-left p-1 border border-gray-200">Mistakes Made</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {student.questions.map((q, qIndex) => (
                                              <tr key={qIndex}>
                                                <td className="p-1 border border-gray-200">{q.question_number}</td>
                                                <td className="p-1 border border-gray-200">{q.total_score || 0}</td>
                                                <td className="p-1 border border-gray-200">{q.max_marks || 0}</td>
                                                <td className="p-1 border border-gray-200">
                                                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    {q.error_type || 'N/A'}
                                                  </span>
                                                </td>
                                                <td className="p-1 border border-gray-200">{q.mistakes_made || 'N/A'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}

                      {/* Question Analytics */}
                      {submission.class_analytics && submission.class_analytics.question_analytics && (
                        <details>
                          <summary className="cursor-pointer text-[#00A0E3] font-medium text-sm">View Question Analytics</summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="text-left p-2 border border-gray-200">Question</th>
                                  <th className="text-left p-2 border border-gray-200">Attempts</th>
                                  <th className="text-left p-2 border border-gray-200">Average Score</th>
                                  <th className="text-left p-2 border border-gray-200">Max Score</th>
                                  <th className="text-left p-2 border border-gray-200">Average %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(submission.class_analytics.question_analytics).map(([qNum, data]) => (
                                  <tr key={qNum}>
                                    <td className="p-2 border border-gray-200">{qNum}</td>
                                    <td className="p-2 border border-gray-200">{data.attempts}</td>
                                    <td className="p-2 border border-gray-200">{data.total_score}</td>
                                    <td className="p-2 border border-gray-200">{data.max_score}</td>
                                    <td className="p-2 border border-gray-200">{data.average_percentage}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}

                      {/* Footer Info */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <small className="text-gray-500">Teacher ID: {submission.teacher_name || 'N/A'}</small>
                          </div>
                          <div className="text-right">
                            <small className="text-gray-500">
                              Submission Date: {submission.submission_date ? new Date(submission.submission_date).toLocaleString() : 'Not submitted'}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button onClick={() => setShowPreviousClasswork(false)} className="bg-gray-200 hover:bg-gray-300 text-[#0B1120] rounded-lg px-4 py-2 font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Previous Homework Modal
  const renderPreviousHomeworkModal = () => {
    if (!showPreviousHomework) return null;
    return (
      <div className="fixed inset-0 z-[10000] flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl my-8">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#00A0E3] text-white rounded-t-xl">
            <h3 className="text-lg font-bold">Previous Homework Analysis Report</h3>
            <button onClick={() => setShowPreviousHomework(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {previousHomeworkError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{previousHomeworkError}</div>
            ) : previousHomeworkData.length === 0 ? (
              <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-center">
                <h5 className="font-semibold">No previous homework submissions found.</h5>
                <p className="mt-1 text-sm">Start creating homework assignments to see analysis reports here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {previousHomeworkData.map((submission, index) => (
                  <div key={submission.id || index} className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div></div>
                        <div>
                          <span className="inline-flex px-3 py-1 rounded-full text-lg font-medium bg-gray-100 text-[#0B1120]">
                            Analysis Report of {submission.student_fullname} ({ submission.student_id || submission.result_json.roll_number})
                          </span>
                          <small className="block mt-1 text-gray-500 px-4">
                            Submitted: {submission.submission_date ? new Date(submission.submission_date).toLocaleString() : 'N/A'}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Overall Performance Summary */}
                      {submission.result_json && submission.result_json.questions && (
                        <div className="p-4 bg-gray-50">
                          <h6 className="text-[#00A0E3] font-semibold mb-3">Performance Overview</h6>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                              <div className="text-blue-500 text-2xl font-bold">
                                {submission.result_json.questions.reduce((sum, q) => sum + (q.total_score || 0), 0)}/{submission.result_json.questions.reduce((sum, q) => sum + (q.max_score || q.max_marks), 0)}
                              </div>
                              <small className="text-gray-500">Total Score</small>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detailed Question Analysis */}
                      {submission.result_json && submission.result_json.questions && (
                        <div className="p-4">
                          <h6 className="text-[#00A0E3] font-semibold mb-3">Question-by-Question Analysis</h6>

                          <div className="space-y-3">
                            {submission.result_json.questions.map((question, qIndex) => (
                              <div key={qIndex} className="bg-white rounded-lg shadow-sm border border-gray-100">
                                <div className={`p-3 rounded-t-lg ${question.answer_category === 'Correct' ? 'bg-green-500 text-white' :
                                  question.answer_category === 'Partially-Correct' ? 'bg-yellow-400 text-[#0B1120]' :
                                    'bg-red-500 text-white'
                                  }`}>
                                  <div className="flex justify-between items-center">
                                    <h6 className="font-semibold text-sm">
                                      Question {qIndex + 1}: {question.topic || question.question_number}
                                    </h6>
                                    <div className="flex items-center gap-2">
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 space-y-3">
                                      <div>
                                        <strong className="text-[#00A0E3] text-sm">Student's Work:</strong>
                                        <div className="mt-1 text-gray-600 text-sm"><MarkdownWithMath content={question.comment || question.gap_analysis} /></div>
                                      </div>

                                      <div>
                                        <strong className="text-[#00A0E3] text-sm">Correction:</strong>
                                        <div className="mt-1 text-green-600 text-sm"><MarkdownWithMath content={question.correction_comment || question.mistakes_made} /></div>
                                      </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg">
                                      <h6 className="text-[#00A0E3] font-semibold text-sm mb-2">Analysis</h6>

                                      <div className="mb-2">
                                        <small className="text-gray-500">Score:</small>
                                        <div className="flex items-center gap-1">
                                          <span className="font-bold">{question.total_score}</span>
                                          <span className="text-gray-400">/</span>
                                          <span className="text-gray-400">{question.max_score || question.max_marks}</span>
                                        </div>
                                      </div>

                                      <div className="mb-2">
                                        <small className="text-gray-500">Category:</small>
                                        <span className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                          question.answer_category || question.error_type === 'Correct' ? 'bg-green-100 text-green-800' :
                                            question.answer_category || question.error_type === 'Partially-Correct' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                        }`}>
                                          {question.answer_category || question.error_type}
                                        </span>
                                      </div>

                                      <div className="mb-2">
                                        <small className="text-gray-500">Concepts:</small>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {question.concepts_required && question.concepts_required.map((concept, cIndex) => (
                                            <span key={cIndex} className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              {concept}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button onClick={() => setShowPreviousHomework(false)} className="bg-gray-200 hover:bg-gray-300 text-[#0B1120] rounded-lg px-4 py-2 font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Homework List Modal
  const renderHomeworkListModal = () => {
    if (!showHomeworkListModal) return null;
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#00A0E3] text-white rounded-t-xl">
            <h3 className="text-lg font-bold">Previous Homework Assignments</h3>
            <button onClick={() => setShowHomeworkListModal(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {isLoadingHomeworkList ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-[#00A0E3] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-500">Fetching previous homework assignments...</p>
              </div>
            ) : homeworkListError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">{homeworkListError}</div>
            ) : homeworkList.length === 0 ? (
              <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-center">
                <h5 className="font-semibold">No previous homework assignments found.</h5>
                <p className="mt-1 text-sm">Start creating new homework assignments to see them here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {homeworkListData.map((homework, index) => (
                  <button
                    key={index}
                    className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    onClick={() => handleHomeworkSelection(homework.homework_code)}
                  >
                    <div>
                      <span className="font-semibold text-[#0B1120]">{homework.homework_code}</span>
                      {homework.submissions_count !== null && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="text-green-600 mr-3">
                            {homework.submissions_count} submitted
                          </span>
                          <span className="text-amber-600">
                            {homework.non_submitted_count} not submitted
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-[#00A0E3] text-white">
                      View Report
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button onClick={() => setShowHomeworkListModal(false)} className="bg-gray-200 hover:bg-gray-300 text-[#0B1120] rounded-lg px-4 py-2 font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Classwork List Modal
  const renderClassworkListModal = () => {
    if (!showClassworkListModal) return null;
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#00A0E3] text-white rounded-t-xl">
            <h3 className="text-lg font-bold">Previous Classwork Assignments</h3>
            <button onClick={() => setShowClassworkListModal(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {isLoadingClassworkList ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-[#00A0E3] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-gray-500">Fetching previous classwork assignments...</p>
              </div>
            ) : classworkListError ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">{classworkListError}</div>
            ) : classworkList.length === 0 ? (
              <div className="p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-center">
                <h5 className="font-semibold">No previous classwork assignments found.</h5>
                <p className="mt-1 text-sm">Start creating new classwork assignments to see them here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classworkList.map((classworkCode, index) => (
                  <button
                    key={index}
                    className="w-full flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    onClick={() => handleClassworkSelection(classworkCode)}
                  >
                    <span className="text-[#0B1120]">{classworkCode}</span>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-[#0B1120]">
                      View Report
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button onClick={() => setShowClassworkListModal(false)} className="bg-gray-200 hover:bg-gray-300 text-[#0B1120] rounded-lg px-4 py-2 font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Shared form fields renderer for both homework and classwork modes
  const renderQuestionSelectionForm = (title, description) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-[#0B1120] mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.class_code} value={cls.class_code}>
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.subject_code} value={subject.subject_code}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Chapters</label>
            <Select
              isMulti
              options={chapters.map((chapter) => ({
                value: chapter.topic_code,
                label: chapter.name,
              }))}
              value={selectedChapters.map((code) => ({
                value: code,
                label: chapters.find(
                  (chapter) => chapter.topic_code === code
                )?.name,
              }))}
              onChange={(selectedOptions) => {
                setSelectedChapters(
                  selectedOptions.map((option) => option.value)
                );
              }}
              classNamePrefix="react-select"
              placeholder="Select Chapters"
              isDisabled={!selectedSubject}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              disabled={selectedChapters.length === 0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="">Select Question Type</option>
              <option value="solved">Solved Examples</option>
              <option value="exercise">Practice Exercises</option>
              <option value="external">Set of Questions</option>
              <option value="worksheets">Worksheets</option>
            </select>
          </div>
        </div>
        {/* Conditional selectors for Set or Worksheet */}
        {questionType === "external" && (
          <div>
            <label className="block text-sm font-medium text-[#0B1120] mb-1">Select Exercises (Multiple Selection)</label>
            <Select
              isMulti
              options={subTopics.map((subTopic, index) => ({
                value: subTopic,
                label: getSubtopicDisplayName(subTopic, index),
              }))}
              value={selectedExercises.map((exercise) => {
                const index = subTopics.findIndex(st => st === exercise);
                return {
                  value: exercise,
                  label: getSubtopicDisplayName(exercise, index),
                };
              })}
              onChange={(selectedOptions) => {
                setSelectedExercises(
                  selectedOptions ? selectedOptions.map((option) => option.value) : []
                );
              }}
              classNamePrefix="react-select"
              placeholder="Select one or more exercises"
              isDisabled={selectedChapters.length === 0}
            />
          </div>
        )}
        {questionType === "worksheets" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0B1120] mb-1">Select Worksheet</label>
              <select
                value={selectedWorksheet}
                onChange={(e) => setSelectedWorksheet(e.target.value)}
                disabled={selectedChapters.length === 0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00A0E3] focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
              >
                <option value="">Select Worksheet</option>
                {worksheets.map((worksheet) => (
                  <option key={worksheet.id || worksheet.worksheet_name} value={worksheet.worksheet_name}>
                    {worksheet.worksheet_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isGenerateButtonEnabled()}
            className="bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-6 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Loading...' : 'Generate Questions'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <AlertContainer />
      <div className="space-y-4">
        {/* Add Previous Classwork Button only for classwork mode */}
        {mode === "classwork" && !showClassworkForm && (
          <div className="flex justify-end">
            <button
              onClick={fetchClassworkList}
              disabled={isLoadingClassworkList}
              className="bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
            >
              {isLoadingClassworkList ? 'Loading...' : 'View Previous Classwork Assignments'}
            </button>
          </div>
        )}

        {mode === "homework" && !showHomeworkForm && (
          <div className="flex justify-end">
            {/* placeholder */}
          </div>
        )}

        {mode === "homework" && !showHomeworkForm && (
          <div className="flex justify-end">
            <button
              onClick={fetchHomeworkList}
              disabled={isLoadingHomeworkList}
              className="bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50"
            >
              {isLoadingHomeworkList ? 'Loading...' : 'View Previous Homework Assignments'}
            </button>
          </div>
        )}

        {mode === "classwork"
          ? (
            !showClassworkForm
              ? renderQuestionSelectionForm("Quick Classwork Generator", "Select class, subject, and chapter to generate questions for classwork")
              : renderClassworkForm()
          )
          : (!showHomeworkForm
            ? renderQuestionSelectionForm("Quick Homework Generator", "Select class, subject, and chapter to generate questions for homework")
            : renderHomeworkForm())}

        {/* Question List Modal */}
        {showQuestionList && mode !== "classwork" && (
          <QuestionListModal
            show={showQuestionList}
            onHide={() => setShowQuestionList(false)}
            questionList={questionList}
            isMultipleSelect={true}
            onMultipleSelectSubmit={handleMultipleSelectSubmit}
          />
        )}

        {/* For classwork mode, show question list modal and then classwork form */}
        {showQuestionList && mode === "classwork" && (
          <QuestionListModal
            show={showQuestionList}
            onHide={() => setShowQuestionList(false)}
            questionList={questionList}
            isMultipleSelect={true}
            onMultipleSelectSubmit={(selectedQuestionsData) => {
              setSelectedQuestions(selectedQuestionsData);
              setShowQuestionList(false);
              setShowClassworkForm(true);
              // Optionally, generate a default code/title
              const timestamp = new Date().getTime().toString().slice(-6);
              setClassworkCode(`CW-${timestamp}`);
              const subjectName = subjects.find(s => s.subject_code === selectedSubject)?.subject_name || "Subject";
              const chapterName = chapters.find(c => c.topic_code === selectedChapters[0])?.name || "Chapter";
              const exerciseNumbers = selectedExercises.map((exercise) => {
                const subtopicIndex = subTopics.findIndex(st => st === exercise);
                return subtopicIndex !== -1 ? subtopicIndex + 1 : "";
              }).filter(num => num !== "").join(", ");

              const exerciseText = exerciseNumbers ? `Exercises ${exerciseNumbers}` : "Selected Exercises";
              setClassworkTitle(`${subjectName} - ${chapterName} ${exerciseText}`);
            }}
          />
        )}

        {/* Render Previous Classwork Modal */}
        {renderPreviousClassworkModal()}

        {/* Render Classwork List Modal */}
        {renderClassworkListModal()}

        {/* Render Previous Homework Modal */}
        {renderPreviousHomeworkModal()}

        {/* Render Homework List Modal */}
        {renderHomeworkListModal()}
      </div>

      <div></div>
    </>
  );
};

export default QuickExerciseComponent;
