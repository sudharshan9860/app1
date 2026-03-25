import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const UploadHomework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState(null); // <-- single select
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHomework, setFetchingHomework] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchHomeworkList();
  }, []);

  const fetchHomeworkList = async () => {
    try {
      setFetchingHomework(true);
      setError(null);
      const response = await axiosInstance.get('/homework-list/');

      // Handle both response formats
      let homeworkCodes = [];
      if (response.data.homework_codes) {
        // Check if it's an array of strings or objects
        if (Array.isArray(response.data.homework_codes)) {
          if (typeof response.data.homework_codes[0] === 'string') {
            // Old format: array of strings
            homeworkCodes = response.data.homework_codes;
          } else if (typeof response.data.homework_codes[0] === 'object') {
            // New format: array of objects
            homeworkCodes = response.data.homework_codes.map(item => item.homework_code);
          }
        }
      }

      setHomeworkList(homeworkCodes);
      console.log('homework-list data', homeworkCodes);
    } catch (error) {
      console.error('Error fetching homework list:', error);
      setError('Failed to fetch homework list. Please try again.');
    } finally {
      setFetchingHomework(false);
    }
  };

  const handleHomeworkSelect = (homeworkId) => {
    setSelectedHomeworkId(homeworkId);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

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
      setError(errors.join(' '));
      event.target.value = null; // Reset the input
      return;
    }

    setError(null); // Clear any previous errors
    // Append new files to existing ones
    setPdfFiles(prevFiles => [...prevFiles, ...validFiles]);
    event.target.value = null; // Reset the input to allow selecting the same files again
  };

  // Remove individual file from selection
  const removePdfFile = (indexToRemove) => {
    setPdfFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedHomeworkId) {
      setError('Please select one homework');
      return;
    }

    if (!pdfFiles || pdfFiles.length === 0) {
      setError('Please select at least one PDF file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      // keep API compatible: send array with a single id
      formData.append('homework_code', selectedHomeworkId.trim());

      // Append multiple PDF files
      pdfFiles.forEach((pdf, index) => {
        formData.append('pdf_response', pdf);
      });

      const response = await axiosInstance.post('auto-homework-submission/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percentCompleted);
        },
      });


      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setSelectedHomeworkId(null);
        setPdfFiles([]);
        setUploadProgress(0);
        const input = document.getElementById('pdf-upload');
        if (input) input.value = null;

        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error uploading homework:', error);
      setError('Failed to upload homework. Please try again.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-[#0B1120] mb-6">Upload Homework PDF</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <span>&#10060;</span>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <span>&#9989;</span>
            {pdfFiles.length} homework file(s) uploaded successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Homework Selection Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#0B1120] mb-3">Select Homework</h3>

            {fetchingHomework ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-[#00A0E3] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500">Loading homework list...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {homeworkList.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <p>No homework available</p>
                    </div>
                  ) : (
                    homeworkList.map((homework) => (
                      <div key={homework} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="homework"
                            checked={selectedHomeworkId === homework}
                            onChange={() => handleHomeworkSelect(homework)}
                            className="w-4 h-4 text-[#00A0E3] focus:ring-[#00A0E3]"
                          />
                          <div>
                            <span className="font-medium text-[#0B1120]">
                              {homework || `Homework #${homework}`}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  {selectedHomeworkId ? '1 homework selected' : '0 homework selected'}
                </div>
              </>
            )}
          </div>

          {/* File Upload Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#0B1120] mb-3">Upload PDF Files</h3>

            <div>
              <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#00A0E3] transition-colors">
                <div className="text-3xl mb-2">&#128196;</div>
                <span className="text-gray-600">
                  {pdfFiles.length > 0 ? `Choose ${pdfFiles.length} file(s)` : 'Choose PDF files'}
                </span>
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
            </div>

            {/* File Preview */}
            {pdfFiles.length > 0 && (
              <div className="mt-4">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">Selected {pdfFiles.length} file(s):</span>
                </div>
                <div className="space-y-2">
                  {pdfFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>&#128196;</span>
                        <span className="text-sm font-medium text-[#0B1120]">{file.name}</span>
                        <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePdfFile(index)}
                        className="text-red-500 hover:text-red-700 text-lg font-bold px-2"
                        title="Remove file"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-[#00A0E3] h-full rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedHomeworkId || pdfFiles.length === 0}
            className="w-full bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Uploading {pdfFiles.length} file(s)...
              </>
            ) : (
              <>
                <span>&#128228;</span>
                Upload {pdfFiles.length} Homework File(s)
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadHomework;
