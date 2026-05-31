/* Pruebas de integración invocando los route handlers en proceso (sin servidor). */
import { NextRequest } from "next/server";

import * as members from "../src/app/api/members/route";
import * as memberId from "../src/app/api/members/[id]/route";
import * as assignCoach from "../src/app/api/members/[id]/assign-coach/route";
import * as markContacted from "../src/app/api/members/[id]/mark-contacted/route";
import * as coaches from "../src/app/api/coaches/route";
import * as todayMembers from "../src/app/api/coaches/[id]/today-members/route";
import * as tasks from "../src/app/api/tasks/route";
import * as taskComplete from "../src/app/api/tasks/[id]/complete/route";
import * as alerts from "../src/app/api/alerts/route";
import * as alertResolve from "../src/app/api/alerts/[id]/resolve/route";
import * as msgTemplates from "../src/app/api/messages/templates/route";
import * as msgCopy from "../src/app/api/messages/copy/route";
import * as reportsWeekly from "../src/app/api/reports/weekly/route";
import * as reportGen from "../src/app/api/reports/weekly/generate/route";
import * as settings from "../src/app/api/settings/route";
import * as riskRules from "../src/app/api/settings/risk-rules/route";

const BASE = "http://localhost/api";
function req(path: string, init: { method?: string; body?: unknown; org?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init.org) headers["x-user-id"] = init.org === "org_norte" ? "usr_b_owner" : "usr_a_owner";
  return new NextRequest(`${BASE}${path}`, {
    method: init.method ?? "GET", headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
}
async function json(res: Response) { return JSON.parse(await res.text()); }

let fail = 0;
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "\u2713" : "\u2717"} ${label}${extra ? ` \u2014 ${extra}` : ""}`);
  if (!cond) fail++;
};

(async () => {
  let r = await members.GET(req("/members"));
  let b = await json(r);
  ok("GET /members (A) = 14", r.status === 200 && b.data.length === 14, `${b.data.length}`);

  r = await members.GET(req("/members?riskLevel=high&status=at_risk"));
  b = await json(r);
  ok("filtro high+at_risk => Marta", b.data.length === 1 && b.data[0].fullName === "Marta García");

  r = await members.GET(req("/members", { org: "org_norte" }));
  b = await json(r);
  ok("tenant B aislado = 6", b.data.length === 6, `${b.data.length}`);

  r = await members.GET(new NextRequest(`${BASE}/members`, { headers: { "x-user-id": "usr_inexistente" } }));
  b = await json(r);
  ok("usuario inexistente => 401", r.status === 401 && b.error.code === "UNAUTHORIZED");

  r = await members.POST(req("/members", { method: "POST", body: { fullName: "X", email: "bad", mainGoal: "t", level: "beginner" } }));
  b = await json(r);
  ok("POST email invalido => 422", r.status === 422 && b.error.code === "VALIDATION_ERROR");

  r = await members.POST(req("/members", { method: "POST", body: { fullName: "Nuevo Socio", email: "n@x.com", mainGoal: "salud", level: "beginner" } }));
  b = await json(r);
  const newId = b.data.id;
  ok("crear sin coach => no_coach", r.status === 201 && b.data.status === "no_coach" && b.data.assignedCoachId === null);

  r = await assignCoach.POST(req(`/members/${newId}/assign-coach`, { method: "POST", body: { coachId: "cph_a2" } }), { params: { id: newId } });
  b = await json(r);
  ok("assign-coach => in_progress + coach", b.data.status === "in_progress" && b.data.assignedCoachId === "cph_a2");

  r = await assignCoach.POST(req(`/members/${newId}/assign-coach`, { method: "POST", body: { coachId: "cph_b1" } }), { params: { id: newId } });
  b = await json(r);
  ok("assign-coach cross-tenant => bloqueado", r.status >= 400, `${b.error?.code}`);

  r = await markContacted.POST(req(`/members/mbr_marta/mark-contacted`, { method: "POST" }), { params: { id: "mbr_marta" } });
  b = await json(r);
  ok("mark-contacted actualiza accion", r.status === 200 && b.data.nextRecommendedAction.includes("contacto"));

  r = await memberId.GET(req("/members/nope"), { params: { id: "nope" } });
  b = await json(r);
  ok("GET member inexistente => 404", r.status === 404 && b.error.code === "NOT_FOUND");

  r = await coaches.GET(req("/coaches"));
  b = await json(r);
  ok("GET /coaches con load 0-1", b.data.length === 4 && b.data.every((c: { load: number }) => c.load >= 0 && c.load <= 1), `${b.data.length} coaches`);

  r = await todayMembers.GET(req("/coaches/cph_a1/today-members"), { params: { id: "cph_a1" } });
  b = await json(r);
  ok("today-members trae accion sugerida", b.data.length > 0 && !!b.data[0].suggestedAction);

  r = await tasks.GET(req("/tasks?status=today"));
  b = await json(r);
  const aTask = b.data[0].id;
  ok("GET /tasks?status=today", b.data.length > 0);
  r = await taskComplete.POST(req(`/tasks/${aTask}/complete`, { method: "POST", body: { completed: true } }), { params: { id: aTask } });
  b = await json(r);
  ok("complete task => completedAt fijado", b.data.status === "completed" && !!b.data.completedAt);

  r = await alerts.GET(req("/alerts?status=open"));
  b = await json(r);
  const aAlert = b.data[0].id;
  ok("GET /alerts?status=open ordenadas por riesgo", b.data[0].riskLevel === "high");
  r = await alertResolve.POST(req(`/alerts/${aAlert}/resolve`, { method: "POST", body: {} }), { params: { id: aAlert } });
  b = await json(r);
  ok("resolve alert => resolvedAt fijado", b.data.status === "resolved" && !!b.data.resolvedAt);

  r = await msgTemplates.GET(req("/messages/templates"));
  b = await json(r);
  ok("GET templates (A) = 9", b.data.length === 9, `${b.data.length}`);
  r = await msgCopy.POST(req("/messages/copy", { method: "POST", body: { templateId: "tpl_a_noreturn", memberId: "mbr_marta" } }));
  b = await json(r);
  ok("copy renderiza nombre => Marta", b.data.body.includes("Marta") && !b.data.body.includes("{{"));

  r = await reportsWeekly.GET(req("/reports/weekly"));
  b = await json(r);
  ok("GET reports/weekly trae latest", !!b.data.latest);
  r = await reportGen.POST(req("/reports/weekly/generate", { method: "POST" }));
  b = await json(r);
  ok("generate report calcula metricas", r.status === 201 && typeof b.data.metricsJson.activationRate === "number" && !!b.data.summary);

  r = await settings.GET(req("/settings"));
  b = await json(r);
  ok("GET settings trae org + 4 reglas", b.data.organization.id === "org_centro" && b.data.rules.length === 4);
  r = await settings.PATCH(req("/settings", { method: "PATCH", body: { brandingColor: "#16623d" } }));
  b = await json(r);
  ok("PATCH settings color valido", b.data.brandingColor === "#16623d");
  r = await settings.PATCH(req("/settings", { method: "PATCH", body: { brandingColor: "rojo" } }));
  b = await json(r);
  ok("PATCH settings color invalido => 422", r.status === 422);
  r = await riskRules.PATCH(req("/settings/risk-rules", { method: "PATCH", body: { rules: [{ type: "no_return_7d", thresholdValue: 5, enabled: true }] } }));
  b = await json(r);
  ok("PATCH risk-rules actualiza umbral", b.data[0].thresholdValue === 5);

  r = await members.GET(req("/members", { org: "org_norte" }));
  b = await json(r);
  ok("tenant B sigue = 6 (sin contaminar)", b.data.length === 6, `${b.data.length}`);

  console.log(fail === 0 ? "\nTODOS LOS ENDPOINTS OK \u2705" : `\n${fail} fallo(s) \u274c`);
  process.exit(fail === 0 ? 0 : 1);
})();
