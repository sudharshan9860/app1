import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const UploadClasswork = () => {
  const [classworkList, setclassworkList] = useState([]);
  const [selectedclassworkId, setSelectedclassworkId] = useState(null); // <-- single select
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingclasswork, setFetchingclasswork] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchclassworkList();
  }, []);

  const fetchclassworkList = async () => {
    try {
      setFetchingclasswork(true);
      setError(null);
      const response = await axiosInstance.get('/classwork-list/');
      setclassworkList(response.data.homework_codes);
      console.log('classwork-list data', response.data.classwork_codes);
    } catch (error) {
      console.error('Error fetching classwork list:', error);
      setError('Failed to fetch classwork list. Please try again.');
    } finally {
      setFetchingclasswork(false);
    }
  };

  const handleclassworkSelect = (classworkId) => {
    setSelectedclassworkId(classworkId);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      event.target.value = null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedclassworkId) {
      setError('Please select one classwork');
      return;
    }

    if (!pdfFile) {
      setError('Please select a PDF file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      // keep API compatible: send array with a single id
      formData.append('homework_code', selectedclassworkId.trim());
      formData.append('pdf_response', pdfFile);

      const response = await axiosInstance.post('auto-classwork-submission/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percentCompleted);
        },
      });


      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setSelectedclassworkId(null);
        setPdfFile(null);
        setUploadProgress(0);
        const input = document.getElementById('pdf-upload');
        if (input) input.value = null;

        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error uploading classwork:', error);
      setError('Failed to upload classwork. Please try again.');
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
    <>coming soon...</>
  );
};

export default UploadClasswork;
