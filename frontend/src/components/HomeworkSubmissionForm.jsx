
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from './AuthContext';
import CameraCapture from './CameraCapture';
import MarkdownWithMath from './MarkdownWithMath';
import { getImageSrc } from '../utils/imageUtils';

const HomeworkSubmissionForm = () => {
  const [imageFiles, setImageFiles] = useState([]); // Changed from single file to array
  const [imageSourceType, setImageSourceType] = useState("upload"); // "upload" or "camera"
  const [assignment, setAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Add upload progress
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useContext(AuthContext);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        // Get homework details from location state (passed from notification)
        const notificationId = location.state?.notificationId;

        const response = await axiosInstance.get(`/notification-data/?notification_id=${notificationId}`);
        console.log("homework-details",response.data)

        // Set assignment to the homework object, not the entire response
        setAssignment(response.data.homework);

        const homeworkDetails = response.data.homework;
        console.log("homework_details", homeworkDetails)

        const homeworkCode = response.data.homework.homework_code;
        console.log("Homework_Code", homeworkCode)
      } catch (error) {
        console.error("Error fetching assignment:", error);
      }
    };

    fetchAssignment();
  }, [location]);

  // Handle multiple image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file size before accepting
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024); // 5MB limit

    if (oversizedFiles.length > 0) {
      setError(
        `Some files exceed the 5MB size limit. Please select smaller images.`
      );
      return;
    }

    setImageFiles(prevImages => [...prevImages, ...files]);
    setError(null); // Clear previous errors
  };

  // Handle captured image from camera
  const handleCapturedImage = (capturedImageBlob) => {
    // Convert blob to File object
    const file = new File([capturedImageBlob], `homework-response-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setImageFiles(prevImages => [...prevImages, file]);
    setError(null);
  };

  // Handle upload progress
  const handleUploadProgress = (percent) => {
    setUploadProgress(percent);
  };

  // Cancel/Remove specific image
  const handleCancelImage = (index) => {
    const updatedImages = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedImages);
  };

  // Clear all images
  const handleClearAllImages = () => {
    setImageFiles([]);
  };

  // Check if user is loaded
  if (!username) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center text-gray-500">
            <div>Please log in to submit homework</div>
          </div>
        </div>
      </div>
    );
  }

  // Check if assignment is loaded
  if (!assignment) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center">
            {error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="text-gray-500">Loading assignment details...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    setUploadProgress(0);

    if (imageFiles.length === 0) {
      setError("Please upload or capture at least one image");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('homework_code', assignment.homework_code);
      formData.append('student_id', username);
      formData.append('submission_type', 'image');

      // Append multiple image files
      imageFiles.forEach((file, index) => {
        formData.append('image_response', file);
      });

      // Submit the homework with progress tracking
      console.log(formData);

      // Use custom upload method with progress tracking for images
      const response = await axiosInstance.uploadFile(
        '/homework-submission/',
        formData,
        handleUploadProgress
      );

      setSuccess("Homework submitted successfully!");
      setImageFiles([]);
      setUploadProgress(0);

      // Redirect to student dashboard after submission
      setTimeout(() => {
        navigate('/student-dash', {
          state: {
            message: 'Homework submitted successfully!',
            type: 'success'
          }
        });

        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit homework");
      console.error("Error submitting homework:", error);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if assignment is overdue
  const isOverdue = assignment.due_date ? (new Date() > new Date(assignment.due_date)) : false;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 p-6 border-b border-gray-100">
          <div className="text-[#00A0E3]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0B1120]">Submit Homework</h2>
            <p className="text-sm text-gray-500">Submit your response for the assignment</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Assignment Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold text-[#0B1120]">{assignment.title || 'Untitled Homework'}</h3>

            {assignment.questions && assignment.questions.map((question, index) => {
              return (
                <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="text-sm font-semibold text-[#00A0E3] mb-1">Question {index + 1}</h4>
                  <div className="text-sm text-gray-700"><MarkdownWithMath content={question.question} /></div>

                  {question.image && (
                    <img
                      src={getImageSrc(question.image)}
                      alt={`Question ${index + 1}`}
                      className="mt-2 max-w-full rounded-lg max-h-48 object-contain"
                    />
                  )}
                </div>
              );
            })}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
                {assignment.due_date && (
                  <> at {new Date(assignment.due_date).toLocaleTimeString()}</>
                )}
              </div>
              <div className="flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Student: {username}
              </div>
            </div>
            {isOverdue && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                This assignment is overdue
              </div>
            )}
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0B1120] mb-2">Image Source</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${imageSourceType === "upload" ? 'bg-[#00A0E3] text-white border-[#00A0E3]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00A0E3]'}`}
                  onClick={() => setImageSourceType("upload")}
                  disabled={isSubmitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17,8 12,3 7,8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload Images
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${imageSourceType === "camera" ? 'bg-[#00A0E3] text-white border-[#00A0E3]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00A0E3]'}`}
                  onClick={() => setImageSourceType("camera")}
                  disabled={isSubmitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Take Photos
                </button>
              </div>
            </div>

            {imageSourceType === "upload" ? (
              <div>
                <label htmlFor="image-response1" className="block text-sm font-medium text-[#0B1120] mb-2">Upload Your Response Images</label>
                <input
                  id="image-response1"
                  type="file"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#00A0E3] file:text-white file:text-sm file:cursor-pointer"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Maximum file size: 5MB per image. You can select multiple images.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#0B1120] mb-2">Capture Your Response Images</label>
                <div>
                  <CameraCapture
                    onImageCapture={handleCapturedImage}
                    videoConstraints={{
                      facingMode: { ideal: "environment" },
                      width: { ideal: 4096 },
                      height: { ideal: 3072 },
                      focusMode: { ideal: "continuous" },
                      exposureMode: { ideal: "continuous" }
                    }}
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Click "Capture" to take photos of your homework response. You can capture multiple images.
                  </p>
                </div>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#00A0E3] h-full rounded-full transition-all text-[10px] text-white text-center leading-3"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Uploading images... Please don't close this page.
                </p>
              </div>
            )}

            {/* Image Previews */}
            {imageFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h6 className="text-sm font-semibold text-[#0B1120]">Uploaded Images ({imageFiles.length})</h6>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                    onClick={handleClearAllImages}
                    disabled={isSubmitting}
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageFiles.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-28 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCancelImage(index)}
                        disabled={isSubmitting}
                        aria-label="Remove image"
                      >
                        &times;
                      </button>
                      <div className="mt-1 text-[10px] text-gray-400 truncate">
                        <span>{image.name}</span>
                        <span className="ml-1">
                          {(image.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || imageFiles.length === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Homework'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomeworkSubmissionForm;
