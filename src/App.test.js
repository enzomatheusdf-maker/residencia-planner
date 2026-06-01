import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app loading screen', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Carregando seus dados/i);
  expect(loadingElement).toBeInTheDocument();
});
