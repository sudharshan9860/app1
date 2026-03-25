// EnhancedTeacherDash.jsx

import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import TeacherDashboard from './TeacherDashboard';
import StudentDash from './StudentDash';
import QuickExerciseComponent from './QuickExerciseComponent';
import ExamAnalytics from './ExamAnalytics';
import ProgressTab from './ProgressTab';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Import the separated components
import ClassAnalysis from './ClassAnalysis';
import StudentAnalysis from './StudentAnalysis';
import UploadHomework from './UploadHomework';
import UploadClasswork from './UploadClasswork';
import ExamCorrection from './ExamCorrection';
import QuestionPaperGenerator from './QuestionPaperGenerator';
import { useAlert } from './AlertBox';

// Mock data for different classes (6th to 12th)
const classesData = {
  1: {
    id: 1,
    name: "Class 6th",
    students: [
      { id: 1, name: "Arjun Patel", class: "6th", efficiency: 78 },
      { id: 2, name: "Sneha Gupta", class: "6th", efficiency: 82 },
      { id: 3, name: "Rohit Sharma", class: "6th", efficiency: 75 }
    ],
    analytics: {
      weeklyEfficiency: [
        { week: 'May 01 - May 01', date: 'May 01', efficiency: 76, tasksCompleted: 45, avgTime: 2.1 },
        { week: 'May 08 - May 08', date: 'May 08', efficiency: 82, tasksCompleted: 52, avgTime: 1.8 },
        { week: 'May 15 - May 15', date: 'May 15', efficiency: 84, tasksCompleted: 58, avgTime: 1.7 },
        { week: 'May 22 - May 22', date: 'May 22', efficiency: 78, tasksCompleted: 48, avgTime: 2.2 },
        { week: 'May 29 - May 29', date: 'May 29', efficiency: 74, tasksCompleted: 42, avgTime: 2.5 }
      ],
      studentProgressComparison: [
        { student: 'Arjun Patel', efficiencyImprovement: 10.7, regularScoreImprovement: -13.5, currentEfficiency: 78 },
        { student: 'Sneha Gupta', efficiencyImprovement: 14.5, regularScoreImprovement: 0, currentEfficiency: 82 },
        { student: 'Rohit Sharma', efficiencyImprovement: 13.5, regularScoreImprovement: -0.5, currentEfficiency: 75 }
      ],
      learningGapAnalysis: [
        { topic: 'Basic Arithmetic', 'Students with High Gap': 15, 'Students with Medium Gap': 25, 'Students with Low Gap': 35, 'Students with No Gap': 25 },
        { topic: 'Fractions', 'Students with High Gap': 20, 'Students with Medium Gap': 30, 'Students with Low Gap': 25, 'Students with No Gap': 25 },
        { topic: 'Geometry Basics', 'Students with High Gap': 25, 'Students with Medium Gap': 35, 'Students with Low Gap': 20, 'Students with No Gap': 20 },
        { topic: 'Decimals', 'Students with High Gap': 10, 'Students with Medium Gap': 20, 'Students with Low Gap': 40, 'Students with No Gap': 30 },
        { topic: 'Percentages', 'Students with High Gap': 30, 'Students with Medium Gap': 25, 'Students with Low Gap': 25, 'Students with No Gap': 20 }
      ]
    }
  },
  2: {
    id: 2,
    name: "Class 7th",
    students: [
      { id: 4, name: "Kavya Singh", class: "7th", efficiency: 85 },
      { id: 5, name: "Amit Kumar", class: "7th", efficiency: 79 },
      { id: 6, name: "Riya Jain", class: "7th", efficiency: 88 }
    ],
    analytics: {
      learningGapAnalysis: [
        { topic: 'Integers', 'Students with High Gap': 12, 'Students with Medium Gap': 28, 'Students with Low Gap': 35, 'Students with No Gap': 25 },
        { topic: 'Algebra Introduction', 'Students with High Gap': 18, 'Students with Medium Gap': 32, 'Students with Low Gap': 25, 'Students with No Gap': 25 },
        { topic: 'Ratios and Proportions', 'Students with High Gap': 22, 'Students with Medium Gap': 33, 'Students with Low Gap': 25, 'Students with No Gap': 20 }
      ]
    }
  },
  3: {
    id: 3,
    name: "Class 8th",
    students: [
      { id: 7, name: "Dev Agarwal", class: "8th", efficiency: 90 },
      { id: 8, name: "Ananya Reddy", class: "8th", efficiency: 83 },
      { id: 9, name: "Karan Mehta", class: "8th", efficiency: 77 }
    ],
    analytics: {
      learningGapAnalysis: [
        { topic: 'Linear Equations', 'Students with High Gap': 14, 'Students with Medium Gap': 26, 'Students with Low Gap': 35, 'Students with No Gap': 25 },
        { topic: 'Mensuration', 'Students with High Gap': 19, 'Students with Medium Gap': 31, 'Students with Low Gap': 25, 'Students with No Gap': 25 },
        { topic: 'Exponents', 'Students with High Gap': 21, 'Students with Medium Gap': 34, 'Students with Low Gap': 25, 'Students with No Gap': 20 }
      ]
    }
  },
  4: {
    id: 4,
    name: "Class 9th",
    students: [
      { id: 10, name: "Ishita Bansal", class: "9th", efficiency: 92 },
      { id: 11, name: "Varun Kapoor", class: "9th", efficiency: 86 },
      { id: 12, name: "Pooja Nair", class: "9th", efficiency: 81 }
    ],
    analytics: {
      learningGapAnalysis: [
        { topic: 'Polynomials', 'Students with High Gap': 16, 'Students with Medium Gap': 24, 'Students with Low Gap': 35, 'Students with No Gap': 25 },
        { topic: 'Coordinate Geometry', 'Students with High Gap': 22, 'Students with Medium Gap': 28, 'Students with Low Gap': 25, 'Students with No Gap': 25 },
        { topic: 'Statistics', 'Students with High Gap': 18, 'Students with Medium Gap': 32, 'Students with Low Gap': 30, 'Students with No Gap': 20 }
      ]
    }
  },
  5: {
    id: 5,
    name: "Class 10th",
    students: [
      { id: 13, name: "Aryan Shah", class: "10th", efficiency: 89 },
      { id: 14, name: "Sakshi Tiwari", class: "10th", efficiency: 94 },
      { id: 15, name: "Harsh Yadav", class: "10th", efficiency: 76 }
    ],
    analytics: {
      learningGapAnalysis: [
        { topic: 'Quadratic Equations', 'Students with High Gap': 20, 'Students with Medium Gap': 25, 'Students with Low Gap': 30, 'Students with No Gap': 25 },
        { topic: 'Trigonometry', 'Students with High Gap': 25, 'Students with Medium Gap': 30, 'Students with Low Gap': 25, 'Students with No Gap': 20 },
        { topic: 'Circles', 'Students with High Gap': 15, 'Students with Medium Gap': 35, 'Students with Low Gap': 30, 'Students with No Gap': 20 }
      ]
    }
  },
  6: {
    id: 6,
    name: "Class 11th",
    students: [
      { id: 16, name: "Nisha Chawla", class: "11th", efficiency: 87 },
      { id: 17, name: "Siddharth Roy", class: "11th", efficiency: 91 },
      { id: 18, name: "Deepika Sinha", class: "11th", efficiency: 84 }
    ],
    analytics: {
      learningGapAnalysis: [
        { topic: 'Sets and Functions', 'Students with High Gap': 18, 'Students with Medium Gap': 27, 'Students with Low Gap': 30, 'Students with No Gap': 25 },
        { topic: 'Limits and Derivatives', 'Students with High Gap': 28, 'Students with Medium Gap': 32, 'Students with Low Gap': 25, 'Students with No Gap': 15 },
        { topic: 'Permutations', 'Students with High Gap': 22, 'Students with Medium Gap': 28, 'Students with Low Gap': 30, 'Students with No Gap': 20 }
      ]
    }
  },
  7: {
    id: 7,
    name: "Class 12th",
    students: [
      { id: 19, name: "Vikram Singh", class: "12th", efficiency: 88 },
      { id: 20, name: "Meera Patel", class: "12th", efficiency: 92 },
      { id: 21, name: "Sanjay Kumar", class: "12th", efficiency: 78 }
    ],
    analytics: {
      weeklyEfficiency: [
        { week: 'May 01 - May 01', date: 'May 01', efficiency: 76, tasksCompleted: 45, avgTime: 2.1 },
        { week: 'May 08 - May 08', date: 'May 08', efficiency: 82, tasksCompleted: 52, avgTime: 1.8 },
        { week: 'May 15 - May 15', date: 'May 15', efficiency: 84, tasksCompleted: 58, avgTime: 1.7 },
        { week: 'May 22 - May 22', date: 'May 22', efficiency: 78, tasksCompleted: 48, avgTime: 2.2 },
        { week: 'May 29 - May 29', date: 'May 29', efficiency: 74, tasksCompleted: 42, avgTime: 2.5 }
      ],
      studentProgressComparison: [
        { student: 'Vikram Singh', efficiencyImprovement: 16.0, regularScoreImprovement: 0, currentEfficiency: 88 },
        { student: 'Meera Patel', efficiencyImprovement: 9.2, regularScoreImprovement: -1.8, currentEfficiency: 92 },
        { student: 'Sanjay Kumar', efficiencyImprovement: 13.5, regularScoreImprovement: -0.5, currentEfficiency: 78 }
      ],
      learningGapAnalysis: [
        { topic: 'Calculus Applications', 'Students with High Gap': 15, 'Students with Medium Gap': 25, 'Students with Low Gap': 35, 'Students with No Gap': 25 },
        { topic: 'Vector Algebra', 'Students with High Gap': 20, 'Students with Medium Gap': 30, 'Students with Low Gap': 25, 'Students with No Gap': 25 },
        { topic: 'Probability', 'Students with High Gap': 25, 'Students with Medium Gap': 35, 'Students with Low Gap': 20, 'Students with No Gap': 20 },
        { topic: 'Matrices', 'Students with High Gap': 10, 'Students with Medium Gap': 20, 'Students with Low Gap': 40, 'Students with No Gap': 30 },
        { topic: 'Differential Equations', 'Students with High Gap': 30, 'Students with Medium Gap': 25, 'Students with Low Gap': 25, 'Students with No Gap': 20 }
      ]
    }
  }
};


