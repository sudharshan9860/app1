import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, Camera, ArrowLeft, CheckCircle, X, Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import CameraCapture from "./CameraCapture";
import MarkdownWithMath from "./MarkdownWithMath";

function WorksheetSubmission() {
  const location = useLocation();
  const navigate = useNavigate();

  const { worksheetName, worksheetQuestions = [] } = location.state || {};

  const [images, setImages] = useState([]);
  const [imageSourceType, setImageSourceType] = useState("upload");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!worksheetName) {
      setError("Worksheet name is missing. Please go back and select a worksheet.");
    }
  }, [worksheetName]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError("Some files exceed the 5MB size limit. Please select smaller images.");
      return;
    }

    setImages(prevImages => [...prevImages, ...files]);
    setError(null);
  };

  const handleCapturedImage = (capturedImageBlob) => {
    const file = new File(
      [capturedImageBlob],
      `worksheet-${worksheetName}-${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    );
    setImages(prevImages => [...prevImages, file]);
    setError(null);
  };

  const handleUploadProgress = (percent) => {
    setUploadProgress(percent);
  };

  const handleRemoveImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  const handleClearAllImages = () => {
    setImages([]);
    setError(null);
  };

  const handleSubmitWorksheet = async () => {
    if (images.length === 0) {
      setError("Please upload at least one image of your worksheet solutions.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("worksheet_name", worksheetName);

    images.forEach((image) => {
      formData.append("image_response", image);
    });

    try {
      const response = await axiosInstance.uploadFile(
        "/worksheet-submission/",
        formData,
        handleUploadProgress
      );

      setSuccessMessage("Worksheet submitted successfully!");

      setTimeout(() => {
        navigate("/studentdash", {
          state: { worksheetSubmitted: true }
        });
      }, 2000);

    } catch (error) {
      console.error("Submission error:", error);
      if (error.code === "ECONNABORTED") {
        setError("Request timed out. Please try with smaller images or check your connection.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to submit worksheet. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getLevelClasses = (level) => {
    const l = level.toLowerCase();
    if (l === 'easy') return 'bg-green-100 text-green-800';
    if (l === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#0B1120]">Worksheet: {worksheetName}</h2>
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="p-0.5 hover:bg-red-100 rounded">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          {/* Worksheet Questions Display */}
          {worksheetQuestions && worksheetQuestions.length > 0 && (
            <div className="mb-6 bg-[#F8FAFC] p-5 rounded-lg max-h-[400px] overflow-y-auto">
              <h4 className="font-semibold text-[#0B1120] mb-3">Worksheet Questions</h4>
              <div className="space-y-3">
                {worksheetQuestions.map((questionData, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg bg-white">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-[30px] h-[30px] rounded-full bg-[#00A0E3] text-white flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {questionData.question && (
                          <div className="mb-2">
                            <MarkdownWithMath content={questionData.question} />
                          </div>
                        )}
                        {questionData.level && (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getLevelClasses(questionData.level)}`}>
                            {questionData.level}
                          </span>
                        )}
                        {questionData.question_image && (
                          <div className="mt-2">
                            <img
                              src={`data:image/png;base64,${questionData.question_image}`}
                              alt={`Question ${index + 1}`}
                              className="max-w-full h-auto rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="mb-6">
            <h4 className="font-semibold text-[#0B1120] mb-3">Upload Your Solutions</h4>

            {/* Image Source Selection */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setImageSourceType("upload")}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                  imageSourceType === "upload"
                    ? 'bg-[#00A0E3] text-white'
                    : 'border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3]/10'
                }`}
              >
                <Upload size={16} />
                Upload Images
              </button>
              <button
                onClick={() => setImageSourceType("camera")}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
                  imageSourceType === "camera"
                    ? 'bg-[#00A0E3] text-white'
                    : 'border border-[#00A0E3] text-[#00A0E3] hover:bg-[#00A0E3]/10'
                }`}
              >
                <Camera size={16} />
                Take Photo
              </button>
            </div>

            {/* Conditional Upload/Camera Interface */}
            {imageSourceType === "upload" ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#00A0E3]/10 file:text-[#0080B8] hover:file:bg-[#00A0E3]/20 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can select multiple images. Maximum 5MB per image.
                </p>
              </div>
            ) : (
              <div className="p-3 border border-gray-200 rounded-lg">
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
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Click "Capture" to take photos of your worksheet solutions
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-5 relative overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00A0E3] transition-all animate-pulse"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow">
                  {uploadProgress}%
                </span>
              </div>
              <p className="text-center text-sm text-gray-500 mt-1">
                Uploading... Please don't close this page.
              </p>
            </div>
          )}

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-semibold text-[#0B1120]">Solution Images ({images.length})</h5>
                <button
                  onClick={handleClearAllImages}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Solution ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isSubmitting}
                      aria-label="Remove image"
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmitWorksheet}
              disabled={images.length === 0 || isSubmitting}
              className="flex items-center gap-2 px-8 py-3 text-base font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Submit Worksheet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorksheetSubmission;
