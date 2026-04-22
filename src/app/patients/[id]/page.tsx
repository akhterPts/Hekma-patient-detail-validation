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
      const response = await fetch(`/api/patients/${id}/comments`, {
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

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/patients/${id}/final-json`);
      if (!response.ok) throw new Error('Failed to fetch final JSON');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient_validation_${id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate validation report.');
    }
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
      </header>

      <section className={`${styles.summaryCard} card`}>
        <h3>Clinical Case Summary</h3>
        <p>{patient.summary || patient.data?.Patient_Summary}</p>
      </section>

      {patient.data.Patient_Block_Summary && (
        <section className={styles.profileSection}>
          <h3>Patient Clinical Profile</h3>
          <div className={styles.profileGrid}>
            {Object.entries(patient.data.Patient_Block_Summary as Record<string, any>).map(([key, value]) => (
              value ? (
                <div key={key} className={styles.profileItem}>
                  <label>{key.replace(/_/g, ' ')}</label>
                  <div>{typeof value === 'string' ? value : JSON.stringify(value)}</div>
                </div>
              ) : null
            ))}
          </div>
        </section>
      )}

      {patient.data.Trials?.map((trial: any, tIdx: number) => {
        const trialComments = patient.comments?.Trials?.find((t: any) => t.trial_index === tIdx);

        return (
          <div key={tIdx} className={styles.trialBlock}>
            <header className={styles.trialHeader}>
              <div className={styles.trialHeaderTop}>
                <span className={styles.trialIdBadge}>{trial.Trail_ID}</span>
                <h2>{trial.Trail_text.title}</h2>
              </div>
              
              <div className={styles.trialMetaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Phase</span>
                  <span className={styles.metaValue}>{trial.Trail_text.metadata.phase || 'N/A'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Enrollment</span>
                  <span className={styles.metaValue}>{trial.Trail_text.metadata.enrollment || '0'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Drugs</span>
                  <span className={styles.metaValue}>{trial.Trail_text.metadata.drugs || 'None'}</span>
                </div>
              </div>
            </header>

            <div className={styles.summarySection}>
              <div className={styles.protocolSummary}>
                <strong>Brief Summary:</strong>
                <p>{trial.Trail_text.metadata.brief_summary}</p>
              </div>
            </div>

            <div className={styles.validationCore}>

            <div className={styles.fieldsGrid}>
              <div className={`${styles.fieldSection} card`}>
                <h4>Relevance Reasoning</h4>
                <div className={styles.originalVal}>{trial.Relevance_Reasoning}</div>
                <CommentBox
                  label="Validation Notes"
                  fieldId={`trial_${tIdx}_relevance`}
                  initialComment={trialComments?.trial_fields['Relevance_Reasoning'] || { entries: [], current_status: 'draft' }}
                  onSave={(comment, status, isUpdate) => handleUpdateComment({
                    trial_index: tIdx,
                    type: 'trial_fields',
                    fields: { Relevance_Reasoning: { comment, status, action: isUpdate ? 'update' : 'add' } }
                  })}
                />
              </div>

              <div className={`${styles.fieldSection} card`}>
                <h4>Eligibility Reasoning</h4>
                <div className={styles.originalVal}>{trial.Eligibility_Reasoning}</div>
                <CommentBox
                  label="Validation Notes"
                  fieldId={`trial_${tIdx}_eligibility`}
                  initialComment={trialComments?.trial_fields['Eligibility_Reasoning'] || { entries: [], current_status: 'draft' }}
                  onSave={(comment, status, isUpdate) => handleUpdateComment({
                    trial_index: tIdx,
                    type: 'trial_fields',
                    fields: { Eligibility_Reasoning: { comment, status, action: isUpdate ? 'update' : 'add' } }
                  })}
                />
              </div>

              <div className={`${styles.fieldSection} card`}>
                <h4>Predicted Label</h4>
                <div className={styles.originalVal}>
                  <span className="badge" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                    {trial.Predicted_Labels}
                  </span>
                </div>
                <CommentBox
                  label="Validation Notes"
                  fieldId={`trial_${tIdx}_labels`}
                  initialComment={trialComments?.trial_fields['Predicted_Labels'] || { entries: [], current_status: 'draft' }}
                  onSave={(comment, status, isUpdate) => handleUpdateComment({
                    trial_index: tIdx,
                    type: 'trial_fields',
                    fields: { Predicted_Labels: { comment, status, action: isUpdate ? 'update' : 'add' } }
                  })}
                />
              </div>
            </div>

            <div className={styles.criteriaList}>
              <h3>Inclusion Criteria Mapping</h3>
              {trial.Matching_Results.inclusion.map((item: any, iIdx: number) => {
                const itemComments = trialComments?.inclusion?.find((i: any) => i.item_index === iIdx);
                return (
                  <div key={iIdx} className={`${styles.criteriaItem} card`}>
                    <div className={styles.criteriaContent}>
                      <div className={styles.criteriaHeader}>
                        <strong>Criterion {iIdx + 1}</strong>
                        <div className="badge pill">{item.LLM_output}</div>
                      </div>
                      <div className={styles.criteriaBody}>
                        <strong>LLM Reasoning:</strong>
                        <p>{item.LLM_Reasoning}</p>
                      </div>
                    </div>
                    <div className={styles.commentSingle}>
                      <CommentBox
                        label="Reasoning Validation"
                        fieldId={`inc_${iIdx}_reasoning`}
                        initialComment={itemComments?.fields['LLM_Reasoning'] || { entries: [], current_status: 'draft' }}
                        onSave={(comment, status, isUpdate) => handleUpdateComment({
                          trial_index: tIdx,
                          type: 'inclusion',
                          item_index: iIdx,
                          fields: { LLM_Reasoning: { comment, status, action: isUpdate ? 'update' : 'add' } }
                        })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.criteriaList}>
              <h3>Exclusion Criteria Mapping</h3>
              {trial.Matching_Results.exclusion.map((item: any, eIdx: number) => {
                const itemComments = trialComments?.exclusion?.find((e: any) => e.item_index === eIdx);
                return (
                  <div key={eIdx} className={`${styles.criteriaItem} card`}>
                    <div className={styles.criteriaContent}>
                      <div className={styles.criteriaHeader}>
                        <strong>Criterion {eIdx + 1}</strong>
                        <div className="badge pill">{item.LLM_output}</div>
                      </div>
                      <div className={styles.criteriaBody}>
                        <strong>LLM Reasoning:</strong>
                        <p>{item.LLM_Reasoning}</p>
                      </div>
                    </div>
                    <div className={styles.commentSingle}>
                      <CommentBox
                        label="Reasoning Validation"
                        fieldId={`exc_${eIdx}_reasoning`}
                        initialComment={itemComments?.fields['LLM_Reasoning'] || { entries: [], current_status: 'draft' }}
                        onSave={(comment, status, isUpdate) => handleUpdateComment({
                          trial_index: tIdx,
                          type: 'exclusion',
                          item_index: eIdx,
                          fields: { LLM_Reasoning: { comment, status, action: isUpdate ? 'update' : 'add' } }
                        })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        );
      })}
      <footer className={styles.footerActions}>
        <button onClick={() => router.push('/patients')} className={styles.secondaryBtn}>Back to Records List</button>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <button onClick={handleDownload} className={styles.secondaryBtn}>Download Final JSON</button>
          <button onClick={() => router.push('/patients')} className={styles.primaryBtn}>Save & Finalize Validation</button>
        </div>
      </footer>
    </div>
  );
}
