import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import statusReducer from './status/statusSlice';
import themeReducer from './theme/themeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    status: statusReducer,
    theme: themeReducer,
  },
});

export default store;
