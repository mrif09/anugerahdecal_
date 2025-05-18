import { onAuthStateChanged } from '@firebase/auth';
import { create } from 'zustand';
import { auth } from '../lib/firebase';

const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
    initializeAuth: () => {
        onAuthStateChanged(auth, (user) => {
            set({ user, loading: false })
        })
    }
}))

export default useAuthStore;