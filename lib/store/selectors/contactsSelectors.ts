import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectFilteredContacts = createSelector(
  [
    (state: RootState) => state.contacts.contacts,
    (state: RootState) => state.contacts.searchTerm,
    (state: RootState) => state.contacts.filterType,
    (state: RootState) => state.contacts.agentFilter,
    (state: RootState) => state.contacts.agentMap,
  ],
  (contacts, searchTerm, filterType, agentFilter, agentMap) => {
    let filtered = [...contacts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => {
        const phone = (contact.phone || '').toLowerCase();
        const email = (contact.email || '').toLowerCase();
        const firstName = (contact.firstName || '').toLowerCase();
        const lastName = (contact.lastName || '').toLowerCase();
        const agentName = contact.agentUid ? (agentMap[contact.agentUid]?.name || '').toLowerCase() : '';
        
        return phone.includes(term) || 
               email.includes(term) || 
               firstName.includes(term) || 
               lastName.includes(term) ||
               agentName.includes(term);
      });
    }

    if (filterType === 'phone') {
      filtered = filtered.filter(c => c.phone);
    } else if (filterType === 'email') {
      filtered = filtered.filter(c => c.email);
    } else if (filterType === 'agent') {
      filtered = filtered.filter(c => c.agentUid);
    }

    if (agentFilter) {
      filtered = filtered.filter(c => c.agentUid === agentFilter);
    }

    return filtered;
  }
);

export const selectUniqueAgents = createSelector(
  [
    (state: RootState) => state.contacts.contacts,
    (state: RootState) => state.contacts.agentMap,
  ],
  (contacts, agentMap) => {
    const agentUidSet = new Set<string>();
    contacts.forEach(c => {
      if (c.agentUid) {
        agentUidSet.add(c.agentUid);
      }
    });
    const agentUids = Array.from(agentUidSet);
    return agentUids.map(uid => ({
      uid: uid,
      name: agentMap[uid]?.name || 'Unknown',
    }));
  }
);

export const selectAgents = createSelector(
  [(state: RootState) => state.contacts.allUsers],
  (allUsers) => {
    return allUsers.filter((user: any) => user.designation === 'Agent');
  }
);

export const selectCoreFields = createSelector(
  [(state: RootState) => state.contacts.contactFields],
  (contactFields) => {
    return contactFields.filter((f: any) => f.core);
  }
);

export const selectCustomFields = createSelector(
  [(state: RootState) => state.contacts.contactFields],
  (contactFields) => {
    return contactFields.filter((f: any) => !f.core);
  }
);

export const selectDisplayFields = createSelector(
  [
    (state: RootState) => state.contacts.contactFields,
    selectCustomFields,
  ],
  (contactFields, customFields) => {
    const fields: Array<{ id: string; label: string; type: string; core: boolean; key?: string; required?: boolean }> = [];
    
    const coreOrder = ['First Name', 'Last Name', 'Phone', 'Email'];
    coreOrder.forEach(label => {
      const field = contactFields.find((f: any) => f.label === label && f.core);
      if (field) {
        const labelLower = label.toLowerCase().replace(/\s+/g, '');
        const labelMap: Record<string, string> = {
          'firstname': 'firstName',
          'lastname': 'lastName',
          'phone': 'phone',
          'email': 'email',
        };
        fields.push({
          ...field,
          key: labelMap[labelLower] || labelLower,
          required: label === 'First Name' || label === 'Last Name',
        });
      }
    });
    
    contactFields.forEach((f: any) => {
      if (f.core && f.label !== 'Agent' && !fields.find((ff: any) => ff.id === f.id)) {
        const labelLower = f.label.toLowerCase().replace(/\s+/g, '');
        const labelMap: Record<string, string> = {
          'firstname': 'firstName',
          'lastname': 'lastName',
          'phone': 'phone',
          'email': 'email',
        };
        fields.push({
          ...f,
          key: labelMap[labelLower] || labelLower,
          required: false,
        });
      }
    });
    
    customFields.forEach((f: any) => {
      fields.push({
        ...f,
        key: f.id,
        required: false,
      });
    });
    
    return fields;
  }
);

