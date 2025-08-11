import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/apiServices';
import { initializeApiClient } from '../services/apiServices'; // Import the initializer

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('accessToken');
            
            if (token) {
                // --- THE FIX: Initialize the API client FIRST ---
                initializeApiClient(token);

                try {
                    // --- THEN, attempt to fetch the user profile ---
                    const userData = await api.getMyProfile();
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (error) {
                    console.error("Failed to fetch user profile, token might be invalid.", error);
                    // If the token is invalid, log the user out.
                    logout();
                }
            }
            
            // We're done checking for a token and trying to log in.
            setIsLoading(false);
        };

        loadUser();
    }, []); // This effect runs only once when the provider is mounted.

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