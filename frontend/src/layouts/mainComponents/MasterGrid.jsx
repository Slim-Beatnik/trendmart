import { useState, useCallback } from 'react';
import ProductCategories from '@children/products/ProductCategories';
import FeaturedProducts from '@children/products/FeaturedProducts';
import RecommendedProducts from '@children/products/RecommendedProducts';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useTheme } from '@resources/themes/themeContext';
import ChildrenMayScroll from '@resources/wrapperComponents/ChildrenMayScroll';

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
      style={{ backgroundColor: theme.colors.whiteBg, padding: '1rem' }}
    >
      <Col
        id="leftCol"
        className="align-self-center"
        style={{
          minHeight: '69vh',
          maxWidth: '20%',
          minWidth: '20%',
          borderRight: `.13rem solid ${theme.colors.details}`,
        }}
      >
        <ChildrenMayScroll direction="vertical">
          <ProductCategories
            onSelectCategory={handleSelectCategory}
            activeCategoryId={activeCategoryId}
          />
        </ChildrenMayScroll>
      </Col>

      <Col
        id="rightCol"
        className="d-flex flex-column w-100 ps-4"
        style={{ gap: '1.8rem' }}
      >
        <Row
          id="featuredRow"
          className="d-flex flex-row p-0"
          style={{
            height: '45%'
          }}

        >
          <FeaturedProducts
            activeCategoryId={activeCategoryId}
            activeCategoryName={activeCategoryName}
            onClearCategory={() => handleSelectCategory(null)}
          />
        </Row>
        <Row
          className="d-flex flex-column pt-2"
          style={{
            borderTop: `.13rem solid ${theme.colors.details}`,
          }}
        >
          <RecommendedProducts />
        </Row>
      </Col>
    </Row>
  );
}

export default MasterGrid;
