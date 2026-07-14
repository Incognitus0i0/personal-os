import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import PersonalOS from "./PersonalOS";

// Catches render crashes and shows a readable error instead of a white screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crash:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          fontFamily: "'Jost',system-ui,sans-serif", background: "#F5F5F5",
          color: "#3A3530", padding: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Something went wrong</div>
          <div style={{ fontSize: 12.5, color: "#A0A0A0", maxWidth: 480, lineHeight: 1.6, wordBreak: "break-word" }}>
            {String(this.state.error)}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "9px 22px", border: "none", borderRadius: 8,
              background: "#2A2825", color: "#EBE8E0",
              fontFamily: "inherit", fontSize: 13, cursor: "pointer", marginTop: 6,
            }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Jost',system-ui,sans-serif",color:"#A0A0A0",background:"#F5F5F5",
      fontSize:14,letterSpacing:".08em"}}>
      Loading…
    </div>
  );
  if (!session) return <Auth />;
  return (
    <ErrorBoundary>
      <PersonalOS userEmail={session.user.email} onSignOut={() => supabase.auth.signOut()} />
    </ErrorBoundary>
  );
}
