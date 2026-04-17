import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";
import { getDetectionsFromSupabase } from "../data-utils";
import WhitelistForm from "./whitelist";
import DetectionCard from "./DetectionCard";
import AccountManager from "./AccountManager";
import { useRoleContext } from "./RoleContext";
import { Radio, Activity, Wifi, Shield, LogOut, Users } from "lucide-react";

function Dashboard({ onLogout, userEmail }) {
  const { isTeacher, role } = useRoleContext();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewDetection, setHasNewDetection] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [whitelistCount, setWhitelistCount] = useState(0);
  const [view, setView] = useState("detections");

  const prevDataRef = useRef([]);

  const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
  const normMac = (v) => norm(v);

  const fetchFromSupabase = async () => {
    setIsLoading(true);

    try {
      const { data: whitelistRows, error: wlErr } = await supabase
        .from("whitelist")
        .select("mac");

      if (wlErr) console.error("Whitelist error:", wlErr);

      const wlMAC = (whitelistRows || [])
        .map((w) => normMac(w.mac))
        .filter(Boolean);

      setWhitelistCount(wlMAC.length);

      const detections = await getDetectionsFromSupabase();

      const filteredRows = (detections || []).filter((d) => {
        const mac = normMac(d.mac);
        return !(mac && wlMAC.includes(mac));
      });

      const uniqueKey = (d) => {
        const ssid = norm(d.ssid);
        const mac = normMac(d.mac);
        return ssid || mac || String(d.id ?? JSON.stringify(d));
      };

      const uniqueData = Array.from(
        new Map(filteredRows.map((d) => [uniqueKey(d), d])).values()
      );

      const newDetections = uniqueData.filter(
        (d) => !prevDataRef.current.some((prev) => uniqueKey(prev) === uniqueKey(d))
      );

      if (newDetections.length > 0) {
        setHasNewDetection(true);
        setToastMessage(`🎯 ${newDetections.length} new detection(s) found!`);
      } else {
        setHasNewDetection(false);
        setToastMessage("⚠️ No new detections");
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setData(uniqueData);
      prevDataRef.current = uniqueData;
    } catch (err) {
      console.error(err);
      setToastMessage("❌ Failed to fetch data");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFromSupabase();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchFromSupabase, 9000);
    return () => clearInterval(interval);
  }, []);

  const handleDetectionDeleted = (mac) => {
    setData((prev) => prev.filter((d) => d.mac !== mac));
    prevDataRef.current = prevDataRef.current.filter((d) => d.mac !== mac);
  };

  const handleDetectionUpdated = (updated) => {
    setData((prev) => prev.map((d) => (d.mac === updated.mac ? updated : d)));
    prevDataRef.current = prevDataRef.current.map((d) =>
      d.mac === updated.mac ? updated : d
    );
  };

  const totalDetections = data.length;
  const uniqueAnchors = new Set(data.map((d) => d.anchor_id ?? d.anchor)).size;

  const avatarLetter = (userEmail || "A")[0].toUpperCase();

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-circle">
            <Radio className="sidebar-logo-icon" />
          </div>
          <div>
            <h1 className="sidebar-title">ESP32 Monitor</h1>
            <p className="sidebar-subtitle">
              <span className="sidebar-status-dot" />
              Live detection
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-btn ${view === "detections" ? "sidebar-nav-active" : ""}`}
            onClick={() => setView("detections")}
          >
            <Wifi size={14} />
            Detections
          </button>
          {isTeacher && (
            <button
              className={`sidebar-nav-btn ${view === "accounts" ? "sidebar-nav-active" : ""}`}
              onClick={() => setView("accounts")}
            >
              <Users size={14} />
              Account Manager
            </button>
          )}
        </nav>

        <div className="sidebar-quickstats">
          <h3 className="sidebar-quickstats-title">Quick stats</h3>
          <div className="sidebar-quickstats-grid">
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-value">{totalDetections}</div>
              <div className="sidebar-stat-label">Detected devices</div>
            </div>
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-value">{uniqueAnchors}</div>
              <div className="sidebar-stat-label">Anchors (ESP32)</div>
            </div>
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-value">{whitelistCount}</div>
              <div className="sidebar-stat-label">Whitelisted MACs</div>
            </div>
          </div>
        </div>

        <div className="sidebar-whitelist">
          <WhitelistForm onInserted={fetchFromSupabase} />
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{avatarLetter}</div>
            <div>
              <p className="sidebar-user-name">{userEmail || "User"}</p>
              <p className="sidebar-user-role">
                {role === "teacher" ? "Teacher" : "Assistant"}
              </p>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={onLogout}>
            <LogOut className="sidebar-logout-icon" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {showToast && (
          <div className={`toast ${hasNewDetection ? "toast-success" : "toast-neutral"}`}>
            {toastMessage}
          </div>
        )}

        {view === "accounts" ? (
          <AccountManager />
        ) : (
          <>
            <header className="dashboard-header">
              <div>
                <h2 className="dashboard-header-title">Detection monitor</h2>
                <p className="dashboard-header-subtitle">
                  Real-time WiFi detection overview
                </p>
                <p className="dashboard-header-small">
                  Auto-refresh every 9 seconds
                </p>
              </div>
            </header>

            <div className="dashboard-content">
              <div className="dashboard-top-row">
                <div
                  className={`status-card ${
                    isLoading
                      ? "status-card-loading"
                      : hasNewDetection
                      ? "status-card-ok"
                      : "status-card-empty"
                  }`}
                >
                  <div className="status-icon-wrapper">
                    {isLoading ? (
                      <Activity className="status-icon spinning" />
                    ) : hasNewDetection ? (
                      <Activity className="status-icon" />
                    ) : (
                      <Wifi className="status-icon" />
                    )}
                  </div>
                  <div>
                    <h3 className="status-title">
                      {isLoading
                        ? "Scanning..."
                        : hasNewDetection
                        ? "New detections"
                        : "No new detections"}
                    </h3>
                    <p className="status-subtitle">
                      {isLoading ? "Checking for devices" : "Last check just now"}
                    </p>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon-circle">
                    <Shield className="summary-icon" />
                  </div>
                  <div>
                    <h3 className="summary-title">Network overview</h3>
                    <p className="summary-subtitle">
                      {totalDetections} devices · {uniqueAnchors} anchors ·{" "}
                      {whitelistCount} whitelisted
                    </p>
                  </div>
                </div>
              </div>

              <div className="detections-header">
                <h3 className="detections-title">Detected devices</h3>
                <span className="detections-count">
                  {data.length} device{data.length !== 1 ? "s" : ""}
                </span>
              </div>

              {data.length === 0 && !isLoading ? (
                <div className="detections-empty">
                  <div className="detections-empty-icon">
                    <Radio className="detections-empty-radio" />
                  </div>
                  <h3>No detections yet</h3>
                  <p>
                    Waiting for ESP32 to send detection data. Make sure your
                    nodes are online and connected.
                  </p>
                </div>
              ) : (
                <div className="detections-grid">
                  {data.map((d, i) => (
                    <DetectionCard
                      key={`${d.mac ?? "no-mac"}-${d.anchor ?? "no-anchor"}-${i}`}
                      detection={d}
                      onDeleted={handleDetectionDeleted}
                      onUpdated={handleDetectionUpdated}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
