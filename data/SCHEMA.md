# ward JSON schema (one file per ward)
{
  "ward_id": "shinjuku",            // romaji lowercase
  "ward_ja": "新宿区", "ward_ko": "신주쿠구",
  "checked_at": "2026-09-30",
  "main_office": {"name_ja": "", "address_ja": "", "hours_ja": "", "weekend_or_extended_hours_ja": "", "url": ""},
  "language_support": {"summary_ko": "", "korean_available": true|false|null, "details_ja": "", "source_url": ""},
  "procedures": {
    "moving_in":  { ...procedure },     // 転入届（外国人住民）: both 'arriving from abroad (新規入国)' and 'moving from another Japanese municipality'
    "national_health_insurance": { ...procedure },   // 国民健康保険 加入
    "my_number_card": { ...procedure }  // マイナンバーカード 交付申請・受取
  },
  "unverified": ["things that official pages did not state and need phone/counter confirmation"]
}
procedure = {
  "name_ja": "", "name_ko": "",
  "deadline_ko": "",                      // e.g. 전입 후 14일 이내
  "where_ja": "", "where_ko": "",         // counter/window name, branch offices OK?
  "reservation_ko": "",                   // required / not required / online booking URL
  "required_documents": [ {"item_ja": "", "item_ko": "", "condition_ko": ""} ],
  "cases": [ {"case_ko": "", "notes_ko": ""} ],   // e.g. 해외에서 신규 입국 / 국내 다른 구에서 이사
  "fee_ko": "", "processing_time_ko": "", "online_option_ko": "",
  "notes_ko": [""],
  "sources": [ {"title": "", "url": ""} ]    // official pages actually opened
}
Rules: facts only from official sources (ward site, city hall PDFs, デジタル庁, 出入国在留管理庁, 総務省). If not stated → null and add to "unverified". Never guess.
