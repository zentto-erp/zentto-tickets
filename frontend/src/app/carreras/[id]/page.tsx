"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TimerIcon from "@mui/icons-material/Timer";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import { useRace, useRaceCategories, useRaceLeaderboard, useRegisterRace } from "@/hooks/useRaces";
import { useSession } from "next-auth/react";

const DIST_COLORS: Record<string, string> = { "5K": "#10B981", "10K": "#3B82F6", "21K": "#F59E0B", "42K": "#EF4444" };
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function RaceDetailPage() {
  const { id } = useParams();
  const raceId = Number(id);
  const { data: session } = useSession();
  const [tab, setTab] = useState(0);
  const [regOpen, setRegOpen] = useState(false);
  const [selCat, setSelCat] = useState<number | null>(null);
  const { data: race, isLoading } = useRace(raceId);
  const { data: categories } = useRaceCategories(raceId);
  const { data: leaderboard } = useRaceLeaderboard(raceId, selCat ?? undefined);

  if (isLoading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!race) return <Box textAlign="center" py={8}><Typography variant="h5" color="text.secondary">Carrera no encontrada</Typography></Box>;

  const dc = DIST_COLORS[race.Distance] || "#6366F1";
  const pct = race.MaxParticipants > 0 ? Math.round((Number(race.RegisteredCount ?? 0) / race.MaxParticipants) * 100) : 0;
  const closed = race.RegistrationDeadline ? new Date(race.RegistrationDeadline) < new Date() : false;

  return (
    <Box px={4} py={4} maxWidth={1200} mx="auto">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="start" gap={2} mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1} mb={1}>
            <DirectionsRunIcon sx={{ fontSize: 32, color: dc }} />
            <Typography variant="h4" fontWeight={800}>{race.EventName}</Typography>
          </Stack>
          <Chip label={race.Distance} sx={{ bgcolor: dc, color: "#fff", fontWeight: 700, fontSize: "1rem", mb: 1 }} />
          <Stack direction="row" gap={2} mt={1} flexWrap="wrap">
            <Stack direction="row" alignItems="center" gap={0.5}><CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">{race.EventDate && new Date(race.EventDate).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Typography></Stack>
            {race.VenueName && <Stack direction="row" alignItems="center" gap={0.5}><LocationOnIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">{race.VenueName}{race.City ? `, ${race.City}` : ""}</Typography></Stack>}
            <Stack direction="row" alignItems="center" gap={0.5}><PeopleIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">{race.RegisteredCount ?? 0} / {race.MaxParticipants} inscritos</Typography></Stack>
          </Stack>
        </Box>
        <Button variant="contained" size="large" startIcon={<PersonAddIcon />} disabled={closed || pct >= 100 || !session}
          onClick={() => setRegOpen(true)} sx={{ background: `linear-gradient(135deg, ${dc}, ${dc}CC)`, px: 4 }}>
          {closed ? "Inscripcion cerrada" : pct >= 100 ? "Cupos agotados" : "Inscribirse"}
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography variant="body2" fontWeight={600}>Ocupacion</Typography>
          <Typography variant="body2" color="text.secondary">{pct}%</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 5, bgcolor: "rgba(0,0,0,0.1)", "& .MuiLinearProgress-bar": { bgcolor: pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981", borderRadius: 5 } }} />
      </Paper>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Categorias" icon={<EmojiEventsIcon />} iconPosition="start" />
        <Tab label="Clasificacion" icon={<LeaderboardIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && <Grid container spacing={2}>
        {(categories ?? []).map((cat: any) => (
          <Grid key={cat.CategoryId} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2.5, borderTop: `3px solid ${dc}` }}>
              <Typography variant="h6" fontWeight={700}>{cat.Name}</Typography>
              <Typography variant="body2" color="text.secondary">Edad: {cat.AgeMin}-{cat.AgeMax} | {cat.Gender === "X" ? "Mixto" : cat.Gender}</Typography>
              <Typography variant="h5" fontWeight={800} color="primary" mt={0.5}>{Number(cat.Price) === 0 ? "Gratis" : `$${Number(cat.Price).toFixed(2)}`}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>}

      {tab === 1 && <Box>
        <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
          <Chip label="Todas" variant={selCat === null ? "filled" : "outlined"} onClick={() => setSelCat(null)} sx={selCat === null ? { bgcolor: dc, color: "#fff" } : {}} />
          {(categories ?? []).map((c: any) => <Chip key={c.CategoryId} label={c.Name} variant={selCat === c.CategoryId ? "filled" : "outlined"} onClick={() => setSelCat(c.CategoryId)} sx={selCat === c.CategoryId ? { bgcolor: dc, color: "#fff" } : {}} />)}
        </Stack>
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 700 }}>Pos</TableCell><TableCell sx={{ fontWeight: 700 }}>Dorsal</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell><TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tiempo</TableCell><TableCell sx={{ fontWeight: 700 }}>Dif</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {(leaderboard ?? []).map((r: any, i: number) => (
              <TableRow key={r.registrationId} sx={{ bgcolor: i < 3 && r.position ? `rgba(${i === 0 ? "255,215,0" : i === 1 ? "192,192,192" : "205,127,50"},0.08)` : "inherit" }}>
                <TableCell>{r.position ? <Stack direction="row" alignItems="center" gap={0.5}>{r.position <= 3 && <EmojiEventsIcon sx={{ fontSize: 18, color: r.position === 1 ? "#FFD700" : r.position === 2 ? "#C0C0C0" : "#CD7F32" }} />}{r.position}</Stack> : "-"}</TableCell>
                <TableCell><Chip label={`#${r.bibNumber}`} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                <TableCell>{r.fullName}</TableCell><TableCell>{r.categoryName ?? "-"}</TableCell>
                <TableCell><Stack direction="row" alignItems="center" gap={0.5}><TimerIcon sx={{ fontSize: 14 }} />{r.chipTime ?? "-"}</Stack></TableCell>
                <TableCell>{r.gap || "-"}</TableCell>
                <TableCell><Chip label={r.status === "finished" ? "Finalizado" : r.status === "confirmed" ? "Confirmado" : "Inscrito"} size="small" color={r.status === "finished" ? "success" : r.status === "confirmed" ? "info" : "default"} /></TableCell>
              </TableRow>
            ))}
            {(leaderboard ?? []).length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Sin participantes aun.</Typography></TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer>
      </Box>}

      <RegDialog open={regOpen} onClose={() => setRegOpen(false)} raceId={raceId} cats={categories ?? []} dc={dc} />
    </Box>
  );
}

function RegDialog({ open, onClose, raceId, cats, dc }: { open: boolean; onClose: () => void; raceId: number; cats: any[]; dc: string }) {
  const mut = useRegisterRace();
  const [f, setF] = useState({ fullName: "", email: "", idDocument: "", dateOfBirth: "", gender: "X", categoryId: "", tShirtSize: "M", emergencyContact: "", emergencyPhone: "" });
  const [ok, setOk] = useState<any>(null);
  const ch = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = async () => { try { const r = await mut.mutateAsync({ raceId, ...f, categoryId: Number(f.categoryId), dateOfBirth: f.dateOfBirth || null }); setOk(r.registration); } catch {} };
  const close = () => { setF({ fullName: "", email: "", idDocument: "", dateOfBirth: "", gender: "X", categoryId: "", tShirtSize: "M", emergencyContact: "", emergencyPhone: "" }); setOk(null); onClose(); };

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{ok ? "Inscripcion Confirmada" : "Inscripcion"}</DialogTitle>
      <DialogContent>{ok ? (
        <Box textAlign="center" py={2}>
          <Box sx={{ width: 120, height: 120, borderRadius: "50%", background: `linear-gradient(135deg, ${dc}20, ${dc}40)`, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
            <Typography variant="h3" fontWeight={900} color={dc}>#{ok.BibNumber}</Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} mb={1}>Dorsal: #{ok.BibNumber}</Typography>
          <Typography color="text.secondary" mb={2}>{ok.FullName}</Typography>
          <Alert severity="success">Inscripcion exitosa. Presenta tu QR en el kit pickup.</Alert>
          {ok.Barcode && <Paper sx={{ p: 2, bgcolor: "grey.50", mt: 2 }}><Typography variant="caption" color="text.secondary">QR</Typography><Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: "break-all" }}>{ok.Barcode}</Typography></Paper>}
        </Box>
      ) : (
        <Stack spacing={2} mt={1}>
          {mut.isError && <Alert severity="error">{(mut.error as Error)?.message || "Error"}</Alert>}
          <TextField label="Nombre completo" fullWidth required value={f.fullName} onChange={ch("fullName")} />
          <TextField label="Email" type="email" fullWidth value={f.email} onChange={ch("email")} />
          <Stack direction="row" spacing={2}>
            <TextField label="Documento" fullWidth value={f.idDocument} onChange={ch("idDocument")} />
            <TextField label="Nacimiento" type="date" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={f.dateOfBirth} onChange={ch("dateOfBirth")} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Genero" select fullWidth value={f.gender} onChange={ch("gender")}><MenuItem value="X">Mixto</MenuItem><MenuItem value="M">Masculino</MenuItem><MenuItem value="F">Femenino</MenuItem></TextField>
            <TextField label="Categoria" select fullWidth required value={f.categoryId} onChange={ch("categoryId")}>{cats.map((c) => <MenuItem key={c.CategoryId} value={c.CategoryId}>{c.Name} - {Number(c.Price) === 0 ? "Gratis" : `$${Number(c.Price).toFixed(2)}`}</MenuItem>)}</TextField>
          </Stack>
          <TextField label="Talla camiseta" select fullWidth value={f.tShirtSize} onChange={ch("tShirtSize")}>{SIZES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
          <Divider /><Typography variant="subtitle2" fontWeight={600}>Contacto emergencia</Typography>
          <Stack direction="row" spacing={2}><TextField label="Nombre" fullWidth value={f.emergencyContact} onChange={ch("emergencyContact")} /><TextField label="Telefono" fullWidth value={f.emergencyPhone} onChange={ch("emergencyPhone")} /></Stack>
        </Stack>
      )}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={close}>{ok ? "Cerrar" : "Cancelar"}</Button>
        {!ok && <Button variant="contained" onClick={submit} disabled={mut.isPending || !f.fullName || !f.categoryId} sx={{ background: `linear-gradient(135deg, ${dc}, ${dc}CC)` }}>{mut.isPending ? "Inscribiendo..." : "Confirmar"}</Button>}
      </DialogActions>
    </Dialog>
  );
}
