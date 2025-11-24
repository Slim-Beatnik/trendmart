import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Card from 'react-bootstrap/Card';
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

    const isDark = theme?.mode === 'dark';

    return (
        <Card
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            className="p-3 shadow position-relative m-auto"
            style={{
                width: '75vw',
                height: '75vh',
                maxWidth: '75vw',
                maxHeight: '75vh',
                backgroundColor: isDark ? '#000' : '#fffffb',
                color: isDark ? '#eee' : '#222',
                borderRadius: theme.props.bR_less,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Close button styled like FocusedProduct */}
            <PopupCloseButton
                onClose={() => setPopup(null)}
                ariaLabel="Close cart"
                variant="darkBlue"
            />

            <Card.Body className="h-100 d-flex flex-column">
                <Col
                    className="d-inline-flex flex-column justify-content-start align-items-stretch gap-2 px-1 py-2 h-100"
                    style={{
                        minHeight: '400px',
                    }}
                >
                    <h2 className="mb-2" style={{ fontSize: '1.1rem' }}>Your Cart</h2>

                    <div
                        className="flex-grow-1 d-flex flex-column gap-2 overflow-auto"
                        style={{ maxHeight: 'calc(75vh - 220px)' }}
                    >
                        {items.length === 0 && (
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                style={{ fontSize: '.65rem', alignSelf: 'flex-start' }}
                                onClick={() => setPopup(null)}
                            >
                                Browse Products
                            </Button>
                        )}
                        {items.map(item => {
                            const { productId, name, price, quantity, imageUrl, backendItemId } = item;
                            const lineTotal = (Number(price) || 0) * quantity;
                            const busy = loadingItemId === productId;
                            return (
                                <Row
                                    key={productId}
                                    className="gx-2 py-2 border rounded align-items-center"
                                    style={{ background: isDark ? '#111' : '#fff', fontSize: '.75rem', borderColor: isDark ? '#333' : undefined }}
                                >
                                    <Col xs={3} className="d-flex justify-content-center">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={name}
                                                style={{ width: '100%', height: '55px', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <div
                                                className="w-100 d-flex align-items-center justify-content-center"
                                                style={{ height: '55px', background: isDark ? '#222' : '#f8f9fa' }}
                                            >
                                                <span className="text-muted" style={{ fontSize: '.6rem' }}>
                                                    No image
                                                </span>
                                            </div>
                                        )}
                                    </Col>
                                    <Col xs={5} className="d-flex flex-column">
                                        <strong style={{ lineHeight: 1.1 }}>{name}</strong>
                                        <span className="text-muted">
                                            ${Number(price).toFixed(2)}
                                        </span>
                                        <span className="text-muted">
                                            Line: ${lineTotal.toFixed(2)}
                                        </span>
                                        {errorMap[productId] && (
                                            <span className="text-danger">
                                                {errorMap[productId]}
                                            </span>
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
                        <div className="d-flex justify-content-between">
                            <span>Subtotal</span>
                            <strong>${subtotal.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span>Tax</span>
                            <strong>${tax.toFixed(2)}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span>Total</span>
                            <strong>${total.toFixed(2)}</strong>
                        </div>
                    </div>

                    <Button
                        className="mt-3 align-self-center fw-semibold"
                        style={{ ...theme.buttons.splash, fontSize: '.8rem' }}
                        disabled={items.length === 0}
                        onClick={() => {
                            import('@children/popupLayoutChildren/checkout/ShippingPopup')
                                .then(mod => {
                                    const ShippingPopup = mod.default;
                                    setPopup(<ShippingPopup />);
                                })
                                .catch(() => setPopup(null));
                        }}
                    >
                        Proceed to Checkout
                    </Button>
                </Col>
            </Card.Body>
        </Card>
    );
}

export default CartPopup;
