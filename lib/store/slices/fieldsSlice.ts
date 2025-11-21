import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContactField } from '@/types';
import { getContactFields, createContactField, updateContactField, deleteContactField } from '@/lib/firebase/services';

interface FieldsState {
  fields: ContactField[];
  loading: boolean;
  error: string | null;
  selectedField: ContactField | null;
}

const initialState: FieldsState = {
  fields: [],
  loading: false,
  error: null,
  selectedField: null,
};

export const fetchFields = createAsyncThunk('fields/fetchFields', async () => {
  return await getContactFields();
});

export const addField = createAsyncThunk('fields/addField', async (fieldData: Omit<ContactField, 'id'>) => {
  const id = await createContactField(fieldData);
  return { ...fieldData, id } as ContactField;
});

export const editField = createAsyncThunk(
  'fields/editField',
  async ({ id, fieldData }: { id: string; fieldData: Partial<ContactField> }) => {
    await updateContactField(id, fieldData);
    return { id, fieldData };
  }
);

export const removeField = createAsyncThunk('fields/removeField', async (id: string) => {
  await deleteContactField(id);
  return id;
});

const fieldsSlice = createSlice({
  name: 'fields',
  initialState,
  reducers: {
    setSelectedField: (state, action: PayloadAction<ContactField | null>) => {
      state.selectedField = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.loading = false;
        state.fields = action.payload;
      })
      .addCase(fetchFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch fields';
      })
      .addCase(addField.fulfilled, (state, action) => {
        state.fields.push(action.payload);
      })
      .addCase(addField.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create field';
      })
      .addCase(editField.fulfilled, (state, action) => {
        const index = state.fields.findIndex((f) => f.id === action.payload.id);
        if (index !== -1) {
          state.fields[index] = { ...state.fields[index], ...action.payload.fieldData };
        }
        if (state.selectedField?.id === action.payload.id) {
          state.selectedField = { ...state.selectedField, ...action.payload.fieldData };
        }
      })
      .addCase(editField.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update field';
      })
      .addCase(removeField.fulfilled, (state, action) => {
        state.fields = state.fields.filter((f) => f.id !== action.payload);
        if (state.selectedField?.id === action.payload) {
          state.selectedField = null;
        }
      })
      .addCase(removeField.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete field';
      });
  },
});

export const { setSelectedField, clearError } = fieldsSlice.actions;
export default fieldsSlice.reducer;

