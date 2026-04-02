// useDirectUpload.js
// Custom hook that handles direct-to-DigitalOcean upload via presigned URLs
//
// FLOW:
// 1. Call backend → get presigned PUT URL + final public URL
// 2. PUT file directly to DO Spaces from browser (no Django memory usage!)
// 3. Return the public URL to use in the exam correction request

import { useState, useCallback, useRef } from "react";
import axiosInstance from "../api/axiosInstance";

/**
 * Hook for uploading files directly to DigitalOcean Spaces.
 * Returns upload functions with per-file and overall progress tracking.
 */
const useDirectUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploading, setUploading] = useState(false);
  const abortControllerRef = useRef(null);

  /**
   * Upload a single file directly to DO Spaces.
   * @param {File} file - The file to upload
   * @param {string} uploadType - "question_paper" or "answer_sheet"
   * @param {object} metadata - { teacher_name, section_name, exam_name }
   * @param {function} onFileProgress - callback(percent) for this file
   * @returns {string} The public URL of the uploaded file
   */
  const uploadSingleFile = useCallback(
    async (file, uploadType, metadata, onFileProgress) => {
      // Step 1: Get presigned URL from backend
      const presignedResponse = await axiosInstance.post(
        "/api/generate-presigned-url/",
        {
          file_name: file.name,
          file_type: file.type || "application/pdf",
          upload_type: uploadType,
          teacher_name: metadata.teacher_name,
          section_name: metadata.section_name,
          exam_name: metadata.exam_name,
        },
      );

      const { presigned_url, file_url } = presignedResponse.data;

      // Step 2: PUT file directly to DO Spaces (bypasses Django entirely!)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortControllerRef.current = { abort: () => xhr.abort() };

        xhr.open("PUT", presigned_url, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
        // DO Spaces requires this header for public access
        xhr.setRequestHeader("x-amz-acl", "public-read");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onFileProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onFileProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(
              new Error(
                `Upload failed with status ${xhr.status}: ${xhr.statusText}`,
              ),
            );
          }
        };

        xhr.onerror = () =>
          reject(new Error("Network error during file upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.send(file);
      });

      return file_url;
    },
    [],
  );

  /**
   * Upload multiple files with batch presigned URL generation.
   * More efficient for many answer sheets - gets all URLs in one request.
   * @param {File[]} files - Array of files
   * @param {string} uploadType - "question_paper" or "answer_sheet"
   * @param {object} metadata - { teacher_name, section_name, exam_name }
   * @returns {string[]} Array of public URLs
   */
  const uploadMultipleFiles = useCallback(
    async (files, uploadType, metadata) => {
      if (!files || files.length === 0) return [];

      setUploading(true);
      setTotalFiles(files.length);
      setCurrentFileIndex(0);
      setUploadProgress(0);

      const urls = [];

      try {
        // Step 1: Get all presigned URLs in one batch request
        const batchResponse = await axiosInstance.post(
          "/api/generate-presigned-urls-batch/",
          {
            files: files.map((f) => ({
              file_name: f.name,
              file_type: f.type || "application/pdf",
            })),
            upload_type: uploadType,
            teacher_name: metadata.teacher_name,
            section_name: metadata.section_name,
            exam_name: metadata.exam_name,
          },
        );

        const presignedUrls = batchResponse.data.urls;

        // Step 2: Upload files in parallel (max 3 concurrent uploads)
        const CONCURRENT_LIMIT = 3;
        const fileProgress = new Array(files.length).fill(0);

        const updateOverallProgress = () => {
          const totalProgress = fileProgress.reduce((sum, p) => sum + p, 0);
          setUploadProgress(Math.round(totalProgress / files.length));
        };

        // Process in chunks of CONCURRENT_LIMIT
        for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
          const chunk = files.slice(i, i + CONCURRENT_LIMIT);
          const chunkUrls = presignedUrls.slice(i, i + CONCURRENT_LIMIT);

          const uploadPromises = chunk.map((file, chunkIndex) => {
            const globalIndex = i + chunkIndex;
            const { presigned_url, file_url } = chunkUrls[chunkIndex];

            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();

              xhr.open("PUT", presigned_url, true);
              xhr.setRequestHeader(
                "Content-Type",
                file.type || "application/pdf",
              );
              xhr.setRequestHeader("x-amz-acl", "public-read");

              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  fileProgress[globalIndex] = Math.round(
                    (event.loaded / event.total) * 100,
                  );
                  updateOverallProgress();
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  setCurrentFileIndex((prev) => prev + 1);
                  resolve(file_url);
                } else {
                  reject(
                    new Error(`Upload failed for ${file.name}: ${xhr.status}`),
                  );
                }
              };

              xhr.onerror = () =>
                reject(new Error(`Network error uploading ${file.name}`));
              xhr.send(file);
            });
          });

          const chunkResults = await Promise.all(uploadPromises);
          urls.push(...chunkResults);
        }

        setUploadProgress(100);
        return urls;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  /**
   * Cancel any ongoing upload
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    uploadSingleFile,
    uploadMultipleFiles,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    uploading,
    cancelUpload,
  };
};

export default useDirectUpload;
