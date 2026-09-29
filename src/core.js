// Pure data + query logic (no MCP dependency) so it can be unit-tested.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

export const PROCEDURES = {
  moving_in: { ko: "전입신고", ja: "転入届" },
  national_health_insurance: { ko: "국민건강보험 가입", ja: "国民健康保険 加入" },
  my_number_card: { ko: "마이넘버카드 신청·수령", ja: "マイナンバーカード 申請・受取" },
};

export const DISCLAIMER_KO =
  "각 구 공식 사이트 기준으로 정리한 정보이며 법률 자문이 아닙니다. 확인일(checked_at) 이후 바뀌었을 수 있으니 방문 전 sources의 공식 페이지 또는 구청에 확인하세요. unverified 항목은 공식 페이지에 명시되지 않은 내용입니다.";

export function loadWards(dir = DATA_DIR) {
  const wards = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    const w = JSON.parse(readFileSync(join(dir, f), "utf8"));
    wards[w.ward_id] = w;
  }
  return wards;
}

// Strip only explicit suffixes (区, 구, -ku, city); a bare "ku" is part of romaji names like "shinjuku".
const norm = (s) =>
  String(s ?? "").trim().toLowerCase().replace(/[\s　_]/g, "").replace(/(-?city|-ku|区役所|구청|区|구)$/u, "");

export function findWard(wards, query) {
  const q = norm(query);
  if (!q) return null;
  for (const w of Object.values(wards)) {
    const keys = [w.ward_id, w.ward_ja, w.ward_ko].map(norm);
    if (keys.includes(q)) return w;
  }
  return null;
}

function wardNotFound(wards, query) {
  return {
    error: `지원하지 않는 구입니다: ${query}`,
    available_wards: Object.values(wards).map((w) => ({ ward_id: w.ward_id, ward_ja: w.ward_ja, ward_ko: w.ward_ko })),
  };
}

export function listWards(wards) {
  return {
    wards: Object.values(wards).map((w) => ({
      ward_id: w.ward_id,
      ward_ja: w.ward_ja,
      ward_ko: w.ward_ko,
      checked_at: w.checked_at,
      procedures: Object.keys(w.procedures),
      korean_language_support: w.language_support?.korean_available ?? null,
    })),
    procedures: PROCEDURES,
    disclaimer_ko: DISCLAIMER_KO,
  };
}

export function getProcedure(wards, wardQuery, procedure) {
  const w = findWard(wards, wardQuery);
  if (!w) return wardNotFound(wards, wardQuery);
  const p = w.procedures[procedure];
  if (!p) return { error: `알 수 없는 절차: ${procedure}`, available_procedures: Object.keys(PROCEDURES) };
  return {
    ward: { ward_id: w.ward_id, ward_ja: w.ward_ja, ward_ko: w.ward_ko },
    checked_at: w.checked_at,
    procedure,
    ...p,
    language_support: w.language_support,
    unverified: w.unverified,
    disclaimer_ko: DISCLAIMER_KO,
  };
}

// Picks the case entries relevant to how the person arrives.
function relevantCases(cases = [], arrival) {
  const abroad = /해외|국외|신규\s*입국|新規入国/u;
  const domestic = /국내|다른\s*(구|시|지자체)|전출|転出|특례/u;
  const re = arrival === "from_abroad" ? abroad : domestic;
  const hit = cases.filter((c) => re.test(c.case_ko ?? ""));
  return hit.length ? hit : cases;
}

export function movingChecklist(wards, wardQuery, arrival) {
  const w = findWard(wards, wardQuery);
  if (!w) return wardNotFound(wards, wardQuery);
  const P = w.procedures;
  const step = (order, key, when) => ({
    order,
    procedure: key,
    name_ko: P[key]?.name_ko ?? PROCEDURES[key].ko,
    name_ja: P[key]?.name_ja ?? PROCEDURES[key].ja,
    when_ko: when,
    deadline_ko: P[key]?.deadline_ko ?? null,
    where_ko: P[key]?.where_ko ?? null,
    reservation_ko: P[key]?.reservation_ko ?? null,
    required_documents: P[key]?.required_documents ?? [],
    cases: relevantCases(P[key]?.cases, arrival),
    notes_ko: P[key]?.notes_ko ?? [],
    sources: P[key]?.sources ?? [],
  });
  return {
    ward: { ward_id: w.ward_id, ward_ja: w.ward_ja, ward_ko: w.ward_ko },
    arrival,
    checked_at: w.checked_at,
    steps: [
      step(1, "moving_in", "거주 시작 후 가장 먼저 (다른 절차의 전제)"),
      step(2, "national_health_insurance", "전입신고와 같은 날 이어서 하는 것이 일반적"),
      step(3, "my_number_card", "전입 후 개인번호 통지서가 도착한 뒤 신청 → 교부 통지 후 예약하여 수령"),
    ],
    main_office: w.main_office,
    language_support: w.language_support,
    unverified: w.unverified,
    disclaimer_ko: DISCLAIMER_KO,
  };
}

export function compareWards(wards, procedure) {
  if (!PROCEDURES[procedure]) return { error: `알 수 없는 절차: ${procedure}`, available_procedures: Object.keys(PROCEDURES) };
  return {
    procedure,
    wards: Object.values(wards).map((w) => {
      const p = w.procedures[procedure] ?? {};
      return {
        ward_ko: w.ward_ko,
        ward_ja: w.ward_ja,
        checked_at: w.checked_at,
        deadline_ko: p.deadline_ko ?? null,
        where_ko: p.where_ko ?? null,
        reservation_ko: p.reservation_ko ?? null,
        processing_time_ko: p.processing_time_ko ?? null,
        fee_ko: p.fee_ko ?? null,
        korean_language_support: w.language_support?.summary_ko ?? null,
        sources: p.sources ?? [],
      };
    }),
    disclaimer_ko: DISCLAIMER_KO,
  };
}
