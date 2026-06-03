import React from "react";
import { Button } from "./Button";
import { Card } from "./Card";

export function EmptyState({ action, description, icon, title }) {
  return (
    <Card
      variant="elevated"
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      {icon ? (
        <div
          aria-hidden="true"
          style={{
            display: "grid",
            placeItems: "center",
            width: 44,
            height: 44,
            borderRadius: "var(--med-radius-md)",
            color: "var(--med-blue)",
            background: "var(--med-blue-soft)",
          }}
        >
          {icon}
        </div>
      ) : null}
      <div>
        <h3 style={{ margin: 0, color: "var(--med-text-strong)", fontSize: "var(--med-text-lg)", fontWeight: 900 }}>
          {title}
        </h3>
        {description ? (
          <p style={{ margin: "8px 0 0", color: "var(--med-text-muted)", fontSize: "var(--med-text-base)", lineHeight: 1.55 }}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Button onClick={action.onClick} variant={action.variant || "secondary"}>
          {action.label}
        </Button>
      ) : null}
    </Card>
  );
}
