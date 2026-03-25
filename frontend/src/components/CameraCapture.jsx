import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Check, RefreshCw } from 'lucide-react';

const CameraCapture = ({ onImageCapture, videoConstraints }) => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 320, height: 240 });
  const [isMobile, setIsMobile] = useState(false);

  // Maximum quality constraints for text extraction
  const captureConstraints = {
    width: { ideal: 4096, min: 1920 },
    height: { ideal: 3072, min: 1080 },
    aspectRatio: { ideal: 4/3 },
    // Advanced constraints for better quality
    frameRate: { ideal: 30 },
    facingMode: { ideal: "environment" },
    // Override with user constraints
    ...videoConstraints,
    // Force high resolution if user specified lower
    ...(videoConstraints?.width?.ideal < 1920 ? { width: { ideal: 4096, min: 1920 } } : {}),
    ...(videoConstraints?.height?.ideal < 1080 ? { height: { ideal: 3072, min: 1080 } } : {})
  };

  // Calculate responsive display dimensions
  useEffect(() => {
    const calculateDimensions = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const mobile = windowWidth <= 768;
      setIsMobile(mobile);

      const padding = 40;
      const buttonAreaHeight = 100;

      const maxWidth = windowWidth - padding;
      const maxHeight = windowHeight - buttonAreaHeight;

      let width, height;

      if (mobile) {
        width = maxWidth;
        height = Math.min((width * 4) / 3, maxHeight);
        if (height === maxHeight) {
          width = (height * 3) / 4;
        }
      } else {
        if (windowWidth > windowHeight) {
          height = Math.min(maxHeight, 480);
          width = (height * 16) / 9;
          if (width > maxWidth) {
            width = maxWidth;
            height = (width * 9) / 16;
          }
        } else {
          width = Math.min(maxWidth, 480);
          height = (width * 4) / 3;
          if (height > maxHeight) {
            height = maxHeight;
            width = (height * 3) / 4;
          }
        }
      }

      setDisplayDimensions({ width: Math.floor(width), height: Math.floor(height) });
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    window.addEventListener('orientationchange', calculateDimensions);

    return () => {
      window.removeEventListener('resize', calculateDimensions);
      window.removeEventListener('orientationchange', calculateDimensions);
    };
  }, []);

  const capture = () => {
    // Capture at maximum possible resolution
    const imageSrc = webcamRef.current.getScreenshot({
      width: 4096,
      height: 3072
    });

    if (imageSrc) {
      // Optional: Enhance image quality for text extraction
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas to actual image size for no quality loss
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply sharpening and contrast enhancement for better text recognition
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(img, 0, 0);

        // Get enhanced image
        const enhancedImage = canvas.toDataURL('image/jpeg', 1.0);
        setImage(enhancedImage);
      };
      img.src = imageSrc;
    }
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const confirmImage = () => {
    if (image && onImageCapture) {
      const blob = dataURItoBlob(image);
      onImageCapture(blob);
      setImage(null);
    }
  };

  const retakeImage = () => {
    setImage(null);
  };

  // Image quality settings
  const imageSettings = {
    screenshotFormat: "image/jpeg",
    screenshotQuality: 1.0,
    forceScreenshotSourceSize: true
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full h-full box-border overflow-hidden ${isMobile ? 'p-2.5' : 'p-5'}`}>
      {!image ? (
        <>
          <div
            className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-black"
            style={{ width: `${displayDimensions.width}px`, height: `${displayDimensions.height}px` }}
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              {...imageSettings}
              width={displayDimensions.width}
              height={displayDimensions.height}
              videoConstraints={captureConstraints}
              className="w-full h-full object-cover"
              minScreenshotWidth={1920}
              minScreenshotHeight={1080}
            />
          </div>
          <div
            className="mt-5 flex gap-2.5 justify-center flex-wrap w-full"
            style={{ maxWidth: `${displayDimensions.width}px` }}
          >
            <button
              type="button"
              onClick={capture}
              className={`border-none rounded-md font-medium cursor-pointer inline-flex items-center gap-2 justify-center min-w-[140px] bg-[#00A0E3] hover:bg-[#0080B8] text-white ${
                isMobile ? 'py-3 px-6 text-base' : 'py-2.5 px-5 text-sm'
              }`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <Camera className="w-5 h-5" />
              Capture Photo
            </button>
          </div>
          <div className="mt-2.5 text-center text-xs text-gray-500">
            Tip: Hold steady and ensure good lighting for best text capture
          </div>
        </>
      ) : (
        <>
          <div
            className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100"
            style={{ width: `${displayDimensions.width}px`, height: `${displayDimensions.height}px` }}
          >
            <img
              src={image}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          </div>
          <div
            className="mt-5 flex gap-2.5 justify-center flex-wrap w-full"
            style={{ maxWidth: `${displayDimensions.width}px` }}
          >
            <button
              type="button"
              onClick={confirmImage}
              className={`border-none rounded-md font-medium cursor-pointer inline-flex items-center gap-2 justify-center min-w-[140px] bg-emerald-500 hover:bg-emerald-600 text-white ${
                isMobile ? 'py-3 px-6 text-base' : 'py-2.5 px-5 text-sm'
              }`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <Check className="w-5 h-5" />
              Use This Photo
            </button>
            <button
              type="button"
              onClick={retakeImage}
              className={`border-none rounded-md font-medium cursor-pointer inline-flex items-center gap-2 justify-center min-w-[140px] bg-red-500 hover:bg-red-600 text-white ${
                isMobile ? 'py-3 px-6 text-base' : 'py-2.5 px-5 text-sm'
              }`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <RefreshCw className="w-5 h-5" />
              Retake
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
