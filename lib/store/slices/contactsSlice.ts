import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Contact, User, ContactField } from '@/types';
import { getContacts, createContact, updateContact, deleteContact, getUsers, getContactFields } from '@/lib/firebase/services';

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  selectedContact: Contact | null;
  searchTerm: string;
  filterType: 'all' | 'phone' | 'email' | 'agent';
  agentFilter: string;
  agentMap: Record<string, any>;
  allUsers: any[];
  contactFields: any[];
}

const initialState: ContactsState = {
  contacts: [],
  loading: false,
  error: null,
  selectedContact: null,
  searchTerm: '',
  filterType: 'all',
  agentFilter: '',
  agentMap: {},
  allUsers: [],
  contactFields: [],
};

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async () => {
  return await getContacts();
});

export const addContact = createAsyncThunk('contacts/addContact', async (contactData: Omit<Contact, 'id'>) => {
  const id = await createContact(contactData);
  return { ...contactData, id } as Contact;
});

export const editContact = createAsyncThunk(
  'contacts/editContact',
  async ({ id, contactData }: { id: string; contactData: Partial<Contact> }) => {
    await updateContact(id, contactData);
    return { id, contactData };
  }
);

export const removeContact = createAsyncThunk('contacts/removeContact', async (id: string) => {
  await deleteContact(id);
  return id;
});

export const fetchUsersForContacts = createAsyncThunk('contacts/fetchUsers', async () => {
  return await getUsers();
});

export const fetchContactFields = createAsyncThunk('contacts/fetchContactFields', async () => {
  return await getContactFields();
});

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setSelectedContact: (state, action: PayloadAction<Contact | null>) => {
      state.selectedContact = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFilterType: (state, action: PayloadAction<'all' | 'phone' | 'email' | 'agent'>) => {
      state.filterType = action.payload;
    },
    setAgentFilter: (state, action: PayloadAction<string>) => {
      state.agentFilter = action.payload;
    },
    setAgentMap: (state, action: PayloadAction<Record<string, any>>) => {
      state.agentMap = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch contacts';
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.contacts.push(action.payload);
      })
      .addCase(addContact.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create contact';
      })
      .addCase(editContact.fulfilled, (state, action) => {
        const index = state.contacts.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = { ...state.contacts[index], ...action.payload.contactData };
        }
        if (state.selectedContact?.id === action.payload.id) {
          state.selectedContact = { ...state.selectedContact, ...action.payload.contactData };
        }
      })
      .addCase(editContact.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update contact';
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter((c) => c.id !== action.payload);
        if (state.selectedContact?.id === action.payload) {
          state.selectedContact = null;
        }
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete contact';
      })
      .addCase(fetchUsersForContacts.fulfilled, (state, action) => {
        state.allUsers = action.payload;
        const map: Record<string, any> = {};
        action.payload.forEach((user: User) => {
          map[user.uid] = user;
        });
        state.agentMap = map;
      })
      .addCase(fetchContactFields.fulfilled, (state, action) => {
        state.contactFields = action.payload;
      });
  },
});

export const { setSelectedContact, setSearchTerm, setFilterType, setAgentFilter, setAgentMap, clearError } = contactsSlice.actions;
export default contactsSlice.reducer;

