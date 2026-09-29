import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadWards, findWard } from "../src/core.js";

const call = async (client, name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return JSON.parse(r.content[0].text);
};

test("ward name matching accepts romaji / Japanese / Korean", () => {
  const w = loadWards();
  for (const q of ["shinjuku", "新宿区", "新宿", "신주쿠", "신주쿠구", "Shinjuku-ku"]) assert.equal(findWard(w, q)?.ward_id, "shinjuku", q);
  assert.equal(findWard(w, "아다치")?.ward_id, "adachi");
  assert.equal(findWard(w, "世田谷区")?.ward_id, "setagaya");
  assert.equal(findWard(w, "渋谷区"), null);
});

test("every procedure has at least one official source", () => {
  for (const w of Object.values(loadWards()))
    for (const [k, p] of Object.entries(w.procedures)) {
      assert.ok(p.sources?.length > 0, `${w.ward_id}/${k} has no sources`);
      for (const s of p.sources) assert.match(s.url, /^https:\/\/[^/]*(lg\.jp|go\.jp|tokyo\.jp)/, `${w.ward_id}/${k} non-official source ${s.url}`);
    }
});

test("MCP server over stdio: all tools respond", async () => {
  const client = new Client({ name: "smoke", version: "0" });
  await client.connect(new StdioClientTransport({ command: "node", args: ["src/index.js"] }));
  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ["compare_wards", "get_moving_checklist", "get_procedure", "list_wards"]);

  assert.equal((await call(client, "list_wards")).wards.length, 3);

  const c = await call(client, "get_moving_checklist", { ward: "신주쿠", arrival: "from_abroad" });
  assert.deepEqual(c.steps.map((s) => s.procedure), ["moving_in", "national_health_insurance", "my_number_card"]);
  assert.ok(c.steps[0].required_documents.length > 0);
  assert.ok(c.disclaimer_ko);

  const p = await call(client, "get_procedure", { ward: "足立区", procedure: "my_number_card" });
  assert.equal(p.ward.ward_id, "adachi");

  const miss = await call(client, "get_procedure", { ward: "渋谷区", procedure: "moving_in" });
  assert.ok(miss.error && miss.available_wards.length === 3);

  assert.equal((await call(client, "compare_wards", { procedure: "moving_in" })).wards.length, 3);
  await client.close();
});
