import Card from 'react-bootstrap/Card';
import { useNavigate, useParams } from 'react-router-dom';
import PopupCloseButton from '@children/button/CloseButton';
import { useTheme } from '@resources/themes/themeContext';
import StripePaymentSection from './StripePaymentSection';
import PaymentResult from './PaymentResult';
import { getOrder } from '@api/orders';
import { getPaymentByOrder } from '@api/payments';
import { useState, useEffect } from 'react';
import OrderSummary from './OrderSummary';

function PaymentPopup() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [result, setResult] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState(null);
    const [amountCents, setAmountCents] = useState(0);
    const [orderData, setOrderData] = useState(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await getOrder(orderId);
                if (!active) return;
                setOrderData(data);
                const totalFloat = Number(data?.total || 0);
                setAmountCents(Math.round(totalFloat * 100));
            } catch {
                if (!active) return;
                setError('Unable to load order details.');
            }
        })();
        return () => { active = false; };
    }, [orderId]);

    useEffect(() => {
        if (!showResult || !result || !orderId) return;
        const terminal = new Set(['succeeded', 'required_capture', 'completed', 'failed', 'canceled', 'refunded']);
        if (terminal.has(result.status)) return;
        let timer = setInterval(async () => {
            try {
                const data = await getPaymentByOrder(orderId);
                if (data?.status && terminal.has(data.status)) {
                    setResult(r => ({ ...r, status: data.status }));
                    clearInterval(timer);
                }
            } catch { }
        }, 4000);
        return () => clearInterval(timer);
    }, [showResult, result, orderId]);

    // Navigate to confirmation page when payment succeeded
    useEffect(() => {
        if (!result || !orderId) return;
        const successStates = new Set(['succeeded', 'completed']);
        if (successStates.has(result.status)) {
            navigate(`/order-confirmation/${orderId}`);
        }
    }, [result, orderId, navigate]);

    return (
        <Card className='p-3 shadow position-relative m-auto'
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#fffffb',
                color: '#222',
                borderRadius: 4,
                ...theme.schemes.darkText,
            }}
        >
            <PopupCloseButton onClick={() => navigate(-1)} />
            <Card.Body className='h-100 d-flex flex-column gap-3' style={{ overflowY: 'auto' }}>
                <h3 className='m-0'>Payment</h3>
                {showResult ? (
                    <PaymentResult
                        result={result}
                        onClose={() => navigate(-1)}
                    />
                ) : (
                    <StripePaymentSection
                        orderId={orderId}
                        currency='usd'
                        amountCents={amountCents}
                        onBack={() => navigate(-1)}
                        onPaymentComplete={(intent) => { setResult(intent); setShowResult(true); }}
                        onInitError={(msg) => setError(msg)}
                    />
                )}

                {error && !showResult && (
                    <div className='alert alert-danger mt-2' role='alert' aria-live='polite'>
                        {error}
                        <button type='button' className='btn btn-sm btn-outline-dark ms-2' onClick={() => window.location.reload()}>
                            Retry
                        </button>
                    </div>
                )}

                {showResult && result && !['succeeded', 'completed', 'failed', 'canceled', 'refunded', 'required_capture'].includes(result.status) && (
                    <div className='mt-2 text-muted' style={{ fontSize: '.85rem' }}>
                        Finalizing payment… (waiting for confirmation)
                    </div>
                )}

                {!showResult && orderData && (
                    <OrderSummary
                        validation={{
                            items: (orderData.items || []).map(it => ({
                                id: it.id,
                                name: it.product_name || it.name,
                                quantity: it.quantity,
                                price_cents: Math.round(Number(it.price_per_unit || 0) * 100),
                            })),
                            total_cents: Math.round(Number(orderData.total || 0) * 100),
                            tax_cents: Math.round(Number(orderData.tax_total || 0) * 100),
                            shipping_cents: 0,
                        }}
                    />
                )}
            </Card.Body>
        </Card>
    );
}

export default PaymentPopup;
