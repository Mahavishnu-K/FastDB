import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This effect runs only once when the app component mounts
        try {
            // --- THE FIX IS HERE ---
            // Try to get the user object from localStorage
            const savedUser = localStorage.getItem('user');

            if (savedUser) {
                // If found, parse it and set it as the initial state
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            // If parsing fails, ensure user is null
            setUser(null);
        } finally {
            // We're done checking, so set loading to false
            setIsLoading(false);
        }
    }, []);
    
    // Create a logout function to be used globally
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        // Full page reload to ensure all state is cleared
        window.location.href = '/login';
    };

    const value = {
        user,
        setUser,
        isLoading,
        logout, // Provide the logout function to the context
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};