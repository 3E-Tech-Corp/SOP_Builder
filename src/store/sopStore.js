import { create } from 'zustand';

const useSopStore = create((set) => ({
  // Toast state
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast = { id, ...toast, createdAt: Date.now() };
    set(state => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, toast.duration || 4000);
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  // Designer selection state
  selectedNode: null,
  selectedEdge: null,
  setSelectedNode: (node) => set({ selectedNode: node, selectedEdge: null }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedNode: null }),
  clearSelection: () => set({ selectedNode: null, selectedEdge: null }),

  // Tester role simulation
  currentRole: 'Admin',
  setCurrentRole: (role) => set({ currentRole: role }),

  // Active test object
  activeObjectId: null,
  setActiveObjectId: (id) => set({ activeObjectId: id }),
}));

export default useSopStore;
