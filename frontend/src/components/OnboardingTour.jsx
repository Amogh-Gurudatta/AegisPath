import React from 'react';
import { Joyride, STATUS } from 'react-joyride';

/* ─────────────────────────────────────────
   Step content helper — matches site card style
───────────────────────────────────────── */
function StepContent({ icon, title, body }) {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{
          fontSize: '16px',
          lineHeight: 1,
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '6px',
          padding: '5px 7px',
        }}>{icon}</span>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: '#6366f1',
          fontFamily: "'JetBrains Mono', monospace",
        }}>{title}</span>
      </div>
      <p style={{
        margin: 0,
        fontSize: '13px',
        lineHeight: 1.65,
        color: '#8892a4',
      }}>{body}</p>
    </div>
  );
}

export default function OnboardingTour({ run, setRun }) {
  const steps = [
    {
      target: 'body',
      placement: 'center',
      disableBeacon: true,
      content: (
        <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", textAlign: 'center', padding: '4px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            marginBottom: '14px',
            fontSize: '22px',
          }}>🛡️</div>
          <h3 style={{
            margin: '0 0 8px',
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '-0.2px',
            color: '#e2e8f0',
          }}>Welcome to AegisPath</h3>
          <p style={{
            margin: '0 0 4px',
            fontSize: '13px',
            lineHeight: 1.65,
            color: '#8892a4',
            maxWidth: '280px',
          }}>
            Enterprise-grade interactive threat topology simulator. Let's take a quick tour of the key features.
          </p>
        </div>
      ),
    },
    {
      target: '.sidebar',
      placement: 'right',
      disableBeacon: true,
      content: (
        <StepContent
          icon="📦"
          title="Component Library"
          body="Drag infrastructure nodes — Firewalls, Servers, and Workstations — from this palette onto the canvas to build your attack surface map."
        />
      ),
    },
    {
      target: '.canvas-container',
      placement: 'center',
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
      target: '.inspector-panel',
      placement: 'left',
      disableBeacon: true,
      content: (
        <StepContent
          icon="🔧"
          title="Node Inspector"
          body="Click any node to edit its IP address, CVSS score, patch status, and RCE flags — or pin it as the Attacker Entry Point or High-Value Target."
        />
      ),
    },
    {
      target: '.simulate-btn',
      placement: 'bottom',
      disableBeacon: true,
      content: (
        <StepContent
          icon="⚡"
          title="Run Simulation"
          body="Triggers the multi-path threat engine. The primary attack route is animated in red; up to two alternative lateral paths are traced in amber."
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
      key={run ? 'running' : 'stopped'}
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose
      disableScrolling={false}
      callback={handleJoyrideCallback}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Next →',
        skip: 'Skip tour',
      }}
      styles={{
        options: {
          /* Glass dark background — matches --glass-bg */
          arrowColor: '#0d1017',
          backgroundColor: '#0d1017',
          /* Dim overlay — matches site's modal overlays */
          overlayColor: 'rgba(8, 10, 15, 0.72)',
          /* Indigo primary — matches --accent-indigo */
          primaryColor: '#6366f1',
          textColor: '#e2e8f0',
          /* Matches --inspector-width */
          width: 340,
          zIndex: 10000,
        },
        tooltip: {
          /* Same glass card style as .simulation-report-panel */
          borderRadius: '12px',
          border: '1px solid #1e2638',
          boxShadow:
            '0 0 0 1px rgba(99,102,241,0.12), 0 20px 48px -8px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '20px 22px',
          background: 'rgba(13, 16, 23, 0.95)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipFooter: {
          marginTop: '18px',
          paddingTop: '14px',
          borderTop: '1px solid #1e2638',
        },
        tooltipFooterSpacer: {
          flex: 1,
        },
        /* Progress counter — matches --font-mono + --text-muted */
        tooltipTitle: {
          fontSize: '13px',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#4e5a6b',
          fontWeight: 500,
          letterSpacing: '0.3px',
          marginBottom: '6px',
        },
        /* Next button — matches .btn.btn-primary */
        buttonNext: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderRadius: '6px',
          border: 'none',
          color: '#fff',
          fontWeight: 600,
          fontSize: '12px',
          letterSpacing: '0.3px',
          padding: '7px 16px',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 0 14px rgba(99,102,241,0.35)',
          fontFamily: "'Inter', sans-serif",
        },
        /* Back button — matches secondary .btn */
        buttonBack: {
          background: 'transparent',
          border: '1px solid #1e2638',
          borderRadius: '6px',
          color: '#8892a4',
          fontSize: '12px',
          fontWeight: 500,
          padding: '7px 14px',
          cursor: 'pointer',
          marginRight: '8px',
          fontFamily: "'Inter', sans-serif",
        },
        /* Skip button — matches --text-secondary */
        buttonSkip: {
          background: 'transparent',
          border: 'none',
          color: '#4e5a6b',
          fontSize: '12px',
          padding: '7px 10px',
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.3px',
        },
        buttonClose: {
          color: '#4e5a6b',
          width: '14px',
          height: '14px',
        },
        /* Beacon ring — indigo glow */
        beacon: {
          inner: '#6366f1',
          outer: 'rgba(99,102,241,0.3)',
        },
        /* Spotlight hole in overlay */
        spotlight: {
          borderRadius: '8px',
          boxShadow: '0 0 0 2px rgba(99,102,241,0.4)',
        },
      }}
    />
  );
}
