import { createSlice } from '@reduxjs/toolkit';

const userPrefMode = () => {
  try {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
  } catch (e) {
    console.log(e);
    return 'light';
  }
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: userPrefMode() },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setTheme(state, action) {
      state.mode = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
