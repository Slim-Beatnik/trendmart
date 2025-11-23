import { useState } from 'react';
import { useTheme } from '@resources/themes/themeContext';
import { Button, Col, Row } from 'react-bootstrap';

const ThemeBlock = ({ schemeName, styleObject }) => {
  const [isHovering, setIsHovering] = useState(false);

  const combinedStyles = {
    ...styleObject,
    borderWidth: isHovering ? '3px' : '1px',
    borderStyle: isHovering ? 'solid' : 'none',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '.7rem',
    padding: '1rem',
    margin: '.5rem',
    borderRadius: '8px',
    width: '250px',
  };

  return (
    <div
      style={combinedStyles}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      @styles/reusableStyles.js has them all laid out
      <br />
      import useTheme from '@styles/themeContext'
      <br />
      the define a variable const &#123; theme &#125; = useTheme()
      <br />
      ...theme.schemes.{schemeName}, if you want a border you must add one.
      <br />
      conditionals have spread operatores outside of them:
      <br />
      ...(condition ? theme.schemes.{schemeName} : theme.schemes.otherName)
      {schemeName}
    </div>
  );
};

const ThemeButtonsBlock = ({ buttonName, styleObject }) => {
  return (
    <Button
      style={{
        ...styleObject,
        height: 'fit-content',
        width: 'fit-content',
        margin: '.5rem',
      }}
    >
      {buttonName}
    </Button>
  );
};

function StyleGuide() {
  const { theme } = useTheme();

  return (
    <Row className="g-3">
      <h4 className="mt-3 mb-3">Style Guide Component</h4>

      {Object.keys(theme.schemes).map((schemeName) => (
        <Col
          key={schemeName}
          md={4}
          sm={6}
          xs={12}
        >
          <div className="d-flex flex-column align-items-start">
            <ThemeBlock
              schemeName={schemeName}
              styleObject={theme.schemes[schemeName]}
            />
            <ThemeButtonsBlock
              buttonName={schemeName}
              styleObject={theme.buttons[schemeName]}
            />
          </div>
        </Col>
      ))}
    </Row>
  );
}

export default StyleGuide;
