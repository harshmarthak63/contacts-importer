import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  writeBatch,
  QueryConstraint,
  deleteField
} from 'firebase/firestore';
import { getDb } from './config';
import { Contact, ContactField, User, ImportSummary } from '@/types';

const COMPANY_DOC_ID = 'default';

export const contactsCollection = () => 
  collection(getDb(), 'company', COMPANY_DOC_ID, 'contacts');

export const getContacts = async (filters?: { 
  phone?: string; 
  email?: string; 
  agentUid?: string;
}): Promise<Contact[]> => {
  try {
    const constraints: QueryConstraint[] = [];
    
    if (filters?.phone) {
      constraints.push(where('phone', '==', filters.phone));
    }
    if (filters?.email) {
      constraints.push(where('email', '==', filters.email));
    }
    if (filters?.agentUid) {
      constraints.push(where('agentUid', '==', filters.agentUid));
    }

    const q = constraints.length > 0 
      ? query(contactsCollection(), ...constraints)
      : contactsCollection();
      
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdOn: doc.data().createdOn?.toDate?.() || doc.data().createdOn,
    })) as Contact[];
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    throw new Error(`Failed to fetch contacts: ${error.message || 'Unknown error'}`);
  }
};

export const getContactById = async (id: string): Promise<Contact | null> => {
  try {
    const docRef = doc(contactsCollection(), id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdOn: docSnap.data().createdOn?.toDate?.() || docSnap.data().createdOn,
      } as Contact;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching contact by ID:', error);
    throw new Error(`Failed to fetch contact: ${error.message || 'Unknown error'}`);
  }
};

export const findContactByPhoneOrEmail = async (
  phone?: string, 
  email?: string
): Promise<Contact | null> => {
  if (!phone && !email) return null;
  
  try {
    if (phone) {
      const phoneQuery = query(contactsCollection(), where('phone', '==', phone));
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        const doc = phoneSnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdOn: doc.data().createdOn?.toDate?.() || doc.data().createdOn,
        } as Contact;
      }
    }
    
    if (email) {
      const emailQuery = query(contactsCollection(), where('email', '==', email));
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        const doc = emailSnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdOn: doc.data().createdOn?.toDate?.() || doc.data().createdOn,
        } as Contact;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('Error finding contact by phone or email:', error);
    throw new Error(`Failed to find contact: ${error.message || 'Unknown error'}`);
  }
};

