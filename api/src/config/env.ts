import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || "4700", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "change_me",
  },
  pg: {
    host: process.env.PG_HOST || "localhost",
    port: parseInt(process.env.PG_PORT || "5432", 10),
    database: process.env.PG_DATABASE || "zentto_tickets",
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  zenttoApiUrl: process.env.ZENTTO_API_URL || "http://localhost:4000",
  ws: {
    port: parseInt(process.env.WS_PORT || "4701", 10),
  },
};
