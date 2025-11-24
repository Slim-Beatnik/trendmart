import Card from 'react-bootstrap/Card';
import { useNavigate } from 'react-router-dom';
import PopupCloseButton from '@children/button/CloseButton';
import { useTheme } from '@resources/themes/themeContext';
import ShippingAddressForm from './ShippingAddressForm';
import { createOrder } from '@api/orders';
import { validateCheckout } from '@api/checkout';
import OrderSummary from './OrderSummary';
import { useState } from 'react';

function ShippingPopup() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [step, setStep] = useState('address'); // address | reviewing
    const [validation, setValidation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);

    const handleAddressComplete = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await validateCheckout();
            setValidation(data);
            setStep('reviewing');
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
                <h3 className='m-0'>Shipping</h3>
                {step === 'address' && (
                    <ShippingAddressForm
                        onBack={() => navigate(-1)}
                        onNext={handleAddressComplete}
                    />
                )}

                {step === 'reviewing' && (
                    <>
                        <h5 className='mb-1'>Review Order</h5>
                        <OrderSummary validation={validation} />
                        <div className='d-flex justify-content-between'>
                            <button className='btn btn-outline-secondary' onClick={() => setStep('address')}>Back</button>
                            <button className='btn btn-dark' disabled={creatingOrder} onClick={handleCreateOrder}>
                                {creatingOrder ? 'Creating…' : 'Create Order'}
                            </button>
                        </div>
                    </>
                )}

                {loading && <div>Validating cart…</div>}
                {error && (
                    <div className='alert alert-danger mt-2'>
                        {error}
                        <button className='btn btn-sm btn-outline-dark ms-2' onClick={() => { setError(null); setStep('address'); }}>Retry</button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default ShippingPopup;
