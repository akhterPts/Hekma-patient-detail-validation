import fs from 'fs';
import path from 'path';
import { PatientData, PatientSummary, TrialComments } from '@/types/patient';

const DATA_DIR = path.join(process.cwd(), 'src/data/patients');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function savePatient(patient: PatientData): void {
  const filePath = path.join(DATA_DIR, `${patient.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(patient, null, 2));
}

export function getPatient(id: string): PatientData | null {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function getAllPatients(): PatientSummary[] {
  const files = fs.readdirSync(DATA_DIR);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
      const patient: PatientData = JSON.parse(content);
      return {
        id: patient.id,
        summary: patient.summary,
        has_review_requests: patient.has_review_requests,
      };
    });
}

export function updatePatientComments(id: string, update: {
  trial_index: number;
  type: 'trial_fields' | 'inclusion' | 'exclusion';
  item_index?: number;
  fields: any;
}): boolean {
  const patient = getPatient(id);
  if (!patient) return false;

  const { trial_index, type, item_index, fields } = update;
  let trial = patient.comments.Trials.find(t => t.trial_index === trial_index);

  if (!trial) {
    trial = {
      trial_index,
      trial_fields: {},
      inclusion: [],
      exclusion: [],
    };
    patient.comments.Trials.push(trial);
  }

  if (type === 'trial_fields') {
    trial.trial_fields = { ...trial.trial_fields, ...fields };
  } else if (type === 'inclusion' || type === 'exclusion') {
    let item = trial[type].find(i => i.item_index === item_index);
    if (!item) {
      item = { item_index: item_index!, fields: {} };
      trial[type].push(item);
    }
    item.fields = { ...item.fields, ...fields };
  }

  // Recompute has_review_requests
  patient.has_review_requests = patient.comments.Trials.some(t => {
    const trialFieldsReview = Object.values(t.trial_fields).some(f => f.status === 'needs_review');
    const inclusionReview = t.inclusion.some(i => Object.values(i.fields).some(f => f.status === 'needs_review'));
    const exclusionReview = t.exclusion.some(e => Object.values(e.fields).some(f => f.status === 'needs_review'));
    return trialFieldsReview || inclusionReview || exclusionReview;
  });

  savePatient(patient);
  return true;
}

export function getFinalJson(id: string): any | null {
  const patient = getPatient(id);
  if (!patient) return null;

  const finalJson = JSON.parse(JSON.stringify(patient.data));
  const patientId = finalJson.Patient_ID;

  patient.comments.Trials.forEach(trialComment => {
    const trial = finalJson.Trials.find((t: any) => t.Trail_ID || t.Trial_ID === trialComment.trial_index); 
    // Note: The PDF has Trail_ID in some places and Trial_ID in others. I'll need to be flexible.
    // Actually, the sample code in PDF uses trial_index to find it.
    
    const targetTrial = finalJson.Trials[trialComment.trial_index];
    if (!targetTrial) return;

    // Inject trial level comments
    Object.entries(trialComment.trial_fields).forEach(([field, data]) => {
      targetTrial[`${field}_comments`] = data.comment;
    });

    // Inject inclusion comments
    trialComment.inclusion.forEach(incComment => {
      const incItem = targetTrial.Matching_Results.inclusion[incComment.item_index];
      if (incItem) {
        Object.entries(incComment.fields).forEach(([field, data]) => {
          incItem[`${field}_comments`] = data.comment;
        });
      }
    });

    // Inject exclusion comments
    trialComment.exclusion.forEach(excComment => {
      const excItem = targetTrial.Matching_Results.exclusion[excComment.item_index];
      if (excItem) {
        Object.entries(excComment.fields).forEach(([field, data]) => {
          excItem[`${field}_comments`] = data.comment;
        });
      }
    });
  });

  return finalJson;
}
