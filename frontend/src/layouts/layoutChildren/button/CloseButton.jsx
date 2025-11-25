import CloseButton from 'react-bootstrap/CloseButton';
import { useTheme } from '@resources/themes/themeContext';

function PopupCloseButton({ onClick }) {
  const { mode } = useTheme();

  return (
    <div data-bs-theme={mode}>
      <CloseButton
        className="position-absolute top-0 end-0"
        style={{ zIndex: 999 }}
        onClick={onClick}
      />
    </div>
  );
}

export default PopupCloseButton;
