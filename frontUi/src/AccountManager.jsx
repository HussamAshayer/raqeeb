import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { supabaseAdmin } from "./supabase-admin";
import { UserPlus, Trash2, Loader2, Users, RefreshCw } from "lucide-react";

export default function AccountManager() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("assistant");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error: err } = await supabaseAdmin.auth.admin.listUsers();
    if (!err && data?.users) {
      // fetch roles for all users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap = Object.fromEntries(
        (roles || []).map((r) => [r.user_id, r.role])
      );

      setAccounts(
        data.users.map((u) => ({
          id: u.id,
          email: u.email,
          role: roleMap[u.id] || "assistant",
          created_at: u.created_at,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
    });
    fetchAccounts();
  }, []);

  const createAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) { setError("Email is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setSubmitting(true);

    // Create the auth user (no email confirmation)
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: { role },
    });

    if (createErr) {
      setError(createErr.message);
      setSubmitting(false);
      return;
    }

    // Assign role (upsert in case trigger already inserted a default row)
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newUser.user.id, role }, { onConflict: "user_id" });

    if (roleErr) {
      setError("User created but role assignment failed: " + roleErr.message);
    } else {
      setSuccess(`Account created for ${email}.`);
      setEmail("");
      setPassword("");
      setRole("assistant");
      fetchAccounts();
    }

    setSubmitting(false);
  };

  const deleteAccount = async (id, accountEmail) => {
    if (!window.confirm(`Delete account for ${accountEmail}?`)) return;
    await supabaseAdmin.auth.admin.deleteUser(id);
    await supabase.from("user_roles").delete().eq("user_id", id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="am-page">
      <div className="am-top-bar">
        <div className="am-top-bar-left">
          <div className="am-icon-circle">
            <Users size={18} />
          </div>
          <div>
            <h2 className="am-title">Account Manager</h2>
            <p className="am-subtitle">Create and manage user accounts</p>
          </div>
        </div>
        <button className="am-refresh-btn" onClick={fetchAccounts} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spinning" : ""} />
        </button>
      </div>

      <div className="am-grid">
        {/* Create account form */}
        <div className="am-card">
          <h3 className="am-card-title">New Account</h3>
          <p className="am-card-desc">
            Account is created immediately — no email confirmation needed.
          </p>

          <form onSubmit={createAccount} className="am-form">
            <div className="am-field">
              <label className="am-label">Email Address</label>
              <input
                className="am-input"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="am-field">
              <label className="am-label">Password</label>
              <input
                className="am-input"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="am-field">
              <label className="am-label">Role</label>
              <select
                className="am-input am-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="assistant">Assistant (read-only)</option>
                <option value="teacher">Teacher (full access)</option>
              </select>
            </div>

            {error && <p className="am-error">{error}</p>}
            {success && <p className="am-success">{success}</p>}

            <button type="submit" disabled={submitting} className="am-submit-btn">
              {submitting
                ? <Loader2 size={14} className="spinning" />
                : <UserPlus size={14} />
              }
              Create Account
            </button>
          </form>
        </div>

        {/* Accounts list */}
        <div className="am-card">
          <h3 className="am-card-title">All Accounts</h3>

          {loading ? (
            <div className="am-loading">
              <Loader2 size={20} className="spinning" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="am-empty">No accounts found.</p>
          ) : (
            <div className="am-list">
              {accounts.map((acc) => (
                <div key={acc.id} className="am-item">
                  <div className="am-item-info">
                    <span className="am-item-email">{acc.email}</span>
                    <div className="am-item-badges">
                      <span className={`am-role-badge am-role-${acc.role}`}>
                        {acc.role}
                      </span>
                    </div>
                  </div>
                  {acc.id !== currentUserId && (
                    <button
                      className="am-delete-btn"
                      onClick={() => deleteAccount(acc.id, acc.email)}
                      title="Delete account"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
