import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3000/me', {
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser({ id: data.id, role: data.role });
                }
            })
            .catch(err => console.error('Session check failed', err));
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}




