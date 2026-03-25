import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import MarkdownWithMath from './MarkdownWithMath';
import { Loader2, ArrowLeft } from 'lucide-react';

const SimilarQuestions = () => {
  const [similarQuestions, setSimilarQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch similar questions when component mounts
  useEffect(() => {
    console.log("Location state:", location.state);
    fetchSimilarQuestions();
  }, []);

  // Function to fetch similar questions from API
  const fetchSimilarQuestions = async () => {
    try {
      setLoading(true);
      setError('');

      if (!location.state?.originalQuestion) {
        throw new Error('Original question not found in the navigation state');
      }

      console.log("Sending request with question:", location.state.originalQuestion);

      const response = await axiosInstance.post('/similarquestion/', {
        question: location.state.originalQuestion,
        request_specific_concepts: true
      });

      console.log("API Response:", response.data);
      setSimilarQuestions(response.data);
    } catch (err) {
      console.error('Error fetching similar questions:', err);
      generateFallbackSimilarQuestions();
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback similar questions when API fails
  const generateFallbackSimilarQuestions = () => {
    if (!location.state?.originalQuestion) return;

    const originalQuestion = location.state.originalQuestion;
    let specificConcepts = '';

    if (originalQuestion.toLowerCase().includes('circle') ||
        originalQuestion.toLowerCase().includes('tangent')) {
      specificConcepts = `1. CIRCLE PROPERTIES:\n- A circle is a set of points that are equidistant from a given point (the center).\n- The radius is the distance from the center to any point on the circle.\n- Tangents to a circle are perpendicular to the radius at the point of tangency.\n\n2. TANGENT PROPERTIES:\n- A tangent to a circle touches the circle at exactly one point.\n- If two tangents are drawn to a circle from an external point, they are equal in length.\n- The tangent at any point on a circle is perpendicular to the radius drawn to that point.\n\n3. PARALLEL LINES AND ANGLES:\n- When parallel lines are cut by a transversal, corresponding angles are equal.\n- When parallel lines are cut by a transversal, alternate angles are equal.\n- The sum of angles in a triangle equals 180 degrees.\n\n4. ANGLE IN A SEMICIRCLE:\n- An angle inscribed in a semicircle is always 90 degrees (a right angle).`;
    } else if (originalQuestion.toLowerCase().includes('cylinder') ||
               originalQuestion.toLowerCase().includes('hemisphere')) {
      specificConcepts = `1. CORE CONCEPTS:\n- Cylinder: A three-dimensional shape with two parallel circular bases and a curved surface connecting the bases. Its height is the distance between the bases.\n- Hemisphere: Half of a sphere, having a curved surface and a flat circular face.\n- Surface Area: The total area that the surface of a three-dimensional object occupies.\n- Modification of Solids: When parts are removed from a solid, care must be taken to account for added or removed surfaces in surface area calculations.\n\n2. DETAILED EXPLANATION:\n- We start with a cylinder of height h and base radius r.\n- Two hemispheres with the same radius are scooped out from both ends of the cylinder.\n- By removing each hemisphere, the flat circular ends of the cylinder are no longer part of the surface. Instead, we have the curved surface of the hemispheres.\n\n3. PROBLEM-SOLVING APPROACH:\n- Step 1: Calculate the lateral surface area of the cylinder using the formula: 2\u03C0rh.\n- Step 2: Calculate the curved surface area of one hemisphere using the formula: 2\u03C0r\u00B2. Since there are two hemispheres, multiply this by 2.\n- Step 3: Add the lateral surface area of the cylinder to the total curved surface area of the hemispheres.\n\n4. FORMULAS AND PRINCIPLES:\n- Lateral Surface Area of Cylinder: 2\u03C0rh\n- Curved Surface Area of a Hemisphere: 2\u03C0r\u00B2\n- Total Surface Area: Combine the lateral surface area of the cylinder and twice the curved surface area of one hemisphere.`;
    } else {
      specificConcepts = `1. UNDERSTANDING THE PROBLEM:\n- Identify what is given in the problem.\n- Determine what is being asked for.\n- Recognize the relevant mathematical concepts involved.\n\n2. STRATEGY SELECTION:\n- Choose appropriate formulas and methods based on the problem type.\n- Break down complex problems into smaller, manageable parts.\n- Consider alternative approaches if direct methods are challenging.\n\n3. SYSTEMATIC SOLUTION PROCESS:\n- Apply selected formulas correctly with the given values.\n- Perform calculations step by step to avoid errors.\n- Check intermediate results for reasonableness.\n\n4. VERIFICATION AND INTERPRETATION:\n- Verify the solution by checking if it satisfies all conditions of the problem.\n- Interpret the answer in the context of the original problem.\n- Consider if the solution makes physical or practical sense.`;
    }

    const fallbackData = {
      similar_question: `"${originalQuestion.substring(0, 100)}..."`,
      theory_concepts: specificConcepts
    };

    setSimilarQuestions(fallbackData);
  };

  // Render theoretical concepts with improved formatting
  const renderTheoreticalConcepts = () => {
    if (!similarQuestions || !similarQuestions.theory_concepts) {
      return null;
    }

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-6">
        <div className="bg-[#00A0E3] text-white px-5 py-3 font-semibold">Theoretical Concepts</div>
        <div className="p-5">
          {similarQuestions.theory_concepts.split('\n').map((paragraph, index) => {
            const trimmedPara = paragraph.trim();

            if (!trimmedPara) return null;

            if (trimmedPara.match(/^\d+\.\s+[A-Z\s]+:?/)) {
              return (
                <div key={index} className="mt-4 first:mt-0">
                  <h5 className="text-[#0B1120] font-bold text-base">{trimmedPara}</h5>
                </div>
              );
            }

            if (trimmedPara.startsWith('-')) {
              return (
                <div key={index} className="pl-4 py-1 border-l-2 border-[#00A0E3] ml-2 mb-2">
                  <MarkdownWithMath content={trimmedPara.substring(1).trim()} />
                </div>
              );
            }

            return <p key={index} className="text-[#0B1120] mb-2">{trimmedPara}</p>;
          })}
        </div>
      </div>
    );
  };

  // Handle selecting a question to solve
  const handleQuestionSelect = (question) => {
    navigate('/solvequestion', {
      state: {
        question: question.similar_question,
        class_id: location.state?.class_id,
        subject_id: location.state?.subject_id,
        topic_ids: location.state?.topic_ids,
        subtopic: location.state?.subtopic,
        image: location.state?.questionImage
      }
    });
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    navigate('/student-dash');
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#00A0E3] animate-spin mx-auto" />
          <p className="mt-4 text-[#0B1120]">Loading similar questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-[#0B1120] text-center mb-8">Similar Practice Questions</h2>

        <div className="space-y-6">
          {/* Original Question Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="bg-[#0B1120] text-white px-5 py-3 font-semibold">Original Question</div>
            <div className="p-5">
              <MarkdownWithMath content={location.state?.originalQuestion || "Consider a variation of the original problem with different values."} />
              {location.state?.questionImage && (
                <div className="mt-4">
                  <img
                    src={location.state.questionImage}
                    alt="Question"
                    className="max-w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Theoretical Concepts Section */}
          {renderTheoreticalConcepts()}

          {/* Similar Question Section */}
          {similarQuestions && similarQuestions.similar_question && (
            <div className="bg-white rounded-xl shadow-md border border-[#00A0E3]/20 overflow-hidden">
              <div className="bg-[#00A0E3] text-white px-5 py-3 font-semibold">Practice Question</div>
              <div className="p-5">
                <MarkdownWithMath content={similarQuestions.similar_question} />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleQuestionSelect(similarQuestions)}
                    className="px-6 py-2.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg font-medium transition-colors"
                  >
                    Solve This Question
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Dashboard button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimilarQuestions;
