"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import GridOnIcon from "@mui/icons-material/GridOn";

/* ══════════════════════════════════════════
   VenueDesigner — Editor visual de venues con Fabric.js
   Permite crear secciones como polígonos/rectángulos,
   definir filas y asientos, y exportar la configuración.
   ══════════════════════════════════════════ */

interface SectionDef {
  id: string;
  name: string;
  code: string;
  category: string;
  color: string;
  rows: number;
  seatsPerRow: number;
  isGA: boolean;
  gaCapacity: number;
  // Fabric.js object properties
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
}

interface VenueDesignerProps {
  venueName: string;
  initialSections?: SectionDef[];
  onSave: (sections: SectionDef[]) => void;
  backgroundImage?: string;
}

const CATEGORIES = [
  { value: "vip", label: "VIP", color: "#EF4444" },
  { value: "preferencial", label: "Preferencial", color: "#F59E0B" },
  { value: "palco", label: "Palco", color: "#8B5CF6" },
  { value: "standard", label: "Standard", color: "#3B82F6" },
  { value: "general", label: "General", color: "#10B981" },
];

export default function VenueDesigner({
  venueName,
  initialSections = [],
  onSave,
  backgroundImage,
}: VenueDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const [sections, setSections] = useState<SectionDef[]>(initialSections);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);

  // ── Inicializar Fabric.js ──
  useEffect(() => {
    async function initFabric() {
      const fabric = await import("fabric");
      if (!canvasRef.current || fabricRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 900,
        height: 600,
        backgroundColor: "#1E293B",
        selection: true,
      });

      fabricRef.current = canvas;

      // Dibujar campo central como referencia
      const field = new fabric.Rect({
        left: 270,
        top: 150,
        width: 360,
        height: 300,
        fill: "#166534",
        stroke: "#22C55E",
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        selectable: false,
        evented: false,
      });
      canvas.add(field);

      const fieldText = new fabric.FabricText("CAMPO / ESCENARIO", {
        left: 360,
        top: 290,
        fontSize: 14,
        fill: "#FFFFFF",
        fontFamily: "Inter",
        selectable: false,
        evented: false,
      });
      canvas.add(fieldText);

      // Agregar grid si está activo
      if (showGrid) {
        drawGrid(canvas, fabric);
      }

      // Cargar secciones iniciales
      for (const sec of initialSections) {
        addSectionToCanvas(canvas, fabric, sec);
      }

      // Event: selección de objeto
      canvas.on("selection:created", (e: any) => {
        const obj = e.selected?.[0];
        if (obj?.sectionId) {
          setSelectedSection(obj.sectionId);
        }
      });

      canvas.on("selection:cleared", () => {
        setSelectedSection(null);
      });

      // Event: mover/resize objeto → actualizar sección
      canvas.on("object:modified", (e: any) => {
        const obj = e.target;
        if (obj?.sectionId) {
          setSections((prev) =>
            prev.map((s) =>
              s.id === obj.sectionId
                ? { ...s, left: obj.left, top: obj.top, width: obj.width * (obj.scaleX || 1), height: obj.height * (obj.scaleY || 1), angle: obj.angle || 0 }
                : s
            )
          );
        }
      });

      canvas.renderAll();
    }

    initFabric();

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, []);

  function drawGrid(canvas: any, fabric: any) {
    const gridSize = 20;
    for (let i = 0; i < 900 / gridSize; i++) {
      canvas.add(
        new fabric.Line([i * gridSize, 0, i * gridSize, 600], {
          stroke: "rgba(255,255,255,0.05)",
          selectable: false,
          evented: false,
        })
      );
      canvas.add(
        new fabric.Line([0, i * gridSize, 900, i * gridSize], {
          stroke: "rgba(255,255,255,0.05)",
          selectable: false,
          evented: false,
        })
      );
    }
  }

  function addSectionToCanvas(canvas: any, fabric: any, section: SectionDef) {
    const rect = new fabric.Rect({
      left: section.left,
      top: section.top,
      width: section.width || 100,
      height: section.height || 60,
      fill: section.color + "80",
      stroke: section.color,
      strokeWidth: 2,
      rx: 4,
      ry: 4,
      angle: section.angle || 0,
    });
    (rect as any).sectionId = section.id;

    const label = new fabric.FabricText(section.code || section.name, {
      left: section.left + 5,
      top: section.top + 5,
      fontSize: 11,
      fill: "#FFF",
      fontFamily: "Inter",
      fontWeight: "bold",
      selectable: false,
      evented: false,
    });

    const group = new fabric.Group([rect, label], {
      left: section.left,
      top: section.top,
    });
    (group as any).sectionId = section.id;

    canvas.add(group);
  }

  // ── Agregar nueva sección ──
  const addSection = useCallback(async () => {
    const fabric = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;

    const id = `sec-${Date.now()}`;
    const cat = CATEGORIES[sections.length % CATEGORIES.length];
    const newSection: SectionDef = {
      id,
      name: `Sección ${sections.length + 1}`,
      code: `S${sections.length + 1}`,
      category: cat.value,
      color: cat.color,
      rows: 10,
      seatsPerRow: 20,
      isGA: false,
      gaCapacity: 0,
      left: 50 + (sections.length % 4) * 120,
      top: 50 + Math.floor(sections.length / 4) * 80,
      width: 100,
      height: 60,
      angle: 0,
    };

    setSections((prev) => [...prev, newSection]);
    addSectionToCanvas(canvas, fabric, newSection);
    canvas.renderAll();
    setSelectedSection(id);
  }, [sections]);

  // ── Eliminar sección ──
  const deleteSection = useCallback((id: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const obj = objects.find((o: any) => o.sectionId === id);
    if (obj) canvas.remove(obj);

    setSections((prev) => prev.filter((s) => s.id !== id));
    setSelectedSection(null);
    canvas.renderAll();
  }, []);

  // ── Actualizar propiedades de sección ──
  const updateSection = useCallback((id: string, updates: Partial<SectionDef>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const selected = sections.find((s) => s.id === selectedSection);

  return (
    <Box display="flex" gap={2} height="100%">
      {/* ── Canvas ── */}
      <Paper sx={{ flex: 1, position: "relative", overflow: "hidden", bgcolor: "#0F172A" }}>
        {/* Toolbar */}
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}>
          <Tooltip title="Agregar sección">
            <IconButton size="small" onClick={addSection} sx={{ bgcolor: "primary.main", color: "#FFF", "&:hover": { bgcolor: "primary.dark" } }}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={() => setZoom((z) => Math.min(z + 0.2, 3))} sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#FFF" }}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))} sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#FFF" }}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Grid">
            <IconButton size="small" onClick={() => setShowGrid(!showGrid)} sx={{ bgcolor: showGrid ? "primary.main" : "rgba(255,255,255,0.1)", color: "#FFF" }}>
              <GridOnIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box sx={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <canvas ref={canvasRef} />
        </Box>

        <Typography variant="caption" sx={{ position: "absolute", bottom: 8, left: 8, color: "rgba(255,255,255,0.4)" }}>
          {venueName} — {sections.length} secciones
        </Typography>
      </Paper>

      {/* ── Panel de propiedades ── */}
      <Paper sx={{ width: 300, p: 2, overflow: "auto" }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Secciones
        </Typography>

        {sections.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Haz clic en + para agregar secciones al venue.
          </Typography>
        )}

        {/* Lista de secciones */}
        <Stack spacing={1} mb={2}>
          {sections.map((sec) => (
            <Paper
              key={sec.id}
              variant="outlined"
              sx={{
                p: 1,
                cursor: "pointer",
                bgcolor: selectedSection === sec.id ? "action.selected" : "transparent",
                borderLeft: `4px solid ${sec.color}`,
              }}
              onClick={() => setSelectedSection(sec.id)}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" fontWeight={600}>{sec.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {sec.isGA ? `GA: ${sec.gaCapacity}` : `${sec.rows}×${sec.seatsPerRow} = ${sec.rows * sec.seatsPerRow} asientos`}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteSection(sec.id); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Propiedades de sección seleccionada */}
        {selected && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Propiedades: {selected.name}</Typography>
            <TextField label="Nombre" size="small" value={selected.name} onChange={(e) => updateSection(selected.id, { name: e.target.value })} />
            <TextField label="Código" size="small" value={selected.code} onChange={(e) => updateSection(selected.id, { code: e.target.value })} />
            <Select size="small" value={selected.category} onChange={(e) => {
              const cat = CATEGORIES.find((c) => c.value === e.target.value);
              updateSection(selected.id, { category: e.target.value, color: cat?.color || selected.color });
            }}>
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </Select>
            <TextField label="Color" size="small" type="color" value={selected.color} onChange={(e) => updateSection(selected.id, { color: e.target.value })} />

            {!selected.isGA && (
              <>
                <TextField label="Filas" size="small" type="number" value={selected.rows} onChange={(e) => updateSection(selected.id, { rows: Number(e.target.value) })} />
                <TextField label="Asientos por fila" size="small" type="number" value={selected.seatsPerRow} onChange={(e) => updateSection(selected.id, { seatsPerRow: Number(e.target.value) })} />
                <Typography variant="caption" color="text.secondary">
                  Total: {selected.rows * selected.seatsPerRow} asientos
                </Typography>
              </>
            )}

            <Button
              variant={selected.isGA ? "contained" : "outlined"}
              size="small"
              onClick={() => updateSection(selected.id, { isGA: !selected.isGA })}
            >
              {selected.isGA ? "General Admission ✓" : "Hacer General Admission"}
            </Button>

            {selected.isGA && (
              <TextField label="Capacidad GA" size="small" type="number" value={selected.gaCapacity} onChange={(e) => updateSection(selected.id, { gaCapacity: Number(e.target.value) })} />
            )}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Acciones */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            fullWidth
            onClick={() => onSave(sections)}
          >
            Guardar Venue
          </Button>
        </Stack>

        <Typography variant="caption" display="block" color="text.secondary" mt={2}>
          Arrastra y redimensiona las secciones en el canvas.
          Los asientos se generan automáticamente según filas × asientos por fila.
        </Typography>
      </Paper>
    </Box>
  );
}
