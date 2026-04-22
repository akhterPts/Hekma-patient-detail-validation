"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      getPatientById
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
