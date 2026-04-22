import { PatientData, PatientSummary } from '@/types/patient';

const API_BASE = 'https://gpt-api.hekma.ai/api/annotations';

export async function getPatient(id: string): Promise<PatientData | null> {
  try {
    const response = await fetch(`${API_BASE}/patients/${id}`, {
      headers: {
        'accept': 'application/json'
      },
      cache: 'no-store' // Ensure real-time data
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch patient ${id} from API:`, error);
    return null;
  }
}

export async function getAllPatients(): Promise<PatientSummary[]> {
  try {
    const response = await fetch(`${API_BASE}/patients`, {
      headers: {
        'accept': 'application/json'
      },
      cache: 'no-store' // Ensure real-time data
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch patients from API:', error);
    return [];
  }
}

export async function updatePatientComments(id: string, update: {
  trial_index: number;
  type: 'trial_fields' | 'inclusion' | 'exclusion';
  item_index?: number;
  fields: any;
}): Promise<PatientData | null> {
  try {
    // Push update to API
    const response = await fetch(`${API_BASE}/patients/${id}/comments`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(update)
    });

    if (!response.ok) {
      throw new Error(`Failed to push comments: ${response.statusText}`);
    }

    // Return the updated patient data from the API
    // The API returns the updated patient object directly
    return await response.json();
  } catch (error) {
    console.error(`Failed to push comments for patient ${id} to API:`, error);
    return null;
  }
}

export async function getFinalJson(id: string): Promise<any | null> {
  const patient = await getPatient(id);
  if (!patient) return null;

  const finalJson = JSON.parse(JSON.stringify(patient.data));
  
  if (!patient.comments || !patient.comments.Trials) return finalJson;

  patient.comments.Trials.forEach(trialComment => {
    const targetTrial = finalJson.Trials[trialComment.trial_index];
    if (!targetTrial) return;

    // Inject trial level comments
    Object.entries(trialComment.trial_fields).forEach(([field, data]: [string, any]) => {
      const latest = data.entries?.[data.entries.length - 1];
      targetTrial[`${field}_comments`] = latest?.text || '';
      targetTrial[`${field}_status`] = data.current_status;
    });

    // Inject inclusion comments
    trialComment.inclusion.forEach(incComment => {
      const incItem = targetTrial.Matching_Results.inclusion[incComment.item_index];
      if (incItem) {
        Object.entries(incComment.fields).forEach(([field, data]: [string, any]) => {
          const latest = data.entries?.[data.entries.length - 1];
          incItem[`${field}_comments`] = latest?.text || '';
        });
      }
    });

    // Inject exclusion comments
    trialComment.exclusion.forEach(excComment => {
      const excItem = targetTrial.Matching_Results.exclusion[excComment.item_index];
      if (excItem) {
        Object.entries(excComment.fields).forEach(([field, data]: [string, any]) => {
          const latest = data.entries?.[data.entries.length - 1];
          excItem[`${field}_comments`] = latest?.text || '';
        });
      }
    });
  });

  return finalJson;
}
