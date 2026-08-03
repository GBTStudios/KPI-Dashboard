import { useMemo, useState } from "react";
import {
  Save,
  Send,
  Search,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  Undo2,
  PlusCircle,
  History,
} from "lucide-react";
import { mockKpiIndicators } from "../data/mockKpiData";
import { MONTHS, getEndOfYearActual, getEndOfYearTarget } from "../types/kpi";
import type { KpiIndicator } from "../types/kpi";
import "../styles/KpiEntry.css";
import "../styles/KpiUpdate.css";

const DEPARTMENTS = [
  "Programs",
  "Partnerships",
  "Marketing",
  "Funding",
  "M & E",
  "Mentorship",
  "Guestspeakers",
];
const PARAMETERS = [
  "Campus",
  "Recruitment",
  "Talent Retention",
  "Job Placement",
  "Visibility",
  "Invite Only Donors",
  "Sponsorships",
  "Grants",
  "Website",
  "Social Media",
  "Newsletter",
  "PR",
  "Surveys",
  "Mentors",
  "Guestspeakers",
];
const PEOPLE = ["Amara Whitfield", "John Doe", "Mary Precious"];
const YEARS = ["2024", "2025", "2026"];

export default function KpiUpdate() {
  const [department, setDepartment] = useState("all");
  const [parameter, setParameter] = useState("all");
  const [person, setPerson] = useState("all");
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [indicators, setIndicators] =
    useState<KpiIndicator[]>(mockKpiIndicators);
  const [originalIndicators] = useState<KpiIndicator[]>(mockKpiIndicators);
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowFilter, setRowFilter] = useState<"all" | "modified">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return indicators.filter((row) => {
      if (department !== "all" && row.department !== department) return false;
      if (parameter !== "all" && row.parameter !== parameter) return false;
      if (person !== "all" && row.personInCharge !== person) return false;
      if (rowFilter === "modified" && !modifiedIds.has(row.id)) return false;
      if (search && !row.indicator.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [
    indicators,
    department,
    parameter,
    person,
    rowFilter,
    modifiedIds,
    search,
  ]);

  function markModified(id: string) {
    setModifiedIds((prev) => new Set(prev).add(id));
  }

  function handleActualChange(id: string, monthIndex: number, value: string) {
    const numValue = value === "" ? null : Number(value);
    setIndicators((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const nextActual = [...row.monthlyActual];
        nextActual[monthIndex] = numValue;
        return { ...row, monthlyActual: nextActual };
      }),
    );
    markModified(id);
  }

  function handleMonthlyTargetChange(
    id: string,
    monthIndex: number,
    value: string,
  ) {
    const numValue = value === "" ? 0 : Number(value);
    setIndicators((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const nextTarget = [...row.monthlyTarget];
        nextTarget[monthIndex] = numValue;
        return { ...row, monthlyTarget: nextTarget };
      }),
    );
    markModified(id);
  }

  function handleDeleteRow(id: string) {
    setIndicators((prev) => prev.filter((row) => row.id !== id));
    setModifiedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setConfirmDeleteId(null);
  }

  function handleDiscardChanges() {
    setIndicators(originalIndicators);
    setModifiedIds(new Set());
    setEditingRowId(null);
  }

  function handleBulkFillMissing() {
    setIndicators((prev) =>
      prev.map((row) => {
        const nextActual = row.monthlyActual.map((v) => (v === null ? 0 : v));
        return { ...row, monthlyActual: nextActual };
      }),
    );
  }

  async function handleSave(type: "draft" | "submit") {
    setSaving(true);
    try {
      // TODO: replace with real API call once backend endpoint exists.
      console.log(`Saving as ${type}`, indicators);
      await new Promise((r) => setTimeout(r, 500));
      if (type === "submit") setModifiedIds(new Set());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="kpi-entry-page">
      <div className="kpi-entry-breadcrumb">Dashboard &gt; KPI Entry</div>

      <div className="kpi-update-top">
        <div>
          <h1>Update KPI Records</h1>
          <p>
            Capture monthly performance data and adjust existing organizational
            metrics.
          </p>
        </div>
        <div className="kpi-update-top-actions">
          <button type="button" className="kpi-btn-outline">
            <PlusCircle size={14} /> Create new entry
          </button>
          <button type="button" className="kpi-btn-outline" disabled>
            <History size={14} /> Import history
          </button>
        </div>
      </div>

      <div className="kpi-update-filterbar">
        <div className="kpi-update-filter-fields">
          <div className="kpi-filter-group">
            <label>Department</label>
            <div className="kpi-select-wrap">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="all">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="kpi-select-icon" />
            </div>
          </div>

          <div className="kpi-filter-group">
            <label>Parameter</label>
            <div className="kpi-select-wrap">
              <select
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
              >
                <option value="all">All parameters</option>
                {PARAMETERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="kpi-select-icon" />
            </div>
          </div>

          <div className="kpi-filter-group">
            <label>Person responsible</label>
            <div className="kpi-select-wrap">
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
              >
                <option value="all">All people</option>
                {PEOPLE.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="kpi-select-icon" />
            </div>
          </div>

          <div className="kpi-filter-group">
            <label>Reporting year</label>
            <div className="kpi-select-wrap">
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="kpi-select-icon" />
            </div>
          </div>
        </div>

        <div className="kpi-update-filterbar-actions">
          <button
            type="button"
            className="kpi-btn-outline"
            onClick={handleDiscardChanges}
          >
            <Undo2 size={14} /> Discard Changes
          </button>
          <button
            type="button"
            className="kpi-btn-primary"
            onClick={() => handleSave("submit")}
            disabled={saving}
          >
            <Send size={14} /> {saving ? "Submitting..." : "Submit Updates"}
          </button>
        </div>
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
          <select
            value={rowFilter}
            onChange={(e) => setRowFilter(e.target.value as "all" | "modified")}
          >
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
        <table className="kpi-table kpi-table-update">
          <colgroup>
            <col className="kpi-colw-dept" />
            <col className="kpi-colw-param" />
            <col className="kpi-colw-indicator" />
            <col className="kpi-colw-target" />
            <col className="kpi-colw-map" />
            {MONTHS.map((m) => (
              <col key={m} className="kpi-colw-month" />
            ))}
            <col className="kpi-colw-rowactions" />
          </colgroup>
          <thead>
            <tr>
              <th className="kpi-col-dept kpi-sticky">Department</th>
              <th className="kpi-col-param kpi-sticky">Parameter</th>
              <th className="kpi-col-indicator kpi-sticky">Indicator</th>
              <th className="kpi-col-target kpi-sticky">Annual Target</th>
              <th className="kpi-col-map kpi-sticky">MAP</th>
              {MONTHS.map((m) => (
                <th key={m} className="kpi-col-month">
                  {m}
                </th>
              ))}
              <th className="kpi-col-rowactions"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const isModified = modifiedIds.has(row.id);
              const isEditing = editingRowId === row.id;
              const eoyActual = getEndOfYearActual(row.monthlyActual);
              const eoyTarget = getEndOfYearTarget(row.monthlyTarget);

              return (
                <>
                  <tr
                    key={`${row.id}-actuals`}
                    className={isModified ? "kpi-row-modified" : ""}
                  >
                    <td className="kpi-col-dept kpi-sticky" rowSpan={3}>
                      {row.department}
                    </td>
                    <td className="kpi-col-param kpi-sticky" rowSpan={3}>
                      {row.parameter}
                    </td>
                    <td className="kpi-col-indicator kpi-sticky" rowSpan={3}>
                      {row.indicator}
                    </td>
                    <td
                      className="kpi-col-target kpi-sticky kpi-target-cell"
                      rowSpan={3}
                    >
                      {eoyTarget.toLocaleString()}
                    </td>
                    <td className="kpi-col-map kpi-sticky kpi-map-label kpi-map-actuals">
                      ACTUALS
                    </td>
                    {row.monthlyActual.map((val, i) => (
                      <td key={i} className="kpi-col-month kpi-cell-input">
                        {isEditing ? (
                          <input
                            type="number"
                            value={val ?? ""}
                            placeholder="–"
                            onChange={(e) =>
                              handleActualChange(row.id, i, e.target.value)
                            }
                          />
                        ) : (
                          <span className={val === null ? "kpi-missing" : ""}>
                            {val === null ? "–" : val}
                          </span>
                        )}
                      </td>
                    ))}
                    <td
                      className="kpi-col-rowactions kpi-rowactions-cell"
                      rowSpan={3}
                    >
                      <button
                        type="button"
                        className="kpi-row-icon-btn"
                        aria-label="Edit row"
                        onClick={() =>
                          setEditingRowId(isEditing ? null : row.id)
                        }
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="kpi-row-icon-btn kpi-row-icon-danger"
                        aria-label="Delete row"
                        onClick={() => setConfirmDeleteId(row.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  <tr key={`${row.id}-target`}>
                    <td className="kpi-col-map kpi-sticky kpi-map-label">
                      TARGET
                    </td>
                    {row.monthlyTarget.map((val, i) => (
                      <td key={i} className="kpi-col-month kpi-cell-input">
                        {isEditing ? (
                          <input
                            type="number"
                            value={val ?? ""}
                            placeholder="–"
                            onChange={(e) =>
                              handleMonthlyTargetChange(
                                row.id,
                                i,
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <span>{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr key={`${row.id}-pct`}>
                    <td className="kpi-col-map kpi-sticky kpi-map-label kpi-map-pct">
                      %
                    </td>
                    {row.monthlyTarget.map((target, i) => {
                      const actual = row.monthlyActual[i];
                      const pct =
                        actual === null || actual === undefined
                          ? null
                          : Math.round((actual / target) * 100);
                      const tone =
                        pct === null
                          ? ""
                          : pct >= 90
                            ? "kpi-pct-good"
                            : pct >= 70
                              ? "kpi-pct-warn"
                              : "kpi-pct-bad";
                      return (
                        <td
                          key={i}
                          className={`kpi-col-month kpi-cell-readonly ${tone}`}
                        >
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
                  No records match your filters.
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
            <span className="kpi-footer-value">
              {filtered.length} / {indicators.length}
            </span>
          </div>
          <div>
            <span className="kpi-footer-label">Modified records</span>
            <span className="kpi-footer-value">{modifiedIds.size}</span>
          </div>
          <div>
            <span className="kpi-footer-label">Auto-saved</span>
            <span className="kpi-footer-value kpi-footer-value-small">
              Just now
            </span>
          </div>
        </div>

        <div className="kpi-bulk-action">
          <span>Bulk Action: Set 0 for missing values</span>
          <button
            type="button"
            className="kpi-bulk-apply"
            onClick={handleBulkFillMissing}
          >
            Apply
          </button>
        </div>

        <div className="kpi-footer-actions">
          <button
            type="button"
            className="kpi-btn-outline"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            <Save size={14} /> Save as draft
          </button>
          <button
            type="button"
            className="kpi-btn-primary"
            onClick={() => handleSave("submit")}
            disabled={saving}
          >
            <Send size={14} />{" "}
            {saving ? "Submitting..." : "Finalize submission"}
          </button>
        </div>
      </div>

      {confirmDeleteId && (
        <div
          className="kpi-modal-overlay"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div className="kpi-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="kpi-modal-title">Delete this KPI record?</h2>
            <p className="kpi-modal-description">
              This will permanently remove the indicator and all its monthly
              data. This action cannot be undone.
            </p>
            <div className="kpi-modal-actions">
              <button
                type="button"
                className="kpi-btn-outline"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="kpi-btn-danger"
                onClick={() => handleDeleteRow(confirmDeleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
