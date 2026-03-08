import { useCallback, useRef, useState } from 'react';
import { isValidSTLFile, isFileSizeValid } from '../utils/fileHelpers';

interface Props {
  onFileSelected: (file: File) => void;
  isBaseLoaded: boolean;
  isProcessing: boolean;
}

export function FileUploadSection({ onFileSelected, isBaseLoaded, isProcessing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);
      if (!isValidSTLFile(file)) {
        setValidationError('Please select an .stl file.');
        return;
      }
      if (!isFileSizeValid(file)) {
        setValidationError('File exceeds 50MB limit.');
        return;
      }
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Base Nameplate STL</h3>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".stl"
          className="hidden"
          onChange={handleChange}
          disabled={isProcessing}
        />
        {fileName ? (
          <p className="text-sm text-gray-600">
            {isBaseLoaded ? '✓' : '⏳'} {fileName}
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Drop .stl file here or click to browse
          </p>
        )}
      </div>
      {validationError && (
        <p className="text-xs text-red-600 mt-1">{validationError}</p>
      )}
    </section>
  );
}
