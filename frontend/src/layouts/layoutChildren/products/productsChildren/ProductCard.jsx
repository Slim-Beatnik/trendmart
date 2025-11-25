import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { useTheme } from '@resources/themes/themeContext';
import { useDispatch } from 'react-redux';
import { addItem, attachBackendId } from '@redux/cart/cartSlice';
import { addToCart as addToCartApi } from '@api/cart';
import { logCartAdd } from '@api/events';
import { useState } from 'react';

function ProductCard({
    product,
    onBuy,
    onView,
    onAddToCart,
    onMoreLikeThis,
    minimal = false,
    height = null,
}) {
    const { theme } = useTheme();
    if (!product) return null;

    const dispatch = useDispatch();
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState(null);
    const { id, name, imageUrl, description, price, score } = product;
    const priceDisplay = `$${Number(price || 0).toFixed(2)}`;

    const cardHeight = height || undefined;
    return (
        <Card
            className="h-100 w-100 d-flex flex-column shadow-sm"
            data-product-id={id}
            style={{
                minWidth: 0,
                borderRadius: 8,
                background: '#fffffd',
                height: cardHeight || undefined,
            }}
            onClick={() => onView?.(product)}
        >
            {imageUrl ? (
                <Card.Img
                    variant="top"
                    src={imageUrl}
                    alt={name}
                    style={{
                        height: 140,
                        width: '100%',
                        objectFit: 'contain',
                        background: '#e9eef2',
                    }}
                />
            ) : (
                <div
                    style={{
                        height: 140,
                        width: '100%',
                        background: '#e9eef2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '.65rem',
                        color: '#555',
                        fontStyle: 'italic',
                    }}
                >
                    No Image
                </div>
            )}
            <Card.Body
                className="d-flex flex-column p-2"
                style={{ fontSize: '.75rem' }}
            >
                <div
                    className="fw-semibold"
                    style={{
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {name}
                </div>
                {!minimal && description && (
                    <div
                        className="text-muted mt-1"
                        style={{
                            fontSize: '.7rem',
                            lineHeight: 1.2,
                            maxHeight: '2.4rem',
                            overflow: 'hidden',
                        }}
                    >
                        {description}
                    </div>
                )}
                <div className="mt-1 d-flex flex-column gap-1">
                    <div
                        style={{
                            fontSize: '.65rem',
                            color: theme.colors.contrast,
                            fontWeight: 600,
                        }}
                    >
                        {priceDisplay}
                    </div>
                    {score !== undefined && (
                        <div style={{ fontSize: '.6rem', color: theme.colors.text }}>
                            AI Score: {(score * 100).toFixed(0)}%
                        </div>
                    )}
                </div>
                {!minimal && (
                    <div className="mt-2 d-flex gap-2">
                        <Button
                            size="sm"
                            variant="dark"
                            style={{ ...theme.buttons.splash, fontSize: '.7rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onBuy?.(product);
                            }}
                        >
                            Buy
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-primary"
                            style={{ fontSize: '.7rem' }}
                            disabled={adding}
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (onAddToCart) {
                                    onAddToCart(product);
                                    return;
                                }
                                try {
                                    setAddError(null);
                                    setAdding(true);
                                    // Optimistic local add
                                    dispatch(addItem({
                                        productId: id,
                                        name,
                                        price,
                                        quantity: 1,
                                        imageUrl
                                    }));
                                    const resp = await addToCartApi(id, 1);
                                    if (resp?.id) {
                                        dispatch(attachBackendId({ productId: id, backendItemId: resp.id }));
                                    }
                                    try { await logCartAdd(product); } catch { /* ignore */ }
                                } catch (err) {
                                    // Rollback could be implemented; for now rely on server hydration later
                                    console.warn('Add to cart failed', err?.message);
                                    setAddError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Add failed');
                                } finally {
                                    setAdding(false);
                                }
                            }}
                        >
                            {adding ? 'Adding...' : 'Cart'}
                        </Button>
                    </div>
                )}
                {addError && (
                    <div className="mt-2 text-danger" style={{ fontSize: '.6rem', lineHeight: 1.1 }}>
                        {addError}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default ProductCard;
