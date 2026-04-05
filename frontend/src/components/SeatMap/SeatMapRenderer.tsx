"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Stage, Layer, Group, Rect, Circle, Text, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { SectionAvailability, SeatAvailability, SeatStatus } from "@/types";

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
  maxTickets?: number;
}

const STATUS_COLORS: Record<SeatStatus, string> = {
  available: "#10B981",
  held: "#F59E0B",
  sold: "#6B7280",
  blocked: "#374151",
};

const SELECTED_COLOR = "#6366F1";
const SEAT_RADIUS = 9;
const SEAT_GAP = 5;
const ROW_HEIGHT = SEAT_RADIUS * 2 + SEAT_GAP + 2;

export default function SeatMapRenderer({
  sections, seats, selectedSectionId, selectedSeats,
  onSectionClick, onSeatClick, onBackToOverview,
  width = 900, height = 600, maxTickets = 6,
}: SeatMapRendererProps) {
  const stageRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? scale * scaleBy : scale / scaleBy;
    setScale(Math.max(0.3, Math.min(5, newScale)));
  }, [scale]);

  useEffect(() => { setScale(1); setPosition({ x: 0, y: 0 }); }, [selectedSectionId]);

  if (!selectedSectionId) {
    const fieldW = width * 0.35, fieldH = height * 0.4;
    const fieldX = width / 2 - fieldW / 2, fieldY = height / 2 - fieldH / 2;
    const reserved = sections.filter(s => !s.IsGeneralAdmission);
    const ga = sections.filter(s => s.IsGeneralAdmission);
    const sectionPositions = new Map<number, { x: number; y: number; w: number; h: number }>();

    reserved.forEach((sec, idx) => {
      const total = reserved.length;
      const angle = Math.PI + (idx / Math.max(total - 1, 1)) * Math.PI;
      const x = width / 2 + Math.cos(angle) * width * 0.38;
      const y = height / 2 + Math.sin(angle) * height * 0.38;
      sectionPositions.set(sec.SectionId, { x: x - 55, y: y - 28, w: 110, h: 56 });
    });

    ga.forEach((sec, idx) => {
      const total = ga.length;
      const spacing = width * 0.4 / Math.max(total, 1);
      const x = width / 2 - (total - 1) * spacing / 2 + idx * spacing;
      sectionPositions.set(sec.SectionId, { x: x - 55, y: height - 108, w: 110, h: 56 });
    });

    return (
      <Stage ref={stageRef} width={width} height={height} draggable onWheel={handleWheel}
        scaleX={scale} scaleY={scale} x={position.x} y={position.y}
        onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}>
        <Layer>
          <Rect x={0} y={0} width={width} height={height} fill="#0F172A" cornerRadius={12} />
          <Rect x={fieldX} y={fieldY} width={fieldW} height={fieldH} fill="#166534" cornerRadius={8} stroke="#22C55E" strokeWidth={2} />
          <Text x={fieldX} y={fieldY + fieldH / 2 - 8} width={fieldW} text="ESCENARIO" fontSize={14} fill="rgba(255,255,255,0.5)" align="center" fontStyle="bold" />
          <Line points={[fieldX + fieldW / 2, fieldY, fieldX + fieldW / 2, fieldY + fieldH]} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <Circle x={fieldX + fieldW / 2} y={fieldY + fieldH / 2} radius={30} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {sections.map((section) => {
            const pos = sectionPositions.get(section.SectionId);
            if (!pos) return null;
            const isHovered = hoveredSection === section.SectionId;
            const hasAvailable = Number(section.Available) > 0;
            const isGA = section.IsGeneralAdmission;
            const fillColor = section.Color || "#3B82F6";
            const opacity = hasAvailable ? (isHovered ? 1 : 0.75) : 0.3;
            return (
              <Group key={section.SectionId}
                onClick={() => !isGA && hasAvailable && onSectionClick(section.SectionId)}
                onMouseEnter={(e) => { setHoveredSection(section.SectionId); const c = e.target.getStage()?.container(); if (c) c.style.cursor = hasAvailable && !isGA ? "pointer" : "default"; }}
                onMouseLeave={(e) => { setHoveredSection(null); const c = e.target.getStage()?.container(); if (c) c.style.cursor = "default"; }}>
                {isHovered && <Rect x={pos.x-2} y={pos.y-2} width={pos.w+4} height={pos.h+4} fill="transparent" stroke="#FFF" strokeWidth={2} cornerRadius={8} shadowBlur={16} shadowColor={fillColor} shadowOpacity={0.6} />}
                <Rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} fill={fillColor} opacity={opacity} cornerRadius={8} stroke={isHovered ? "#FFF" : "rgba(255,255,255,0.15)"} strokeWidth={isHovered ? 2 : 1} />
                <Text x={pos.x+4} y={pos.y+6} width={pos.w-8} text={section.Code || section.Name} fontSize={11} fontStyle="bold" fill="#FFF" align="center" wrap="none" ellipsis />
                {Number(section.MinPrice) > 0 && <Text x={pos.x+4} y={pos.y+21} width={pos.w-8} text={`$${Number(section.MinPrice).toFixed(0)}`} fontSize={14} fontStyle="bold" fill="#FFF" align="center" />}
                <Text x={pos.x+4} y={pos.y+38} width={pos.w-8} text={isGA ? `GA - ${section.Available} disp.` : hasAvailable ? `${section.Available} disp.` : "Agotado"} fontSize={9} fill="rgba(255,255,255,0.7)" align="center" />
              </Group>
            );
          })}
          <Text x={16} y={12} text="Selecciona una seccion" fontSize={14} fill="rgba(255,255,255,0.5)" fontStyle="bold" />
          <Group x={width-160} y={12}>
            <Rect x={0} y={0} width={150} height={68} fill="rgba(0,0,0,0.5)" cornerRadius={6} />
            <Circle x={16} y={16} radius={5} fill="#10B981" /><Text x={28} y={10} text="Disponible" fontSize={10} fill="#CBD5E1" />
            <Circle x={16} y={34} radius={5} fill="#F59E0B" /><Text x={28} y={28} text="General Admission" fontSize={10} fill="#CBD5E1" />
            <Circle x={16} y={52} radius={5} fill="#6B7280" opacity={0.4} /><Text x={28} y={46} text="Agotado" fontSize={10} fill="#CBD5E1" />
          </Group>
        </Layer>
      </Stage>
    );
  }

  const seatsByRow = useMemo(() => {
    if (!seats) return new Map<string, SeatAvailability[]>();
    const map = new Map<string, SeatAvailability[]>();
    for (const seat of seats) { const k = seat.RowLabel; if (!map.has(k)) map.set(k, []); map.get(k)!.push(seat); }
    for (const [k, v] of map) map.set(k, v.sort((a, b) => a.SeatNumber - b.SeatNumber));
    return map;
  }, [seats]);

  const rowLabels = Array.from(seatsByRow.keys()).sort();
  const maxSeatsInRow = Math.max(...Array.from(seatsByRow.values()).map(r => r.length), 1);
  const totalSeatWidth = maxSeatsInRow * (SEAT_RADIUS * 2 + SEAT_GAP);
  const xOffset = Math.max(80, (width - totalSeatWidth) / 2);
  const sectionInfo = sections.find(s => s.SectionId === selectedSectionId);
  const contentHeight = Math.max(height, 100 + rowLabels.length * ROW_HEIGHT + 80);

  return (
    <Stage ref={stageRef} width={width} height={height} draggable onWheel={handleWheel}
      scaleX={scale} scaleY={scale} x={position.x} y={position.y}
      onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}>
      <Layer>
        <Rect x={0} y={0} width={width} height={contentHeight} fill="#0F172A" />
        <Group onClick={onBackToOverview}
          onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = "pointer"; }}
          onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = "default"; }}>
          <Rect x={12} y={10} width={90} height={28} fill="#475569" cornerRadius={6} />
          <Text x={12} y={16} width={90} text="< Volver" fontSize={12} fill="#FFF" align="center" fontStyle="bold" />
        </Group>
        {sectionInfo && <Group>
          <Text x={116} y={12} text={sectionInfo.Code || sectionInfo.Name} fontSize={16} fill="#FFF" fontStyle="bold" />
          <Text x={116} y={30} text={`${Number(sectionInfo.Available)} disponibles de ${Number(sectionInfo.Total)}`} fontSize={11} fill="#94A3B8" />
        </Group>}
        {selectedSeats.length > 0 && <Group>
          <Rect x={width-200} y={8} width={190} height={32} fill={SELECTED_COLOR} cornerRadius={6} opacity={0.9} />
          <Text x={width-200} y={18} width={190} text={`${selectedSeats.length}/${maxTickets} seleccionados`} fontSize={12} fill="#FFF" fontStyle="bold" align="center" />
        </Group>}
        <Rect x={xOffset} y={52} width={totalSeatWidth} height={28} fill="#166534" cornerRadius={6} />
        <Text x={xOffset} y={58} width={totalSeatWidth} text="ESCENARIO / CAMPO" fontSize={12} fill="rgba(255,255,255,0.6)" align="center" fontStyle="bold" />

        {rowLabels.map((label, rowIdx) => {
          const rowSeats = seatsByRow.get(label) || [];
          const yBase = 100 + rowIdx * ROW_HEIGHT;
          const rowTotalW = rowSeats.length * (SEAT_RADIUS * 2 + SEAT_GAP);
          const rowXStart = xOffset + (totalSeatWidth - rowTotalW) / 2;
          return (
            <Group key={label}>
              <Text x={12} y={yBase-5} text={label} fontSize={12} fill="#64748B" fontStyle="bold" />
              {rowSeats.map((seat, seatIdx) => {
                const x = rowXStart + seatIdx * (SEAT_RADIUS * 2 + SEAT_GAP);
                const isSelected = selectedSeats.includes(seat.SeatId);
                const isHover = hoveredSeat === seat.SeatId;
                const isAvailable = seat.Status === "available";
                const canClick = isAvailable || isSelected;
                const color = isSelected ? SELECTED_COLOR : STATUS_COLORS[seat.Status];
                return (
                  <Group key={seat.SeatId}>
                    <Circle x={x} y={yBase} radius={isHover ? SEAT_RADIUS+2 : SEAT_RADIUS} fill={color}
                      stroke={isSelected ? "#FFF" : isHover && canClick ? "#E2E8F0" : "transparent"} strokeWidth={isSelected ? 2 : 1}
                      opacity={isAvailable || isSelected ? 1 : 0.35}
                      onClick={() => canClick && onSeatClick(seat.SeatId)}
                      onMouseEnter={(e) => { setHoveredSeat(seat.SeatId); const c = e.target.getStage()?.container(); if (c) c.style.cursor = canClick ? "pointer" : "not-allowed"; }}
                      onMouseLeave={(e) => { setHoveredSeat(null); const c = e.target.getStage()?.container(); if (c) c.style.cursor = "default"; }}
                      shadowBlur={isSelected ? 10 : isHover ? 6 : 0} shadowColor={isSelected ? SELECTED_COLOR : "#FFF"} shadowOpacity={isSelected ? 0.7 : 0.3} />
                    {(isHover || isSelected) && <Text x={x-SEAT_RADIUS} y={yBase-5} width={SEAT_RADIUS*2} text={String(seat.SeatNumber)} fontSize={9} fill="#FFF" fontStyle="bold" align="center" listening={false} />}
                    {isHover && <Group>
                      <Rect x={x-45} y={yBase-SEAT_RADIUS-38} width={90} height={28} fill="rgba(0,0,0,0.85)" cornerRadius={4} listening={false} />
                      <Text x={x-45} y={yBase-SEAT_RADIUS-34} width={90} text={`Fila ${seat.RowLabel} - Asiento ${seat.SeatNumber}`} fontSize={9} fill="#FFF" align="center" listening={false} />
                      <Text x={x-45} y={yBase-SEAT_RADIUS-22} width={90} text={seat.Status === "available" ? "Disponible" : seat.Status === "held" ? "Reservado" : seat.Status === "sold" ? "Vendido" : "Bloqueado"} fontSize={9} fill={STATUS_COLORS[seat.Status]} align="center" listening={false} />
                    </Group>}
                  </Group>
                );
              })}
              <Text x={rowXStart + rowTotalW + 8} y={yBase-5} text={label} fontSize={12} fill="#64748B" fontStyle="bold" />
            </Group>
          );
        })}

        <Group x={width-170} y={contentHeight-110}>
          <Rect x={0} y={0} width={160} height={100} fill="rgba(0,0,0,0.5)" cornerRadius={6} />
          {([{s:"available" as SeatStatus,l:"Disponible"},{s:"held" as SeatStatus,l:"Reservado"},{s:"sold" as SeatStatus,l:"Vendido"},{s:"blocked" as SeatStatus,l:"Bloqueado"}]).map((item,i)=>(
            <Group key={item.s} x={12} y={12+i*18}><Circle x={6} y={0} radius={6} fill={STATUS_COLORS[item.s]} opacity={item.s==="available"?1:0.5} /><Text x={18} y={-6} text={item.l} fontSize={10} fill="#CBD5E1" /></Group>
          ))}
          <Group x={12} y={12+4*18}><Circle x={6} y={0} radius={6} fill={SELECTED_COLOR} stroke="#FFF" strokeWidth={2} /><Text x={18} y={-6} text="Tu seleccion" fontSize={10} fill="#CBD5E1" /></Group>
        </Group>
      </Layer>
    </Stage>
  );
}
