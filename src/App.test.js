import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app loading screen', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Carregando perfil/i);
  expect(loadingElement).toBeInTheDocument();
});
