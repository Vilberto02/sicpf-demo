import { useInventoryStore } from './store';
import { getInventory } from './api';

jest.mock('./api', () => ({
  getInventory: jest.fn(),
  createInventoryItem: jest.fn(),
  updateInventoryItem: jest.fn(),
  deleteInventoryItem: jest.fn(),
}));

describe('useInventoryStore', () => {
  beforeEach(() => {
    useInventoryStore.setState({ items: [], loading: false, error: null });
    jest.clearAllMocks();
  });

  it('fetchItems should update items state on success', async () => {
    const mockData = [
      {
        id: 1,
        codigo: 'MED-001',
        nombre: 'Paracetamol',
        stock_flotante: 10,
        stock_real: 10,
        lote: 'L123',
        vencimiento: '2027-01-01',
        status: 'Activo',
        categoria: 'Medicamento'
      }
    ];
    
    (getInventory as jest.Mock).mockResolvedValue(mockData);

    const store = useInventoryStore.getState();
    await store.fetchItems();

    expect(useInventoryStore.getState().items).toEqual(mockData);
    expect(useInventoryStore.getState().loading).toBe(false);
  });
});
