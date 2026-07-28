import { useAuth } from "./context/AuthContext";
import { ProtectedRoutes } from "./routes/ProtectedRoutes";
import { PublicRoutes } from "./routes/PublicRoutes";


function App() {
  const { isLogged } = useAuth();
  if (isLogged) {
    return (
      <ProtectedRoutes />
    )
  }
  return <PublicRoutes />
}
export default App;