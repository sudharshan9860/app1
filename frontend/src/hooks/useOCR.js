import { useState } from 'react';
import { createWorker } from 'tesseract.js';

/**
 * Custom hook for OCR functionality
 * @returns {Object} OCR functions and state
 */
export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Process an image file with OCR to extract text
   * @param {File} imageFile - The image file to process
   * @param {String} language - The language to use for OCR (default: 'eng')
   * @returns {Promise<String>} - The extracted text
   */
  const processImage = async (imageFile, language = 'eng') => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const worker = await createWorker(language, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt(m.progress * 100));
          }
        },
      });

      // Convert file to base64 for Tesseract
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const { data: { text } } = await worker.recognize(reader.result);
            await worker.terminate();
            setIsProcessing(false);
            setProgress(100);
            resolve(text.trim());
          } catch (error) {
            setError(error.message || 'OCR processing failed');
            setIsProcessing(false);
            reject(error);
          }
        };
        
        reader.onerror = () => {
          setError('Failed to read image file');
          setIsProcessing(false);
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsDataURL(imageFile);
      });
    } catch (error) {
      setError(error.message || 'OCR processing failed');
      setIsProcessing(false);
      throw error;
    }
  };

  /**
   * Process multiple image files with OCR
   * @param {Array<File>} imageFiles - Array of image files
   * @param {String} language - The language to use for OCR
   * @returns {Promise<Array<String>>} - Array of extracted texts
   */
  const processMultipleImages = async (imageFiles, language = 'eng') => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const results = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const text = await processImage(imageFiles[i], language);
        results.push(text);
      }
      
      return results;
    } catch (error) {
      setError(error.message || 'Failed to process multiple images');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processImage,
    processMultipleImages,
    isProcessing,
    progress,
    error
  };
};