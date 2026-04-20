"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './upload.module.css';

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const response = await fetch('/api/patients/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      router.push(`/patients/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <div className={`card ${styles.uploadCard}`}>
        <h1 style={{ marginBottom: 'var(--space-md)' }}>Upload Patient Dataset</h1>
        <p style={{ color: 'var(--text-soft)', marginBottom: 'var(--space-xl)' }}>
          Select a patient JSON file to initialize the validation workflow.
        </p>

        <div className={styles.dropZone}>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            id="file-upload"
            hidden
          />
          <label htmlFor="file-upload" className={styles.dropZoneLabel}>
            {isUploading ? 'Processing...' : 'Click to select JSON file'}
          </label>
        </div>

        {error && <p style={{ color: 'var(--status-needs-review)', marginTop: 'var(--space-md)' }}>{error}</p>}
      </div>
    </div>
  );
}
