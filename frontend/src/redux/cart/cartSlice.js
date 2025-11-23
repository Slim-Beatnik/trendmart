import { createSlice } from '@reduxjs/toolkit';

const TAX_RATE = 0.07;

const initialState = {
    items: [] // Each item: { productId, name, price, quantity }
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        hydrateCart(state, action) {
            state.items = action.payload || [];
        },
        addItem(state, action) {
            const product = action.payload;
            const index = state.items.findIndex(item => item.productId === product.productId);
            if (index === -1) {
                state.items.push({ ...product, quantity: product.quantity || 1 });
            } else {
                state.items[index].quantity += product.quantity || 1;
            }
        },
        updateQuantity(state, action) {
            const { productId, quantity } = action.payload;
            const q = Math.max(1, quantity);
            state.items = state.items.map(item => item.productId === productId ? { ...item, quantity: q } : item);
        },
        removeItem(state, action) {
            const productId = action.payload;
            state.items = state.items.filter(item => item.productId !== productId);
        },
        clearCart(state) {
            state.items = [];
        }
    }
});

export const { hydrateCart, addItem, updateQuantity, removeItem, clearCart } = cartSlice.actions;

// Selectors
export const selectCartItems = state => state.cart.items;
export const selectCartQuantity = state =>
    state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartSubtotal = state =>
    state.cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0);
export const selectCartTax = state =>
    +(selectCartSubtotal(state) * TAX_RATE).toFixed(2);
export const selectCartTotal = state =>
    +(selectCartSubtotal(state) + selectCartTax(state)).toFixed(2);

export default cartSlice.reducer;