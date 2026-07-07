import React from "react";
import {
  Shield,
  Server,
  Laptop,
  Globe,
  Network,
  Database,
  GitMerge,
  Cloud,
} from "lucide-react";

export const NodeTypeIcon = ({ nodeType, size = 18 }) => {
  switch (nodeType) {
    case "firewall":
      return <Shield size={size} />;
    case "server":
      return <Server size={size} />;
    case "internet":
      return <Globe size={size} />;
    case "router":
      return <Network size={size} />;
    case "database":
      return <Database size={size} />;
    case "loadbalancer":
      return <GitMerge size={size} />;
    case "cloud":
      return <Cloud size={size} />;
    default:
      return <Laptop size={size} />;
  }
};
