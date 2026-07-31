import { useMemo, useState } from "react";
import { Save, Send, Search, ChevronDown, Check, Plus, X } from "lucide-react";
import { mockKpiIndicators } from "../data/mockKpiData";
import { MONTHS, getEndOfYearActual } from "../types/kpi";
import type { KpiIndicator } from "../types/kpi";
import "../styles/KpiEntry.css";

const DEPARTMENTS = ["Programs", "Partnerships", "Marketing", "Funding", "M & E", "Mentorship", "Guestspeakers"];
const PARAMETERS = ["Campus", "Recruitment", "Talent Retention", "Job Placement", "Visibility", "Invite Only Donors", "Sponsorships", "Grants", "Website", "Social Media", "Newsletter", "PR", "Surveys", "Mentors", "Guestspeakers"];
const PEOPLE = ["Amara Whitfield", "John Doe", "Mary Precious"];
const YEARS = ["2024", "2025", "2026"];

interface NewRowForm {
  department: string;
  parameter: string;
  personInCharge: string;
  indicator: string;
  annualTarget: string;
}

const emptyNewRow: NewRowForm = {
  department: DEPARTMENTS[0],
  parameter: PARAMETERS[0],
  personInCharge: PEOPLE[0],
  indicator: "",
  annualTarget: "",
};

export default function KpiEntry() {
  const [mode, setMode] = useState<"create" | "update">("create");
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [indicators, setIndicators] = useState<KpiIndicator[]>(mockKpiIndicators);
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [newRow, setNewRow] = useState<NewRowForm>(emptyNewRow);

  const filtered = useMemo(() => {
    if (!search) return indicators;
    return indicators.filter((row) => row.indicator.toLowerCase().includes(search.toLowerCase()));
  }, [indicators, search]);

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

  function handleAddIndicator() {
    if (!newRow.indicator || !newRow.annualTarget) return;

    const target = Number(newRow.annualTarget);
    const monthlyTarget = Array(12).fill(Math.round(target / 12));

    const newIndicator: KpiIndicator = {
      id: crypto.randomUUID(),
      department: newRow.department,
      parameter: newRow.parameter,
      personInCharge: newRow.personInCharge,
      indicator: newRow.indicator,
      annualTarget: target,
      monthlyTarget,
      monthlyActual: Array(12).fill(null),
    };

    setIndicators((prev) => [...prev, newIndicator]);
    setNewRow((prev) => ({ ...prev, indicator: "", annualTarget: "" }));
  }

  function handleCancelNewRow() {
    setNewRow(emptyNewRow);
  }

  async function handleSave(type: "draft" | "submit") {
    setSaving(true);
    try {
      // TODO: replace with real API call once backend endpoint exists.
      console.log(`Saving as ${type}`);
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
            <select value={newRow.department} onChange={(e) => setNewRow((r) => ({ ...r, department: e.target.value }))}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} className="kpi-select-icon" />
          </div>
        </div>

        <div className="kpi-filter-group">
          <label>Parameter</label>
          <div className="kpi-select-wrap">
            <select value={newRow.parameter} onChange={(e) => setNewRow((r) => ({ ...r, parameter: e.target.value }))}>
              {PARAMETERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown size={14} className="kpi-select-icon" />
          </div>
        </div>

        <div className="kpi-filter-group">
          <label>Person responsible</label>
          <div className="kpi-select-wrap">
            <select value={newRow.personInCharge} onChange={(e) => setNewRow((r) => ({ ...r, personInCharge: e.target.value }))}>
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

        <div className="kpi-filter-group">
          <label>Indicator name</label>
          <input
            type="text"
            className="kpi-plain-input"
            placeholder="e.g. Electricity uptime days/month"
            value={newRow.indicator}
            onChange={(e) => setNewRow((r) => ({ ...r, indicator: e.target.value }))}
          />
        </div>

      
        <button type="button" className="kpi-btn-outline" onClick={handleCancelNewRow}>
          <X size={14} /> Cancel
        </button>
        <button type="button" className="kpi-btn-primary" onClick={handleAddIndicator}>
          <Plus size={14} /> Add
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
            <col className="kpi-colw-person" />
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
              <th className="kpi-col-person kpi-sticky">Person Responsible</th>
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
                      {row.department}
                    </td>
                    <td className="kpi-col-param kpi-sticky" rowSpan={3}>{row.parameter}</td>
                    <td className="kpi-col-indicator kpi-sticky" rowSpan={3}>{row.indicator}</td>
                    <td className="kpi-col-person kpi-sticky" rowSpan={3}>{row.personInCharge}</td>
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
                <td colSpan={7 + MONTHS.length} className="kpi-empty">
                  No indicators match your search.
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