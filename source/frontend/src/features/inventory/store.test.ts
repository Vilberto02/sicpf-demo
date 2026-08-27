import { useInventoryStore } from './store';
import { getInventory } from './api';

jest.mock('./api', () => ({
  getInventory: jest.fn(),
  getLoteCatalogo: jest.fn(),
  createInventoryItem: jest.fn(),
  updateInventoryItem: jest.fn(),
  deleteInventoryItem: jest.fn(),
}));

describe('useInventoryStore', () => {
  beforeEach(() => {
    useInventoryStore.setState({ items: [], count: 0, page: 1, search: '', ordering: '-created_at', loading: false, error: null });
    jest.clearAllMocks();
  });

  it('fetchItems should update items state on success', async () => {
    const mockData = {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          producto_codigo: 'MED-001',
          producto_nombre: 'Paracetamol',
          stock_flotante: 10,
          stock_real: 10,
          codigo_lote: 'L123',
          fecha_vencimiento: '2027-01-01',
          producto_estado: 'activo',
          categoria_nombre: 'Medicamentos'
        }
      ]
    };

    (getInventory as jest.Mock).mockResolvedValue(mockData);

    const store = useInventoryStore.getState();
    await store.fetchItems();

    expect(useInventoryStore.getState().items).toEqual(mockData.results);
    expect(useInventoryStore.getState().count).toBe(1);
    expect(useInventoryStore.getState().loading).toBe(false);
  });
});
