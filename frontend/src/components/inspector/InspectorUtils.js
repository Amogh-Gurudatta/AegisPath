export const NodeTypeClass = (nodeType) => {
  switch (nodeType) {
    case "firewall":
      return "palette-icon-firewall";
    case "server":
      return "palette-icon-server";
    case "internet":
      return "palette-icon-internet";
    case "router":
      return "palette-icon-router";
    case "database":
      return "palette-icon-database";
    case "loadbalancer":
      return "palette-icon-loadbalancer";
    case "cloud":
      return "palette-icon-cloud";
    default:
      return "palette-icon-workstation";
  }
};

export const validateIp = (ip) => {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

export const validateIpOrCidr = (ip) => {
  const ipv4CidrRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[12][0-9]|3[0-2]))?$/;
  return ipv4CidrRegex.test(ip);
};

export const formatConfigValue = (val) => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return val.join(", ") || "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
};

// Keys managed by the editable UI — excluded from the Custom Properties editor
export const EDIT_KEYS = [
  "ip_address",
  "cvss_score",
  "is_patched",
  "has_rce_vulnerability",
  "has_weak_credentials",
  "is_attacker_entry",
  "is_target_asset",
  "allowed_ips",
  "open_ports",
  "cve_id",
  "attack_techniques",
  "epss_score",
];

export const inputStyle = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border-color)",
  color: "var(--text-primary)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
};

export const checkboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  fontSize: "13px",
};
