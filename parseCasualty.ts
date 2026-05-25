// 자연어 입력 모듈 - 오케스트레이터
// UI(App.tsx)는 이 함수 하나만 호출하면 된다.
// 1) 서버리스 함수 /api/parse-casualty (LLM 해석)를 먼저 시도하고,
// 2) 실패하거나 키가 없으면 규칙 기반 폴백 파서로 자동 대체한다.
// 데모가 API 키 없이도 항상 동작하도록 보장한다.

import type { ParsedCasualty, ParseApiResponse } from './types';
import { fallbackParse } from './fallbackParser';

export async function parseCasualty(text: string): Promise<ParsedCasualty> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      confidence: 0,
      rawText: text,
      source: 'fallback',
      notes: '입력된 문장이 없습니다.',
    };
  }

  try {
    const res = await fetch('/api/parse-casualty', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
    });

    if (res.ok) {
      const data = (await res.json()) as ParseApiResponse;
      if (data.ok && data.parsed) {
        return {
          ...data.parsed,
          rawText: text,
          source: 'llm',
        };
      }
    }
    // res.ok 가 아니거나 (예: 503 no_api_key, 502 upstream) 응답이 비정상이면 폴백으로 진행
  } catch {
    // 네트워크 오류 - 폴백으로 진행
  }

  return fallbackParse(text);
}
