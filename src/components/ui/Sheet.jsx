import React from "react";
import { Dialog } from "./Dialog";

export function Sheet({ open, title, description, children, footer, onClose, formDirty = false, side = "bottom" }) {
  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      footer={footer}
      onClose={onClose}
      formDirty={formDirty}
      mobileSheet
      wide={side === "right"}
    >
      {children}
    </Dialog>
  );
}
