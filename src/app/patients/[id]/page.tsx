"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PatientData, PatientComment, ReviewStatus } from '@/types/patient';
import CommentBox from '@/components/ui/CommentBox';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { usePatients } from '../../../context/PatientContext';

import styles from './detail.module.css';

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    updatePatientState,
    getPatientById,
    detailSyncEpochById,
    trackPendingUpdate,
    handleToggleExpand,
    clearValidationState
  } = usePatients();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTrialIndex, setActiveTrialIndex] = useState(0);

  const isCommented = patient?.comments?.Trials?.length > 0;

  // Detail page always loads from GET /patients/:id (not list cache).
  // loadPatient must not depend on getPatientById/context patients; context updates after save used to recreate this callback,
  // trigger the mount effect again, and overwrite freshly saved data with a stale snapshot from the patient list.
  const loadPatientData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`, { cache: 'no-store' });
      const data = await res.json();
      setPatient(data);
      updatePatientState(id as string, data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [id, updatePatientState]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  const bulkSaveSyncEpoch = detailSyncEpochById[id as string] ?? 0;
  useEffect(() => {
    if (bulkSaveSyncEpoch === 0) return;
    const p = getPatientById(id as string);
    if (p?.data && p.comments != null) {
      setPatient(p);
    }
  }, [bulkSaveSyncEpoch, id, getPatientById]);

  useEffect(() => {
    const trialCount = patient?.data?.Trials?.length ?? 0;
    if (trialCount === 0) {
      setActiveTrialIndex(0);
      return;
    }
    if (activeTrialIndex >= trialCount) {
      setActiveTrialIndex(0);
    }
  }, [patient, activeTrialIndex]);

  // Clean validation state on unmount or patient change
  useEffect(() => {
    return () => clearValidationState();
  }, [id, clearValidationState]);

  const handleUpdateComment = async (update: any) => {
    try {
      const currentScrollY = window.scrollY;
      const response = await fetch(`/api/patients/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      if (response.ok) {
        let nextPatient = await response.json();
        const hasTrialsComments =
          nextPatient?.comments?.Trials != null && Array.isArray(nextPatient.comments.Trials);
        const hasPatientData = nextPatient?.data != null;
        // POST response is authoritative; GET right after POST can briefly return stale reads.
        if (!hasTrialsComments || !hasPatientData) {
          const latestResponse = await fetch(`/api/patients/${id}`, { cache: 'no-store' });
          if (latestResponse.ok) {
            nextPatient = await latestResponse.json();
          }
        }
        setPatient(nextPatient);
        updatePatientState(id as string, nextPatient);

        // Keep viewport stable after state replacement.
        requestAnimationFrame(() => {
          window.scrollTo({ top: currentScrollY, behavior: 'auto' });
        });
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

      <div className={styles.mainContent}>
        <aside className={styles.leftColumn}>
          <section className={`${styles.summaryCard} card`}>
            <h3>Clinical Case Summary</h3>
            <p>{patient.data?.Patient_Summary || patient.summary}</p>
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
        </aside>

        <section className={styles.rightColumn}>
          <div className={styles.trialTabs}>
            {patient.data.Trials?.map((trial: any, tIdx: number) => (
              <button
                key={`${trial.Trail_ID || 'trial'}-${tIdx}`}
                type="button"
                className={`${styles.trialTab} ${activeTrialIndex === tIdx ? styles.trialTabActive : ''}`}
                onClick={() => setActiveTrialIndex(tIdx)}
              >
                {trial.Trail_ID || `Trial ${tIdx + 1}`}
              </button>
            ))}
          </div>

          {patient.data.Trials?.map((trial: any, tIdx: number) => {
            const trialComments = patient.comments?.Trials?.find((t: any) => t.trial_index === tIdx);
            const isActivePanel = activeTrialIndex === tIdx;

            return (
              <div
                key={tIdx}
                className={!isActivePanel ? styles.trialPanelHidden : undefined}
                aria-hidden={!isActivePanel}
              >
              <div className={styles.trialBlock}>
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
                    forcedExpanded={false}
                    bulkSaveCollapseEpoch={bulkSaveSyncEpoch}
                    showSaveButton={isCommented}
                    onToggleExpand={(val) => handleToggleExpand(`trial_${tIdx}_relevance`, val)}
                    onChange={(comment, status) => trackPendingUpdate(`trial_${tIdx}_relevance`, comment, status, {
                      trial_index: tIdx,
                      type: 'trial_fields',
                      fields: { Relevance_Reasoning: { comment, status, action: 'add' } }
                    })}
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
                    forcedExpanded={false}
                    bulkSaveCollapseEpoch={bulkSaveSyncEpoch}
                    showSaveButton={isCommented}
                    onToggleExpand={(val) => handleToggleExpand(`trial_${tIdx}_eligibility`, val)}
                    onChange={(comment, status) => trackPendingUpdate(`trial_${tIdx}_eligibility`, comment, status, {
                      trial_index: tIdx,
                      type: 'trial_fields',
                      fields: { Eligibility_Reasoning: { comment, status, action: 'add' } }
                    })}
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
                    forcedExpanded={false}
                    bulkSaveCollapseEpoch={bulkSaveSyncEpoch}
                    showSaveButton={isCommented}
                    onToggleExpand={(val) => handleToggleExpand(`trial_${tIdx}_labels`, val)}
                    onChange={(comment, status) => trackPendingUpdate(`trial_${tIdx}_labels`, comment, status, {
                      trial_index: tIdx,
                      type: 'trial_fields',
                      fields: { Predicted_Labels: { comment, status, action: 'add' } }
                    })}
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
                <div className={`${styles.criteriaBody} my-3`}>
                  <strong> Inclusion Criteria: {trial.Trail_text.metadata["inclusion_criteria"].split(":").at(1)}</strong>
                </div>
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
                          fieldId={`inc_${tIdx}_${iIdx}_reasoning`}
                          initialComment={itemComments?.fields['LLM_Reasoning'] || { entries: [], current_status: 'draft' }}
                          forcedExpanded={false}
                          bulkSaveCollapseEpoch={bulkSaveSyncEpoch}
                          showSaveButton={isCommented}
                          onToggleExpand={(val) => handleToggleExpand(`inc_${tIdx}_${iIdx}_reasoning`, val)}
                          onChange={(comment, status) => trackPendingUpdate(`inc_${tIdx}_${iIdx}_reasoning`, comment, status, {
                            trial_index: tIdx,
                            type: 'inclusion',
                            item_index: iIdx,
                            fields: { LLM_Reasoning: { comment, status, action: 'add' } }
                          })}
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
                <div className={`${styles.criteriaBody} my-3`}>
                  <strong> Exclusion Criteria: {trial.Trail_text.metadata["exclusion_criteria"].split(":").at(1)}</strong>
                </div>
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
                          fieldId={`exc_${tIdx}_${eIdx}_reasoning`}
                          initialComment={itemComments?.fields['LLM_Reasoning'] || { entries: [], current_status: 'draft' }}
                          forcedExpanded={false}
                          bulkSaveCollapseEpoch={bulkSaveSyncEpoch}
                          showSaveButton={isCommented}
                          onToggleExpand={(val) => handleToggleExpand(`exc_${tIdx}_${eIdx}_reasoning`, val)}
                          onChange={(comment, status) => trackPendingUpdate(`exc_${tIdx}_${eIdx}_reasoning`, comment, status, {
                            trial_index: tIdx,
                            type: 'exclusion',
                            item_index: eIdx,
                            fields: { LLM_Reasoning: { comment, status, action: 'add' } }
                          })}
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
        </section>
      </div>
    </div>
  );
}
