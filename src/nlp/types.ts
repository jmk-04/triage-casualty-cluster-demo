// 자연어 입력 모듈 - 공통 타입
// 의무요원 무전 메시지 같은 자연어 한 줄을 구조화 데이터로 변환한 결과를 담는다.
// 기존 src/types.ts 의 InjuryProfile / TreatmentState / Consciousness 와 필드명을 일치시킨다.

import type { InjuryProfile, TreatmentState, Consciousness } from '../types';

export interface ParsedVitals {
  respiratoryRate?: number;
  spo2?: number;
  pulse?: number;
  systolicBp?: number;
}

export interface ParsedCasualty {
  vitals?: ParsedVitals;
  injuries?: Partial<InjuryProfile>;
  treatments?: Partial<TreatmentState>;
  consciousness?: Consciousness;
  walking?: boolean;
  breathing?: boolean;
  confidence: number; // 0~1, 추출 확신도
  rawText: string; // 원본 입력 문장
  source: 'llm' | 'fallback'; // LLM 해석인지 규칙 기반 폴백인지
  notes?: string; // 해석 관련 부가 설명(선택)
}

// 서버리스 함수 /api/parse-casualty 의 응답 형태
export interface ParseApiResponse {
  ok: boolean;
  parsed?: ParsedCasualty;
  error?: string;
}
