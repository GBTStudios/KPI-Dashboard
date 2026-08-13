// ============================================================
// FileUpload.tsx
// ------------------------------------------------------------
// Handles the dashed-border upload area: drag & drop, click-to-
// browse, file type/size validation, showing the selected file,
// and now the actual upload itself.
//
// CHANGED: accepted types and max size now match the backend exactly
// (.xlsx and .csv, 10MB) instead of the earlier .xlsx/.xls/.csv at
// 25MB - .xls was dropped since the backend can't parse it without
// reintroducing xlrd, which the original spec explicitly ruled out.
// ============================================================

import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { UploadedFileInfo } from '../../types/importData';
import { uploadImport, type ImportResult, type ImportRowErrorInfo } from '../../services/importService';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB - matches the backend's limit exactly

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return `.${parts[parts.length - 1].toLowerCase()}`;
}

interface FileUploadProps {
  onImportStart?: () => void;
  onImportComplete?: (result: ImportResult) => void;
  onImportError?: () => void;
}

export default function FileUpload({ onImportStart, onImportComplete, onImportError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<UploadedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);

  function validateAndSetFile(file: File) {
    const extension = getFileExtension(file.name);

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError('Unsupported file type. Please upload a .xlsx or .csv file.');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File is too large. Maximum size is 10MB.');
      setSelectedFile(null);
      return;
    }

    setError(null);
    setUploadResult(null);
    setSelectedFile({
      file,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    });
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
    e.target.value = '';
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setError(null);
    setUploadResult(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    onImportStart?.();
    try {
      const result = await uploadImport(selectedFile.file);
      setUploadResult(result);
      onImportComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.');
      onImportError?.();
    } finally {
      setIsUploading(false);
    }
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
            <div className="upload-subtitle">Supports .xlsx and .csv formats (Max 10MB)</div>

            <button
              type="button"
              className="upload-select-btn"
              onClick={() => inputRef.current?.click()}
            >
              <span className="upload-select-plus">+</span> Select File
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
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
              disabled={isUploading}
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

      {selectedFile && !uploadResult && (
        <button
          type="button"
          className="upload-select-btn upload-submit-btn"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 size={14} className="upload-spinner" /> Uploading...
            </>
          ) : (
            'Upload and process'
          )}
        </button>
      )}

      {uploadResult && (
        <ImportResultPanel result={uploadResult} />
      )}
    </div>
  );
}

/** Shows what happened after a completed upload: rows imported vs.
 * failed, and the specific row-level errors if anything failed - the
 * backend still reports a full result even on PARTIAL_SUCCESS/FAILED,
 * not just a pass/fail flag, so this surfaces it instead of throwing
 * it away. Uses new class names (upload-result*) - not yet present in
 * ImportData.css, since I don't have that stylesheet; ask me for it
 * and I'll add matching rules instead of leaving this unstyled. */
function ImportResultPanel({ result }: { result: ImportResult }) {
  const { record, rowErrors } = result;
  const tone =
    record.status === 'completed' ? 'success' : record.status === 'partial' ? 'partial' : 'failed';

  return (
    <div className={`upload-result upload-result-${tone}`}>
      <div className="upload-result-header">
        {tone === 'success' ? (
          <CheckCircle2 size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
        <span>
          {record.status === 'completed' && `Imported all ${record.rows} row(s) successfully.`}
          {record.status === 'partial' &&
            `Imported ${record.rows - rowErrors.length} of ${record.rows} row(s) - ${rowErrors.length} failed.`}
          {record.status === 'failed' && `Import failed - 0 of ${record.rows} row(s) were imported.`}
        </span>
      </div>

      {rowErrors.length > 0 && (
        <ul className="upload-result-errors">
          {rowErrors.map((e: ImportRowErrorInfo, i: number) => (
            <li key={i}>
              Row {e.rowNumber}
              {e.column ? ` (${e.column})` : ''}: {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}