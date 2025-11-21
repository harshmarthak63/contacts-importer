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
  
  const { getDb } = await import('./config');

  try {
    const db = getDb();
    const companyRef = doc(db, 'company', COMPANY_DOC_ID);
    const companySnap = await getDoc(companyRef);
    
    if (!companySnap.exists()) {
      await setDoc(companyRef, {
        id: COMPANY_DOC_ID,
        createdAt: new Date(),
      });
    }

    const existingFields = await getContactFields();
    const existingFieldsMap = new Map(existingFields.map(f => [f.label.toLowerCase(), f]));

    for (const field of CORE_FIELDS) {
      const existingField = existingFieldsMap.get(field.label.toLowerCase());
      if (!existingField) {
        await createContactField(field);
      } else if (existingField.type !== field.type && existingField.core) {
        await updateContactField(existingField.id, { type: field.type });
      }
    }
  } catch (error) {
    console.error('Failed to initialize company:', error);
  }
}
