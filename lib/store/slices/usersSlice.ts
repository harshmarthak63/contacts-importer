import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/firebase/services';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  selectedUser: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  return await getUsers();
});

export const addUser = createAsyncThunk('users/addUser', async (userData: Omit<User, 'uid'>) => {
  const uid = await createUser(userData);
  return { ...userData, uid } as User;
});

export const editUser = createAsyncThunk(
  'users/editUser',
  async ({ uid, userData }: { uid: string; userData: Partial<User> }) => {
    await updateUser(uid, userData);
    return { uid, userData };
  }
);

export const removeUser = createAsyncThunk('users/removeUser', async (uid: string) => {
  await deleteUser(uid);
  return uid;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create user';
      })
      .addCase(editUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.uid === action.payload.uid);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload.userData };
        }
        if (state.selectedUser?.uid === action.payload.uid) {
          state.selectedUser = { ...state.selectedUser, ...action.payload.userData };
        }
      })
      .addCase(editUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update user';
      })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.uid !== action.payload);
        if (state.selectedUser?.uid === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(removeUser.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete user';
      });
  },
});

export const { setSelectedUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;

