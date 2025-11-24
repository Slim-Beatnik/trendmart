import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { getStripe } from '../../../../stripe/stripeClients';
import { getStripeConfig, createPaymentIntent } from '@api/payments';
import StripeCardForm from './StripeCardForm';

function StripePaymentSection({
  orderId,
  currency = 'usd',
  amountCents = 0,
  onBack,
  onPaymentComplete,
}) {
  const [publishableKey, setPublishableKey] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [fakeMode, setFakeMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [needAuth, setNeedAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setNeedAuth(false);
        const cfg = await getStripeConfig();
        setPublishableKey(cfg?.publishableKey || cfg?.publishable_key);
        setFakeMode(Boolean(cfg?.fake));
        const intent = await createPaymentIntent({
          orderId,
          currency,
          amountCents,
        });
        setClientSecret(intent?.client_secret);
        setErr(null);
      } catch (e) {
        const unauthorized = e?.response?.status === 401;
        const payload = e?.response?.data || {};
        const baseMessage = payload.message || payload.error || 'Unable to initialize payment.';
        const detail = payload.details ? `${payload.details}` : '';
        setNeedAuth(unauthorized);
        setErr(`${baseMessage}${detail}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, currency]);

  if (loading) return <div>Loading payment…</div>;
  if (err)
    return (
      <div className="d-flex flex-column gap-2">
        <div className="text-danger">{err}</div>
        {needAuth && (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => navigate('/')}
          >
            Go back to home to log in
          </button>
        )}
        <button
          className="btn btn-sm btn-outline-dark"
          onClick={() => window.location.reload()}
        >
          Retry Initialization
        </button>
      </div>
    );
  if (!publishableKey || !clientSecret)
    return <div className="text-danger">Missing Stripe configuration.</div>;

  if (fakeMode) {
    return (
      <div className="d-flex flex-column gap-3">
        <div>Simulated payment mode. No card entry required.</div>
        <button
          className="btn btn-dark"
          onClick={() => onPaymentComplete?.({ client_secret: clientSecret, status: 'completed' })}
        >
          Complete Payment
        </button>
        <button className="btn btn-outline-secondary" onClick={onBack}>Back</button>
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{ clientSecret }}
    >
      <StripeCardForm
        clientSecret={clientSecret}
        currency={currency}
        amountCents={amountCents}
        onBack={onBack}
        onComplete={onPaymentComplete}
      />
    </Elements>
  );
}

export default StripePaymentSection;
