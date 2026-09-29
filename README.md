# tokyo-ward-procedures-mcp

도쿄에서 한국인 주민이 가장 많은 3개 구(신주쿠·아다치·세타가야, 도쿄도 외국인인구 2026년 7월 기준)의
외국인 전입 절차를 AI 에이전트가 호출할 수 있게 만든 MCP 서버입니다.

- 절차: 전입신고(転入届) · 국민건강보험 가입 · 마이넘버카드 신청·수령
- 모든 항목에 공식 출처 URL과 확인일(checked_at)이 붙어 있습니다.
- 공식 페이지에 없는 내용은 추측하지 않고 `unverified`에 적었습니다.

## 도구

| 도구 | 용도 |
|---|---|
| `get_moving_checklist(ward, arrival)` | 전입 후 해야 할 일 순서표. `arrival`: `from_abroad`(해외 신규 입국) / `domestic`(국내 이사) |
| `get_procedure(ward, procedure)` | 한 구의 한 절차 상세 |
| `compare_wards(procedure)` | 3개 구 비교 |
| `list_wards()` | 지원 구·절차 목록 |

`ward`는 `shinjuku` / `新宿区` / `신주쿠` 모두 받습니다.

## 실행

```bash
npm install
npm test              # 데이터 출처 검사 + 서버 호출 테스트
npm start             # 로컬(stdio) — Claude Desktop 등에서 사용
npm run start:http    # 원격(HTTP) — POST /mcp, 기본 포트 8787 (PORT로 변경)
```

Claude Desktop 설정 예시(`claude_desktop_config.json`):

```json
{ "mcpServers": { "tokyo-ward-procedures": { "command": "node", "args": ["/절대경로/tokyo-ward-procedures-mcp/src/index.js"] } } }
```

## 원격 공개

`src/http.js`는 Node만 있으면 어디서든 돌아갑니다(Render, Railway, Fly.io 등).
호출이 올 때마다 도구 이름·인자·User-Agent를 한 줄씩 로그로 남기므로, 실제 에이전트 호출 수를 그대로 셀 수 있습니다(개인정보는 남기지 않음).

## 데이터 갱신

`data/*.json`을 수정하면 됩니다. 형식은 `data/SCHEMA.md`를 따릅니다. 행정 정보는 바뀌므로 최소 월 1회 출처 페이지를 다시 확인하세요.

## 고지

각 구 공식 사이트 기준으로 정리한 정보이며 법률 자문이 아닙니다. 방문 전 출처 페이지 또는 구청에 확인하세요.
