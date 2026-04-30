"use client";

import React from 'react';
import Link from 'next/link';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { usePatients } from '../../context/PatientContext';

import styles from './patients.module.css';

export default function PatientList() {
  const { patients, loading, error } = usePatients();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');

  const filteredPatients = patients.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = p.id.toLowerCase().includes(searchLower) ||
      (p.summary && p.summary.toLowerCase().includes(searchLower));

    let matchesFilter = true;
    if (filterStatus === 'commented') {
      matchesFilter = p.is_commented === true;
    } else if (filterStatus === 'needs_review') {
      matchesFilter = p.has_review_requests === true;
    } else if (filterStatus === 'clean') {
      matchesFilter = p.has_review_requests === false;
    } else if (filterStatus === 'not_commented') {
      matchesFilter = p.is_commented === false;
    }
 
    return matchesSearch && matchesFilter;
  });

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

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search by ID or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Statuses</option>
          <option value="commented">Commented</option>
          <option value="needs_review">Needs Review</option>
          <option value="clean">Clean</option>
          <option value="not_commented">Not yet commented</option>
        </select>
      </div>

      <div className={styles.patientGrid}>
        {filteredPatients.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {patients.length === 0 ? "No records found in the Hekma Vault." : "No patients match your search criteria."}
            </p>
          </div>
        ) : (
          filteredPatients.map(p => (
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
