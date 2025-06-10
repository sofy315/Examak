import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);



  const login = async (credentials) => {
    const response = await api.post('/auth', credentials);
    localStorage.setItem('token', response.data.data);
    setUser(response.data.user);
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data}`;
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);