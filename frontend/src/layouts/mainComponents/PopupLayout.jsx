import { useTheme } from '@resources/themes/themeContext';

function PopupLayout({ children }) {
  const { theme } = useTheme();

  return (
    <div
      className="min-vw-100 position-absolute bottom-0 left-0 justify-content-start align-content-center m-0 p-0"
      style={{
        backgroundColor: `${theme.colors.lightBg}80`,
        backdropFilter: 'blur(5px)',
        width: '100vw',
        height: '78vh',
        zIndex: 500,
      }}
    >
      <div className="d-flex mx-auto h-100 w-100 p-3">{children}</div>
    </div>
  );
}

export default PopupLayout;
