/* ══════════════════════════════════════════
   Zentto Tickets — Tipos compartidos
   ══════════════════════════════════════════ */

// ── Venue ──
export interface Venue {
  VenueId: number;
  CompanyId: number;
  Name: string;
  Address: string;
  City: string;
  Country: string;
  Capacity: number;
  TimeZone: string;
  ImageUrl: string | null;
  SvgTemplate: string | null;
  IsActive: boolean;
}

export interface VenueConfiguration {
  ConfigurationId: number;
  VenueId: number;
  Name: string;
  Description: string | null;
  SvgOverlay: string | null;
  IsActive: boolean;
}

export interface Section {
  SectionId: number;
  ConfigurationId: number;
  Name: string;
  Code: string;
  Category: SectionCategory;
  Color: string;
  Polygon: number[][] | null;
  SortOrder: number;
  IsGeneralAdmission: boolean;
  GaCapacity: number;
  SeatCount?: number;
}

export type SectionCategory = "vip" | "preferencial" | "palco" | "general" | "standard";

export interface Row {
  RowId: number;
  SectionId: number;
  Label: string;
  SeatCount: number;
  SortOrder: number;
}

export interface Seat {
  SeatId: number;
  RowId: number;
  Number: number;
  SeatType: "seat" | "wheelchair" | "companion" | "obstructed";
  IsAccessible: boolean;
  X?: number;
  Y?: number;
}

// ── Event ──
export interface Event {
  EventId: number;
  CompanyId: number;
  Name: string;
  Description: string | null;
  ConfigurationId: number;
  EventDate: string;
  DoorsOpen: string | null;
  Status: EventStatus;
  EventType: EventType;
  ImageUrl: string | null;
  MaxTicketsPerOrder: number;
  IsPublished: boolean;
  VenueName?: string;
  City?: string;
  Country?: string;
  ConfigurationName?: string;
}

export type EventStatus = "draft" | "published" | "on_sale" | "sold_out" | "completed" | "cancelled";
export type EventType = "general" | "concert" | "sports" | "theater" | "race" | "festival";

export interface PricingZone {
  ZoneId: number;
  EventId: number;
  Name: string;
  Color: string;
  Price: number;
  Currency: string;
  SectionIds?: number[];
}

// ── Inventory ──
export type SeatStatus = "available" | "held" | "sold" | "blocked";

export interface SeatAvailability {
  SeatId: number;
  Status: SeatStatus;
  HeldUntil: string | null;
  RowLabel: string;
  SeatNumber: number;
  SeatType: string;
  IsAccessible: boolean;
}

export interface SectionAvailability {
  SectionId: number;
  Name: string;
  Code: string;
  Category: SectionCategory;
  Color: string;
  Polygon: number[][] | null;
  IsGeneralAdmission: boolean;
  Available: number;
  Held: number;
  Sold: number;
  Total: number;
  MinPrice: number;
}

// ── Order ──
export interface Order {
  OrderId: number;
  CompanyId: number;
  EventId: number;
  UserId: string;
  BuyerName: string;
  BuyerEmail: string;
  BuyerPhone: string | null;
  Total: number;
  Currency: string;
  Status: OrderStatus;
  PaymentRef: string | null;
  PaymentMethod: string | null;
  PaidAt: string | null;
  CreatedAt: string;
  EventName?: string;
  EventDate?: string;
  VenueName?: string;
  TicketCount?: number;
}

export type OrderStatus = "pending_payment" | "paid" | "cancelled" | "refunded";

// ── Ticket ──
export interface Ticket {
  TicketId: number;
  OrderId: number;
  EventId: number;
  SeatId: number | null;
  Barcode: string;
  Price: number;
  Currency: string;
  Status: TicketStatus;
  ScannedAt: string | null;
  TransferTo: string | null;
  RowLabel?: string;
  SeatNumber?: number;
  SectionName?: string;
  SectionCode?: string;
  EventName?: string;
  EventDate?: string;
  VenueName?: string;
}

export type TicketStatus = "active" | "cancelled" | "transferred" | "used";

// ── Race / Carrera ──
export interface Race {
  RaceId: number;
  EventId: number;
  Distance: string;          // "5K", "10K", "21K", "42K"
  MaxParticipants: number;
  RegistrationDeadline: string;
  StartTime: string;
  RouteMapUrl: string | null;
  Categories: RaceCategory[];
}

export interface RaceCategory {
  CategoryId: number;
  RaceId: number;
  Name: string;              // "Elite", "Sub-23", "General", "Veteranos"
  AgeMin: number;
  AgeMax: number;
  Gender: "M" | "F" | "X";
  Price: number;
  Currency: string;
}

export interface RaceRegistration {
  RegistrationId: number;
  RaceId: number;
  UserId: string;
  BibNumber: string;         // Dorsal
  CategoryId: number;
  FullName: string;
  IdDocument: string;
  DateOfBirth: string;
  Gender: "M" | "F" | "X";
  EmergencyContact: string;
  EmergencyPhone: string;
  TShirtSize: string;
  Status: "registered" | "confirmed" | "dns" | "dnf" | "finished";
  FinishTime: string | null;
  ChipTime: string | null;
  Position: number | null;
  CategoryPosition: number | null;
}

// ── SeatMap ──
export interface SeatMapData {
  configuration: VenueConfiguration & { VenueName: string; SvgTemplate: string | null };
  sections: (Section & {
    Rows: (Row & {
      seats: Seat[];
    })[];
  })[];
}

// ── Paginated response ──
export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

// ── WebSocket messages ──
export interface WsSeatChange {
  type: "seat_change";
  eventId: number;
  seatId: number;
  status: SeatStatus;
}
