import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import statusReducer from './status/statusSlice';
import themeReducer from './theme/themeSlice';
import cartReducer from './cart/cartSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    status: statusReducer,
    theme: themeReducer,
    cart: cartReducer,
  },
});

export default store;
