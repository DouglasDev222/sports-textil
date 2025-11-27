import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

import authRoutes from "./routes/admin/auth";
import usersRoutes from "./routes/admin/users";
import organizersRoutes from "./routes/admin/organizers";
import eventsRoutes from "./routes/admin/events";
import modalitiesRoutes from "./routes/admin/modalities";
import batchesRoutes from "./routes/admin/batches";
import pricesRoutes from "./routes/admin/prices";
import shirtsRoutes from "./routes/admin/shirts";
import attachmentsRoutes from "./routes/admin/attachments";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/admin/auth", authRoutes);
  app.use("/api/admin/users", usersRoutes);
  app.use("/api/admin/organizers", organizersRoutes);
  app.use("/api/admin/events", eventsRoutes);
  app.use("/api/admin/events/:eventId/modalities", modalitiesRoutes);
  app.use("/api/admin/events/:eventId/batches", batchesRoutes);
  app.use("/api/admin/events/:eventId/prices", pricesRoutes);
  app.use("/api/admin/events/:eventId/shirts", shirtsRoutes);
  app.use("/api/admin/events/:eventId/attachments", attachmentsRoutes);

  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      const publicEvents = events.filter(e => e.status === "publicado");
      res.json({ success: true, data: publicEvents });
    } catch (error) {
      console.error("Get public events error:", error);
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
      });
    }
  });

  app.get("/api/events/:slug", async (req, res) => {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event || event.status !== "publicado") {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Evento nao encontrado" }
        });
      }

      const [modalities, batches, prices, attachments] = await Promise.all([
        storage.getModalitiesByEvent(event.id),
        storage.getBatchesByEvent(event.id),
        storage.getPricesByEvent(event.id),
        storage.getAttachmentsByEvent(event.id)
      ]);

      const activeBatch = batches.find(b => b.ativo);

      res.json({
        success: true,
        data: {
          ...event,
          modalities,
          activeBatch,
          prices: prices.filter(p => p.batchId === activeBatch?.id),
          attachments
        }
      });
    } catch (error) {
      console.error("Get public event error:", error);
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" }
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
