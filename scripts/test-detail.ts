import { NextRequest } from "next/server";
import * as detail from "../src/app/api/members/[id]/detail/route";
import * as notes from "../src/app/api/members/[id]/notes/route";

const BASE = "http://localhost/api";
const req = (path: string, init: { method?: string; body?: unknown } = {}) =>
  new NextRequest(`${BASE}${path}`, { method: init.method ?? "GET", headers: { "content-type": "application/json" }, body: init.body ? JSON.stringify(init.body) : undefined });
const json = async (r: Response) => JSON.parse(await r.text());
let fail = 0;
const ok = (l: string, c: boolean, e = "") => { console.log(`${c ? "✓" : "✗"} ${l}${e ? ` — ${e}` : ""}`); if (!c) fail++; };

(async () => {
  let r = await detail.GET(req("/members/mbr_marta/detail"), { params: { id: "mbr_marta" } });
  let b = await json(r);
  ok("detail Marta: insight + aiSummary + score history", r.status === 200 && !!b.data.aiSummary && b.data.scoreHistory.length >= 2);
  ok("detail incluye actividad y recommendedClass", Array.isArray(b.data.activity) && !!b.data.recommendedClass);

  r = await notes.POST(req("/members/mbr_marta/notes", { method: "POST", body: { body: "Llamada hecha, retoma el martes" } }), { params: { id: "mbr_marta" } });
  b = await json(r);
  ok("crear nota => 201", r.status === 201 && b.data.body.includes("martes"));

  r = await notes.GET(req("/members/mbr_marta/notes"), { params: { id: "mbr_marta" } });
  b = await json(r);
  ok("listar notas => incluye la creada", b.data.length >= 1);

  r = await notes.POST(req("/members/mbr_marta/notes", { method: "POST", body: { body: "" } }), { params: { id: "mbr_marta" } });
  ok("nota vacía => 422", r.status === 422);

  console.log(fail === 0 ? "\nDETAIL + NOTES OK ✅" : `\n${fail} fallo(s) ❌`);
  process.exit(fail === 0 ? 0 : 1);
})();
