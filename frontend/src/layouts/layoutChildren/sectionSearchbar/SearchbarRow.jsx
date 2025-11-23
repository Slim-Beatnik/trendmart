import { useState, useCallback } from 'react';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import filterIcon from '/filterIcon.svg?url';
import { useTheme } from '@resources/themes/themeContext';

function SearchbarRow({
  searchId,
  placeholder,
  filterButton = false,
  sectionTitle = null,
  onSearch = null,
  debounceMs = 350,
}) {
  const [value, setValue] = useState('');
  const [timer, setTimer] = useState(null);
  const { mode, theme } = useTheme();

  const handleChange = useCallback(
    (e) => {
      const next = e.target.value;
      setValue(next);
      if (onSearch) {
        if (timer) clearTimeout(timer);
        const t = setTimeout(() => onSearch(next), debounceMs);
        setTimer(t);
      }
    },
    [onSearch, debounceMs, timer]
  );

  return (
    <div data-bs-theme={mode}>
      <Row
        className="d-flex flex-row align-items-center m-0 w-100 px py-0 gap-1"
        style={{ height: '2.5rem' }}
      >
        {sectionTitle && (
          <Col
            className="d-flex flex-column flex-grow-1 justify-content-start align-items-start m-0 p-0 text-nowrap d-none d-sm-flex fs-4 align-self-end"
            style={{ color: theme.colors.contrast, fontWeight: '700' }}
          >
            {sectionTitle}
          </Col>
        )}
        {filterButton && (
          <Col
            className="d-flex flex-grow-0 flex-column p-0 justify-content-center align-content-center"
            style={{ height: '2.5rem' }}
          >
            <Image
              alt="filter"
              src={filterIcon}
              style={{
                height: '2rem',
                width: 'auto',
                cursor: 'pointer',
                alignSelf: 'center',
              }}
            />
          </Col>
        )}
        <Col className="d-flex justify-content-center align-items-center p-0">
          <Form.Control
            id={searchId}
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            className="d-flex flex-row h-100 flex-grow-0"
            style={{
              boxSizing: 'border-box',
              fieldSizing: 'content',
              borderRadius: '.3rem',
              borderWidth: '.13rem',
              borderColor: theme.colors.details,
            }}
          />
        </Col>
      </Row>
    </div>
  );
}

export default SearchbarRow;
