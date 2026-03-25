import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ChevronDown, HelpCircle } from 'lucide-react';
import QuestionListModal from './QuestionListModal';
import axiosInstance from '../api/axiosInstance';
import MarkdownWithMath from './MarkdownWithMath';
import Tutorial from './Tutorial';
import { useTutorial } from '../contexts/TutorialContext';
import { getImageSrc } from '../utils/imageUtils';
import { useMascot, MASCOT_ANIMATIONS } from '../contexts/MascotContext';
import { FloatingMascot, useSpeechBubble } from './Mascot3D';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuestionListModal, setShowQuestionListModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [autoCalculatedScore, setAutoCalculatedScore] = useState(null);

  // Accordion state for explain action
  const [openAccordionIndex, setOpenAccordionIndex] = useState(0);

  // Tutorial context
  const {
    shouldShowTutorialForPage,
    completeTutorialFlow,
    startTutorialFromToggle,
    startTutorialForPage,
  } = useTutorial();

  // Mascot context
  const { playScoreAnimation, playActionAnimation, playAnimation, ANIMATIONS } = useMascot();

  // Speech bubble for contextual mascot feedback
  const {
    currentBubble,
    showBubble: isBubbleVisible,
    showMessage: showMascotMessage,
    hideMessage: hideMascotMessage,
  } = useSpeechBubble();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const { state } = location;
  const {
    message,
    ai_data,
    actionType,
    questionList,
    class_id,
    subject_id,
    topic_ids,
    subtopic,
    questionImage,
    questionNumber,
    studentImages = [],
    question_id,
    context
  } = state || {};
  console.log('question_id from explain state:', question_id);
  const {
    question,
    ai_explaination,
    student_answer,
    concepts,
    comment,gap_analysis,time_analysis,error_type,mistakes_made,
    concepts_used,
    solution,
    score,
    obtained_marks,
    total_marks,
    question_marks,
    question_image_base64,
    student_answer_base64,
    videos = [],
    real_world_videos = [],
    bridges_used,
    patterns_required,
    pattern_explanation,
    pattern_based_solution
  } = ai_data || {};

  // Determine which AI explanation to use - prioritize pattern_based_solution if available
  const effectiveAiExplaination = pattern_based_solution?.ai_explaination || ai_explaination;
  console.log('AI Data:', ai_data);
  const formated_concepts_used = Array.isArray(concepts_used)
    ? concepts_used.join(', ')
    : concepts_used || '';

  // Combine student images from state and API response
  const getAllStudentImages = () => {
    const images = [];

    if (studentImages && studentImages.length > 0) {
      studentImages.forEach((imageUrl, index) => {
        images.push({
          src: imageUrl,
          type: 'uploaded',
          label: `Uploaded Image `
        });
      });
    }

    if (student_answer_base64) {
      images.push({
        src: `data:image/jpeg;base64,${student_answer_base64}`,
        type: 'processed',
        label: 'Processed Solution'
      });
    }

    return images;
  };

  const allStudentImages = getAllStudentImages();

  // Tutorial steps for ResultPage
  const tutorialSteps = [
    {
      target: '.result-title',
      content: 'Congratulations! This is your result page where you can see AI feedback on your solution.',
      disableBeacon: true,
    },
    {
      target: '.student-images',
      content: 'Here you can see your uploaded solution images. The AI has analyzed your work!',
      skipIfMissing: true,
    },
    {
      target: '.result-question',
      content: 'This section shows the AI\'s feedback, solution steps, and corrections for your answer.',
    },
    {
      target: '.practice-btn-fixed',
      content: 'Click here to practice similar questions and improve your understanding!',
    },
    {
      target: '.dashboard-btn-fixed',
      content: 'Use the Question List button to try other questions from your selection.',
    },
    {
      target: '.back-btn-fixed',
      content: 'You can go back to modify your answer or try a different approach. That completes the tutorial!',
    },
  ];

  // Handle tutorial completion for ResultPage
  const handleTutorialComplete = () => {
    console.log("ResultPage tutorial completed - marking entire flow as complete");
    completeTutorialFlow();
  };

  // Set mascot emotion based on score or action type
  useEffect(() => {
    if ((actionType === 'correct' || actionType === 'submit') &&
        (obtained_marks !== undefined || score !== undefined)) {
      const obtainedValue = obtained_marks !== undefined
        ? (typeof obtained_marks === 'number' ? obtained_marks : parseInt(obtained_marks, 10))
        : (score !== undefined
          ? (typeof score === 'number' ? score : parseInt(score, 10))
          : 0);

      const totalValue = total_marks !== undefined
        ? (typeof total_marks === 'number' ? total_marks : parseInt(total_marks, 10))
        : (question_marks !== undefined
          ? (typeof question_marks === 'number' ? question_marks : parseInt(question_marks, 10))
          : 10);

      playScoreAnimation(obtainedValue, totalValue);

      const scorePercent = (obtainedValue / totalValue) * 100;
      setTimeout(() => {
        if (scorePercent >= 80) {
          showMascotMessage("Excellent work! Keep it up!", 4000);
        } else if (scorePercent >= 60) {
          showMascotMessage("Good effort! Review the gaps.", 4000);
        } else if (scorePercent >= 40) {
          showMascotMessage("Keep practicing! You'll improve.", 4000);
        } else {
          showMascotMessage("Don't give up! Let's learn together.", 4000);
        }
      }, 800);
    } else {
      playActionAnimation(actionType);

      setTimeout(() => {
        if (actionType === 'solve') {
          showMascotMessage("Here's the solution!", 3000);
        } else if (actionType === 'explain') {
          showMascotMessage("Let me explain the concepts!", 3000);
        }
      }, 500);
    }
  }, [actionType, obtained_marks, total_marks, score, question_marks, playScoreAnimation, playActionAnimation, showMascotMessage]);

  // Apply dark mode on component mount and listen for changes
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(darkModeEnabled);
      document.body.classList.toggle('dark-mode', darkModeEnabled);
    };

    checkDarkMode();

    window.addEventListener('storage', checkDarkMode);

    return () => {
      window.removeEventListener('storage', checkDarkMode);
    };
  }, []);

   // Allow page scrolling
     useEffect(() => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }, []);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      studentImages.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [studentImages]);

  // Auto-calculate score if none is provided from API
  useEffect(() => {
    if ((actionType === 'submit' || actionType === 'correct') &&
        student_answer &&
        obtained_marks === undefined &&
        score === undefined) {
      calculateAutoScore();
    }
  }, [ai_data, actionType, student_answer]);

  // Function to calculate score based on student answer
  const calculateAutoScore = async () => {
    if (!student_answer || !question) {
      return;
    }

    setIsCalculatingScore(true);

    try {
      const aiScoringResponse = await axiosInstance.post('/auto-score/', {
        student_answer,
        question,
        expected_solution: ai_explaination || solution || [],
        total_marks: total_marks || question_marks || 10
      }).catch(() => null);

      if (aiScoringResponse?.data?.score !== undefined) {
        setAutoCalculatedScore(aiScoringResponse.data.score);
      } else {
        const fallbackScore = calculateFallbackScore();
        setAutoCalculatedScore(fallbackScore);
      }
    } catch (error) {
      console.error('Error calculating score:', error);
      const fallbackScore = calculateFallbackScore();
      setAutoCalculatedScore(fallbackScore);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Fallback scoring method using keyword matching
  const calculateFallbackScore = () => {
    const totalMark = total_marks || question_marks || 10;

    const expectedSolution = Array.isArray(ai_explaination)
      ? ai_explaination.join(' ')
      : (Array.isArray(solution) ? solution.join(' ') : '');

    if (!expectedSolution) {
      return 0;
    }

    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
    };

    const normalizedStudentAnswer = normalizeText(student_answer);
    const normalizedSolution = normalizeText(expectedSolution);

    const extractKeywords = (text) => {
      const commonWords = ['the', 'and', 'is', 'in', 'of', 'to', 'for', 'a', 'by', 'with', 'as'];
      const words = text.split(/\s+/);
      return words.filter(word =>
        word.length > 2 && !commonWords.includes(word)
      );
    };

    const solutionKeywords = extractKeywords(normalizedSolution);
    const studentKeywords = extractKeywords(normalizedStudentAnswer);

    let matchCount = 0;
    for (const keyword of solutionKeywords) {
      if (studentKeywords.includes(keyword)) {
        matchCount++;
      }
    }

    const matchPercentage = solutionKeywords.length > 0
      ? matchCount / solutionKeywords.length
      : 0;

    let calculatedScore = Math.round(matchPercentage * totalMark);

    if (calculatedScore === 0 && matchCount > 0 && normalizedStudentAnswer.length > 10) {
      calculatedScore = 1;
    }

    if (matchPercentage > 0.8) {
      calculatedScore = totalMark;
    }

    return calculatedScore;
  };

  const handleBackToDashboard = () => {
    navigate('/student-dash');
  };

  const handleBack = () => {
    navigate('/solvequestion', {
      state: {
        question: question,
        questionNumber: questionNumber,
        questionList: questionList,
        class_id: class_id,
        subject_id: subject_id,
        topic_ids: topic_ids,
        subtopic: subtopic,
        image: questionImage,
        index: questionNumber ? questionNumber - 1 : 0,
        selectedQuestions: questionList,
        question_id: question_id,
        context: context
      }
    });
  };
  const handleShowQuestionList = () => {
    setShowQuestionListModal(true);
  };

  const handleCloseQuestionList = () => {
    setShowQuestionListModal(false);
  };

  const handleQuestionSelect = (selectedQuestion, index, selectedImage, question_id, questionContext = null) => {
    navigate('/solvequestion', {
      state: {
        question: selectedQuestion,
        questionNumber: index + 1,
        questionList,
        class_id,
        subject_id,
        topic_ids,
        subtopic,
        image: selectedImage,
        question_id: question_id || `question_${index}_${Date.now()}`,
        context: questionContext
      }
    });
  };

  const handlePracticeSimilar = () => {
    if (!question) {
      setErrorMessage('No question available for practice');
      return;
    }

    navigate('/similar-questions', {
      state: {
        originalQuestion: question,
        class_id,
        subject_id,
        topic_ids,
        subtopic,
        questionImage,
        solution: ai_explaination || solution
      }
    });
  };

  // Display the score with proper formatting
  const renderScore = () => {
    const scoreFromApi = obtained_marks !== undefined
                    ? (typeof obtained_marks === 'number' ? obtained_marks : parseInt(obtained_marks, 10))
                    : (score !== undefined
                        ? (typeof score === 'number' ? score : parseInt(score, 10))
                        : null);

    const totalValue = total_marks !== undefined
      ? (typeof total_marks === 'number' ? total_marks : parseInt(total_marks, 10))
      : (question_marks !== undefined
          ? (typeof question_marks === 'number' ? question_marks : parseInt(question_marks, 10))
          : 10);

    if (scoreFromApi !== null) {
      const percent = (scoreFromApi / totalValue) * 100;
      return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${percent >= 60 ? 'border-l-4 border-l-[#22c55e]' : 'border-l-4 border-l-[#ef4444]'}`}>
          <p className="text-lg font-semibold text-[#0B1120]">
            <span className="text-gray-500">Score:</span>{' '}
            <span className={percent >= 60 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
              {scoreFromApi} / {totalValue}
            </span>
          </p>
        </div>
      );
    }

    if (isCalculatingScore) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#00A0E3]" />
          <span className="font-semibold text-[#0B1120]">Calculating Score...</span>
        </div>
      );
    }
  };

  // Function to render solution steps with proper formatting
  const renderSolutionSteps = (steps) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return <p className="text-gray-500 italic">No solution steps available.</p>;
    }

    return (
      <div className="space-y-4 mt-3">
        {steps.map((step, index) => {
          const stepMatch = step.match(/^Step\s+(\d+):\s+(.*)/i);

          if (stepMatch) {
            const [_, stepNumber, stepContent] = stepMatch;
            return (
              <div key={index} className="pl-4 border-l-2 border-[#00A0E3]">
                <div className="text-sm font-bold text-[#00A0E3] mb-1">Step {stepNumber}:</div>
                <div className="text-[#0B1120] text-sm leading-relaxed">
                  <MarkdownWithMath content={stepContent} />
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className="pl-4 border-l-2 border-[#00A0E3]">
                <div className="text-sm font-bold text-[#00A0E3] mb-1">Step {index+1}:</div>
                <div className="text-[#0B1120] text-sm leading-relaxed">
                  <MarkdownWithMath content={step} />
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const formatExampleContent = (example) => {
    if (!example) return null;

    const [intro, ...stepParts] = example.split(/Step \d+:/);

    return (
      <div className="mt-3 space-y-2">
        {stepParts.map((step, index) => (
          <div key={index} className="pl-3 border-l-2 border-gray-200">
            <strong className="text-sm text-[#0B1120]">{`Step ${index + 1}:`}</strong>
            <MarkdownWithMath content={step.replace(/\*\*/g, '').trim()} />
          </div>
        ))}
      </div>
    );
  };

  // Function to render video cards
  const renderVideoSection = (videosArray, title) => {
    if (!Array.isArray(videosArray) || videosArray.length === 0) return null;

    return (
      <div className="mt-4">
        {title && <h5 className="text-sm font-semibold text-[#0B1120] mb-3">{title}</h5>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videosArray.map((video, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <a
                href={video.url || video.embed_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 object-cover"
                />
              </a>
              <div className="p-3">
                <p className="text-sm font-semibold text-[#0B1120] line-clamp-2">{video.title}</p>
                <p className="text-xs text-gray-500 mt-1">{video.channel}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {video.duration} | {video.views} | {video.likes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContentBasedOnAction = () => {
    if (!actionType) {
      return <p className="text-gray-500">No action type provided. Unable to display results.</p>;
    }

    switch (actionType) {

      case 'submit':
        return (
          <>
            <div className="result-question bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
              <p className="font-semibold text-[#0B1120] mb-2">Student Answer:</p>
              <div className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm">
                {student_answer || "No answer submitted"}
              </div>
            </div>
            {renderScore()}
            {comment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p><span className="font-semibold text-[#0B1120]">Comments:</span> {comment}</p>
              </div>
            )}
            {formated_concepts_used && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p><span className="font-semibold text-[#0B1120]">Concepts Used:</span> {formated_concepts_used}</p>
              </div>
            )}
          </>
        );
      case 'solve':
        return (
          <>
            <div className="result-question bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
              <p className="text-lg font-bold text-[#00A0E3] mb-3">AI Solution:</p>
              {question_image_base64 && (
                <div className="mb-4">
                  <img
                    src={getImageSrc(question_image_base64, 'image/jpeg')}
                    alt="Solution diagram"
                    className="max-w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
              {renderSolutionSteps(ai_explaination)}
            </div>
            {comment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p><span className="font-semibold text-[#0B1120]">Comments:</span> {comment}</p>
              </div>
            )}
            {formated_concepts_used && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p><span className="font-semibold text-[#0B1120]">Concepts Used:</span> {formated_concepts_used}</p>
              </div>
            )}
          </>
        );
        case 'correct':
        return (
        <>
          <div className="result-question bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <p className="text-lg font-bold text-[#00A0E3] mb-3">
              {pattern_based_solution ? 'Pattern-Based AI Solution:' : 'AI Solution:'}
            </p>
            {question_image_base64 && (
              <div className="mb-4">
                <img
                  src={getImageSrc(question_image_base64, 'image/jpeg')}
                  alt="Solution diagram"
                  className="max-w-full rounded-lg border border-gray-200"
                />
              </div>
            )}
            {renderSolutionSteps(effectiveAiExplaination)}
            </div>
            {renderScore()}
            {comment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p className="font-semibold text-[#0B1120] mb-1">Comments:</p>
                <MarkdownWithMath content={comment} />
              </div>
            )}
            {error_type && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 border-l-4 border-l-[#ef4444]">
                <p className="font-semibold text-[#0B1120] mb-1">Type of Error:</p>
                <MarkdownWithMath content={error_type} />
              </div>
            )}
            {gap_analysis && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p className="font-semibold text-[#0B1120] mb-1">Gap Analysis:</p>
                <MarkdownWithMath content={gap_analysis} />
              </div>
            )}
            {mistakes_made && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 border-l-4 border-l-[#ef4444]">
                <p className="font-semibold text-[#0B1120] mb-1">Mistakes Made:</p>
                <MarkdownWithMath content={mistakes_made} />
              </div>
            )}
            {patterns_required && patterns_required.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p className="font-semibold text-[#0B1120] mb-2">Patterns Required:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {patterns_required.map((pattern, index) => (
                    <li key={index}><MarkdownWithMath content={pattern} /></li>
                  ))}
                </ul>
              </div>
            )}
            {bridges_used && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p className="font-semibold text-[#0B1120] mb-1">Bridges Used:</p>
                <MarkdownWithMath content={bridges_used} />
              </div>
            )}
            {pattern_explanation && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p className="font-semibold text-[#0B1120] mb-1">Pattern Explanation:</p>
                <MarkdownWithMath content={pattern_explanation} />
              </div>
            )}
            {time_analysis && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p className="font-semibold text-[#0B1120] mb-1">Time-Management:</p>
                <MarkdownWithMath content={time_analysis} />
              </div>
            )}
            {formated_concepts_used && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p className="font-semibold text-[#0B1120] mb-1">Concepts Required:</p>
                <MarkdownWithMath content={formated_concepts_used} />
              </div>
            )}
          </>
        );

      case 'explain':
        return (
          <>
            {concepts && (
              <div className="space-y-3">
                {concepts.map((conceptItem, index) => {
                  const isOpen = openAccordionIndex === index;
                  return (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                        onClick={() => setOpenAccordionIndex(isOpen ? -1 : index)}
                      >
                        <span className="font-semibold text-[#0B1120]">{`Concept ${index + 1}`}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 border-t border-gray-100">
                          <p className="mt-4 text-base font-bold text-[#0B1120]">
                            {conceptItem.concept}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-[#00A0E3]">Explanation:</p>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            <MarkdownWithMath content={conceptItem.explanation} />
                          </div>

                          {/* Example Section */}
                          {conceptItem.example && (
                            <div className="mt-4">
                              {typeof conceptItem.example === "string" ? (
                                <>
                                  <p className="text-sm font-semibold text-[#00A0E3]">Example:</p>
                                  <div className="text-sm text-gray-700">
                                    <MarkdownWithMath content={conceptItem.example} />
                                  </div>
                                  <p className="text-sm font-semibold text-[#00A0E3] mt-2">Solution:</p>
                                  <div className="text-sm text-gray-700">
                                    <MarkdownWithMath content={conceptItem.application} />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {conceptItem.example.problem && (
                                    <div className="text-sm text-gray-700">
                                      <MarkdownWithMath content={conceptItem.example.problem} />
                                    </div>
                                  )}
                                  {conceptItem.example.solution && (
                                    <>
                                      <p className="text-sm font-semibold text-[#00A0E3] mt-2">Solution:</p>
                                      <div className="text-sm text-gray-700">
                                        <MarkdownWithMath content={conceptItem.example.solution} />
                                        <MarkdownWithMath content={conceptItem.example.explaination} />
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Filtered video + real world video sections */}
                          {Array.isArray(videos) && videos.length > 0 && (
                            videos
                              .filter(
                                (item) =>
                                  item.concept_name?.toLowerCase().trim() ===
                                  conceptItem.concept?.toLowerCase().trim()
                              )
                              .map((item, idx) => (
                                <div key={idx}>
                                  {Array.isArray(item.videos) && item.videos.length > 0 && (
                                    renderVideoSection(
                                      item.videos,
                                      `Concept Explanation Videos`
                                    )
                                  )}

                                  {item.real_world_video && (
                                    renderVideoSection(
                                      [item.real_world_video],
                                      null
                                    )
                                  )}
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {comment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 mt-4">
                <p className="font-semibold text-[#0B1120] mb-1">Comments:</p>
                <MarkdownWithMath content={comment} />
              </div>
            )}
            {formated_concepts_used && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                <p><span className="font-semibold text-[#0B1120]">Concepts Used:</span> {formated_concepts_used}</p>
              </div>
            )}
          </>
        );

      default:
        return <p className="text-gray-500">No action type provided. Unable to display results.</p>;
    }
  };

  return (
    <>
      {/* Sticky Top Bar */}
      <div className={`sticky top-0 z-50 backdrop-blur-md border-b ${isDarkMode ? 'bg-[#0B1120]/90 border-gray-800' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="back-btn-fixed px-4 py-2 border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              &larr; Back
            </button>
            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#0B1120]'}`}>
              {actionType === 'correct' ? 'AI Correction' : actionType === 'solve' ? 'AI Solution' : actionType === 'explain' ? 'Concepts' : 'Result'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePracticeSimilar}
              className="practice-btn-fixed px-4 py-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Practice Similar
            </button>
            <button
              type="button"
              onClick={handleShowQuestionList}
              className="dashboard-btn-fixed px-4 py-2 border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3] hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Question List
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              onClick={() => startTutorialForPage("resultPage")}
              title="Start Tutorial"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
        <div className="flex flex-col lg:flex-row gap-6 p-4 pt-6 max-w-7xl mx-auto">
          {/* Left Column - Sticky Image Container */}
          {allStudentImages.length > 0 && (
            <div className="lg:w-5/12 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="result-title text-xl font-bold text-[#0B1120] mb-4">Your Solution</h2>
                <div className="student-images space-y-4">
                  {allStudentImages.map((imageData, index) => (
                    <div key={index} className="relative">
                      <img
                        src={getImageSrc(imageData.src)}
                        alt={imageData.label}
                        className="w-full rounded-lg border border-gray-200"
                        onError={(e) => {
                          console.error('Error loading image:', imageData.src);
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="block mt-1 text-xs text-gray-500">{imageData.label}</span>
                      {imageData.type === 'processed' && (
                        <span className="absolute top-2 right-2 bg-[#00A0E3] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          AI Processed
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Fallback text display */}
                {student_answer && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h5 className="text-sm font-semibold text-[#0B1120] mb-2">Answer Text:</h5>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                      <MarkdownWithMath content={student_answer} />
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Right Column - Content */}
          <div className={allStudentImages.length > 0 ? 'lg:w-7/12' : 'w-full'}>
            <div className="space-y-4">
              <h2 className="result-title text-xl font-bold text-[#0B1120]">Result</h2>

              {errorMessage && (
                <div className="border-l-4 border-[#ef4444] bg-red-50 px-4 py-3 rounded-r-lg text-sm text-[#ef4444] flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-[#ef4444] hover:text-red-700 font-bold text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Question Section - Full Width */}
              <div className="result-question bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-[#0B1120]">
                  <span className="font-semibold">Question {questionNumber}:</span>{' '}
                  <MarkdownWithMath content={question} />
                </p>
                {questionImage && (
                  <div className="mt-3">
                    <img
                      src={getImageSrc(questionImage)}
                      alt="Question"
                      className="max-w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                {solution && solution.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-lg font-bold text-[#00A0E3] mb-2">Solution:</p>
                    {renderSolutionSteps(solution)}
                  </div>
                )}
              </div>

              {renderContentBasedOnAction()}

              {/* Bottom padding */}
              <div className="h-8"></div>
            </div>
          </div>
        </div>

        <QuestionListModal
          show={showQuestionListModal}
          onHide={handleCloseQuestionList}
          questionList={questionList}
          onQuestionClick={handleQuestionSelect}
        />
      </div>

      {/* Floating Mascot - Non-intrusive corner placement */}
      {/* <FloatingMascot
        position="bottom-right"
        size="medium"
        bottomOffset={80}
        speechBubble={currentBubble}
        showBubble={isBubbleVisible}
        onBubbleDismiss={hideMascotMessage}
      /> */}
    </>
  );
};

export default ResultPage;
