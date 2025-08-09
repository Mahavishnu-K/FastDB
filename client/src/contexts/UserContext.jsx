import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/apiServices'; 
import { initializeApiClient } from '../services/apiServices';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeSession = async () => {
            const token = localStorage.getItem('accessToken');
            
            if (token) {
                initializeApiClient(token);
                try {
                    const userData = await api.getMyProfile();
                    setUser(userData); 
                } catch (error) {
                    console.error("Session token is invalid, logging out.", error);
                    localStorage.removeItem('accessToken');
                    setUser(null);
                }
            }
            setIsLoading(false); 
        };

        initializeSession();
    }, []);
    
    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
        window.location.href = '/login';
    };

    const value = {
        user,
        setUser,
        isLoading,
        logout,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};