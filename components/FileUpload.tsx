import React from 'react';
import { Upload, Camera } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onCameraClick: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onCameraClick }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Option */}
        <label className="flex flex-col items-center justify-center h-48 md:h-64 border-4 border-dashed border-blue-200 dark:border-blue-800 rounded-3xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer group">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-200">Upload File</span>
          <span className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 text-center px-4">Photos or PDFs</span>
        </label>

        {/* Camera Option - Triggers in-app camera */}
        <button 
          onClick={onCameraClick}
          className="flex flex-col items-center justify-center h-48 md:h-64 border-4 border-dashed border-emerald-200 dark:border-emerald-800 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer group focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
        >
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-200">Take Photo</span>
          <span className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 text-center px-4">Use your camera</span>
        </button>
      </div>
    </div>
  );
};