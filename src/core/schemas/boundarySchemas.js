import { z } from "zod";

const unknownObjectSchema = z.object({}).catchall(z.unknown());

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatPath(path = []) {
  return path.length ? path.join(".") : "root";
}

function formatZodErrors(error) {
  return error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`);
}

function validateWith(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) {
    return { valid: true, errors: [], data: result.data };
  }
  return { valid: false, errors: formatZodErrors(result.error), data: null };
}

const calendarTopicInputSchema = unknownObjectSchema.refine(
  (topic) => ["temaOriginal", "tema", "title", "nome"].some((field) => String(topic[field] || "").trim()),
  { message: "Item de calendario sem tema." }
);

export const calendarCsvRawSchema = z.string().trim().min(1, "Arquivo CSV vazio.");

export const calendarImportJsonSchema = z
  .array(calendarTopicInputSchema)
  .min(1, "JSON de calendario sem itens.");

const appSectionSchema = unknownObjectSchema.extend({
  temas: z.array(z.unknown()).optional(),
  simulados: z.array(z.unknown()).optional(),
  ankiLog: z.array(z.unknown()).optional(),
  cronogramas: z.array(z.unknown()).optional(),
  casosProgresso: unknownObjectSchema.optional(),
});

export const appStateSchema = unknownObjectSchema.superRefine((state, ctx) => {
  if (state.ownerUid != null && typeof state.ownerUid !== "string") {
    ctx.addIssue({
      code: "custom",
      path: ["ownerUid"],
      message: "ownerUid invalido.",
    });
  }

  for (const section of ["res", "vest"]) {
    if (state[section] != null && !isObject(state[section])) {
      ctx.addIssue({
        code: "custom",
        path: [section],
        message: "Secao de estado invalida.",
      });
    }
  }
});

export const backupFileSchema = unknownObjectSchema.extend({
  version: z.string().min(1, "Campo version ausente."),
  schema: z.string().optional(),
  ownerUid: z.string().nullable().optional(),
  meta: unknownObjectSchema,
  res: appSectionSchema,
  vest: appSectionSchema,
});

export const persistedStateSchema = z.union([
  unknownObjectSchema.extend({
    state: appStateSchema,
    version: z.union([z.number(), z.string()]).optional(),
  }),
  appStateSchema,
]);

export function validateCalendarCsvRaw(raw) {
  return validateWith(calendarCsvRawSchema, raw);
}

export function validateCalendarImportJson(value) {
  return validateWith(calendarImportJsonSchema, value);
}

export function validateBackupFileShape(value) {
  return validateWith(backupFileSchema, value);
}

export function validateAppStateShape(value) {
  return validateWith(appStateSchema, value);
}

export function validatePersistedStateShape(value) {
  return validateWith(persistedStateSchema, value);
}
