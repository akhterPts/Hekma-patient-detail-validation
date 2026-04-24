"use client";

import React from 'react';
import Link from 'next/link';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { usePatients } from '../../context/PatientContext';

import styles from './patients.module.css';

export default function PatientList() {
  const { patients, loading, error } = usePatients();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadAll = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch('/api/patients/export-all');
      if (!response.ok) throw new Error('Failed to export all data');
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hekma_full_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to download full export.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div>Synchronizing Vault Data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={styles.patientList}>
      <div className={styles.header}>
        <div>
          <h1>Patient Records</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: '0.875rem' }}>Full Validation Overview</p>
        </div>
        <button 
          onClick={handleDownloadAll} 
          className={styles.downloadBtn}
          disabled={isDownloading || patients.length === 0}
        >
          {isDownloading ? 'Preparing Export...' : 'Download Full JSON (All)'}
        </button>
      </div>

      <div className={styles.patientGrid}>
        {patients.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No records found in the Hekma Vault.</p>
          </div>
        ) : (
          patients.map(p => (
            <div key={p.id} className={styles.patientCard}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className={styles.patientId}>ID: {p.id}</span>
                  {p.is_commented && (
                    <span style={{
                      fontSize: '0.7rem',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      width: 'fit-content'
                    }}>
                      COMMENTED
                    </span>
                  )}
                </div>
                <StatusIndicator
                  status={p.has_review_requests ? 'needs_review' : 'resolved'}
                  showText={false}
                />
              </div>

              <p className={styles.patientSummary}>{p.summary}</p>

              <div className={styles.cardFooter}>
                <StatusIndicator
                  status={p.has_review_requests ? 'needs_review' : 'resolved'}
                  showText={true}
                />
                <Link href={`/patients/${p.id}`} className={styles.viewBtn}>
                  Review Details →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
