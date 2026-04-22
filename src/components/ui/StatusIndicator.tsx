import React from 'react';
import { ReviewStatus } from '@/types/patient';

interface StatusIndicatorProps {
  status: ReviewStatus;
  showText?: boolean;
}

export default function StatusIndicator({ status, showText = true }: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'draft': return 'var(--status-draft)';
      case 'needs_review': return 'var(--status-needs-review)';
      case 'resolved': return 'var(--status-resolved)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'needs_review': return 'Needs Review';
      case 'resolved': return 'Clean';
      default: return 'Unknown';
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
      <span 
        style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          backgroundColor: getStatusColor(),
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 0 0 2px white, 0 0 0 3px rgba(0,0,0,0.05)'
        }} 
      />
      {showText && (
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
}
