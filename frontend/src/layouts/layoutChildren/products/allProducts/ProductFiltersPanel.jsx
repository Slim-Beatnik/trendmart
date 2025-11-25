import { useTheme } from '@resources/themes/themeContext';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

function ProductFiltersPanel({
  categories = [],
  subcategories = [],
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  search,
  setSearch,
  onClear,
}) {
  const { theme } = useTheme();
  const isDark = theme?.mode === 'dark';

  return (
    <div
      className="d-flex flex-column gap-2 p-2 rounded shadow-sm"
      style={{
        background: isDark ? '#0d1117' : '#ffffff',
        border: isDark ? '1px solid #1f2a37' : '1px solid #d8dee4',
        fontSize: '.75rem',
      }}
    >
      <div
        className="fw-semibold"
        style={{ fontSize: '.8rem' }}
      >
        Filters
      </div>
      <Form.Group className="d-flex flex-column gap-1">
        <Form.Label style={{ fontSize: '.65rem', marginBottom: 0 }}>
          Category
        </Form.Label>
        <Form.Select
          size="sm"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSubcategoryId('');
          }}
          style={{ fontSize: '.7rem' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option
              key={c.id}
              value={c.id}
            >
              {c.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="d-flex flex-column gap-1">
        <Form.Label style={{ fontSize: '.65rem', marginBottom: 0 }}>
          Subcategory
        </Form.Label>
        <Form.Select
          size="sm"
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
          disabled={!categoryId || subcategories.length === 0}
          style={{ fontSize: '.7rem' }}
        >
          <option value="">All Subcategories</option>
          {subcategories.map((s) => (
            <option
              key={s.id}
              value={s.id}
            >
              {s.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="d-flex flex-column gap-1">
        <Form.Label style={{ fontSize: '.65rem', marginBottom: 0 }}>
          Search
        </Form.Label>
        <Form.Control
          size="sm"
          type="text"
          placeholder="Name or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ fontSize: '.7rem' }}
        />
      </Form.Group>
      <div className="d-flex gap-2 mt-1">
        <Button
          variant="outline-secondary"
          size="sm"
          style={{ fontSize: '.65rem', ...theme.buttons.muted }}
          onClick={onClear}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

export default ProductFiltersPanel;