const EnhancedTeacherDash = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, AlertContainer } = useAlert();

  const [selectedClass, setSelectedClass] = useState(classesData[1]);
  // Get activeTab from location state or URL params, default to 'homework'
  const getInitialTab = () => {
    if (location.state?.activeTab) return location.state.activeTab;
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'exam-analytics';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Update activeTab when location changes
  useEffect(() => {
    const newTab = getInitialTab();
    setActiveTab(newTab);
  }, [location.state, location.search]);

  useEffect(() => {
    // Function for ExamCorrection to switch to analytics
    window.handleExamAnalyticsView = () => {
      setActiveTab('exam-analytics');
    };

    // Function for ExamAnalytics to switch to correction
    window.handleExamCorrectionView = () => {
      setActiveTab('exam-correction');
    };

    return () => {
      delete window.handleExamAnalyticsView;
      delete window.handleExamCorrectionView;
    };
  }, []); // Empty dependency array - only runs once

  // In the useEffect that fetches teacher data, save to localStorage:
const fetchTeacherData = async () => {
  try {
    const response = await axiosInstance.get('/teacher-dashboard/');
    console.log('teacher-data', response.data);

    // Detailed logging to see EXACTLY what you're getting
    console.log('===========================================');
    console.log('TEACHER DASHBOARD API RESPONSE');
    console.log('===========================================');
    console.log('Full Response Object:', response);
    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers);
    console.log('===========================================');
    console.log('RESPONSE DATA:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('===========================================');

    // Check what type of data we got
    if (response.data.status === 'warning') {
      console.warn('WARNING from API:', response.data.message);
      console.log('Available Students (IDs only):', response.data.available_students);
    }

    if (response.data.students) {
      console.log('Got full student data:', response.data.students);
    } else {
      console.log('No full student data received, only IDs');
    }

    setTeacherData(response.data);

     // Also log what's being saved to localStorage
    console.log('Saving to localStorage:', {
      teacherData: response.data,
      studentData: response.data.students || []
    });
    // Save to localStorage for Progress tab
    localStorage.setItem('teacherData', JSON.stringify(response.data));
    localStorage.setItem('studentData', JSON.stringify(response.data.students || []));

    if (response.data.students && response.data.students.length > 0) {
      setSelectedClass({
        id: 1,
        name: "Class 6th",
        students: response.data.students
      });
    }
    setLoading(false);
  } catch (error) {
    console.error('Error fetching teacher data:', error);
    setLoading(false);
  }
};

  const generateStudentData = (studentName, classId) => {
    const baseEfficiency = Math.floor(Math.random() * 30) + 60;

    return {
      weeklyEfficiency: [
        { week: 'May 01 - May 01', efficiency: baseEfficiency - 5 + Math.random() * 10 },
        { week: 'May 08 - May 08', efficiency: baseEfficiency - 3 + Math.random() * 10 },
        { week: 'May 15 - May 15', efficiency: baseEfficiency + Math.random() * 10 },
        { week: 'May 22 - May 22', efficiency: baseEfficiency - 2 + Math.random() * 10 },
        { week: 'May 29 - May 29', efficiency: baseEfficiency + 2 + Math.random() * 8 }
      ],
      errorAnalysis: [
        { week: 'May 01 - May 01', Conceptual: 80, Computational: 15, Careless: 5, 'No Error': 20 },
        { week: 'May 08 - May 08', Conceptual: 75, Computational: 18, Careless: 7, 'No Error': 25 },
        { week: 'May 15 - May 15', Conceptual: 60, Computational: 20, Careless: 5, 'No Error': 40 },
        { week: 'May 22 - May 22', Conceptual: 85, Computational: 10, Careless: 5, 'No Error': 18 },
        { week: 'May 29 - May 29', Conceptual: 70, Computational: 15, Careless: 8, 'No Error': 38 }
      ],
      chapterPerformance: [
        { week: 'Week 1', 'Chapter 1': 90, 'Chapter 2': 67, 'Chapter 3': 70, 'Chapter 4': 85, 'Chapter 5': 88, 'Chapter 6': 93, 'Chapter 7': 80, 'Chapter 8': 75, 'Chapter 9': 70, overallAverage: 78 },
        { week: 'Week 2', 'Chapter 1': 92, 'Chapter 2': 70, 'Chapter 3': 72, 'Chapter 4': 87, 'Chapter 5': 90, 'Chapter 6': 95, 'Chapter 7': 82, 'Chapter 8': 77, 'Chapter 9': 72, overallAverage: 80 },
        { week: 'Week 3', 'Chapter 1': 94, 'Chapter 2': 68, 'Chapter 3': 74, 'Chapter 4': 89, 'Chapter 5': 92, 'Chapter 6': 96, 'Chapter 7': 84, 'Chapter 8': 79, 'Chapter 9': 74, overallAverage: 82 },
        { week: 'Week 4', 'Chapter 1': 96, 'Chapter 2': 65, 'Chapter 3': 76, 'Chapter 4': 91, 'Chapter 5': 94, 'Chapter 6': 98, 'Chapter 7': 86, 'Chapter 8': 81, 'Chapter 9': 76, overallAverage: 84 },
        { week: 'Week 5', 'Chapter 1': 98, 'Chapter 2': 62, 'Chapter 3': 78, 'Chapter 4': 93, 'Chapter 5': 96, 'Chapter 6': 100, 'Chapter 7': 88, 'Chapter 8': 83, 'Chapter 9': 78, overallAverage: 86 }
      ]
    };
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    const data = generateStudentData(student.name || student.rollNo || 'Unknown Student', selectedClass.id);
    setStudentData(data);
  };

  const handleAssignmentSubmit = async (assignment, mode) => {
    try {
      const endpoint = mode === "classwork" ? "/classwork/" : "/homework/";
      const response = await axiosInstance.post(endpoint, assignment);

      if (response.status === 201) {
        console.log(`${mode} created successfully:`, response.data);

        if (mode === "homework") {
          setAssignments(prev => [...prev, response.data]);
        }

        showAlert(`${mode.charAt(0).toUpperCase() + mode.slice(1)} created successfully!`);
      }
    } catch (error) {
      console.error(`Error creating ${mode}:`, error);

    }
  };

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    setSelectedStudent(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div>
              <Loader2 className="w-12 h-12 text-[#00A0E3] animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#0B1120] mb-2">Loading Dashboard</h3>
              <p className="text-gray-500">Please wait while we fetch your data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render function
  return (
    <>
      <AlertContainer />
      <div className="min-h-screen bg-[#F8FAFC]">
            {activeTab === 'class' ? (
              <ClassAnalysis
                selectedClass={selectedClass}
                classesData={classesData}
                onClassChange={handleClassChange}
              />
            ) : activeTab === 'student' ? (
              <StudentAnalysis
                selectedClass={selectedClass}
                selectedStudent={selectedStudent}
                onStudentSelect={handleStudentSelect}
                classesData={classesData}
                onClassChange={handleClassChange}
              />
            ): activeTab === 'upload-homework' ? (
              <UploadHomework />
            ): activeTab === 'upload-classwork' ? (
              <UploadClasswork />
            ) : activeTab === 'classwork' ? (
              <div className="p-5">
                <QuickExerciseComponent onCreateHomework={(assignment) => handleAssignmentSubmit(assignment, "classwork")} mode="classwork" />
              </div>
            ) : activeTab === 'homework' ? (
              <div className="p-5">
                <TeacherDashboard
                  user={selectedClass}
                  assignments={assignments}
                  submissions={submissions}
                  onAssignmentSubmit={(assignment) => handleAssignmentSubmit(assignment, "homework")}
                />
              </div>
            ) : activeTab === 'exercise' ? (
              <div className="p-5">
                <QuickExerciseComponent onCreateHomework={(assignment) => handleAssignmentSubmit(assignment, "homework")} />
              </div>
            ) : activeTab === 'exam-correction' ? (
              <ExamCorrection />
            ) : activeTab === 'exam-analytics' ? (
              <div className="p-5 h-[calc(100vh-100px)] overflow-auto">
                <ExamAnalytics />
                </div>
            ) : activeTab === 'progress' ? (
              <ProgressTab
              teacherData={teacherData}
              selectedClass={selectedClass}
              onClassChange={handleClassChange}
              />
            ) : activeTab === 'question-paper' ? (
              <div className="p-5 h-[calc(100vh-100px)] overflow-auto">
                <QuestionPaperGenerator />
              </div>
            ) : null}
      </div>
    </>
  );
};


export default EnhancedTeacherDash;
