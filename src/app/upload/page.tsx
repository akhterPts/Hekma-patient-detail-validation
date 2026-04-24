"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './upload.module.css';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/json") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid JSON file.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const response = await fetch('/api/patients/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Upload failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/patients');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to process JSON file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <div className={`${styles.uploadCard} card`}>
        <div className={styles.header}>
          <h1>Bulk Protocol Upload</h1>
          <p>Import clinical trial protocols to the Hekma Vault</p>
        </div>

        <div 
          className={`${styles.dropZone} ${file ? styles.hasFile : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json"
            style={{ display: 'none' }}
          />
          <div className={styles.dropZoneContent}>
            <div className={styles.icon}>📄</div>
            {file ? (
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024).toFixed(2)} KB</span>
              </div>
            ) : (
              <div className={styles.prompt}>
                <strong>Click to select</strong> or drag and drop
                <span>Accepted format: JSON only</span>
              </div>
            )}
          </div>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}
        {success && <div className={styles.successMsg}>Protocol uploaded successfully! Redirecting...</div>}

        <div className={styles.actions}>
          <button 
            className={styles.cancelBtn} 
            onClick={() => router.push('/patients')}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            className={styles.primaryBtn} 
            onClick={handleUpload}
            disabled={!file || isUploading || success}
          >
            {isUploading ? 'Uploading...' : 'Process Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
