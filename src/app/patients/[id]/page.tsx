"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PatientData, PatientComment, ReviewStatus } from '@/types/patient';
import CommentBox from '@/components/ui/CommentBox';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { usePatients } from '../../../context/PatientContext';

import styles from './detail.module.css';

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { patients, updatePatientState, getPatientById } = usePatients();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = getPatientById(id as string);
    // Only use cached patient if it has the full data object
    if (p && p.data && p.comments) {
      setPatient(p);
      setLoading(false);
    } else {
      setLoading(true);
      fetch(`/api/patients/${id}`)
        .then(res => res.json())
        .then(data => {
          setPatient(data);
          updatePatientState(id as string, data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Fetch error:', err);
          setLoading(false);
        });
    }
  }, [id, getPatientById, updatePatientState]);

  const handleUpdateComment = async (update: any) => {
    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatient(updatedPatient);
        updatePatientState(id as string, updatedPatient);
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDownload = () => {
    if (!patient?.data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patient.data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `patient_${id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) return <div>Synchronizing Protocol Data...</div>;
  if (!patient || !patient.data) return <div>Neural link failed: Patient data not available.</div>;

  return (
    <div className={styles.patientDetail}>
      <header className={styles.detailHeader}>
        <div className={styles.headerInfo}>
          <h1>Patient ID: {patient.id?.slice(0, 12)}</h1>
          <StatusIndicator status={patient.has_review_requests ? 'needs_review' : 'resolved'} />
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => router.push('/patients')} className={styles.secondaryBtn}>Back to List</button>
          <button onClick={handleDownload} className={styles.primaryBtn}>Export Validation Report</button>
        </div>
      </header>

      <section className={`${styles.summaryCard} card`}>
        <h3>Clinical Case Summary</h3>
        <p>{patient.summary || patient.data?.Patient_Summary}</p>
      </section>

      {patient.data.Trials?.map((trial: any, tIdx: number) => {
        const trialComments = patient.comments?.Trials?.find((t: any) => t.trial_index === tIdx);

        return (
          <div key={tIdx} className={styles.trialBlock}>
            <div className={styles.trialHeader}>
              <h2>Clinical Trial: {trial.Trail_ID || trial.Trial_ID}</h2>
              <span className="badge" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                {trial.Predicted_Labels}
              </span>
            </div>

            <div className={styles.fieldsGrid}>
              <div className={`${styles.fieldSection} card`}>
                <h4>Relevance Analysis</h4>
                <div className={styles.originalVal}>{trial.Relevance_Reasoning}</div>
                <CommentBox
                  initialComment={trialComments?.trial_fields['Relevance_Reasoning'] || { comment: '', status: 'draft' }}
                  onSave={(comment, status) => handleUpdateComment({
                    trial_index: tIdx,
                    type: 'trial_fields',
                    fields: { Relevance_Reasoning: { comment, status } }
                  })}
                />
              </div>

              <div className={`${styles.fieldSection} card`}>
                <h4>Eligibility Rationale</h4>
                <div className={styles.originalVal}>{trial.Eligibility_Reasoning}</div>
                <CommentBox
                  initialComment={trialComments?.trial_fields['Eligibility_Reasoning'] || { comment: '', status: 'draft' }}
                  onSave={(comment, status) => handleUpdateComment({
                    trial_index: tIdx,
                    type: 'trial_fields',
                    fields: { Eligibility_Reasoning: { comment, status } }
                  })}
                />
              </div>
            </div>

            <div className={styles.criteriaList}>
              <h3>Inclusion Criteria Mapping</h3>
              {trial.Matching_Results.inclusion.map((item: any, iIdx: number) => {
                const itemComments = trialComments?.inclusion.find((i: any) => i.item_index === iIdx);
                return (
                  <div key={iIdx} className={`${styles.criteriaItem} card`}>
                    <div className={styles.criteriaContent}>
                      <strong>Rationale:</strong>
                      <p>{item.LLM_Reasoning}</p>
                      <strong>Output:</strong>
                      <div className="badge" style={{ backgroundColor: 'var(--divider)', color: 'var(--text-soft)' }}>{item.LLM_output}</div>
                    </div>
                    <CommentBox
                      label="Validation Notes"
                      initialComment={itemComments?.fields['LLM_output'] || { comment: '', status: 'draft' }}
                      onSave={(comment, status) => handleUpdateComment({
                        trial_index: tIdx,
                        type: 'inclusion',
                        item_index: iIdx,
                        fields: { LLM_output: { comment, status } }
                      })}
                    />
                  </div>
                );
              })}
            </div>

            <div className={styles.criteriaList}>
              <h3>Exclusion Criteria Mapping</h3>
              {trial.Matching_Results.exclusion.map((item: any, eIdx: number) => {
                const itemComments = trialComments?.exclusion.find((e: any) => e.item_index === eIdx);
                return (
                  <div key={eIdx} className={`${styles.criteriaItem} card`}>
                    <div className={styles.criteriaContent}>
                      <strong>Rationale:</strong>
                      <p>{item.LLM_Reasoning}</p>
                      <strong>Output:</strong>
                      <div className="badge" style={{ backgroundColor: 'var(--divider)', color: 'var(--text-soft)' }}>{item.LLM_output}</div>
                    </div>
                    <CommentBox
                      label="Validation Notes"
                      initialComment={itemComments?.fields['LLM_output'] || { comment: '', status: 'draft' }}
                      onSave={(comment, status) => handleUpdateComment({
                        trial_index: tIdx,
                        type: 'exclusion',
                        item_index: eIdx,
                        fields: { LLM_output: { comment, status } }
                      })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