export const createContact = async (contact: Omit<Contact, 'id'>): Promise<string> => {
  try {
    const docRef = doc(contactsCollection());
    await setDoc(docRef, {
      ...contact,
      createdOn: Timestamp.now(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating contact:', error);
    throw new Error(`Failed to create contact: ${error.message || 'Unknown error'}`);
  }
};

export const updateContact = async (id: string, updates: Partial<Contact>): Promise<void> => {
  try {
    const docRef = doc(contactsCollection(), id);
    await updateDoc(docRef, updates);
  } catch (error: any) {
    console.error('Error updating contact:', error);
    throw new Error(`Failed to update contact: ${error.message || 'Unknown error'}`);
  }
};

export const deleteContact = async (id: string): Promise<void> => {
  try {
    const docRef = doc(contactsCollection(), id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    throw new Error(`Failed to delete contact: ${error.message || 'Unknown error'}`);
  }
};

export const contactFieldsCollection = () => 
  collection(getDb(), 'company', COMPANY_DOC_ID, 'contactFields');

export const getContactFields = async (): Promise<ContactField[]> => {
  try {
    const snapshot = await getDocs(contactFieldsCollection());
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ContactField[];
  } catch (error: any) {
    console.error('Error fetching contact fields:', error);
    throw new Error(`Failed to fetch contact fields: ${error.message || 'Unknown error'}`);
  }
};

export const getContactFieldById = async (id: string): Promise<ContactField | null> => {
  try {
    const docRef = doc(contactFieldsCollection(), id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ContactField;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching contact field by ID:', error);
    throw new Error(`Failed to fetch contact field: ${error.message || 'Unknown error'}`);
  }
};

export const createContactField = async (field: Omit<ContactField, 'id'>): Promise<string> => {
  try {
    const docRef = doc(contactFieldsCollection());
    await setDoc(docRef, field);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating contact field:', error);
    throw new Error(`Failed to create contact field: ${error.message || 'Unknown error'}`);
  }
};

export const updateContactField = async (id: string, updates: Partial<ContactField>): Promise<void> => {
  try {
    const docRef = doc(contactFieldsCollection(), id);
    await updateDoc(docRef, updates);
  } catch (error: any) {
    console.error('Error updating contact field:', error);
    throw new Error(`Failed to update contact field: ${error.message || 'Unknown error'}`);
  }
};

export const deleteContactField = async (id: string): Promise<void> => {
  try {
    const docRef = doc(contactFieldsCollection(), id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting contact field:', error);
    throw new Error(`Failed to delete contact field: ${error.message || 'Unknown error'}`);
  }
};

export const usersCollection = () => 
  collection(getDb(), 'company', COMPANY_DOC_ID, 'users');

export const getUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(usersCollection());
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(`Failed to fetch users: ${error.message || 'Unknown error'}`);
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const q = query(usersCollection(), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      uid: doc.id,
      ...doc.data(),
    } as User;
  } catch (error: any) {
    console.error('Error fetching user by email:', error);
    throw new Error(`Failed to fetch user: ${error.message || 'Unknown error'}`);
  }
};

export const getUserByUid = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(usersCollection(), uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching user by UID:', error);
    throw new Error(`Failed to fetch user: ${error.message || 'Unknown error'}`);
  }
};

export const createUser = async (user: Omit<User, 'uid'>): Promise<string> => {
  try {
    const docRef = doc(usersCollection());
    await setDoc(docRef, user);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error.message || 'Unknown error'}`);
  }
};

export const updateUser = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    const docRef = doc(usersCollection(), uid);
    await updateDoc(docRef, updates);
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error.message || 'Unknown error'}`);
  }
};

export const deleteUser = async (uid: string): Promise<void> => {
  try {
    const userDocRef = doc(usersCollection(), uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      
      if (userData.designation === 'Agent') {
        try {
          const contactsQuery = query(contactsCollection(), where('agentUid', '==', uid));
          const contactsSnapshot = await getDocs(contactsQuery);
          
          if (!contactsSnapshot.empty) {
            const batch = writeBatch(getDb());
            contactsSnapshot.docs.forEach(contactDoc => {
              const contactRef = doc(contactsCollection(), contactDoc.id);
              batch.update(contactRef, { agentUid: deleteField() });
            });
            await batch.commit();
          }
        } catch (error: any) {
          console.error('Error removing agent assignments:', error);
          throw new Error(`Failed to remove agent assignments: ${error.message || 'Unknown error'}`);
        }
      }
    }
    
    await deleteDoc(userDocRef);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user: ${error.message || 'Unknown error'}`);
  }
};

export const importContacts = async (
  contacts: Omit<Contact, 'id' | 'createdOn'>[],
  onProgress?: (progress: number) => void
): Promise<ImportSummary> => {
  const summary: ImportSummary = {
    created: 0,
    merged: 0,
    skipped: 0,
    errors: [],
  };

  try {
    let batch = writeBatch(getDb());
    let batchCount = 0;
    const BATCH_SIZE = 500;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      try {
        const existing = await findContactByPhoneOrEmail(contact.phone, contact.email);
        
        if (existing) {
          const updates: Partial<Contact> = {};
          Object.keys(contact).forEach(key => {
            if (contact[key] && contact[key] !== '') {
              updates[key] = contact[key];
            }
          });
          
          if (Object.keys(updates).length > 0) {
            const docRef = doc(contactsCollection(), existing.id!);
            batch.update(docRef, updates);
            batchCount++;
            summary.merged++;
          } else {
            summary.skipped++;
          }
        } else {
          const docRef = doc(contactsCollection());
          batch.set(docRef, {
            ...contact,
            createdOn: Timestamp.now(),
          });
          batchCount++;
          summary.created++;
        }

        if (batchCount >= BATCH_SIZE) {
          try {
            await batch.commit();
            batch = writeBatch(getDb());
            batchCount = 0;
          } catch (error: any) {
            console.error('Error committing batch:', error);
            summary.errors.push(`Batch commit failed at row ${i + 1}: ${error.message}`);
            batch = writeBatch(getDb());
            batchCount = 0;
          }
        }

        if (onProgress) {
          onProgress(((i + 1) / contacts.length) * 100);
        }
      } catch (error: any) {
        console.error(`Error processing contact at row ${i + 1}:`, error);
        summary.errors.push(`Row ${i + 1}: ${error.message || 'Unknown error'}`);
        summary.skipped++;
      }
    }

    if (batchCount > 0) {
      try {
        await batch.commit();
      } catch (error: any) {
        console.error('Error committing final batch:', error);
        summary.errors.push(`Final batch commit failed: ${error.message}`);
      }
    }

    return summary;
  } catch (error: any) {
    console.error('Error importing contacts:', error);
    summary.errors.push(`Import failed: ${error.message || 'Unknown error'}`);
    throw error;
  }
};
