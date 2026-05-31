import { useEffect, useState, useMemo } from "react";
import { getOfferReport } from "../../api/offerApi";

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  Accepted: { bg: "var(--erp-success-light,#d1fae5)", text: "var(--erp-success,#065f46)" },
  Rejected:  { bg: "var(--erp-danger-light,#fee2e2)",  text: "var(--erp-danger,#991b1b)"  },
  Pending:   { bg: "var(--erp-warn-light,#fef9c3)",   text: "var(--erp-warn,#854d0e)"    },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: "2px 10px", borderRadius: 999,
      fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
      display: "inline-block"
    }}>
      {status}
    </span>
  );
}

// ─── export to CSV (opens perfectly in Excel) ────────────────────────────────
function exportCSV(rows) {
  const COLS = [
    ["Student Name","student_name"],
    ["Student ID","student_id"],
    ["Branch","branch"],
    ["Company","company_name"],
    ["Drive","drive_title"],
    ["Position","position"],
    ["Package","package"],
    ["Offer Date","offer_date"],
    ["Status","status"],
    ["Rejection Reason","reason"],
  ];
  const header = COLS.map(([h]) => `"${h}"`).join(",");
  const lines  = rows.map(r =>
    COLS.map(([, k]) => `"${(r[k] ?? "").toString().replace(/"/g,'""')}"`)
        .join(",")
  );
  const csv = [header, ...lines].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `offer_report_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── unique sorted list from array of objects ────────────────────────────────
const uniq = (arr, key) => [...new Set(arr.map(r => r[key]).filter(Boolean))].sort();

// ─── Summary card ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="erp-card" style={{ flex: 1, minWidth: 160, padding: "1.2rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: color + "22", display: "grid", placeItems: "center",
          fontSize: 18, color
        }}>
          <i className={`fa-solid ${icon}`} />
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--erp-text-primary,#1e293b)" }}>{value}</div>
          <div style={{ fontSize: 12, color: "var(--erp-text-muted,#64748b)", fontWeight: 500 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, allLabel = "All" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--erp-text-muted,#64748b)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="erp-input"
        style={{ padding: "6px 10px", fontSize: 13 }}
      >
        <option value="">{allLabel}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OfferReport() {
  const [allRows,  setAllRows]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // filter state
  const [search,    setSearch]   = useState("");
  const [fStatus,   setFStatus]  = useState("");
  const [fBranch,   setFBranch]  = useState("");
  const [fCompany,  setFCompany] = useState("");
  const [fDrive,    setFDrive]   = useState("");
  const [fMonth,    setFMonth]   = useState(""); // "YYYY-MM"

  useEffect(() => {
    (async () => {
      try {
        const res = await getOfferReport();
        setAllRows(res.data);
      } catch (e) {
        setError("Failed to load offer report: " + (e.response?.data?.detail || e.message));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived filter options ──
  const branches  = useMemo(() => uniq(allRows, "branch"),       [allRows]);
  const companies = useMemo(() => uniq(allRows, "company_name"), [allRows]);
  const drives    = useMemo(() => uniq(allRows, "drive_title"),  [allRows]);

  // ── Filtered rows ──
  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return allRows.filter(r => {
      if (q && !r.student_name.toLowerCase().includes(q) && !String(r.student_id).includes(q)) return false;
      if (fStatus  && r.status       !== fStatus)  return false;
      if (fBranch  && r.branch       !== fBranch)  return false;
      if (fCompany && r.company_name !== fCompany) return false;
      if (fDrive   && r.drive_title  !== fDrive)   return false;
      if (fMonth && r.offer_date) {
        if (!r.offer_date.startsWith(fMonth)) return false;
      }
      return true;
    });
  }, [allRows, search, fStatus, fBranch, fCompany, fDrive, fMonth]);

  // ── Summary counts ──
  const total    = rows.length;
  const accepted = rows.filter(r => r.status === "Accepted").length;
  const rejected = rows.filter(r => r.status === "Rejected").length;
  const pending  = rows.filter(r => r.status === "Pending").length;

  const clearFilters = () => {
    setSearch(""); setFStatus(""); setFBranch(""); setFCompany(""); setFDrive(""); setFMonth("");
  };

  return (
    <div className="erp-page-content" style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="erp-page-title" style={{ margin: 0 }}>
            <i className="fa-solid fa-chart-bar" style={{ marginRight: 10, color: "var(--erp-primary,#6366f1)" }} />
            Offer Report
          </h1>
          <p style={{ color: "var(--erp-text-muted,#64748b)", marginTop: 4, fontSize: 14 }}>
            Complete overview of all placement offers — accepted, rejected &amp; pending
          </p>
        </div>
        <button
          className="erp-btn erp-btn--primary"
          onClick={() => exportCSV(rows)}
          disabled={rows.length === 0}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <i className="fa-solid fa-file-excel" />
          Export to Excel ({rows.length} rows)
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="erp-alert erp-alert--danger" style={{ marginBottom: "1rem" }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      {/* ── Summary Cards ── */}
      {!loading && (
        <div style={{ display: "flex", gap: 16, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <SummaryCard label="Total Offers"    value={total}    icon="fa-envelope-circle-check" color="#6366f1" />
          <SummaryCard label="Accepted"        value={accepted} icon="fa-circle-check"           color="#10b981" />
          <SummaryCard label="Rejected"        value={rejected} icon="fa-circle-xmark"           color="#ef4444" />
          <SummaryCard label="Pending"         value={pending}  icon="fa-clock"                  color="#f59e0b" />
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className="erp-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>

          {/* Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px", minWidth: 180 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--erp-text-muted,#64748b)", textTransform: "uppercase", letterSpacing: 0.5 }}>Search</label>
            <div style={{ position: "relative" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                className="erp-input"
                style={{ paddingLeft: 32, fontSize: 13 }}
                placeholder="Student name or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <FilterSelect label="Status"  value={fStatus}  onChange={setFStatus}  options={["Accepted","Rejected","Pending"]} />
          <FilterSelect label="Branch"  value={fBranch}  onChange={setFBranch}  options={branches}  />
          <FilterSelect label="Company" value={fCompany} onChange={setFCompany} options={companies} />
          <FilterSelect label="Drive"   value={fDrive}   onChange={setFDrive}   options={drives}    />

          {/* Month-Year picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--erp-text-muted,#64748b)", textTransform: "uppercase", letterSpacing: 0.5 }}>Month / Year</label>
            <input
              type="month"
              className="erp-input"
              style={{ padding: "6px 10px", fontSize: 13 }}
              value={fMonth}
              onChange={e => setFMonth(e.target.value)}
            />
          </div>

          {/* Clear */}
          {(search || fStatus || fBranch || fCompany || fDrive || fMonth) && (
            <button className="erp-btn erp-btn--ghost erp-btn--sm" onClick={clearFilters} style={{ alignSelf: "flex-end" }}>
              <i className="fa-solid fa-xmark" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div className="erp-loader" />
          <p style={{ color: "var(--erp-text-muted,#64748b)", marginTop: 12 }}>Loading offer report…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="erp-card" style={{ textAlign: "center", padding: "4rem" }}>
          <i className="fa-solid fa-inbox" style={{ fontSize: 40, color: "#d1d5db", marginBottom: 12 }} />
          <p style={{ color: "var(--erp-text-muted,#64748b)", fontSize: 15 }}>
            {allRows.length === 0 ? "No offers have been released yet." : "No records match the current filters."}
          </p>
        </div>
      ) : (
        <div className="erp-card" style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="erp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--erp-surface-2,#f8fafc)" }}>
                  {["#","Student","ID","Branch","Company","Drive","Position","Package","Offer Date","Status","Rejection Reason"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontWeight: 700,
                      fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5,
                      color: "var(--erp-text-muted,#64748b)",
                      borderBottom: "2px solid var(--erp-border,#e2e8f0)",
                      whiteSpace: "nowrap"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.offer_id}
                    style={{
                      borderBottom: "1px solid var(--erp-border,#e2e8f0)",
                      background: i % 2 === 0 ? "transparent" : "var(--erp-surface-2,#f8fafc)",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--erp-primary-light,#eef2ff)"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "var(--erp-surface-2,#f8fafc)"}
                  >
                    <td style={{ padding: "10px 14px", color: "var(--erp-text-muted,#64748b)", fontWeight: 600 }}>{i + 1}</td>

                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "var(--erp-primary,#6366f1)", color: "#fff",
                          display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flexShrink: 0
                        }}>
                          {r.student_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--erp-text-primary,#1e293b)" }}>{r.student_name}</span>
                      </div>
                    </td>

                    <td style={{ padding: "10px 14px", color: "var(--erp-text-muted,#64748b)" }}>{r.student_id}</td>

                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        background: "var(--erp-info-light,#dbeafe)", color: "var(--erp-info,#1e40af)",
                        padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600
                      }}>{r.branch}</span>
                    </td>

                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{r.company_name}</td>
                    <td style={{ padding: "10px 14px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.drive_title}>{r.drive_title}</td>
                    <td style={{ padding: "10px 14px" }}>{r.position}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--erp-success,#065f46)" }}>{r.package}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{fmtDate(r.offer_date)}</td>

                    <td style={{ padding: "10px 14px" }}>
                      <StatusBadge status={r.status} />
                    </td>

                    <td style={{ padding: "10px 14px", maxWidth: 200 }}>
                      {r.status === "Rejected" && r.reason ? (
                        <span style={{
                          color: "var(--erp-danger,#991b1b)", fontSize: 12,
                          background: "var(--erp-danger-light,#fee2e2)",
                          padding: "2px 8px", borderRadius: 6, display: "inline-block"
                        }} title={r.reason}>
                          {r.reason.length > 40 ? r.reason.slice(0, 40) + "…" : r.reason}
                        </span>
                      ) : (
                        <span style={{ color: "#d1d5db" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Row count footer */}
          <div style={{
            padding: "10px 16px", borderTop: "1px solid var(--erp-border,#e2e8f0)",
            fontSize: 12, color: "var(--erp-text-muted,#64748b)",
            display: "flex", justifyContent: "space-between"
          }}>
            <span>Showing <strong>{rows.length}</strong> of <strong>{allRows.length}</strong> records</span>
            {rows.length > 0 && (
              <span>
                <strong style={{ color: "#10b981" }}>{accepted}</strong> Accepted &nbsp;|&nbsp;
                <strong style={{ color: "#ef4444" }}>{rejected}</strong> Rejected &nbsp;|&nbsp;
                <strong style={{ color: "#f59e0b" }}>{pending}</strong> Pending
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
