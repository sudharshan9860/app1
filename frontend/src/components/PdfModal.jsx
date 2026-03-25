import React, { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, X, AlertCircle, Loader2 } from "lucide-react";

const PdfModal = ({ isOpen, onClose, pdfUrl, title = "Answer Sheet" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, pdfUrl]);

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5 text-[#0B1120] font-semibold">
            <FileText size={20} className="text-[#00A0E3]" />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center
                text-gray-500 hover:text-[#00A0E3] transition-colors duration-200"
              onClick={handleDownload}
              title="Download PDF"
            >
              <Download size={18} />
            </button>
            <button
              className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center
                text-gray-500 hover:text-[#00A0E3] transition-colors duration-200"
              onClick={handleOpenInNewTab}
              title="Open in new tab"
            >
              <ExternalLink size={18} />
            </button>
            <button
              className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-red-50 flex items-center justify-center
                text-gray-500 hover:text-red-500 transition-colors duration-200"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 relative bg-gray-50">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-white/80">
              <Loader2 size={32} className="text-[#00A0E3] animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Loading document...</p>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-white">
              <AlertCircle size={48} className="text-gray-300" />
              <h3 className="text-lg font-semibold text-[#0B1120]">Unable to load PDF</h3>
              <p className="text-sm text-gray-500">The document could not be displayed in the viewer.</p>
              <button
                className="px-5 py-2.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg
                  text-sm font-medium transition-colors duration-200"
                onClick={handleOpenInNewTab}
              >
                Open in New Tab
              </button>
            </div>
          )}

          <iframe
            src={pdfUrl}
            title="PDF Viewer"
            className={`w-full h-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
