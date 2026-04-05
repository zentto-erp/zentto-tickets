"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { Stage, Layer, Group, Rect, Circle, Text, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { SectionAvailability, SeatAvailability, SeatStatus } from "@/types";

/* ══════════════════════════════════════════
   SeatMapRenderer — Mapa interactivo de asientos
   Usa Konva.js (Canvas) para performance con miles de asientos
   ══════════════════════════════════════════ */

interface SeatMapRendererProps {
  sections: SectionAvailability[];
  seats?: SeatAvailability[];
  selectedSectionId?: number | null;
  selectedSeats: number[];
  onSectionClick: (sectionId: number) => void;
  onSeatClick: (seatId: number) => void;
  onBackToOverview?: () => void;
  width?: number;
  height?: number;
}

const STATUS_COLORS: Record<SeatStatus, string> = {
  available: "#10B981",
  held: "#F59E0B",
  sold: "#6B7280",
  blocked: "#374151",
};

const SEAT_RADIUS = 8;
const SEAT_GAP = 4;
const ROW_HEIGHT = SEAT_RADIUS * 2 + SEAT_GAP;

export default function SeatMapRenderer({
  sections,
  seats,
  selectedSectionId,
  selectedSeats,
  onSectionClick,
  onSeatClick,
  onBackToOverview,
  width = 900,
  height = 600,
}: SeatMapRendererProps) {
  const stageRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // ── Zoom con scroll ──
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY < 0 ? scale * scaleBy : scale / scaleBy;
    setScale(Math.max(0.3, Math.min(5, newScale)));
  }, [scale]);

  // ── Vista de secciones (overview) ──
  if (!selectedSectionId) {
    return (
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
      >
        <Layer>
          {/* Fondo del estadio */}
          <Rect x={0} y={0} width={width} height={height} fill="#1E293B" cornerRadius={16} />

          {/* Campo central (referencia visual) */}
          <Rect
            x={width * 0.3}
            y={height * 0.25}
            width={width * 0.4}
            height={height * 0.5}
            fill="#166534"
            cornerRadius={8}
            stroke="#22C55E"
            strokeWidth={2}
          />

          {/* Secciones como polígonos */}
          {sections.map((section, idx) => {
            const isHovered = hoveredSection === section.SectionId;
            const fillColor = section.Color || "#3B82F6";
            const opacity = section.Available > 0 ? (isHovered ? 1 : 0.7) : 0.3;

            // Si no hay polygon, usar posiciones automáticas en arco
            if (!section.Polygon || section.Polygon.length === 0) {
              const angle = (idx / sections.length) * Math.PI * 2 - Math.PI / 2;
              const rx = width * 0.38;
              const ry = height * 0.42;
              const cx = width / 2;
              const cy = height / 2;
              const x = cx + Math.cos(angle) * rx;
              const y = cy + Math.sin(angle) * ry;
              const boxW = 100;
              const boxH = 50;

              return (
                <Group
                  key={section.SectionId}
                  onClick={() => !section.IsGeneralAdmission && section.Available > 0 && onSectionClick(section.SectionId)}
                  onMouseEnter={() => setHoveredSection(section.SectionId)}
                  onMouseLeave={() => setHoveredSection(null)}
                  style={{ cursor: section.Available > 0 ? "pointer" : "default" }}
                >
                  <Rect
                    x={x - boxW / 2}
                    y={y - boxH / 2}
                    width={boxW}
                    height={boxH}
                    fill={fillColor}
                    opacity={opacity}
                    cornerRadius={6}
                    stroke={isHovered ? "#FFF" : "transparent"}
                    strokeWidth={2}
                    shadowBlur={isHovered ? 10 : 0}
                    shadowColor="#000"
                  />
                  <Text
                    x={x - boxW / 2}
                    y={y - 14}
                    width={boxW}
                    text={section.Code || section.Name}
                    fontSize={11}
                    fontStyle="bold"
                    fill="#FFF"
                    align="center"
                  />
                  <Text
                    x={x - boxW / 2}
                    y={y + 2}
                    width={boxW}
                    text={`$${section.MinPrice}`}
                    fontSize={13}
                    fontStyle="bold"
                    fill="#FFF"
                    align="center"
                  />
                  <Text
                    x={x - boxW / 2}
                    y={y + 16}
                    width={boxW}
                    text={`${section.Available} disp.`}
                    fontSize={9}
                    fill="rgba(255,255,255,0.7)"
                    align="center"
                  />
                </Group>
              );
            }

            // Renderizar polígono real
            const points = section.Polygon.flat();
            return (
              <Group
                key={section.SectionId}
                onClick={() => !section.IsGeneralAdmission && section.Available > 0 && onSectionClick(section.SectionId)}
                onMouseEnter={() => setHoveredSection(section.SectionId)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                <Line
                  points={points}
                  closed
                  fill={fillColor}
                  opacity={opacity}
                  stroke={isHovered ? "#FFF" : "rgba(255,255,255,0.2)"}
                  strokeWidth={isHovered ? 3 : 1}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    );
  }

  // ── Vista de asientos (detalle de sección) ──
  const seatsByRow = useMemo(() => {
    if (!seats) return new Map<string, SeatAvailability[]>();
    const map = new Map<string, SeatAvailability[]>();
    for (const seat of seats) {
      const key = seat.RowLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(seat);
    }
    return map;
  }, [seats]);

  const rowLabels = Array.from(seatsByRow.keys()).sort();

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      draggable
      onWheel={handleWheel}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
    >
      <Layer>
        {/* Fondo */}
        <Rect x={0} y={0} width={width} height={Math.max(height, rowLabels.length * ROW_HEIGHT + 100)} fill="#1E293B" />

        {/* Botón volver */}
        <Group onClick={onBackToOverview}>
          <Rect x={10} y={10} width={100} height={30} fill="#475569" cornerRadius={6} />
          <Text x={10} y={17} width={100} text="← Volver" fontSize={13} fill="#FFF" align="center" />
        </Group>

        {/* Escenario / campo */}
        <Rect x={width * 0.15} y={40} width={width * 0.7} height={30} fill="#166534" cornerRadius={4} />
        <Text x={width * 0.15} y={47} width={width * 0.7} text="ESCENARIO / CAMPO" fontSize={12} fill="#FFF" align="center" />

        {/* Asientos por fila */}
        {rowLabels.map((label, rowIdx) => {
          const rowSeats = seatsByRow.get(label) || [];
          const yBase = 100 + rowIdx * ROW_HEIGHT;
          const xStart = 60;

          return (
            <Group key={label}>
              {/* Label de fila */}
              <Text x={10} y={yBase - 4} text={`Fila ${label}`} fontSize={11} fill="#94A3B8" />

              {/* Asientos */}
              {rowSeats.map((seat, seatIdx) => {
                const x = xStart + seatIdx * (SEAT_RADIUS * 2 + SEAT_GAP);
                const isSelected = selectedSeats.includes(seat.SeatId);
                const isHover = hoveredSeat === seat.SeatId;
                const isAvailable = seat.Status === "available";
                const color = isSelected
                  ? "#6366F1"
                  : STATUS_COLORS[seat.Status];

                return (
                  <Group key={seat.SeatId}>
                    <Circle
                      x={x}
                      y={yBase}
                      radius={isHover ? SEAT_RADIUS + 2 : SEAT_RADIUS}
                      fill={color}
                      stroke={isSelected ? "#FFF" : isHover ? "#E2E8F0" : "transparent"}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={isAvailable || isSelected ? 1 : 0.4}
                      onClick={() => isAvailable && onSeatClick(seat.SeatId)}
                      onMouseEnter={() => setHoveredSeat(seat.SeatId)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      shadowBlur={isSelected ? 8 : 0}
                      shadowColor="#6366F1"
                    />
                    {(isHover || isSelected) && (
                      <Text
                        x={x - 6}
                        y={yBase - 5}
                        text={String(seat.SeatNumber)}
                        fontSize={9}
                        fill="#FFF"
                        fontStyle="bold"
                      />
                    )}
                  </Group>
                );
              })}
            </Group>
          );
        })}

        {/* Leyenda */}
        <Group x={width - 180} y={height - 80}>
          {(["available", "held", "sold", "blocked"] as SeatStatus[]).map((status, i) => (
            <Group key={status} x={0} y={i * 18}>
              <Circle x={8} y={0} radius={6} fill={STATUS_COLORS[status]} />
              <Text x={20} y={-6} text={status === "available" ? "Disponible" : status === "held" ? "Reservado" : status === "sold" ? "Vendido" : "Bloqueado"} fontSize={11} fill="#94A3B8" />
            </Group>
          ))}
          <Group y={4 * 18}>
            <Circle x={8} y={0} radius={6} fill="#6366F1" stroke="#FFF" strokeWidth={2} />
            <Text x={20} y={-6} text="Seleccionado" fontSize={11} fill="#94A3B8" />
          </Group>
        </Group>
      </Layer>
    </Stage>
  );
}
