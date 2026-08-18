import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Send, Search, ChevronDown, Check, Plus, X } from "lucide-react";
import { MONTHS, getEndOfYearActual, getEndOfYearTarget } from "../types/kpi";
import type { KpiIndicator } from "../types/kpi";
import { listKpis, createKpi, saveIndicatorRow } from "../services/kpiService";
import { ApiError } from "../services/api";
import "../styles/KpiEntry.css";

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
  const navigate = useNavigate();
  const [mode, setMode] = useState<"create" | "update">("create");
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [indicators, setIndicators] = useState<KpiIndicator[]>([]);
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [newRow, setNewRow] = useState<NewRowForm>(emptyNewRow);
  const [adding, setAdding] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { items } = await listKpis({ year: Number(year) });
        if (!cancelled) setIndicators(items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load KPI data.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const filtered = useMemo(() => {
    if (!search) return indicators;
    return indicators.filter((row) =>
      row.indicator.toLowerCase().includes(search.toLowerCase()),
    );
  }, [indicators, search]);

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
    setModifiedIds((prev) => new Set(prev).add(id));
  }

  function handleAnnualTargetChange(id: string, value: string) {
    const numValue = value === "" ? 0 : Number(value);
    setIndicators((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, annualTarget: numValue } : row,
      ),
    );
    setModifiedIds((prev) => new Set(prev).add(id));
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
    setModifiedIds((prev) => new Set(prev).add(id));
  }

  async function handleAddIndicator() {
    setError(null);

    // Validate all fields
    if (!newRow.indicator) {
      setError("Please enter an indicator name.");
      return;
    }
    if (!newRow.annualTarget) {
      setError("Please enter an annual target.");
      return;
    }
    if (Number(newRow.annualTarget) <= 0) {
      setError("Annual target must be greater than 0.");
      return;
    }

    setAdding(true);
    try {
      const created = await createKpi({
        department: newRow.department,
        parameter: newRow.parameter,
        indicatorName: newRow.indicator,
        annualTarget: Number(newRow.annualTarget),
        personInCharge: newRow.personInCharge,
        year: Number(year),
      });
      setIndicators((prev) => [...prev, created]);
      setNewRow((prev) => ({ ...prev, indicator: "", annualTarget: "" }));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create that KPI. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function handleCancelNewRow() {
    setNewRow(emptyNewRow);
    setError(null);
  }

  async function handleSave(type: "draft" | "submit") {
    if (modifiedIds.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const idsToSave = Array.from(modifiedIds);
      const results = await Promise.all(
        idsToSave.map((id) => {
          const row = indicators.find((r) => r.id === id)!;
          return saveIndicatorRow(row, { includeAnnualTarget: true });
        }),
      );

      setIndicators((prev) =>
        prev.map((row) => results.find((r) => r.id === row.id) ?? row),
      );
      setModifiedIds(new Set());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Some changes didn't save (${type === "draft" ? "draft" : "submit"} failed). Please try again.`,
      );
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
          <button
            type="button"
            className={mode === "create" ? "active" : ""}
            onClick={() => setMode("create")}
          >
            Create entry
          </button>
          <button
            type="button"
            className={mode === "update" ? "active" : ""}
            onClick={() => navigate("/kpi-update")}
          >
            Update entry
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: "#b91c1c", margin: "8px 0" }}>
          {error}
        </p>
      )}

      <div className="kpi-entry-filters">
        <div className="kpi-filter-group">
          <label>Department</label>
          <div className="kpi-select-wrap">
            <select
              value={newRow.department}
              onChange={(e) =>
                setNewRow((r) => ({ ...r, department: e.target.value }))
              }
            >
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
              value={newRow.parameter}
              onChange={(e) =>
                setNewRow((r) => ({ ...r, parameter: e.target.value }))
              }
            >
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
              value={newRow.personInCharge}
              onChange={(e) =>
                setNewRow((r) => ({ ...r, personInCharge: e.target.value }))
              }
            >
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

        <div className="kpi-filter-group">
          <label>Indicator name</label>
          <input
            type="text"
            className="kpi-plain-input"
            placeholder="e.g. Electricity uptime days/month"
            value={newRow.indicator}
            onChange={(e) =>
              setNewRow((r) => ({ ...r, indicator: e.target.value }))
            }
          />
        </div>

        {/* ✅ ADDED - Annual Target input */}
        <div className="kpi-filter-group">
          <label>Annual Target</label>
          <input
            type="number"
            className="kpi-plain-input"
            placeholder="e.g. 365"
            value={newRow.annualTarget}
            onChange={(e) =>
              setNewRow((r) => ({ ...r, annualTarget: e.target.value }))
            }
          />
        </div>

        <div className="kpi-entry-filter-buttons">
          <button
            type="button"
            className="kpi-btn-outline"
            onClick={handleCancelNewRow}
            disabled={adding}
          >
            <X size={14} /> Cancel
          </button>
          <button
            type="button"
            className="kpi-btn-primary"
            onClick={handleAddIndicator}
            disabled={adding}
          >
            <Plus size={14} /> {adding ? "Adding..." : "Add"}
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
          <select defaultValue="all">
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
        <table className="kpi-table">
          <colgroup>
            <col className="kpi-colw-dept" />
            <col className="kpi-colw-param" />
            <col className="kpi-colw-indicator" />
            <col className="kpi-colw-person" />
            <col className="kpi-colw-target" />
            <col className="kpi-colw-map" />
            {MONTHS.map((m) => (
              <col key={m} className="kpi-colw-month" />
            ))}
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
              {MONTHS.map((m) => (
                <th key={m} className="kpi-col-month">
                  {m}
                </th>
              ))}
              <th className="kpi-col-eoy">End of Year</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7 + MONTHS.length} className="kpi-empty">
                  Loading KPI data...
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((row) => {
              const isModified = modifiedIds.has(row.id);
              const eoyActual = getEndOfYearActual(row.monthlyActual);
              const eoyTarget = getEndOfYearTarget(row.monthlyTarget);
              const eoyPct =
                eoyTarget > 0
                  ? Math.round((eoyActual / eoyTarget) * 100)
                  : null;
              const eoyTone =
                eoyPct === null
                  ? ""
                  : eoyPct >= 90
                    ? "kpi-pct-good"
                    : eoyPct >= 70
                      ? "kpi-pct-warn"
                      : "kpi-pct-bad";

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
                    <td className="kpi-col-person kpi-sticky" rowSpan={3}>
                      {row.personInCharge}
                    </td>
                    <td
                      className="kpi-col-target kpi-sticky kpi-target-cell"
                      rowSpan={3}
                    >
                      <input
                        type="number"
                        className="kpi-target-input"
                        value={row.annualTarget}
                        onChange={(e) =>
                          handleAnnualTargetChange(row.id, e.target.value)
                        }
                      />
                    </td>
                    <td className="kpi-col-map kpi-sticky kpi-map-label kpi-map-actuals">
                      ACTUALS
                    </td>
                    {row.monthlyActual.map((val, i) => (
                      <td key={i} className="kpi-col-month kpi-cell-input">
                        <input
                          type="number"
                          value={val ?? ""}
                          placeholder="–"
                          onChange={(e) =>
                            handleActualChange(row.id, i, e.target.value)
                          }
                        />
                      </td>
                    ))}
                    <td className="kpi-col-eoy kpi-eoy-value" rowSpan={3}>
                      <div className="kpi-eoy-actual">
                        {eoyActual.toLocaleString()}
                      </div>
                      <div className="kpi-eoy-target">
                        {eoyTarget.toLocaleString()}
                      </div>
                      {eoyPct !== null && (
                        <span className={`kpi-eoy-pct ${eoyTone}`}>
                          {eoyPct}%
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr key={`${row.id}-target`}>
                    <td className="kpi-col-map kpi-sticky kpi-map-label">
                      TARGET
                    </td>
                    {row.monthlyTarget.map((val, i) => (
                      <td key={i} className="kpi-col-month kpi-cell-input">
                        <input
                          type="number"
                          value={val ?? ""}
                          placeholder="–"
                          onChange={(e) =>
                            handleMonthlyTargetChange(row.id, i, e.target.value)
                          }
                        />
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
            {!isLoading && filtered.length === 0 && (
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
            <span className="kpi-footer-value">
              {filtered.length} / {indicators.length}
            </span>
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
          <button
            type="button"
            className="kpi-btn-outline"
            onClick={() => handleSave("draft")}
            disabled={saving || modifiedIds.size === 0}
          >
            <Save size={14} /> Save draft
          </button>
          <button
            type="button"
            className="kpi-btn-primary"
            onClick={() => handleSave("submit")}
            disabled={saving || modifiedIds.size === 0}
          >
            <Send size={14} /> {saving ? "Submitting..." : "Submit KPI"}
          </button>
        </div>
      </div>
    </div>
  );
}