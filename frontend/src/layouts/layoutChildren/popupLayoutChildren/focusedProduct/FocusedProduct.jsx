import { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { useTheme } from '@resources/themes/themeContext';
import logoUrl from '/logo.svg?url';
import CloseButton from '../../button/CloseButton';

function FocusedProduct({
  product = {},
  onAddToCart,
  onBuyNow,
  onMoreLikeThis,
  onClose,
}) {
  const { theme } = useTheme();
  // Close on esc
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const name = product?.name || 'Item Name';
  const description = product?.description || 'No description available.';
  const price = product?.price;
  const score = product?.score;
  const priceDisplay = typeof price === 'number' ? `$${price.toFixed(2)}` : '$0.00';

  return (
    <Card
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${name}`}
      className="p-3 shadow position-relative m-auto"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#fffffb',
        color: '#222',
        borderRadius: theme.props.bR_less,
      }}
    >
      {/* Close button */}
      <CloseButton
        onClick={onClose}
        aria-label="Close"
        className="position-absolute"
        style={{
          right: 12,
          top: 8,
          background: '#e8eef6',
          border: '1px solid #9ab',
          borderRadius: theme.props.bR_less,
          padding: '.25rem .5rem',
          fontWeight: 600,
        }}
      />
      <Card.Body className="h-100">
        <Row className="h-100">
          {/* Left column: image/icon + title/description */}
          <Col
            md={5}
            className="d-flex flex-column gap-3"
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                flex: '0 0 auto',
                width: '100%',
                aspectRatio: '4 / 3',
                background: '#e6f0fb',
                border: '2px solid #a7c3e8',
                borderRadius: 6,
              }}
            >
              {product?.imageUrl ? (
                <Card.Img
                  src={product.imageUrl}
                  alt={`Image of ${name}`}
                  style={{
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Card.Img
                  src={logoUrl}
                  alt="Logo"
                  style={{
                    objectFit: 'cover',
                  }}
                />
              )}
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{name}</h2>
              <div style={{ fontSize: '.8rem', marginTop: '.35rem', lineHeight: 1.3 }}>{description}</div>
              <div className='mt-2' style={{ fontSize: '.75rem', fontWeight: 600 }}>Price: {priceDisplay}</div>
              {typeof score === 'number' && (
                <div style={{ fontSize: '.65rem', marginTop: '.25rem', color: '#444' }}>AI Match: {(score * 100).toFixed(0)}%</div>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-auto d-flex flex-wrap gap-2">
              <Button
                variant="primary"
                style={{ ...theme.buttons.contrast }}
                onClick={onAddToCart}
              >
                Add to cart
              </Button>
              <Button
                variant="dark"
                style={{ ...theme.buttons.splash }}
                onClick={onBuyNow}
              >
                Buy
              </Button>
              <Button
                variant="light"
                style={{ ...theme.buttons.muted }}
                onClick={onMoreLikeThis}
              >
                More Like This
              </Button>
            </div>
          </Col>

          {/* Right column: recommendations grid */}
          <Col md={7} className="overflow-auto d-flex flex-column gap-3" style={{ fontSize: '.75rem' }}>
            <div>
              <h5 className='mb-2' style={{ fontSize: '.85rem' }}>You may also like</h5>
              <div style={{ fontSize: '.65rem', color: '#555' }}>Related product recommendations coming soon.</div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
export default FocusedProduct;
