export type ReviewStatus = 'draft' | 'needs_review' | 'resolved';

export interface PatientComment {
  comment: string;
  status: ReviewStatus;
}

export interface TrialComments {
  trial_index: number;
  trial_fields: Record<string, PatientComment>;
  inclusion: Array<{
    item_index: number;
    fields: Record<string, PatientComment>;
  }>;
  exclusion: Array<{
    item_index: number;
    fields: Record<string, PatientComment>;
  }>;
}

export interface PatientData {
  id: string;
  data: any; // The full JSON dataset
  comments: {
    Trials: TrialComments[];
  };
  has_review_requests: boolean;
  summary: string;
}

export interface PatientSummary {
  id: string;
  summary: string;
  has_review_requests: boolean;
}
