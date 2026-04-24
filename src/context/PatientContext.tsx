"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ReviewStatus } from '@/types/patient';

interface Patient {
  id: string;
  summary: string;
  has_review_requests: boolean;
  is_commented?: boolean;
  data: any;
  comments: any;
}

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  refreshPatients: () => Promise<void>;
  updatePatientState: (id: string, updatedData: Partial<Patient>) => void;
  getPatientById: (id: string) => Patient | undefined;
  
  // Validation State
  pendingUpdates: Record<string, any>;
  expandedFields: Set<string>;
  isSavingAll: boolean;
  trackPendingUpdate: (fieldId: string, comment: string, status: ReviewStatus, payload: any) => void;
  handleToggleExpand: (fieldId: string, isExpanded: boolean) => void;
  handleGlobalSave: (patientId: string, currentPatient: any) => Promise<void>;
  clearValidationState: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validation State
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, any>>({});
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);

  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePatientState = useCallback((id: string, updatedData: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  }, []);

  const getPatientById = useCallback((id: string) => {
    return patients.find(p => p.id === id);
  }, [patients]);

  const trackPendingUpdate = useCallback((fieldId: string, comment: string, status: ReviewStatus, payload: any) => {
    setPendingUpdates(prev => ({
      ...prev,
      [fieldId]: { comment, status, payload }
    }));
  }, []);

  const handleToggleExpand = useCallback((fieldId: string, isExpanded: boolean) => {
    setExpandedFields(prev => {
      const next = new Set(prev);
      if (isExpanded) next.add(fieldId);
      else next.delete(fieldId);
      return next;
    });
  }, []);

  const clearValidationState = useCallback(() => {
    setPendingUpdates({});
    setExpandedFields(new Set());
    setIsSavingAll(false);
  }, []);

  const handleGlobalSave = useCallback(async (patientId: string, currentPatient: any) => {
    const updates = Object.values(pendingUpdates).filter(u => u.comment.trim() !== '');
    if (updates.length === 0) return;

    setIsSavingAll(true);
    try {
      let lastUpdatedPatient = currentPatient;
      for (const update of updates) {
        const response = await fetch(`/api/patients/${patientId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.payload),
        });
        if (response.ok) {
          lastUpdatedPatient = await response.json();
        }
      }
      // Full reload to ensure all states are reset as requested
      window.location.reload();
    } catch (err) {
      console.error('Failed to save all comments:', err);
      alert('Failed to save some comments. Please check your connection.');
    } finally {
      setIsSavingAll(false);
    }
  }, [pendingUpdates, updatePatientState, clearValidationState]);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  return (
    <PatientContext.Provider value={{ 
      patients, 
      loading, 
      error, 
      refreshPatients, 
      updatePatientState,
      getPatientById,
      pendingUpdates,
      expandedFields,
      isSavingAll,
      trackPendingUpdate,
      handleToggleExpand,
      handleGlobalSave,
      clearValidationState
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
