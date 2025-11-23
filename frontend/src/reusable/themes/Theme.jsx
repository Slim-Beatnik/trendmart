import { useSelector } from 'react-redux';
import { ThemeContext } from './themeContext';
import { buildTheme } from './styles';

export const ThemeProvider = ({ children }) => {
  const mode = useSelector((state) => state.theme?.mode ?? 'light');
  const theme = buildTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
