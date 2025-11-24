import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import PopupCloseButton from '@children/button/CloseButton';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { useTheme } from '@resources/themes/themeContext';
import {
    selectCartItems,
    selectCartSubtotal,
    selectCartTax,
    selectCartTotal,
    updateQuantity,
    removeItem
} from '@redux/cart/cartSlice';
import { updateCartItem, removeFromCart } from '@api/cart';

// A popup cart panel following existing popup layout styling conventions.
// Provides quantity adjustment and item removal with backend sync.

function CartPopup({ setPopup }) {
    const dispatch = useDispatch();
    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartSubtotal);
    const tax = useSelector(selectCartTax);
    const total = useSelector(selectCartTotal);
    const { theme } = useTheme();

    const [loadingItemId, setLoadingItemId] = useState(null);
    const [errorMap, setErrorMap] = useState({});

    const handleQuantityChange = async (productId, backendItemId, nextQty) => {
        if (!backendItemId) {
            // If backend ID missing, just optimistic update for now
            dispatch(updateQuantity({ productId, quantity: nextQty }));
            return;
        }
        setLoadingItemId(productId);
        dispatch(updateQuantity({ productId, quantity: nextQty })); // optimistic
        try {
            await updateCartItem(backendItemId, nextQty);
            setErrorMap(prev => ({ ...prev, [productId]: null }));
        } catch (err) {
            console.warn('Failed to sync quantity', err);
            setErrorMap(prev => ({ ...prev, [productId]: 'Sync failed' }));
        } finally {
            setLoadingItemId(null);
        }
    };

    const handleRemove = async (productId, backendItemId) => {
        setLoadingItemId(productId);
        dispatch(removeItem(productId)); // optimistic remove
        if (backendItemId) {
            try {
                await removeFromCart(backendItemId);
            } catch (err) {
                console.warn('Failed to remove from backend', err);
            }
        }
        setLoadingItemId(null);
    };

    return (
        <Col
            className="d-inline-flex flex-column position-relative justify-content-start align-items-stretch gap-2 px-3 py-4 m-auto"
            style={{
                minHeight: '400px',
                minWidth: '340px',
                maxWidth: '420px',
                ...theme.schemes.darkText,
                borderRadius: theme.props.bR_less,
                filter: 'drop-shadow(.5rem .5rem 1rem #0a1f44e8)',
            }}
        >
            <PopupCloseButton onClick={() => setPopup(null)} />
            <h2 className="mb-2">Your Cart</h2>
            <div
                className="flex-grow-1 d-flex flex-column gap-2 overflow-auto"
                style={{ maxHeight: '50vh' }}
            >
                {items.length === 0 && (
                    <div className="text-muted">Cart is empty.</div>
                )}
                {items.map(item => {
                    const { productId, name, price, quantity, imageUrl, backendItemId } = item;
                    const lineTotal = (Number(price) || 0) * quantity;
                    const busy = loadingItemId === productId;
                    return (
                        <Row
                            key={productId}
                            className="gx-2 py-2 border rounded align-items-center"
                            style={{ background: '#fff', fontSize: '.75rem' }}
                        >
                            <Col xs={3} className="d-flex justify-content-center">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={name}
                                        style={{ width: '100%', height: '55px', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div className="bg-light w-100 d-flex align-items-center justify-content-center" style={{ height: '55px' }}>
                                        <span className="text-muted" style={{ fontSize: '.6rem' }}>No image</span>
                                    </div>
                                )}
                            </Col>
                            <Col xs={5} className="d-flex flex-column">
                                <strong style={{ lineHeight: 1.1 }}>{name}</strong>
                                <span className="text-muted">${Number(price).toFixed(2)}</span>
                                <span className="text-muted">Line: ${lineTotal.toFixed(2)}</span>
                                {errorMap[productId] && (
                                    <span className="text-danger">{errorMap[productId]}</span>
                                )}
                            </Col>
                            <Col xs={4} className="d-flex flex-column align-items-end gap-1">
                                <Form.Control
                                    type="number"
                                    min={1}
                                    value={quantity}
                                    disabled={busy}
                                    style={{ width: '72px', fontSize: '.7rem' }}
                                    onChange={(e) => {
                                        const next = parseInt(e.target.value, 10) || 1;
                                        handleQuantityChange(productId, backendItemId, next);
                                    }}
                                />
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={busy}
                                    style={{ fontSize: '.65rem' }}
                                    onClick={() => handleRemove(productId, backendItemId)}
                                >
                                    {busy ? <Spinner size="sm" /> : 'Remove'}
                                </Button>
                            </Col>
                        </Row>
                    );
                })}
            </div>
            {/* Totals */}
            <div className="mt-2 d-flex flex-column gap-1" style={{ fontSize: '.8rem' }}>
                <div className="d-flex justify-content-between"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
                <div className="d-flex justify-content-between"><span>Tax</span><strong>${tax.toFixed(2)}</strong></div>
                <div className="d-flex justify-content-between"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            </div>
            <Button
                className="mt-3 align-self-center fw-semibold"
                style={{ ...theme.buttons.splash, fontSize: '.8rem' }}
                disabled={items.length === 0}
                onClick={() => {


                    setPopup(null);
                }}
            >
                Proceed to Checkout
            </Button>
        </Col>
    );
}

export default CartPopup;
