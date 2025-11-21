import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getContactFields, createContactField, updateContactField } from './services';
import { ContactField } from '@/types';

const COMPANY_DOC_ID = 'default';

const CORE_FIELDS: Omit<ContactField, 'id'>[] = [
  { label: 'First Name', type: 'text', core: true },
  { label: 'Last Name', type: 'text', core: true },
  { label: 'Phone', type: 'phone', core: true },
  { label: 'Email', type: 'email', core: true },
  { label: 'Agent', type: 'text', core: true },
];

export async function initializeCompany() {
  if (typeof window === 'undefined') return;
  
  try {
    const { getDb } = await import('./config');

    try {
      const db = getDb();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const companyRef = doc(db, 'company', COMPANY_DOC_ID);
      let companySnap;
      
      try {
        companySnap = await getDoc(companyRef);
      } catch (error: any) {
        console.error('Error fetching company document:', error);
        throw new Error(`Failed to fetch company document: ${error.message || 'Unknown error'}`);
      }
      
      if (!companySnap.exists()) {
        try {
          await setDoc(companyRef, {
            id: COMPANY_DOC_ID,
            createdAt: new Date(),
          });
        } catch (error: any) {
          console.error('Error creating company document:', error);
          throw new Error(`Failed to create company document: ${error.message || 'Unknown error'}`);
        }
      }

      let existingFields;
      try {
        existingFields = await getContactFields();
      } catch (error: any) {
        console.error('Error fetching contact fields:', error);
        throw new Error(`Failed to fetch contact fields: ${error.message || 'Unknown error'}`);
      }

      if (!existingFields || !Array.isArray(existingFields)) {
        console.warn('Contact fields is not an array, initializing with empty array');
        existingFields = [];
      }

      const existingFieldsMap = new Map(existingFields.map(f => [f.label.toLowerCase(), f]));

      for (const field of CORE_FIELDS) {
        try {
          const existingField = existingFieldsMap.get(field.label.toLowerCase());
          if (!existingField) {
            try {
              await createContactField(field);
            } catch (error: any) {
              console.error(`Error creating core field ${field.label}:`, error);
            }
          } else if (existingField.type !== field.type && existingField.core) {
            try {
              await updateContactField(existingField.id, { type: field.type });
            } catch (error: any) {
              console.error(`Error updating core field ${field.label}:`, error);
            }
          }
        } catch (error: any) {
          console.error(`Error processing core field ${field.label}:`, error);
          continue;
        }
      }
    } catch (error: any) {
      console.error('Failed to initialize company:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Critical error in initializeCompany:', error);
  }
}
