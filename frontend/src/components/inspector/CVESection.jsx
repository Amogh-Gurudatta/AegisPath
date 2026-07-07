import React, { useState, useEffect } from "react";
import { inputStyle } from "./InspectorUtils";

export default function CVESection({
  selectedNode,
  updateNodeConfig,
  setCvssText,
}) {
  const [cveInput, setCveInput] = useState("");
  const [cveLoading, setCveLoading] = useState(false);
  const [cveError, setCveError] = useState(null);
  const [cveSummary, setCveSummary] = useState(null);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichError, setEnrichError] = useState(null);

  // Sync state when selectedNode changes
  useEffect(() => {
    setCveInput(selectedNode?.config?.cve_id || "");
    setCveError(null);
    setCveSummary(null);
    setEnrichLoading(false);
    setEnrichError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  if (!selectedNode || selectedNode.nodeType === "internet") return null;

  return (
    <div className="inspector-section">
      <h4
        className="inspector-section-title"
        style={{ display: "flex", alignItems: "center", gap: "6px" }}
      >
        <span>CVE Lookup</span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 400,
            color: "var(--text-muted)",
            marginLeft: "2px",
          }}
        >
          via NIST NVD
        </span>
      </h4>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="CVE-2021-44228"
          value={cveInput}
          onChange={(e) => {
            setCveInput(e.target.value.toUpperCase());
            setCveError(null);
            setCveSummary(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onBlur={async () => {
            const id = cveInput.trim();
            if (!id) return;
            if (!/^CVE-\d{4}-\d+$/i.test(id)) {
              setCveError("Format must be CVE-YYYY-NNNNN");
              return;
            }
            setCveLoading(true);
            setCveError(null);
            setCveSummary(null);
            try {
              const [res, epssRes] = await Promise.all([
                fetch(
                  `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${id}`,
                ),
                fetch(`https://api.first.org/data/v1/epss?cve=${id}`),
              ]);

              if (!res.ok) throw new Error(`NVD responded with ${res.status}`);

              const data = await res.json();

              let epssScore = null;
              let epssPercentile = null;
              if (epssRes.ok) {
                const epssData = await epssRes.json();
                if (epssData?.data?.[0]) {
                  epssScore = parseFloat(epssData.data[0].epss);
                  epssPercentile = parseFloat(epssData.data[0].percentile);
                }
              }

              const vuln = data.vulnerabilities?.[0]?.cve;
              if (!vuln) throw new Error("CVE not found in NVD database");
              const m31 = vuln.metrics?.cvssMetricV31?.[0];
              const m30 = vuln.metrics?.cvssMetricV30?.[0];
              const m2 = vuln.metrics?.cvssMetricV2?.[0];
              const metric = m31 || m30 || m2;
              const score = metric?.cvssData?.baseScore;
              const desc =
                vuln.descriptions?.find((d) => d.lang === "en")?.value || "";

              const configUpdate = { cve_id: id };
              if (score !== undefined) {
                const rounded = Math.round(score * 10) / 10;
                configUpdate.cvss_score = rounded;
                setCvssText(String(rounded));
              }
              if (epssScore !== null) {
                configUpdate.epss_score = epssScore;
              }

              updateNodeConfig(selectedNode.id, configUpdate);

              const summaryObj = {
                score,
                severity: metric?.cvssData?.baseSeverity,
                version: m31 ? "3.1" : m30 ? "3.0" : "2.0",
                description:
                  desc.length > 160 ? desc.slice(0, 160) + "…" : desc,
                epssScore,
                epssPercentile,
              };
              setCveSummary(summaryObj);

              // ── LLM enrichment step ──────────────────────────────
              if (desc) {
                const nodeIdAtEnrich = selectedNode.id;
                setEnrichLoading(true);
                setEnrichError(null);

                const apiUrl =
                  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

                (async () => {
                  try {
                    const enrichRes = await fetch(`${apiUrl}/api/enrich-cve`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        cve_id: id,
                        description: desc,
                      }),
                    });
                    if (!enrichRes.ok)
                      throw new Error(`Enrich responded ${enrichRes.status}`);
                    const enrichData = await enrichRes.json();

                    if (enrichData.enrichment_error) {
                      setEnrichError(
                        "couldn't auto-infer flags — set manually",
                      );
                      return;
                    }

                    const flagUpdate = {};
                    if (enrichData.has_rce_vulnerability !== null)
                      flagUpdate.has_rce_vulnerability =
                        enrichData.has_rce_vulnerability;
                    if (enrichData.has_weak_credentials !== null)
                      flagUpdate.has_weak_credentials =
                        enrichData.has_weak_credentials;
                    if (enrichData.requires_network_access !== null)
                      flagUpdate.requires_network_access =
                        enrichData.requires_network_access;

                    if (Object.keys(flagUpdate).length > 0)
                      updateNodeConfig(nodeIdAtEnrich, flagUpdate);
                  } catch {
                    setEnrichError("couldn't auto-infer flags — set manually");
                  } finally {
                    setEnrichLoading(false);
                  }
                })();
              }
            } catch (err) {
              setCveError(err.message || "Lookup failed");
            } finally {
              setCveLoading(false);
            }
          }}
          style={{
            ...inputStyle,
            flex: 1,
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            borderColor: cveError
              ? "var(--accent-rose)"
              : "var(--border-color)",
          }}
        />
        {cveLoading && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            ⏳ Looking up…
          </span>
        )}
      </div>
      {cveError && (
        <span
          style={{
            fontSize: "11px",
            color: "var(--accent-rose)",
            marginTop: "4px",
            display: "block",
          }}
        >
          {cveError}
        </span>
      )}
      {cveSummary && (
        <div
          style={{
            marginTop: "8px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "8px 10px",
            fontSize: "11.5px",
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            {cveSummary.score !== undefined && (
              <span
                style={{
                  background:
                    cveSummary.score >= 9
                      ? "rgba(244,63,94,0.15)"
                      : cveSummary.score >= 7
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(99,102,241,0.12)",
                  border: `1px solid ${cveSummary.score >= 9 ? "rgba(244,63,94,0.4)" : cveSummary.score >= 7 ? "rgba(245,158,11,0.4)" : "rgba(99,102,241,0.3)"}`,
                  color:
                    cveSummary.score >= 9
                      ? "var(--accent-rose)"
                      : cveSummary.score >= 7
                        ? "var(--accent-amber)"
                        : "var(--accent-indigo)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "11px",
                }}
              >
                CVSS {cveSummary.version}: {cveSummary.score}
              </span>
            )}
            {cveSummary.epssScore !== undefined &&
              cveSummary.epssScore !== null && (
                <span
                  style={{
                    background:
                      cveSummary.epssScore >= 0.5
                        ? "rgba(244,63,94,0.15)"
                        : cveSummary.epssScore >= 0.1
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(99,102,241,0.12)",
                    border: `1px solid ${cveSummary.epssScore >= 0.5 ? "rgba(244,63,94,0.4)" : cveSummary.epssScore >= 0.1 ? "rgba(245,158,11,0.4)" : "rgba(99,102,241,0.3)"}`,
                    color:
                      cveSummary.epssScore >= 0.5
                        ? "var(--accent-rose)"
                        : cveSummary.epssScore >= 0.1
                          ? "var(--accent-amber)"
                          : "var(--accent-indigo)",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "11px",
                  }}
                  title={`EPSS Percentile: ${Math.round(cveSummary.epssPercentile * 100)}%`}
                >
                  EPSS: {(cveSummary.epssScore * 100).toFixed(1)}%
                </span>
              )}
            {cveSummary.severity && (
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                {cveSummary.severity}
              </span>
            )}
            <span
              style={{
                color: "var(--accent-emerald)",
                fontSize: "11px",
                marginLeft: "auto",
              }}
            >
              ✓ CVSS auto-filled
            </span>
          </div>
          {/* Enrichment status row */}
          {(enrichLoading || enrichError) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "5px",
              }}
            >
              {enrichLoading && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  ⏳ Inferring flags via LLM…
                </span>
              )}
              {enrichError && !enrichLoading && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--accent-amber)",
                    fontStyle: "italic",
                  }}
                >
                  ⚠ {enrichError}
                </span>
              )}
            </div>
          )}
          {!enrichLoading && !enrichError && cveSummary && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "5px",
                marginTop: "5px",
              }}
            >
              {[
                "has_rce_vulnerability",
                "has_weak_credentials",
                "requires_network_access",
              ].map((flag) => {
                const val = selectedNode?.config?.[flag];
                if (val === undefined || val === null) return null;
                return (
                  <span
                    key={flag}
                    style={{
                      background: val
                        ? "rgba(244,63,94,0.12)"
                        : "rgba(16,185,129,0.10)",
                      border: `1px solid ${val ? "rgba(244,63,94,0.35)" : "rgba(16,185,129,0.3)"}`,
                      color: val
                        ? "var(--accent-rose)"
                        : "var(--accent-emerald)",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "10.5px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {val ? "✔" : "✘"} {flag.replace(/_/g, " ")}
                  </span>
                );
              })}
            </div>
          )}
          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              fontSize: "11px",
            }}
          >
            {cveSummary.description}
          </p>
        </div>
      )}
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          marginTop: "6px",
        }}
      >
        Paste a CVE ID and tab/click away to auto-fill the CVSS score from NIST
        NVD.
      </p>
    </div>
  );
}
