import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true); setError(""); setInfo("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(error.message);
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) setError(error.message);
        else if (data.session === null) setInfo("Check your email to confirm your account, then sign in.");
      }
    } catch (e) {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", border: "1px solid #2A2825", borderRadius: 8,
    background: "#1A1918", color: "#E8E4DC", fontFamily: "'Jost',system-ui,sans-serif",
    fontSize: 14, outline: "none", letterSpacing: ".01em", boxSizing: "border-box",
  };

  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0F0E0C", fontFamily: "'Jost',system-ui,sans-serif", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 26, fontWeight: 300, color: "#EBE8E0", letterSpacing: ".14em" }}>
            PERSONAL OS
          </div>
          <div style={{ fontSize: 10, color: "#5A5650", letterSpacing: ".18em", textTransform: "uppercase", marginTop: 6 }}>
            Life management system
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={inputStyle} type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            autoComplete="email"
          />
          <input
            style={inputStyle} type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
          {error && <div style={{ fontSize: 12.5, color: "#E08080", lineHeight: 1.5 }}>{error}</div>}
          {info && <div style={{ fontSize: 12.5, color: "#8AC08A", lineHeight: 1.5 }}>{info}</div>}
          <button
            onClick={submit} disabled={loading || !email.trim() || !password}
            style={{
              padding: "12px", border: "none", borderRadius: 8, background: "#EBE8E0",
              color: "#0F0E0C", fontFamily: "'Jost',system-ui,sans-serif", fontSize: 13.5,
              fontWeight: 500, letterSpacing: ".06em", cursor: "pointer", marginTop: 4,
              opacity: loading || !email.trim() || !password ? 0.5 : 1, transition: "opacity .15s",
            }}>
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 22, fontSize: 12.5, color: "#5A5650" }}>
          {mode === "signin" ? (
            <>No account?{" "}
              <span style={{ color: "#A8A49C", cursor: "pointer" }} onClick={() => { setMode("signup"); setError(""); setInfo(""); }}>
                Create one
              </span></>
          ) : (
            <>Already registered?{" "}
              <span style={{ color: "#A8A49C", cursor: "pointer" }} onClick={() => { setMode("signin"); setError(""); setInfo(""); }}>
                Sign in
              </span></>
          )}
        </div>
      </div>
    </div>
  );
}
