import { configureStore } from '@reduxjs/toolkit';
import sidebarReducer from './slices/sidebarSlice';
import usersReducer from './slices/usersSlice';
import contactsReducer from './slices/contactsSlice';
import fieldsReducer from './slices/fieldsSlice';

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    users: usersReducer,
    contacts: contactsReducer,
    fields: fieldsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

