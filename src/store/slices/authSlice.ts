import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  isAdminLoggedIn: boolean;
  user: {
    username: string | null;
    role: 'admin' | 'user' | null;
  };
}

const initialState: AuthState = {
  isAuthenticated: false,
  isAdminLoggedIn: localStorage.getItem('isAdminLoggedIn') === 'true',
  user: {
    username: null,
    role: null,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAdminLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.isAdminLoggedIn = action.payload;
      state.isAuthenticated = action.payload;
      state.user = {
        username: action.payload ? 'admin' : null,
        role: action.payload ? 'admin' : null,
      };
      if (action.payload) {
        localStorage.setItem('isAdminLoggedIn', 'true');
      } else {
        localStorage.removeItem('isAdminLoggedIn');
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.isAdminLoggedIn = false;
      state.user = {
        username: null,
        role: null,
      };
      localStorage.removeItem('isAdminLoggedIn');
    },
  },
});

export const { setAdminLoggedIn, logout } = authSlice.actions;
export default authSlice.reducer; 