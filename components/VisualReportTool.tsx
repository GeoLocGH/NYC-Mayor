import React, { useState, useMemo, useEffect } from 'react';
import { editImageWithPrompt } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { UploadIcon } from './icons/UploadIcon';
import { SendIcon } from './icons/SendIcon';
import { AnnouncementBoard } from './AnnouncementBoard';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { ThumbsDownIcon } from './icons/ThumbsDownIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { GoogleMap } from './GoogleMap';
import { getVisualReportErrorMessage } from '../utils/errorUtils';

const UploadPlaceholder: React.FC = () => (
  <div className="text-center text-slate-400 p-8">
    <UploadIcon className="w-16 h-16 mx-auto mb-4" />
    <h3 className="text-lg font-semibold">Upload Your Visual Report</h3>
    <p className="text-sm">Click or drag & drop a photo of a community issue</p>
  </div>
);

type ReportStatus = 'Received' | 'Under Review' | 'Actioned';

interface SubmittedReport {
  id: number;
  imagePreviewUrl: string;
  prompt: string;
  status: ReportStatus;
  timestamp: Date;
  feedback?: 'satisfied' | 'unsatisfied';
  location?: { lat: number, lng: number };
}

const statusConfig: { [key in ReportStatus]: { color: string; bg: string } } = {
  Received: { color: 'text-slate-300', bg: 'bg-slate-700' },
  'Under Review': { color: 'text-yellow-300', bg: 'bg-yellow-900/50' },
  Actioned: { color: 'text-green-300', bg: 'bg-green-900/50' },
};

