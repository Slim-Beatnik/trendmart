import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProductCard from './ProductCard';

// Single-row grid: up to 4 products, no internal scrolling
function ProductGrid({ products = [], onSelect, onAddToCart, loading, error }) {
  // DELETE!!!
  products =  [1, "ASUS ZenBook X14", "ASUS ZenBook X14 in the Electronics / Laptops category at $1299.99 (rated 4.5/5) featuring brand asus, Windows, core I7, 16gb, 1tb.", 1299.99 ]
  
  return (
    <div
      className="w-100"
      style={{ padding: '0.5rem 0' }}
    >
      {loading && <div className="text-muted small px-2">Loading...</div>}
      {error && !loading && (
        <div className="text-danger small px-2">{error}</div>
      )}
      <Row className="gx-3 m-0 w-100">
        {products.map((p, idx) => (
          <Col
            key={p.id || idx}
            xs={12}
            sm={6}
            md={3}
            lg={3}
            className="d-flex"
          >
            <ProductCard
              product={p}
              minimal
              onView={() => onSelect?.(p)}
              onAddToCart={onAddToCart}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default ProductGrid;
