import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken } from '@api/api';
import { setStatus } from '../status/statusSlice';

const initialState = {
  user: null,
  isAuthenticated: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'error'
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // Attach token immediately
      const token = response.data?.access_token;
      if (token) setAuthToken(token);
      dispatch(setStatus({ message: 'Login successful.', variant: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(
        setStatus({
          message:
            error.response?.data?.message || 'Login failed. Check credentials.',
          variant: 'error',
        })
      );
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createUser = createAsyncThunk(
  'auth/register',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/auth/register', { email, password });
      dispatch(
        setStatus({
          message: 'Registration successful. You are now logged in.',
          variant: 'success',
        })
      );

      // Expect { user: {...} }
      return response.data.user;
    } catch (error) {
      dispatch(
        setStatus({
          message: error.response?.data?.message || 'Registration failed.',
          variant: 'error',
        })
      );
      return rejectWithValue(error.response?.data);
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      // If the page was refreshed, api.js bootstraps from localStorage already.
      const response = await api.get('/auth/protected');

      // Expect { user }
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.post('/auth/logout');
      dispatch(
        setStatus({
          message: "Logged out successfully. We'll see you next time!",
          variant: 'info',
        })
      );
      return null;
    } catch (error) {
      dispatch(
        setStatus({
          message: error.response?.data?.message || 'Logout failed.',
          variant: 'error',
        })
      );
      return rejectWithValue(error.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.status = 'succeeded';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
        state.status = 'error';
      })

      // REGISTER
      .addCase(createUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.status = 'succeeded';
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
        state.status = 'error';
      })

      // CHECK SESSION
      .addCase(checkAuthStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.status = 'succeeded';
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.status = 'error';
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.status = 'idle';
      });
  },
});

export default authSlice.reducer;
