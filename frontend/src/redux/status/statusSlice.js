import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  message: '',
  variant: null, // 'success' | 'error' | 'info'
};

const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    setStatus: (state, action) => {
      const { message, variant } = action.payload;
      state.message = message;
      state.variant = variant;
    },
    clearStatus: (state) => {
      state.message = '';
      state.variant = null;
    },
  },
});

export const { setStatus, clearStatus } = statusSlice.actions;
export default statusSlice.reducer;
