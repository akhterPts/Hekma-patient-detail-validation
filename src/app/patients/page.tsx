"use client";

import React from 'react';
import Link from 'next/link';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { usePatients } from '../../context/PatientContext';

import styles from './patients.module.css';

export default function PatientList() {
  const { patients, loading, error } = usePatients();

  if (loading) return <div>Synchronizing Vault Data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={styles.patientList}>
      <div className={styles.header}>
        <div>
          <h1>Patient Records</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: '0.875rem' }}>Full Validation Overview</p>
        </div>
        <Link href="/upload" className={styles.uploadBtn}>Upload New Patient</Link>
      </div>

      <div className={styles.patientGrid}>
        {patients.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No patients found. Please upload a dataset to begin.</p>
          </div>
        ) : (
          patients.map(p => (
            <div key={p.id} className={styles.patientCard}>
              <div className={styles.cardHeader}>
                <span className={styles.patientId}>ID: {p.id.slice(0, 8)}...</span>
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
