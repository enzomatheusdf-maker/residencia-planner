import { render, screen } from '@testing-library/react';

jest.mock('./services/firebase', () => ({
  __esModule: true,
  auth: { currentUser: null },
  monitorarAuth: jest.fn(() => jest.fn()),
  sincronizarComFirebase: jest.fn(async () => ({ sucesso: true })),
  carregarDadosUsuario: jest.fn(async () => ({ sucesso: false })),
  fazerLogout: jest.fn(async () => ({ sucesso: true })),
  default: {
    auth: { currentUser: null },
    monitorarAuth: jest.fn(() => jest.fn()),
    sincronizarComFirebase: jest.fn(async () => ({ sucesso: true })),
    carregarDadosUsuario: jest.fn(async () => ({ sucesso: false })),
    fazerLogout: jest.fn(async () => ({ sucesso: true })),
  },
}));

const App = require('./App').default;

test('renders app loading screen', () => {
  render(<App />);
  const loadingElement = screen.getByText(/Carregando seus dados/i);
  expect(loadingElement).toBeInTheDocument();
});
