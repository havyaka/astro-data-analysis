/**
 * FileUpload.jsx
 * --------------
 * Drag-and-drop / click-to-upload CSV file picker.
 * Validates file type and shows a live file preview card.
 */

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import styles from './FileUpload.module.css'

export default function FileUpload({ onFileSelect, isLoading }) {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const validateAndSet = useCallback((file) => {
    setError('')
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported.')
      return
    }
    if (file.size > 50 * 1024 * 1024) { // 50 MB guard
      setError('File is too large. Maximum size is 50 MB.')
      return
    }
    setSelectedFile(file)
    onFileSelect(file)
  }, [onFileSelect])

  /* ── Drag handlers ──────────────────────────────────── */
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = ()  => setDragging(false)
  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    validateAndSet(e.dataTransfer.files[0])
  }

  const onInputChange = (e) => validateAndSet(e.target.files[0])
  const clearFile = () => {
    setSelectedFile(null)
    setError('')
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className={styles.wrapper}>
      {/* Drop zone */}
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${selectedFile ? styles.hasFile : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="CSV file upload area"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id="csv-file-input"
          type="file"
          accept=".csv"
          className={styles.hiddenInput}
          onChange={onInputChange}
          disabled={isLoading}
        />

        {selectedFile ? (
          /* File preview card */
          <div className={styles.fileCard}>
            <div className={styles.fileIcon}>
              <FileText size={28} />
            </div>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>{formatSize(selectedFile.size)}</span>
            </div>
            <button
              className={styles.clearBtn}
              onClick={(e) => { e.stopPropagation(); clearFile() }}
              aria-label="Remove selected file"
              disabled={isLoading}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Idle state */
          <div className={styles.idleContent}>
            <div className={`${styles.uploadIcon} ${dragging ? styles.uploadIconDragging : ''}`}>
              <Upload size={32} />
            </div>
            <p className={styles.idleTitle}>
              {dragging ? 'Release to upload' : 'Drag & drop your CSV here'}
            </p>
            <p className={styles.idleSubtitle}>or click to browse files</p>
            <span className={styles.pill}>CSV only · Max 50 MB</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className={styles.errorMsg} role="alert">
          <AlertCircle size={15} />
          {error}
        </div>
      )}
    </div>
  )
}