const ConfirmationModal: React.FC<{ report: SubmittedReport; onClose: () => void; }> = ({ report, onClose }) => (
  <div
    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
    aria-modal="true"
    role="dialog"
  >
    <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700 transform transition-all animate-slide-up">
      <div className="p-6">
        <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400" />
            <h3 className="text-xl font-semibold text-white mt-4">Report Submitted Successfully!</h3>
            <p className="text-sm text-slate-400 mt-1">Your report is now being processed. You can track its status under "My Submitted Reports".</p>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold text-slate-300">Submission Summary:</p>
          <img src={report.imagePreviewUrl} alt="Submitted report" className="w-full h-auto max-h-48 object-contain rounded-md bg-slate-900/50" />
          <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700">
            <p className="text-sm text-slate-300 italic">"{report.prompt}"</p>
          </div>
           {report.location && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <LocationMarkerIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>Location successfully pinned to the report.</span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-slate-800 border-t border-slate-700 px-6 py-4 rounded-b-lg text-right">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded-md hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500"
        >
          Done
        </button>
      </div>
    </div>
  </div>
);


export function VisualReportTool() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReports, setSubmittedReports] = useState<SubmittedReport[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'timestamp' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<SubmittedReport | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);


  const originalImagePreview = useMemo(() => {
    if (originalFile) {
      return URL.createObjectURL(originalFile);
    }
    return null;
  }, [originalFile]);

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks
    return () => {
      // Data URLs used in submittedReports don't need to be revoked.
      if(originalImagePreview) {
        URL.revokeObjectURL(originalImagePreview);
      }
    };
  }, [originalImagePreview]);

  const handleFileSelect = (file: File | null | undefined) => {
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file);
      setError(null);
    } else if (file) {
      setError('Invalid file type. Please upload a PNG, JPG, or WebP image.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleFeedback = (reportId: number, feedback: 'satisfied' | 'unsatisfied') => {
    setSubmittedReports(prev => prev.map(report =>
      report.id === reportId ? { ...report, feedback } : report
    ));
  };
  
  const handleSort = (key: 'timestamp' | 'status') => {
    if (key === sortKey) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder(key === 'timestamp' ? 'desc' : 'asc');
    }
  };
  
  const statusOrder: ReportStatus[] = useMemo(() => ['Received', 'Under Review', 'Actioned'], []);

  const sortedReports = useMemo(() => {
    return [...submittedReports].sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'timestamp') {
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
      } else { // sortKey === 'status'
        comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [submittedReports, sortKey, sortOrder, statusOrder]);


  const ReportStatusCard: React.FC<{ report: SubmittedReport; isExpanded: boolean; onToggle: () => void; }> = ({ report, isExpanded, onToggle }) => (
    <div 
        onClick={onToggle}
        className="bg-slate-800 rounded-lg p-4 shadow-md border border-slate-700 flex gap-4 transition-all duration-300 hover:bg-slate-700/50 cursor-pointer"
    >
      <img src={report.imagePreviewUrl} alt="Report thumbnail" className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start mb-2">
          <p className="text-sm text-slate-300 flex-1 pr-2 truncate">"{report.prompt}"</p>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${statusConfig[report.status].color} ${statusConfig[report.status].bg}`}>
            {report.status}
          </span>
        </div>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="mt-3 pt-3 border-t border-slate-700 text-xs space-y-2">
                <div>
                    <p className="font-semibold text-slate-400">Full Report:</p>
                    <p className="text-slate-300 whitespace-pre-wrap text-sm">{report.prompt}</p>
                </div>
                <div>
                    <p className="font-semibold text-slate-400">Submitted:</p>
                    <p className="text-slate-300 text-sm">{report.timestamp.toLocaleString()}</p>
                </div>
                {report.location && (
                  <div>
                    <p className="font-semibold text-slate-400">Location:</p>
                    <p className="text-slate-300 text-sm flex items-center gap-1.5">
                      <LocationMarkerIcon className="w-3.5 h-3.5 text-orange-400" />
                      Pinned on Map
                    </p>
                  </div>
                )}
            </div>
        </div>
        
        {report.status === 'Actioned' && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            {!report.feedback ? (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Was this issue resolved to your satisfaction?</p>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleFeedback(report.id, 'satisfied'); }} className="flex items-center gap-1.5 text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-md hover:bg-green-500/20 transition">
                    <ThumbsUpIcon className="w-3.5 h-3.5" /> Yes
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleFeedback(report.id, 'unsatisfied'); }} className="flex items-center gap-1.5 text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition">
                    <ThumbsDownIcon className="w-3.5 h-3.5" /> No
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-green-400 font-semibold italic">Thank you for your feedback!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const handleSubmit = async () => {
    if (!originalFile || !prompt) return;

    setIsLoading(true);
    setError(null);

    try {
      const { base64, mimeType } = await fileToBase64(originalFile);
      const editedImageBase64 = await editImageWithPrompt(base64, mimeType, prompt);
      
      const newReportId = Date.now();
      const newReport: SubmittedReport = {
        id: newReportId,
        imagePreviewUrl: `data:image/png;base64,${editedImageBase64}`,
        prompt,
        status: 'Received',
        timestamp: new Date(),
        location: selectedLocation,
      };
      setSubmittedReports(prev => [newReport, ...prev]);
      setLastSubmittedReport(newReport);
      setShowConfirmationModal(true);

      // Clear the form for the next submission
      setOriginalFile(null);
      setPrompt('');
      setSelectedLocation(null);

      // Simulate status changes for demonstration
      setTimeout(() => {
        setSubmittedReports(prev => prev.map(r => r.id === newReportId ? { ...r, status: 'Under Review' } : r));
      }, 8000); // 8 seconds
      
      setTimeout(() => {
        setSubmittedReports(prev => prev.map(r => r.id === newReportId ? { ...r, status: 'Actioned' } : r));
      }, 20000); // 20 seconds


    } catch (err) {
      setError(getVisualReportErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showConfirmationModal && lastSubmittedReport && (
        <ConfirmationModal 
          report={lastSubmittedReport} 
          onClose={() => setShowConfirmationModal(false)}
        />
      )}
       {isMapOpen && (
        <GoogleMap
          initialLocation={selectedLocation}
          onLocationSelect={(loc) => setSelectedLocation(loc)}
          onClose={() => setIsMapOpen(false)}
        />
      )}
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col overflow-y-auto">
        <div className="flex-grow grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Original Image Panel */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Submit a New Report</h2>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative aspect-square w-full bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed transition-colors duration-300 ${
                  isDragOver
                    ? 'border-orange-500 bg-slate-700/50'
                    : 'border-slate-600 hover:border-orange-500'
                }`}
              >
                {originalImagePreview ? (
                  <img src={originalImagePreview} alt="Original" className="object-contain w-full h-full rounded-lg" />
                ) : (
                  <UploadPlaceholder />
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload Image"
                />
              </div>
            </div>

            {/* Submitted Reports Panel */}
            {submittedReports.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">My Submitted Reports</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Sort by:</span>
                    <button
                      onClick={() => handleSort('timestamp')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          sortKey === 'timestamp' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Date
                      {sortKey === 'timestamp' && (
                        sortOrder === 'asc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        )
                      )}
                    </button>
                    <button
                      onClick={() => handleSort('status')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          sortKey === 'status' ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Status
                      {sortKey === 'status' && (
                         sortOrder === 'asc' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        )
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {sortedReports.map(report => (
                    <ReportStatusCard 
                        key={report.id} 
                        report={report} 
                        isExpanded={expandedReportId === report.id}
                        onToggle={() => setExpandedReportId(prev => prev === report.id ? null : report.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Community Announcement Board Panel */}
          <div className="flex flex-col">
            <AnnouncementBoard />
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-slate-900/80 backdrop-blur-sm p-4 border-t border-slate-700 z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the issue and any annotations (e.g., 'Circle the pothole')"
              className="flex-grow w-full bg-slate-700 text-white placeholder-slate-400 rounded-md px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
             <button
              onClick={() => setIsMapOpen(true)}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-md transition-colors duration-300 flex-shrink-0 ${
                selectedLocation
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-600 hover:bg-slate-700 text-white'
              }`}
            >
              <LocationMarkerIcon className="w-5 h-5" />
              <span>{selectedLocation ? 'Location Pinned' : 'Pin Location'}</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!originalFile || !prompt || isLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <SendIcon className="w-5 h-5" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-center md:text-left">{error}</p>}
        </div>
      </footer>
    </>
  );
}
