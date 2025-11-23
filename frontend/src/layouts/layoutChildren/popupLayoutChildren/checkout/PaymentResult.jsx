import Button from 'react-bootstrap/Button';
import { useTheme } from '@resources/themes/themeContext';

function PaymentResult({ result, onClose }) {
  const { theme } = useTheme();
  const succeeded =
    result?.status === 'succeeded' || result?.status === 'required_capture';

  return (
    <div className="d-flex flex-column justify-content-center align-items-center gap-3 flex-grow-1">
      <h4 className="m-0">
        {succeeded ? 'Payment Successful' : 'Payment Status'}
      </h4>
      <div
        className="text-muted"
        style={{ maxWidth: 520, textAlign: 'center' }}
      >
        {succeeded
          ? 'Your payment has been processed successfully.'
          : `Payment status: ${result?.status || 'unknown'}. Please review in your orders.`}
      </div>
      <Button
        variant="dark"
        onClick={onClose}
        style={{ ...theme.buttons.splash }}
      >
        Close
      </Button>
    </div>
  );
}

export default PaymentResult;
