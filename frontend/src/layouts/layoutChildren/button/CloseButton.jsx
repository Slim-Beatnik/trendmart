import CloseButton from 'react-bootstrap/CloseButton';
import { useTheme } from '@resources/themes/themeContext';

function PopupCloseButton({
  onClose = () => { },
  variant = 'default',
  className = '',
  style = {},
  ariaLabel = 'Close',
}) {
  const { theme, mode } = useTheme() || {};
  const colors = theme?.colors || {};
  const radius = theme?.props?.bR_less || '.35rem';

  // Custom grey X icon (Bootstrap-like) encoded as data URI
  const greyX =
    "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23888'><path d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z'/></svg>\")";

  // Base chrome so the button is ALWAYS visible
  const baseChrome = {
    zIndex: 999,
    width: '30px',
    height: '30px',
    borderRadius: radius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    // Subtle but visible background + border
    backgroundColor:
      mode === 'dark'
        ? 'rgba(0, 0, 0, 0.7)'
        : 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(0, 0, 0, 0.25)',
  };

  let variantStyle = {};
  if (variant === 'darkBlue') {
    const bg =
      mode === 'dark'
        ? colors.darkBg || '#135c8b'
        : colors.contrast || '#0a1f44';
    const border = colors.splash || '#00aef0';
    variantStyle = {
      background: bg,
      border: `1px solid ${border}`,
    };
  }

  return (
    <div data-bs-theme={mode}>
      <CloseButton
        aria-label={ariaLabel}
        className={`position-absolute top-0 end-0 ${className}`.trim()}
        style={{
          ...baseChrome,
          backgroundImage: greyX,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '16px 16px',
          filter: 'none', // keep icon grey, don’t let theme invert it
          ...variantStyle,
          ...style,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
    </div>
  );
}

export default PopupCloseButton;
