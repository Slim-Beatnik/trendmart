import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate } from 'react-router-dom';
import PopupCloseButton from '@children/button/CloseButton';
import { useTheme } from '@resources/themes/themeContext';
import ShippingAddressForm from './ShippingAddressForm';
import { createOrder } from '@api/orders';
import { validateCheckout } from '@api/checkout';
import OrderSummary from './OrderSummary';
import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, attachBackendId } from '@redux/cart/cartSlice';
import { addToCart as addToCartApi } from '@api/cart';

function ShippingPopup() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState('address'); // address | review
  const [validation, setValidation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const cartItems = useSelector(selectCartItems);

  const attemptResyncCart = useCallback(async () => {
    // If we have optimistic items without backend IDs, push them to backend
    const pending = cartItems.filter((ci) => !ci.backendItemId);
    if (!pending.length) return;
    for (const item of pending) {
      try {
        const resp = await addToCartApi(item.productId, item.quantity);
        if (resp?.id) {
          dispatch(
            attachBackendId({
              productId: item.productId,
              backendItemId: resp.id,
            })
          );
        }
      } catch (e) {
        // Ignore; user will still see warning until manual retry or refresh
        console.warn(
          'Resync add failed for product',
          item.productId,
          e?.message
        );
      }
    }
  }, [cartItems, dispatch]);

  const handleAddressComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await validateCheckout();
      // If backend reports empty cart but we have local items, attempt resync then revalidate
      if ((!data?.items || data.items.length === 0) && cartItems.length > 0) {
        await attemptResyncCart();
        data = await validateCheckout();
      }
      setValidation(data);
      setStep('review');
    } catch {
      setError('Unable to validate cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    setCreatingOrder(true);
    setError(null);
    try {
      const res = await createOrder();
      const id = res?.order?.id || res?.order?._id || res?.id;
      if (id) {
        navigate(`/checkout/payment/${id}`);
      } else {
        setError('Order creation failed.');
      }
    } catch {
      setError('Order creation failed.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const headerTitle = step === 'address' ? 'Checkout' : 'Review Order';

  const isDark = theme?.mode === 'dark';

  return (
    <Card
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
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
        onClose={() => navigate('/', { replace: true })}
        ariaLabel="Close checkout"
        variant="darkBlue"
      />
      <Card.Body className="h-100 d-flex flex-column">
        <div
          className="d-inline-flex flex-column gap-3 h-100"
          style={{ minHeight: '400px' }}
        >
          <h2
            className="mb-2"
            style={{ fontSize: '1.1rem' }}
          >
            {headerTitle}
          </h2>

          {step === 'address' && (
            <div className="flex-grow-1 overflow-auto">
              <ShippingAddressForm
                onBack={() => navigate('/', { replace: true })}
                onNext={handleAddressComplete}
              />
            </div>
          )}

          {step === 'review' && (
            <div className="flex-grow-1 d-flex flex-column overflow-auto">
              {validation && !validation.valid && validation.messages && (
                <div
                  className="alert alert-warning py-2 mb-2"
                  style={{ fontSize: '.75rem' }}
                >
                  {validation.messages.map((m, i) => (
                    <div key={i}>{m}</div>
                  ))}
                </div>
              )}
              <OrderSummary validation={validation} />
              <div className="d-flex justify-content-between mt-2">
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setStep('address')}
                >
                  Back
                </Button>
                <Button
                  variant="dark"
                  size="sm"
                  disabled={creatingOrder || !validation?.valid}
                  onClick={handleCreateOrder}
                  style={{ minWidth: '110px' }}
                >
                  {creatingOrder ? (
                    <>
                      <Spinner
                        size="sm"
                        className="me-1"
                      />
                      Creating…
                    </>
                  ) : validation?.valid ? (
                    'Place Order'
                  ) : (
                    'Fix Issues'
                  )}
                </Button>
              </div>
            </div>
          )}

          {loading && <div>Validating cart…</div>}
          {error && (
            <div className="alert alert-danger mt-2">
              {error}
              <Button
                variant="outline-dark"
                size="sm"
                className="ms-2"
                onClick={() => {
                  setError(null);
                  setStep('address');
                }}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default ShippingPopup;
