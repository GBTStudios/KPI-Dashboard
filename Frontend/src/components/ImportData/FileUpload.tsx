// ============================================================
// FileUpload.tsx
// ------------------------------------------------------------
// Handles the dashed-border upload area: drag & drop, click-to-
// browse, file type/size validation, and showing the selected
// file (or an error) using React state.
// ============================================================

import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle } from 'lucide-react';
import type { UploadedFileInfo } from '../../types/importData';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB, expressed in bytes

// Small, self-contained helper functions are easier to test and
// read than inlining this logic inside the component itself.
function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return `.${parts[parts.length - 1].toLowerCase()}`;
}

export default function FileUpload() {
  // useRef<HTMLInputElement>(null) — "this will eventually point to
  // an <input> element, but starts out pointing at nothing (null)."
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<UploadedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Shared validation logic used by BOTH drag-drop and click-to-browse,
  // so the two input methods can never enforce different rules.
  function validateAndSetFile(file: File) {
    const extension = getFileExtension(file.name);

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError('Unsupported file type. Please upload a .xlsx, .xls, or .csv file.');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File is too large. Maximum size is 25MB.');
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile({
      file,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    });
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);

    // Reset the input's value. Without this, selecting the SAME file
    // twice in a row wouldn't fire onChange the second time, since
    // the input's value technically hasn't changed.
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); // stops the browser from opening the file itself
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); // required, or the onDrop event won't fire at all
    setIsDragActive(true);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setError(null);
  }

  return (
    <div className="upload-section">
      <div
        className={`upload-area ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <div className="upload-icon-circle">
              <Upload size={30} color="#5575f2" />
            </div>
            <div className="upload-title">Drag and drop your spreadsheet</div>
            <div className="upload-subtitle">
              Supports .xlsx, .xls, and .csv formats (Max 25MB)
            </div>

            <button
              type="button"
              className="upload-select-btn"
              onClick={() => inputRef.current?.click()}
            >
              <span className="upload-select-plus">+</span> Select File
            </button>

            {/* This input is visually hidden via CSS (see .upload-hidden-input) —
                we never want the browser's default file input UI showing,
                only our own styled button. */}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="upload-hidden-input"
            />
          </>
        ) : (
          <div className="upload-selected-file">
            <FileSpreadsheet size={26} color="#1c5e59" />
            <div className="upload-selected-info">
              <div className="upload-selected-label">Selected file</div>
              <div className="upload-selected-name">{selectedFile.name}</div>
              <div className="upload-selected-size">{selectedFile.sizeLabel}</div>
            </div>
            <button
              type="button"
              className="upload-remove-btn"
              onClick={handleRemoveFile}
              aria-label="Remove selected file"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}