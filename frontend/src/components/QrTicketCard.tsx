"use client";
import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Ticket, TicketStatus } from "@/types";

const SC: Record<TicketStatus, { label: string; color: "success"|"error"|"warning"|"default" }> = {
  active: { label: "Activo", color: "success" }, cancelled: { label: "Cancelado", color: "error" },
  transferred: { label: "Transferido", color: "warning" }, used: { label: "Usado", color: "default" },
};

export function QrTicketCard({ ticket }: { ticket: Ticket }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);
  useEffect(() => {
    if (!canvasRef.current || !ticket.Barcode) return;
    QRCode.toCanvas(canvasRef.current, ticket.Barcode, { width: 200, margin: 2, color: { dark: "#1E1B4B", light: "#FFFFFF" }, errorCorrectionLevel: "H" })
      .then(() => setQrReady(true)).catch(console.error);
  }, [ticket.Barcode]);
  const dl = () => { if (!canvasRef.current) return; const a = document.createElement("a"); a.download = `zentto-ticket-${ticket.TicketId}.png`; a.href = canvasRef.current.toDataURL("image/png"); a.click(); };
  const scanned = !!ticket.ScannedAt;
  const sc = SC[ticket.Status];
  return (
    <Paper sx={{ p: 3, borderLeft: `4px solid ${scanned ? "#6B7280" : "#10B981"}`, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", top: 0, right: 220, bottom: 0, width: 1, borderLeft: "2px dashed rgba(0,0,0,0.1)", display: { xs: "none", sm: "block" } }} />
      <Stack direction={{ xs: "column", sm: "row" }} gap={3} alignItems={{ xs: "center", sm: "start" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 200 }}>
          <canvas ref={canvasRef} style={{ borderRadius: 8, opacity: scanned ? 0.4 : 1 }} />
          {scanned && <Chip icon={<CheckCircleIcon />} label="Escaneado" color="default" size="small" sx={{ mt: 1 }} />}
          {!scanned && ticket.Status === "active" && <Button size="small" startIcon={<DownloadIcon />} onClick={dl} disabled={!qrReady} sx={{ mt: 1 }}>Descargar QR</Button>}
        </Box>
        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight={700}>Boleto #{ticket.TicketId}</Typography>
            <Chip label={sc.label} color={sc.color} size="small" />
          </Stack>
          <Typography variant="h6" fontWeight={600} gutterBottom>{ticket.EventName}</Typography>
          {ticket.EventDate && <Typography variant="body2" color="text.secondary" mb={1}>{new Date(ticket.EventDate).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>}
          {ticket.VenueName && <Typography variant="body2" color="text.secondary" mb={1}>{ticket.VenueName}</Typography>}
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" gap={3}>
            {ticket.SectionName && <Box><Typography variant="caption" color="text.secondary">Seccion</Typography><Typography variant="body2" fontWeight={600}>{ticket.SectionName}</Typography></Box>}
            {ticket.RowLabel && <Box><Typography variant="caption" color="text.secondary">Fila</Typography><Typography variant="body2" fontWeight={600}>{ticket.RowLabel}</Typography></Box>}
            {ticket.SeatNumber != null && <Box><Typography variant="caption" color="text.secondary">Asiento</Typography><Typography variant="body2" fontWeight={600}>{ticket.SeatNumber}</Typography></Box>}
            <Box><Typography variant="caption" color="text.secondary">Precio</Typography><Typography variant="body2" fontWeight={600}>${Number(ticket.Price).toFixed(2)} {ticket.Currency}</Typography></Box>
          </Stack>
          {ticket.ScannedAt && <><Divider sx={{ my: 1.5 }} /><Typography variant="caption" color="text.secondary">Escaneado el {new Date(ticket.ScannedAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography></>}
        </Box>
      </Stack>
    </Paper>
  );
}
