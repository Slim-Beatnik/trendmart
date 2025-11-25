import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useTheme } from '@resources/themes/themeContext';

function TextInput({
  children,
  inputId,
  placeholder,
  onChange,
  disabled = false,
  info = null,
  password = false,
}) {
  const { mode, theme } = useTheme();

  // Removed outer <Form> to prevent nesting when used inside parent forms.
  return (
    <div data-bs-mode={mode} style={{ width: '100%' }}>
      <Form.Group style={{ width: '100%' }} controlId={inputId}>
        <InputGroup>
          <Form.Control
            type={password ? 'password' : 'text'}
            placeholder={placeholder}
            disabled={disabled}
            onChange={onChange}
            name={inputId}
            autoComplete="on"
            style={{
              color: theme.colors.text,
              backgroundColor: theme.colors.highlight,
              borderColor: theme.colors.splash,
            }}
          />
          {children}
        </InputGroup>
        {info && (
          <Form.Text
            style={{
              padding: '.1rem 1rem 1rem 1rem',
              marginBottom: '1rem',
            }}
          >
            <em>{info}</em>
          </Form.Text>
        )}
      </Form.Group>
    </div>
  );
}

export default TextInput;
