import { Joyride, STATUS } from "react-joyride";

/* ─────────────────────────────────────────
   Step content helper — matches site card style
   ───────────────────────────────────────── */
function StepContent({ icon, title, body }) {
  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "16px",
            lineHeight: 1,
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "6px",
            padding: "5px 7px",
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: "var(--accent-indigo)",
            fontFamily: "var(--font-heading)",
          }}
        >
          {title}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.65,
          color: "var(--text-secondary)",
        }}
      >
        {body}
      </p>
    </div>
  );
}

export default function OnboardingTour({ run, setRun }) {
  const steps = [
    {
      target: "body",
      placement: "center",
      disableBeacon: true,
      content: (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            textAlign: "center",
            padding: "4px 0",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "12px",
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              marginBottom: "14px",
              fontSize: "22px",
            }}
          >
            🛡️
          </div>
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "-0.2px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Welcome to AegisPath
          </h3>
          <p
            style={{
              margin: "0 auto 4px", // Centered properly using auto margins for fixed width
              fontSize: "13px",
              lineHeight: 1.65,
              color: "var(--text-secondary)",
              maxWidth: "280px",
            }}
          >
            Enterprise-grade interactive threat topology simulator. Let's take a
            quick tour of the key features.
          </p>
        </div>
      ),
    },
    {
      target: ".sidebar",
      placement: "right",
      disableBeacon: true,
      content: (
        <StepContent
          icon="📦"
          title="Component Library"
          body="Drag any of 7 infrastructure node types onto the canvas — Firewall, Server, Workstation, Router, Database, Load Balancer, or Cloud Service — to build your attack surface map."
        />
      ),
    },
    {
      target: ".canvas-container",
      placement: "center",
      disableBeacon: true,
      content: (
        <StepContent
          icon="🗺️"
          title="Topology Canvas"
          body="Drop nodes here and connect them by dragging between ports. This is your live, interactive network diagram. Zoom and pan freely."
        />
      ),
    },
    {
      target: ".inspector-panel",
      placement: "left",
      disableBeacon: true,
      content: (
        <StepContent
          icon="🔧"
          title="Inspector Panel"
          body="Click a node to edit its label, IP, ports, and vulnerabilities. Look up CVE IDs to auto-fill CVSS scores from NIST NVD. Add manual MITRE ATT&CK tags. Click an edge to toggle cleartext mode. Add or delete custom properties. Mark nodes as Entry Points or Targets."
        />
      ),
    },
    {
      target: ".simulate-btn",
      placement: "bottom",
      disableBeacon: true,
      content: (
        <StepContent
          icon="⚡"
          title="Run Simulation"
          body="Triggers the multi-path threat engine across all entry points and targets. The primary attack path animates in red; alternatives trace in amber. Switch attacker personas (Standard / Script Kiddie / APT) in the top bar to change traversal weights before simulating."
        />
      ),
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }
  };

  return (
    <Joyride
      key={run ? "running" : "stopped"}
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      disableScrolling={false}
      callback={handleJoyrideCallback}
      locale={{
        back: "← Back",
        close: "Close",
        last: "Finish Tour",
        next: "Next →",
        skip: "Skip tour",
      }}
      styles={{
        options: {
          arrowColor: "var(--bg-secondary)",
          backgroundColor: "var(--bg-secondary)",
          overlayColor: "var(--theme-overlay-color)",
          primaryColor: "var(--accent-indigo)",
          textColor: "var(--text-primary)",
          width: 340,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 0 0 1px rgba(99,102,241,0.12), var(--shadow-lg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "20px 22px",
          background: "var(--bg-secondary)",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipFooter: {
          marginTop: "18px",
          paddingTop: "14px",
          borderTop: "1px solid var(--border-color)",
        },
        tooltipFooterSpacer: {
          flex: 1,
        },
        tooltipTitle: {
          fontSize: "13px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
          fontWeight: 500,
          letterSpacing: "0.3px",
          marginBottom: "6px",
        },
        buttonClose: {
          color: "var(--text-muted)",
          width: "14px",
          height: "14px",
        },
        beacon: {
          inner: "var(--accent-indigo)",
          outer: "rgba(99,102,241,0.3)",
        },
        spotlight: {
          borderRadius: "8px",
          boxShadow: "0 0 0 2px var(--border-active)",
        },
      }}
    />
  );
}
