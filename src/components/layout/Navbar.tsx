"use client";

import React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { usePatients } from '../../context/PatientContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { id } = useParams();
  const { 
    getPatientById, 
    handleGlobalSave, 
    isSavingAll, 
    expandedFields, 
    pendingUpdates 
  } = usePatients();

  const patient = id ? getPatientById(id as string) : null;
  const isCommented = patient?.comments?.Trials?.length > 0;
  const showGlobalSave = !isCommented && expandedFields.size > 0 && !!id;

  const onGlobalSave = () => {
    if (id) {
      handleGlobalSave(id as string, patient);
    }
  };

  return (
    <header className={styles.topNav}>
      <div className={styles.logoContainer}>
        <a href="/patients">
          <Image 
            src="/Images/logo.svg" 
            alt="Hekma Logo" 
            width={160} 
            height={50} 
            priority
          />
        </a>
      </div>
      
      <div className={styles.navActions}>
        {showGlobalSave && (
          <button 
            onClick={onGlobalSave} 
            className={styles.primaryBtn}
            disabled={isSavingAll || Object.keys(pendingUpdates).length === 0}
          >
            {isSavingAll ? 'Saving...' : 'Save All Validation Notes'}
          </button>
        )}
      </div>
    </header>
  );
}
