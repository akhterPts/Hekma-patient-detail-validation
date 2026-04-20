"use client";

import React, { useState, useEffect } from 'react';
import { ReviewStatus, PatientComment } from '@/types/patient';
import StatusIndicator from './StatusIndicator';

interface CommentBoxProps {
  initialComment: PatientComment;
  onSave: (comment: string, status: ReviewStatus) => void;
  label?: string;
}

import styles from './CommentBox.module.css';

export default function CommentBox({ initialComment, onSave, label }: CommentBoxProps) {
  const [comment, setComment] = useState(initialComment.comment || '');
  const [status, setStatus] = useState<ReviewStatus>(initialComment.status || 'draft');
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    setComment(initialComment.comment || '');
    setStatus(initialComment.status || 'draft');
  }, [initialComment]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setComment(newVal);
    
    // CRITICAL RULE: Reset to "draft" on edit
    if (newVal !== initialComment.comment) {
      setStatus('draft');
      setIsModified(true);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ReviewStatus;
    setStatus(newStatus);
    setIsModified(true);
  };

  const handleSave = () => {
    onSave(comment, status);
    setIsModified(false);
  };

  return (
    <div className={styles.commentBoxContainer}>
      {label && <label className="input-label">{label}</label>}
      
      <div className={styles.commentFormGroup}>
        <textarea
          value={comment}
          onChange={handleCommentChange}
          placeholder="Add your validation notes here..."
          rows={3}
        />
        
        <div className={styles.commentControls}>
          <div className={styles.statusSelectorWrapper}>
            <label className="input-label" style={{ marginBottom: 0 }}>Status:</label>
            <select value={status} onChange={handleStatusChange}>
              <option value="draft">Draft</option>
              <option value="needs_review">Needs Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          <button 
            className={`${styles.saveBtn} ${isModified ? styles.active : ''}`}
            onClick={handleSave}
            disabled={!isModified}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
