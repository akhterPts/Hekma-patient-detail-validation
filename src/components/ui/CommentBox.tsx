"use client";

import React, { useState, useEffect } from 'react';
import { ReviewStatus, PatientComment, CommentEntry } from '@/types/patient';
import styles from './CommentBox.module.css';

interface CommentBoxProps {
  initialComment: PatientComment;
  onSave: (comment: string, status: ReviewStatus, isUpdate: boolean) => void;
  label?: string;
  fieldId: string;
  forcedExpanded?: boolean;
  showSaveButton?: boolean;
  onChange?: (comment: string, status: ReviewStatus) => void;
  onToggleExpand?: (isExpanded: boolean) => void;
}

export default function CommentBox({ 
  initialComment, 
  onSave, 
  label, 
  forcedExpanded = false, 
  showSaveButton = true,
  onChange,
  onToggleExpand
}: CommentBoxProps) {
  // Compatibility Layer
  const legacyComment = (initialComment as any).comment;
  const legacyStatus = (initialComment as any).status;
  
  let initialEntries = initialComment.entries || [];
  let statusAtLoad = initialComment.current_status || legacyStatus || 'draft';

  if (initialEntries.length === 0 && legacyComment) {
    initialEntries = [{
      text: legacyComment,
      status: statusAtLoad,
      timestamp: new Date().toISOString()
    }];
  }

  const entries = initialEntries;
  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  // RULES:
  // - Pencil (Update): Only for the latest entry if it is NOT resolved.
  // - Plus (Add): For empty fields OR when the latest entry IS resolved.
  const hasActiveIssue = latestEntry && latestEntry.status !== 'resolved';
  const isLatestResolved = latestEntry?.status === 'resolved';

  const showPencil = !!hasActiveIssue;
  const showPlus = !latestEntry || isLatestResolved;

  const [isMounted, setIsMounted] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentStatus, setCurrentStatus] = useState<ReviewStatus>(statusAtLoad);
  const [isExpanded, setIsExpanded] = useState(forcedExpanded);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync state when entering Edit vs Add mode
  const enterEditMode = () => {
    if (latestEntry) {
      setNewComment(latestEntry.text);
      setCurrentStatus(latestEntry.status);
    }
    setIsExpanded(true);
    onToggleExpand?.(true);
  };

  const enterAddMode = () => {
    setNewComment('');
    setCurrentStatus('draft');
    setIsExpanded(true);
    onToggleExpand?.(true);
  };

  const handleTextChange = (val: string) => {
    setNewComment(val);
    if (!showSaveButton && onChange) {
      onChange(val, currentStatus);
    }
  };

  const handleStatusChange = (status: ReviewStatus) => {
    setCurrentStatus(status);
    if (!showSaveButton && onChange) {
      onChange(newComment, status);
    }
  };

  const handleUpdate = () => {
    if (newComment.trim()) {
      onSave(newComment, currentStatus, showPencil); // isUpdate = showPencil
      setNewComment('');
      setIsExpanded(false);
      onToggleExpand?.(false);
    }
  };

  const toggleCollapse = () => {
    setIsExpanded(false);
    onToggleExpand?.(false);
  };


  const getStatusClass = (status: ReviewStatus) => {
    switch (status) {
      case 'draft': return styles.statusDraft;
      case 'needs_review': return styles.statusReview;
      case 'resolved': return styles.statusResolved;
      default: return '';
    }
  };

  const getActiveStatusClass = (s: ReviewStatus) => {
    if (currentStatus !== s) return '';
    if (s === 'draft') return styles.draftActive;
    if (s === 'needs_review') return styles.needsReviewActive;
    if (s === 'resolved') return styles.resolvedActive;
    return '';
  };

  return (
    <div className={styles.threadWrapper}>
      {/* 1. Persistent Thread History */}
      {entries.length > 0 && (
        <div className={styles.commentList}>
          {entries.map((entry, idx) => (
            <div key={idx} className={`${styles.commentItem} ${getStatusClass(entry.status)}`}>
              <div className={styles.itemHeader}>
                <span className={styles.itemStatusLabel}>{entry.status.replace('_', ' ')}</span>
                <span className={styles.itemDate}>
                  {isMounted ? `${new Date(entry.timestamp).toLocaleDateString()} at ${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '...'}
                </span>
              </div>
              <p className={styles.itemText}>{entry.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* 2. Toggleable Action Area */}
      {!isExpanded && !forcedExpanded ? (
        <div className={styles.collapsedWrapper}>
          {(showPlus || showPencil) && (
            <button 
              className={showPencil ? styles.pencilBtn : styles.plusBtn}
              onClick={showPencil ? enterEditMode : enterAddMode}
            >
              {showPencil ? '✎' : '+'}
              <span>{showPencil ? 'Edit Latest Comment' : 'Add New Comment'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className={`${styles.commentBoxContainer} ${getStatusClass(currentStatus)}`}>
          <div className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.label}>{showPencil ? 'Modifying Observation' : 'New Clinical Entry'}</span>
              {!forcedExpanded && <button className={styles.closeBtn} onClick={toggleCollapse}>✕</button>}
            </div>
            <div className={styles.statusButtons}>
              {(['draft', 'needs_review', 'resolved'] as ReviewStatus[]).map((s) => (
                <button 
                  key={s}
                  type="button"
                  className={`${styles.statusBtn} ${getActiveStatusClass(s)}`}
                  onClick={() => handleStatusChange(s)}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <textarea
              value={newComment}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={showPencil ? "Update your observation..." : "Start a new clinical note..."}
              rows={2}
              autoFocus={!forcedExpanded}
            />
            {showSaveButton && (
              <div className={styles.actionRow}>
                <button className={styles.cancelBtn} onClick={toggleCollapse}>
                  Cancel
                </button>
                <button 
                  className={styles.updateBtn} 
                  onClick={handleUpdate}
                  disabled={!newComment.trim()}
                >
                  {showPencil ? 'Save Changes' : 'Post to Thread'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
