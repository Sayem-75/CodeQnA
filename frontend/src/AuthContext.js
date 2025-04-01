import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userLevels, setUserLevels] = useState({});

    useEffect(() => {
        // Fetch logged-in user info
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

        // Fetch user levels
        fetch('http://localhost:3000/userlevels')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const map = {};
                    data.data.forEach(u => {
                        map[u.name] = u.level;
                    });
                    setUserLevels(map);
                }
            })
            .catch(err => console.error('Failed to fetch user levels', err));
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, userLevels }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}



