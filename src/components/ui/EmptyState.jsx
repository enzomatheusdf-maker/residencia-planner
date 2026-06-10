import React from "react";
import AppEmptyState from "../EmptyState";

function asIconComponent(icon) {
  if (!icon) return null;
  if (typeof icon === "function") return icon;
  return function EmptyStateIcon() {
    return icon;
  };
}

export function EmptyState({ action, description, icon, title }) {
  const Icon = asIconComponent(icon);
  return (
    <AppEmptyState
      icon={Icon}
      title={title}
      description={description}
      primaryAction={action}
    />
  );
}
