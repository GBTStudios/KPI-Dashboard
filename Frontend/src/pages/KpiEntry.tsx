import { useMemo, useState } from "react";
import { Save, Send, Search, ChevronDown, Check } from "lucide-react";
import { mockKpiIndicators } from "../data/mockKpiData";
import { MONTHS, getEndOfYearActual } from "../types/kpi";
import type { KpiIndicator } from "../types/kpi";
import "../styles/KpiEntry.css";

const DEPARTMENTS = ["All departments", "Programs", "Marketing", "Funding"];
const PARAMETERS = ["All parameters", "Campus", "Digital", "Grants"];
const PEOPLE = ["Amara Whitfield", "John Doe", "Mary Precious"];
const YEARS = ["2024", "2025", "2026"];

export default function KpiEntry() {
  const [mode, setMode] = useState<"create" | "update">("create");
  const [department, setDepartment] = useState("All departments");
  const [parameter, setParameter] = useState("All parameters");
  const [person, setPerson] = useState(PEOPLE[0]);
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [indicators, setIndicators] = useState<KpiIndicator[]>(mockKpiIndicators);
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return indicators.filter((row) => {
      if (department !== "All departments" && row.department !== department) return false;
      if (parameter !== "All parameters" && row.parameter !== parameter) return false;
      if (search && !row.indicator.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [indicators, department, parameter, search]);

  function handleActualChange(id: string, monthIndex: number, value: string) {
    const numValue = value === "" ? null : Number(value);
    setIndicators((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const nextActual = [...row.monthlyActual];
        nextActual[monthIndex] = numValue;
        return { ...row, monthlyActual: nextActual };
      })
    );
    setModifiedIds((prev) => new Set(prev).add(id));
  }

  function handleAnnualTargetChange(id: string, value: string) {
    const numValue = value === "" ? 0 : Number(value);
    setIndicators((prev) =>
      prev.map((row) => (row.id === id ? { ...row, annualTarget: numValue } : row))
    );
    setModifiedIds((prev) => new Set(prev).add(id));
  }

  async function handleSave(type: "draft" | "submit") {
    setSaving(true);
    try {
      // TODO: call KPI entry save/submit service once backend endpoint exists
      await new Promise((r) => setTimeout(r, 500));
      setModifiedIds(new Set());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="kpi-entry-page">
      <div className="kpi-entry-breadcrumb">Dashboard &gt; KPI Entry</div>

      <div className="kpi-entry-top">
        <div>
          <h1>{mode === "create" ? "Create KPI Entry" : "Update KPI Entry"}</h1>
          <p>Capture monthly KPI data for organizational reporting.</p>
        </div>
        <div className="kpi-entry-mode-switch">
          <button type="button" className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>
            Create entry
          </button>
          <button type="button" className={mode === "update" ? "active" : ""} onClick={() => setMode("update")}>
            Update entry
          </button>
        </div>
      </div>

      <div className="kpi-entry-filters">
        <div className="kpi-filter-group">
          <label>Department</label>
          <div className="kpi-select-wrap">
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} className="kpi-select-icon" />
          </div>
        </div>

        <div className="kpi-filter-group">
          <label>Parameter</label>
          <div className="kpi-select-wrap">
            <select value={parameter} onChange={(e) => setParameter(e.target.value)}>
              {PARAMETERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={14} className="kpi-select-icon" />
          </div>
        </div>

        <div className="kpi-filter-group">
          <label>Person responsible</label>
          <div className="kpi-select-wrap">
            <select value={person} onChange={(e) => setPerson(e.target.value)}>
              {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={14} className="kpi-select-icon" />
          </div>
        </div>

        <div className="kpi-filter-group">
          <label>Reporting year</label>
          <div className="kpi-select-wrap">
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} className="kpi-select-icon" />
          </div>
        </div>

        <button type="button" className="kpi-btn-outline" onClick={() => handleSave("draft")} disabled={saving}>
          <Save size={14} /> Save draft
        </button>
        <button type="button" className="kpi-btn-primary" onClick={() => handleSave("submit")} disabled={saving}>
          <Send size={14} /> Submit KPI
        </button>
      </div>

      <div className="kpi-entry-toolbar">
        <div className="kpi-search">
          <Search size={14} className="kpi-search-icon" />
          <input
            type="text"
            placeholder="Search KPI or indicator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="kpi-select-wrap kpi-rows-select">
          <select defaultValue="all">
            <option value="all">All rows</option>
            <option value="modified">Modified only</option>
          </select>
          <ChevronDown size={14} className="kpi-select-icon" />
        </div>
        <span className="kpi-save-status">
          <Check size={13} /> All changes saved
        </span>
      </div>

      <div className="kpi-table-wrapper">
        <table className="kpi-table">
          <colgroup>
            <col className="kpi-colw-dept" />
            <col className="kpi-colw-param" />
            <col className="kpi-colw-indicator" />
            <col className="kpi-colw-target" />
            <col className="kpi-colw-map" />
            {MONTHS.map((m) => <col key={m} className="kpi-colw-month" />)}
            <col className="kpi-colw-eoy" />
          </colgroup>
          <thead>
            <tr>
              <th className="kpi-col-dept kpi-sticky">Department</th>
              <th className="kpi-col-param kpi-sticky">Parameter</th>
              <th className="kpi-col-indicator kpi-sticky">Indicator</th>
              <th className="kpi-col-target kpi-sticky">Annual Target</th>
              <th className="kpi-col-map kpi-sticky">MAP</th>
              {MONTHS.map((m) => <th key={m} className="kpi-col-month">{m}</th>)}
              <th className="kpi-col-eoy">End of Year</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const isModified = modifiedIds.has(row.id);
              const eoyActual = getEndOfYearActual(row.monthlyActual);
              const eoyTarget = row.monthlyTarget.reduce((s, v) => s + v, 0);
              const eoyPct = eoyTarget > 0 ? Math.round((eoyActual / eoyTarget) * 100) : null;
              const eoyTone =
                eoyPct === null ? "" : eoyPct >= 90 ? "kpi-pct-good" : eoyPct >= 70 ? "kpi-pct-warn" : "kpi-pct-bad";

              return (
                <>
                  <tr key={`${row.id}-actuals`} className={isModified ? "kpi-row-modified" : ""}>
                    <td className="kpi-col-dept kpi-sticky" rowSpan={3}>
                      <span className="kpi-dept-dot" />
                      {row.department}
                    </td>
                    <td className="kpi-col-param kpi-sticky" rowSpan={3}>{row.parameter}</td>
                    <td className="kpi-col-indicator kpi-sticky" rowSpan={3}>{row.indicator}</td>
                    <td className="kpi-col-target kpi-sticky kpi-target-cell" rowSpan={3}>
                      <input
                        type="number"
                        className="kpi-target-input"
                        value={row.annualTarget}
                        onChange={(e) => handleAnnualTargetChange(row.id, e.target.value)}
                      />
                    </td>
                    <td className="kpi-col-map kpi-sticky kpi-map-label kpi-map-actuals">ACTUALS</td>
                    {row.monthlyActual.map((val, i) => (
                      <td key={i} className="kpi-col-month kpi-cell-input">
                        <input
                          type="number"
                          value={val ?? ""}
                          placeholder="–"
                          onChange={(e) => handleActualChange(row.id, i, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="kpi-col-eoy kpi-eoy-value" rowSpan={3}>
                      {eoyActual.toLocaleString()}
                      {eoyPct !== null && (
                        <span className={`kpi-eoy-pct ${eoyTone}`}>{eoyPct}%</span>
                      )}
                    </td>
                  </tr>
                  <tr key={`${row.id}-target`}>
                    <td className="kpi-col-map kpi-sticky kpi-map-label">TARGET</td>
                    {row.monthlyTarget.map((val, i) => (
                      <td key={i} className="kpi-col-month kpi-cell-readonly">{val}</td>
                    ))}
                  </tr>
                  <tr key={`${row.id}-pct`}>
                    <td className="kpi-col-map kpi-sticky kpi-map-label kpi-map-pct">%</td>
                    {row.monthlyTarget.map((target, i) => {
                      const actual = row.monthlyActual[i];
                      const pct = actual === null || actual === undefined ? null : Math.round((actual / target) * 100);
                      const tone =
                        pct === null ? "" : pct >= 90 ? "kpi-pct-good" : pct >= 70 ? "kpi-pct-warn" : "kpi-pct-bad";
                      return (
                        <td key={i} className={`kpi-col-month kpi-cell-readonly ${tone}`}>
                          {pct === null ? "–" : `${pct}%`}
                        </td>
                      );
                    })}
                  </tr>
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6 + MONTHS.length} className="kpi-empty">
                  No indicators match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="kpi-entry-footer">
        <div className="kpi-footer-stats">
          <div>
            <span className="kpi-footer-label">KPIs loaded</span>
            <span className="kpi-footer-value">{filtered.length} / {indicators.length}</span>
          </div>
          <div>
            <span className="kpi-footer-label">Modified records</span>
            <span className="kpi-footer-value">{modifiedIds.size}</span>
          </div>
          <div>
            <span className="kpi-footer-label">Autosaved</span>
            <span className="kpi-footer-value">–</span>
          </div>
        </div>
        <div className="kpi-footer-actions">
          <button type="button" className="kpi-btn-outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save size={14} /> Save draft
          </button>
          <button type="button" className="kpi-btn-primary" onClick={() => handleSave("submit")} disabled={saving}>
            <Send size={14} /> {saving ? "Submitting..." : "Submit KPI"}
          </button>
        </div>
      </div>
    </div>
  );
}