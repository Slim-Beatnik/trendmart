import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTheme } from '@resources/themes/themeContext';

function StripeCardForm({
  clientSecret,
  currency,
  amountCents,
  onBack,
  onComplete,
}) {
  const { theme } = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!stripe || !elements) return;

    setProcessing(true);
    const card = elements.getElement(CardElement);

    const { paymentIntent, error } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: { card },
      }
    );

    if (error) {
      setErrorMsg(error.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    setProcessing(false);
    onComplete?.(paymentIntent);
  };

  return (
    <form
      className="d-flex flex-column gap-3"
      onSubmit={handleSubmit}
    >
      <div className="d-flex justify-content-between align-items-center">
        <Button
          variant="outline-secondary"
          onClick={onBack}
          type="button"
          style={{ ...theme.buttons.muted }}
        >
          Back
        </Button>
        <div className="fw-bold">
          Pay {currency?.toUpperCase()} ${(amountCents / 100).toFixed(2)}
        </div>
        <Button
          variant="dark"
          type="submit"
          disabled={!stripe || processing}
          style={{ ...theme.buttons.splash }}
        >
          {processing ? 'Processing…' : 'Pay'}
        </Button>
      </div>

      <div
        className="p-2"
        style={{
          border: '1px solid #ccc',
          borderRadius: 6,
          background: '#fff',
        }}
      >
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {errorMsg && (
        <div className="d-flex flex-column gap-2">
          <div className="text-danger">{errorMsg}</div>
          <Button
            variant="outline-dark"
            type="submit"
            disabled={processing}
            style={{ ...theme.buttons.muted }}
          >
            Try Again
          </Button>
        </div>
      )}
    </form>
  );
}

export default StripeCardForm;
