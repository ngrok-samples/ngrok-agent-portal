import React from "react";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import CancelIcon from "@mui/icons-material/Close";

import AgentEndpoints from "./AgentEndpoints";
export default function AgentEndpointsDialog({ open, onClose, row, onUpdate }) {
  return (
    <Dialog
      keepMounted={false}
      fullWidth
      maxWidth='lg'
      open={open}
      onClose={onClose}
    >
      <DialogContent style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, right: 0 }}>
          <IconButton onClick={onClose}>
            <CancelIcon />
          </IconButton>
        </div>
        <AgentEndpoints
          data={row}
          onUpdate={(updatedRow) => {
            onUpdate(updatedRow);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
