import Card from 'react-bootstrap/Card';
import { useNavigate, useParams } from 'react-router-dom';
import PopupCloseButton from '@children/button/CloseButton';
import { useTheme } from '@resources/themes/themeContext';
import StripePaymentSection from './StripePaymentSection';
import PaymentResult from './PaymentResult';
import { getOrder } from '@api/orders';
import { getPaymentByOrder } from '@api/payments';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearCart } from '@redux/cart/cartSlice';
import OrderSummary from './OrderSummary';

function PaymentPopup() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { orderId } = useParams();

  const dispatch = useDispatch();
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [amountCents, setAmountCents] = useState(0);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getOrder(orderId);
        setOrderError(null);
        if (!active) return;
        setOrderData(data);
        const totalFloat = Number(data?.total || 0);
        setAmountCents(Math.round(totalFloat * 100));
      } catch (err) {
        if (!active) return;
        const unauthorized = [401, 403].includes(err?.response?.status);
        setOrderError({
          message: unauthorized
            ? 'Please log in before viewing this order.'
            : 'Unable to load order details.',
          unauthorized,
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  useEffect(() => {
    if (!showResult || !result || !orderId) return;
    const terminal = new Set([
      'succeeded',
      'required_capture',
      'completed',
      'failed',
      'canceled',
      'refunded',
    ]);
    if (terminal.has(result.status)) return;
    let timer = setInterval(async () => {
      try {
        const data = await getPaymentByOrder(orderId);
        if (data?.status && terminal.has(data.status)) {
          setResult((r) => ({ ...r, status: data.status }));
          clearInterval(timer);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(timer);
  }, [showResult, result, orderId]);

  // Navigate to confirmation page when payment succeeded
  useEffect(() => {
    if (!result || !orderId) return;
    const successStates = new Set(['succeeded', 'completed']);
    if (successStates.has(result.status)) {
      // Clear client-side cart state once on successful payment
      try {
        dispatch(clearCart());
      } catch (e) {
        console.warn('Failed to clear client cart on payment success', e);
      }
      navigate(`/order-confirmation/${orderId}`);
    }
  }, [result, orderId, navigate, dispatch]);

  const isDark = theme?.mode === 'dark';

  return (
    <Card
      role="dialog"
      aria-modal="true"
      aria-label="Payment"
      className="p-3 shadow position-relative m-auto"
      style={{
        width: '75vw',
        height: '75vh',
        maxWidth: '75vw',
        maxHeight: '75vh',
        backgroundColor: isDark ? '#000' : '#fffffb',
        color: isDark ? '#eee' : '#222',
        borderRadius: theme.props?.bR_less || 4,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PopupCloseButton
        onClick={() => navigate('/', { replace: true })}
        ariaLabel="Close payment"
        variant="darkBlue"
      />
      <Card.Body className="h-100 d-flex flex-column gap-3">
        <h2
          className="mb-2"
          style={{ fontSize: '1.1rem' }}
        >
          Payment
        </h2>
        {showResult ? (
          <PaymentResult
            result={result}
            onClose={() => navigate('/', { replace: true })}
          />
        ) : (
          <StripePaymentSection
            orderId={orderId}
            currency="usd"
            amountCents={amountCents}
            onBack={() => navigate('/', { replace: true })}
            onPaymentComplete={(intent) => {
              setResult(intent);
              setShowResult(true);
            }}
          />
        )}

        {orderError && !showResult && (
          <div
            className="alert alert-danger mt-2"
            role="alert"
            aria-live="polite"
          >
            {orderError.message}
            {orderError.unauthorized && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary ms-2"
                onClick={() => navigate('/', { replace: true })}
              >
                Return home to log in
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-dark ms-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {showResult &&
          result &&
          ![
            'succeeded',
            'completed',
            'failed',
            'canceled',
            'refunded',
            'required_capture',
          ].includes(result.status) && (
            <div
              className="mt-2 text-muted"
              style={{ fontSize: '.85rem' }}
            >
              Finalizing payment… (waiting for confirmation)
            </div>
          )}

        {!showResult && orderData && (
          <div className="flex-grow-1 d-flex flex-column overflow-auto">
            <OrderSummary
              validation={{
                items: (orderData.items || []).map((it) => ({
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
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default PaymentPopup;
