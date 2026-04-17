import { useEffect, useState } from "react";
import "./app.css";
import Dashboard from "./Dashboard";
import LoginPage from "./LoginPage";
import { supabase } from "../supabase";
import { RoleContext } from "./RoleContext";
import { useRole } from "./useRole";

function AppInner({ session, onLogout }) {
  const roleData = useRole(session?.user?.id);

  if (roleData.roleLoading) return null;

  return (
    <RoleContext.Provider value={roleData}>
      <Dashboard onLogout={onLogout} userEmail={session?.user?.email} />
    </RoleContext.Provider>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return null;

  if (!session) return <LoginPage />;

  return <AppInner session={session} onLogout={handleLogout} />;
}

export default App;
