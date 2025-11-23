import { useState, useEffect, useCallback } from 'react';
import Stack from 'react-bootstrap/Stack';
import SearchbarRow from '../sectionSearchbar/SearchbarRow';
import { Container } from 'react-bootstrap';
import { listCategories } from '@api/catalog';
import HoverCategory from './productsChildren/HoverCategory';

function ProductCategories({ onSelectCategory, activeCategoryId }) {
  const [categories, setCategories] = useState(null); // null = loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await listCategories();
        if (!ignore) setCategories(result);
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load categories');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, []);

  const placeholderCategories = [
    { id: 'ph-1', name: 'Category 1', slug: 'category-1' },
    { id: 'ph-2', name: 'Category 2', slug: 'category-2' },
    { id: 'ph-3', name: 'Category 3', slug: 'category-3' },
    { id: 'ph-4', name: 'Category 4', slug: 'category-4' },
  ];

  const displayedCategories = categories?.length ? categories : placeholderCategories;

  const handleSelect = useCallback((cat) => {
    if (!onSelectCategory) return;
    // toggle capability: clicking active again clears selection
    if (activeCategoryId && cat.id === activeCategoryId) {
      onSelectCategory(null);
    } else {
      onSelectCategory(cat);
    }
  }, [onSelectCategory, activeCategoryId]);

  return (
    <Container fluid className="p-0 m-0" style={{ height: '100%' }}>
      <Stack direction="vertical" className="d-flex justify-content-start align-items-stretch gap-2 m-0 p-0 w-100">
        <div className='d-flex flex-column ms-3 mt-2 mb-1'>
          <SearchbarRow searchId="subcategorySearch" placeholder="Filter by category" />
          {activeCategoryId && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-2 align-self-start"
              onClick={() => onSelectCategory?.(null)}
            >
              Clear Category
            </button>
          )}
        </div>
        {loading && <div className="small text-muted px-3">Loading categories…</div>}
        {error && !loading && <div className="small text-danger px-3">{error}</div>}
        {displayedCategories.map((cat) => {
          const active = activeCategoryId === cat.id;
          return (
            <HoverCategory
              key={cat.id}
              linksTo={null}
              onClick={() => handleSelect(cat)}
              style={{
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
                background: active ? '#eef3f9' : 'transparent',
                padding: '.35rem .75rem',
                borderRadius: 4,
                border: active ? '1px solid #c5d4e6' : '1px solid transparent'
              }}
            >
              {cat.name}
            </HoverCategory>
          );
        })}
      </Stack>
    </Container>
  );
}

export default ProductCategories;

