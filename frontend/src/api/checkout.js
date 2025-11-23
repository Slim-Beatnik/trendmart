// Checkout validation API client (stub for future backend integration)
// Intended endpoint: POST /checkout/validate -> returns { items: [...], totals: { subtotal, tax, shipping, total } }
// For now this function attempts the call; if backend not ready it returns a minimal placeholder
import api from './api';

export async function validateCheckout() {
    try {
        const { data } = await api.post('/checkout/validate');
        if (data && (Array.isArray(data.items) || Array.isArray(data.cart_items))) {
            const items = data.items || data.cart_items || [];
            return {
                items: items.map(it => ({
                    id: it.id || it.product_id,
                    name: it.name || it.product_name,
                    quantity: Number(it.quantity || 0),
                    price_cents: Math.round(Number(it.price_per_unit || it.price || 0) * 100)
                })),
                tax_cents: Math.round(Number(data.tax || data.tax_total || 0) * 100),
                shipping_cents: Math.round(Number(data.shipping || data.shipping_total || 0) * 100),
                total_cents: Math.round(Number(data.total || data.grand_total || 0) * 100),
            };
        }
    } catch (e) {
        // fall back to placeholder when endpoint not available
    }
    return { items: [], tax_cents: 0, shipping_cents: 0, total_cents: 0 };
}

// Safe wrapper returning {data, error}
export async function safeValidateCheckout() {
    try {
        const data = await validateCheckout();
        return { data, error: null };
    } catch (error) {
        const res = error?.response;
        return {
            data: res?.data || null,
            error: res?.data?.error || res?.data?.message || error?.message || 'Checkout validation failed',
        };
    }
}
