import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { MONTHS, getEndOfYearActual, getEndOfYearTarget } from "../types/kpi";
import type { KpiIndicator } from "../types/kpi";
import { listKpis, deleteKpi, saveIndicatorRow } from "../services/kpiService";
import { ApiError } from "../services/api";
import "../styles/KpiEntry.css";
import "../styles/KpiUpdate.css";

const DEPARTMENTS = [
  "PROGRAM",
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
// "Reporting year" has no backend equivalent yet - see kpiService.ts's
// top-of-file note. Kept as a client-only field for now.
const YEARS = ["2024", "2025", "2026"];

export default function KpiUpdate() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState("all");
  const [parameter, setParameter] = useState("all");
  const [person, setPerson] = useState("all");
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [indicators, setIndicators] = useState<KpiIndicator[]>([]);
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [rowFilter, setRowFilter] = useState<"all" | "modified">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // loadIndicators is called both from the effect below (on filter/year
  // change) and directly from handleDiscardChanges - a request counter
  // guards both call sites the same way: if a newer call has started by
  // the time an older one resolves, the older result is discarded.
  // Without this, switching years quickly (each request took ~3s in
  // testing) could let a slow, stale response for a previous year
  // overwrite the correct result for whatever year is now selected.
  const loadRequestId = useRef(0);

  // department/parameter/year are sent to the backend as real filters
  // (year defaults server-side to the current year if omitted, but we
  // always send the dropdown's value explicitly so switching years
  // actually changes what loads); person/search/rowFilter stay
  // client-side - list_kpis has no person_in_charge or free-text-
  // across-fields filter.
  async function loadIndicators() {
    const requestId = ++loadRequestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const { items } = await listKpis({
        department: department === "all" ? undefined : department,
        parameter: parameter === "all" ? undefined : parameter,
        year: Number(year),
      });
      if (requestId !== loadRequestId.current) return; // a newer request has since started
      setIndicators(items);
      setModifiedIds(new Set());
    } catch (err) {
      if (requestId !== loadRequestId.current) return;
      setError(err instanceof ApiError ? err.message : "Could not load KPI data.");
    } finally {
      if (requestId === loadRequestId.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    loadIndicators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, parameter, year]);

  const filtered = useMemo(() => {
    return indicators.filter((row) => {
      if (person !== "all" && row.personInCharge !== person) return false;
      if (rowFilter === "modified" && !modifiedIds.has(row.id)) return false;
      if (search && !row.indicator.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [indicators, person, rowFilter, modifiedIds, search]);

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
    const numValue = value === "" ? null : Number(value);
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

  async function handleDeleteRow(id: string) {
    setError(null);
    try {
      await deleteKpi(id);
      setIndicators((prev) => prev.filter((row) => row.id !== id));
      setModifiedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete that record. Please try again.");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  // "Discard changes" now means: throw away local edits and re-fetch
  // from the backend, rather than reverting to a frozen mock snapshot.
  async function handleDiscardChanges() {
    setEditingRowId(null);
    await loadIndicators();
  }

  // FIX: the original version filled in 0s locally but never called
  // markModified(), so "Save"/"Submit" (which only loops over
  // modifiedIds) silently skipped these rows - the bulk-fill would look
  // like it worked but nothing would ever reach the backend. Marking the
  // affected rows here is required for this to actually persist.
  function handleBulkFillMissing() {
    setIndicators((prev) =>
      prev.map((row) => {
        const hadMissing = row.monthlyActual.some((v) => v === null);
        if (!hadMissing) return row;
        const nextActual = row.monthlyActual.map((v) => (v === null ? 0 : v));
        markModified(row.id);
        return { ...row, monthlyActual: nextActual };
      }),
    );
  }

  // "draft" and "submit" both persist the same way today - see the
  // top-of-file note in kpiService.ts on why there's no separate
  // draft/submitted state on the backend yet. Annual target is never
  // sent from here - this table has no input for it, only months.
  async function handleSave(type: "draft" | "submit") {
    if (modifiedIds.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const idsToSave = Array.from(modifiedIds);
      const results = await Promise.all(
        idsToSave.map((id) => {
          const row = indicators.find((r) => r.id === id)!;
          return saveIndicatorRow(row, { includeAnnualTarget: false });
        }),
      );

      setIndicators((prev) =>
        prev.map((row) => results.find((r) => r.id === row.id) ?? row),
      );
      setModifiedIds(new Set());
      void type;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Some changes didn't save. Please try again.");
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
          <button
            type="button"
            className="kpi-btn-outline"
            onClick={() => navigate("/kpi-entry")}
          >
            <PlusCircle size={14} /> Create new entry
          </button>
          <button type="button" className="kpi-btn-outline" disabled>
            <History size={14} /> Import history
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: "#b91c1c", margin: "8px 0" }}>
          {error}
        </p>
      )}

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
            disabled={saving}
          >
            <Undo2 size={14} /> Discard Changes
          </button>
          <button
            type="button"
            className="kpi-btn-primary"
            onClick={() => handleSave("submit")}
            disabled={saving || modifiedIds.size === 0}
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
          <Check size={13} /> {modifiedIds.size === 0 ? "All changes saved" : `${modifiedIds.size} unsaved row(s)`}
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
            {isLoading && (
              <tr>
                <td colSpan={6 + MONTHS.length} className="kpi-empty">
                  Loading KPI data...
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((row) => {
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
                          <span className={val === null ? "kpi-missing" : ""}>
                            {val === null ? "–" : val}
                          </span>
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
                        actual === null || actual === undefined || target === null || target === undefined || target === 0
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
            {!isLoading && filtered.length === 0 && (
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
              –
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
            disabled={saving || modifiedIds.size === 0}
          >
            <Save size={14} /> Save as draft
          </button>
          <button
            type="button"
            className="kpi-btn-primary"
            onClick={() => handleSave("submit")}
            disabled={saving || modifiedIds.size === 0}
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