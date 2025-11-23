import { useState, useCallback } from 'react';
import ProductCategories from '../layoutChildren/products/ProductCategories';
import FeaturedProducts from '../layoutChildren/products/FeaturedProducts';
import RecommendedProducts from '../layoutChildren/products/RecommendedProducts';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useTheme } from '@resources/themes/themeContext';

function MasterGrid() {
  const { theme } = useTheme();
  const [activeCategoryId, setActiveCategoryId] = useState(null); // numeric id from API
  const [activeCategoryName, setActiveCategoryName] = useState(null); // display name

  const handleSelectCategory = useCallback((category) => {
    // category expected shape: { id, name }
    if (!category) {
      setActiveCategoryId(null);
      setActiveCategoryName(null);
      return;
    }
    setActiveCategoryId(category.id);
    setActiveCategoryName(category.name);
  }, []);

  return (
    <Row
      className="w-100 d-flex flex-row m-0"
      style={{ backgroundColor: theme.colors.whiteBg, padding: '2rem' }}
    >
      <Col
        id="leftCol"
        className="flex-column m-0 p-0 d-none d-sm-flex flex-grow-0-ns align-self-start"
        style={{
          maxWidth: '20%',
          borderRight: `.13rem solid ${theme.colors.details}`,
        }}
      >
        <ProductCategories
          onSelectCategory={handleSelectCategory}
          activeCategoryId={activeCategoryId}
        />
      </Col>

      <Col
        id="rightCol"
        className="d-flex flex-column w-100 ps-5"
        style={{ gap: '2.3rem' }}
      >
        <Row
          id="featuredRow"
          className="d-flex flex-row"
          style={{ borderBottom: `.13rem solid ${theme.colors.details}` }}
        >
          <FeaturedProducts activeCategoryId={activeCategoryId} activeCategoryName={activeCategoryName} onClearCategory={() => handleSelectCategory(null)} />
        </Row>
        <Row className="d-flex flex-column">
          <RecommendedProducts />
        </Row>
      </Col>
    </Row>
  );
}

export default MasterGrid;
