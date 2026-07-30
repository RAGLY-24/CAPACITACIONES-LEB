import { createContext, useContext, useState } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [token, setTokenState] = useState(
        localStorage.getItem("token")
    );

    // USER
    const [user, setUserState] = useState(null);
    const [permissions, setPermissionsState] = useState(null);

    const setToken = (t) => {
        if (t) {
            localStorage.setItem("token", t);
        } else {
            localStorage.removeItem("token");
        }

        setTokenState(t);
    };

    const setAuthData = (u, p) => {
        setUserState(u);
        setPermissionsState(p);
    };

    const logout = () => {
        setToken(null);
        setAuthData(null, null);
    };

    const isLogged = !!token;

    return (
        <AuthContext.Provider
            value={{
                token,
                setToken,
                user,
                permissions,
                setAuthData,
                logout,
                isLogged
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
};