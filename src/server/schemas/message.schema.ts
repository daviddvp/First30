import { z } from "zod";

export const copyMessageSchema = z.object({
  templateId: z.string().min(1, "Plantilla requerida"),
  memberId: z.string().min(1, "Socio requerido"),
});

export const logMessageSchema = z.object({
  templateId: z.string().nullable().optional().default(null),
  memberId: z.string().min(1),
  channel: z.enum(["whatsapp", "email", "sms"]).default("whatsapp"),
  body: z.string().min(1, "El cuerpo no puede estar vacío"),
  status: z.enum(["copied", "sent"]).default("copied"),
});

export const upsertTemplateSchema = z.object({
  category: z.string().min(2),
  title: z.string().min(2),
  body: z.string().min(5),
  variables: z.array(z.string()).default(["nombre"]),
  active: z.boolean().default(true),
});

export const templateListQuerySchema = z.object({
  category: z.string().optional(),
});
