// Checkout validation API client (stub for future backend integration)
// Intended endpoint: POST /checkout/validate -> returns { items: [...], totals: { subtotal, tax, shipping, total } }
// For now this function attempts the call; if backend not ready it returns a minimal placeholder
import api from './api';

export async function validateCheckout() {
    try {
        const { data } = await api.post('/checkout/validate');
        return normalizeValidationResponse(data, true);
    } catch (e) {
        // If backend returned validation errors (400), still surface structured data
        const data = e?.response?.data;
        if (data) return normalizeValidationResponse(data, false);
        // network or unexpected failure
        return { items: [], subtotal_cents: 0, tax_cents: 0, shipping_cents: 0, total_cents: 0, valid: false, messages: ['Validation request failed'] };
    }
}

function normalizeValidationResponse(data, assumeValidStatus) {
    if (!data || typeof data !== 'object') {
        return { items: [], subtotal_cents: 0, tax_cents: 0, shipping_cents: 0, total_cents: 0, valid: false };
    }
    const itemsSrc = data.items || data.cart_items || [];
    const items = Array.isArray(itemsSrc) ? itemsSrc.map(it => ({
        id: it.product_id || it.id,
        name: it.product_name || it.name,
        quantity: Number(it.quantity || 0),
        price_cents: Math.round(Number(it.price_per_unit || it.price || 0) * 100),
        valid: it.valid !== undefined ? !!it.valid : true,
    })) : [];

    const subtotal = Number(data.subtotal || 0);
    const tax = Number(data.tax_total || data.tax || 0);
    const shipping = Number(data.shipping_total || data.shipping || 0);
    const totalRaw = data.total ?? data.cart_total ?? data.grand_total ?? (subtotal + tax + shipping);

    return {
        items,
        subtotal_cents: Math.round(subtotal * 100),
        tax_cents: Math.round(tax * 100),
        shipping_cents: Math.round(shipping * 100),
        total_cents: Math.round(Number(totalRaw) * 100),
        valid: assumeValidStatus ? data.valid !== false : !!data.valid,
        messages: Array.isArray(data.messages) ? data.messages : (data.error ? [data.error] : []),
        invalid_items: data.invalid_items || [],
    };
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
