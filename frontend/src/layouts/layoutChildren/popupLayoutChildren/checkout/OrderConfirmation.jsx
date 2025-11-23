import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import PopupCloseButton from '@children/button/CloseButton';
import { useTheme } from '@resources/themes/themeContext';
import { getOrder } from '@api/orders';
import { getPaymentByOrder } from '@api/payments';
import OrderSummary from './OrderSummary';

function OrderConfirmation() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState(null);
    const [payment, setPayment] = useState(null);

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const o = await getOrder(orderId);
                const p = await getPaymentByOrder(orderId);
                if (!active) return;
                setOrder(o);
                setPayment(p);
                setError(null);
            } catch (e) {
                if (!active) return;
                setError('Unable to load order confirmation data.');
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [orderId]);

    const validation = order ? {
        items: (order.items || []).map(it => ({
            id: it.id,
            name: it.product_name || it.name,
            quantity: it.quantity,
            price_cents: Math.round(Number(it.price_per_unit || 0) * 100)
        })),
        tax_cents: Math.round(Number(order.tax_total || 0) * 100),
        shipping_cents: 0,
        total_cents: Math.round(Number(order.total || 0) * 100)
    } : null;

    return (
        <Card className='p-3 shadow position-relative m-auto'
            style={{
                width: 'min(92vw, 640px)',
                maxHeight: '90vh',
                backgroundColor: '#fffffb',
                color: '#222',
                borderRadius: 4,
                ...theme.schemes.darkText,
            }}
        >
            <PopupCloseButton onClick={() => navigate(-1)} />
            <Card.Body className='d-flex flex-column gap-3' style={{ overflowY: 'auto' }}>
                <h3 className='m-0'>Order Confirmation</h3>
                {loading && <div>Loading confirmation…</div>}
                {error && (
                    <div className='alert alert-danger'>{error}</div>
                )}
                {!loading && !error && order && (
                    <>
                        <div className='d-flex flex-column gap-1'>
                            <div><strong>Order ID:</strong> {orderId}</div>
                            <div><strong>Payment Status:</strong> {payment?.status || 'pending'}</div>
                        </div>
                        <OrderSummary validation={validation} />
                        <div className='d-flex justify-content-end'>
                            <button className='btn btn-dark' onClick={() => navigate('/')}>Return Home</button>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

export default OrderConfirmation;