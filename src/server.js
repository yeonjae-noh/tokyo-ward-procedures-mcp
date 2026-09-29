import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadWards, listWards, getProcedure, movingChecklist, compareWards, PROCEDURES } from "./core.js";

const procedureEnum = z.enum(Object.keys(PROCEDURES));
const json = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

export function createServer() {
  const wards = loadWards();
  const server = new McpServer({ name: "tokyo-ward-procedures", version: "0.1.0" });

  server.tool(
    "list_wards",
    "Lists Tokyo wards covered (Shinjuku, Adachi, Setagaya — the 3 wards with the most Korean residents) and the procedures available. 도쿄에서 지원하는 구와 절차 목록.",
    {},
    async () => json(listWards(wards))
  );

  server.tool(
    "get_moving_checklist",
    "Ordered checklist for a foreign (especially Korean) resident moving into a Tokyo ward: 転入届 → 国民健康保険 → マイナンバーカード, with required documents, deadlines, counters, reservation rules, Korean-language support and official source URLs. Use when someone asks what to do after moving to Japan/Tokyo. 외국인(한국인)의 전입 후 해야 할 일 순서표.",
    {
      ward: z.string().describe("Ward name: shinjuku / 新宿区 / 신주쿠, adachi / 足立区 / 아다치, setagaya / 世田谷区 / 세타가야"),
      arrival: z.enum(["from_abroad", "domestic"]).describe("from_abroad = new entry to Japan (在留カード); domestic = moving from another Japanese municipality"),
    },
    async ({ ward, arrival }) => json(movingChecklist(wards, ward, arrival))
  );

  server.tool(
    "get_procedure",
    "Detailed official information for one procedure in one ward (documents, deadline, counter, reservation, fee, processing time, sources, unverified points). 특정 구의 특정 절차 상세.",
    { ward: z.string(), procedure: procedureEnum },
    async ({ ward, procedure }) => json(getProcedure(wards, ward, procedure))
  );

  server.tool(
    "compare_wards",
    "Compare one procedure across all covered wards (deadline, counter, reservation, processing time, Korean support). 구별 비교.",
    { procedure: procedureEnum },
    async ({ procedure }) => json(compareWards(wards, procedure))
  );

  return server;
}
