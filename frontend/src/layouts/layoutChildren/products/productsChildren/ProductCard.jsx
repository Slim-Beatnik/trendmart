import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { useTheme } from '@resources/themes/themeContext';
import { useDispatch } from 'react-redux';
import { addItem } from '@redux/cart/cartSlice';
import { addToCart as addToCartApi } from '@api/cart';
import { logCartAdd } from '@api/events';
import { attachBackendId } from '@redux/cart/cartSlice';
import { useSelector } from 'react-redux';
import { selectCartTotal } from '@redux/cart/cartSlice';
import { useState } from 'react';
import Logo from '@children/logo/Logo';

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

    const { id, name, imageUrl, description, price, score } = product;
    const priceDisplay = `$${Number(price || 0).toFixed(2)}`;

    const dispatch = useDispatch();
    const [adding, setAdding] = useState(false);

    const cardHeight = height || undefined;
    const handleAddToCartInternal = async (e) => {
        e.stopPropagation();
        if (!product || adding) return;
        setAdding(true);
        // Optimistic local add
        dispatch(addItem({
            productId: id,
            name,
            price: Number(price || 0),
            imageUrl: imageUrl || null,
            quantity: 1
        }));
        try {
            const resp = await addToCartApi(id, 1);
            // API returns { cart_item: { id, product_id, quantity, ... }, cart_total, message }
            const backendId = resp?.cart_item?.id;
            if (backendId) {
                dispatch(attachBackendId({ productId: id, backendItemId: backendId }));
            }
            // Use allowed generic source for analytics
            logCartAdd(product, 'cold_start').catch(() => { });
        } catch (err) {
            console.warn('Cart sync failed', err);
        } finally {
            setAdding(false);
        }
        onAddToCart?.(product);
    };

    return (
        <Card
            className="h-100 w-100 d-flex flex-column shadow-sm"
            data-product-id={id}
            style={{ minWidth: 0, borderRadius: 8, background: '#fffffd', height: cardHeight || undefined }}
            onClick={() => onView?.(product)}
        >
            {imageUrl ? (
                <Card.Img
                    variant="top"
                    src={imageUrl}
                    alt={name}
                    style={{ height: 140, width: '100%', objectFit: 'contain', background: '#e9eef2' }}
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
                        color: '#555'
                    }}
                    aria-label="No image available"
                >
                    No image
                </div>
            )}
            <Card.Body className="d-flex flex-column p-2" style={{ fontSize: '.75rem' }}>
                <div className="fw-semibold" style={{ lineHeight: 1.2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {name}
                </div>
                {!minimal && description && (
                    <div className="text-muted mt-1" style={{ fontSize: '.7rem', lineHeight: 1.2, maxHeight: '2.4rem', overflow: 'hidden', }}>
                        {description}
                    </div>
                )}
                <div className='mt-1 d-flex flex-column gap-1'>
                    <div style={{ fontSize: '.65rem', color: '#222', fontWeight: 600 }}>{priceDisplay}</div>
                    {score !== undefined && (
                        <div style={{ fontSize: '.6rem', color: '#555' }}>
                            AI Score: {(score * 100).toFixed(0)}%
                        </div>
                    )}
                </div>
                {!minimal && (
                    <div className="mt-2 d-flex gap-2">
                        <Button
                            size='sm'
                            variant='dark'
                            style={{ ...theme.buttons.splash, fontSize: '.7rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onBuy?.(product);
                            }}
                        >
                            Buy
                        </Button>
                        {onAddToCart && (
                            <Button
                                size='sm'
                                variant='outline-primary'
                                style={{ fontSize: '.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: '42px' }}
                                disabled={adding}
                                onClick={handleAddToCartInternal}
                                aria-label='Add to cart'
                            >
                                {adding ? (
                                    <Spinner size='sm' animation='border' />
                                ) : (
                                    <div style={{ width: 20, height: 20, display: 'flex' }}>
                                        <Logo details={false} />
                                    </div>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default ProductCard;