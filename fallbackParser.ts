// 자연어 입력 모듈 - 규칙 기반 폴백 파서
// API 키가 없거나 /api/parse-casualty 호출이 실패할 때 동작한다.
// 결정론적(deterministic)으로 작동하므로, 심사위원이 키 없이 데모를 열어도 자연어 입력이 항상 작동한다.

import type { InjuryProfile, TreatmentState, Consciousness } from '../types';
import type { ParsedCasualty } from './types';

interface KeywordRule {
  // 본문에 아래 키워드 중 하나라도 포함되면 매칭
  keywords: string[];
  // 부정 키워드가 포함되면 매칭에서 제외 (예: "출혈 없음")
  negate?: string[];
  apply: (
    injuries: Partial<InjuryProfile>,
    treatments: Partial<TreatmentState>,
    flags: { walking?: boolean; breathing?: boolean },
  ) => void;
}

const RULES: KeywordRule[] = [
  {
    keywords: ['절단', '절단됨', '잘림'],
    apply: (i) => {
      i.amputation = true;
      i.massiveHemorrhage = true;
      i.limbInjury = true;
    },
  },
  {
    keywords: ['대량출혈', '출혈 심', '피 많', '과다출혈', '심한 출혈'],
    negate: ['출혈 없', '출혈 멈', '출혈 통제', '지혈 완료'],
    apply: (i) => {
      i.massiveHemorrhage = true;
    },
  },
  {
    keywords: ['지혈대', '터니켓', 'tourniquet'],
    apply: (i, t) => {
      i.tourniquetApplied = true;
      t.bleedingControlled = true;
    },
  },
  {
    keywords: ['지혈 완료', '지혈됨', '출혈 통제', '출혈 멈'],
    apply: (_i, t) => {
      t.bleedingControlled = true;
    },
  },
  {
    keywords: ['흉부', '가슴', '흉상'],
    apply: (i) => {
      i.chestInjury = true;
    },
  },
  {
    keywords: ['긴장성 기흉', '기흉'],
    apply: (i) => {
      i.tensionPneumothorax = true;
      i.chestInjury = true;
    },
  },
  {
    keywords: ['두부', '머리', '뇌'],
    apply: (i) => {
      i.headInjury = true;
    },
  },
  {
    keywords: ['복부', '배', '복강'],
    apply: (i) => {
      i.abdominalInjury = true;
    },
  },
  {
    keywords: ['골반'],
    apply: (i) => {
      i.pelvicInjury = true;
    },
  },
  {
    keywords: ['척추', '경추', '목 손상'],
    apply: (i) => {
      i.suspectedSpineInjury = true;
    },
  },
  {
    keywords: ['화상', '불에', '데임'],
    apply: (i) => {
      i.burn = true;
    },
  },
  {
    keywords: ['흡입 화상', '연기 흡입', '기도 화상'],
    apply: (i) => {
      i.inhalationBurn = true;
      i.burn = true;
    },
  },
  {
    keywords: ['총상', '총에', '피격'],
    apply: (i) => {
      i.gunshot = true;
      i.penetratingTrauma = true;
    },
  },
  {
    keywords: ['파편', '파편창', '유탄'],
    apply: (i) => {
      i.fragmentWound = true;
      i.penetratingTrauma = true;
    },
  },
  {
    keywords: ['폭발', '폭압'],
    apply: (i) => {
      i.blastInjury = true;
    },
  },
  {
    keywords: ['관통'],
    apply: (i) => {
      i.penetratingTrauma = true;
    },
  },
  {
    keywords: ['개방 골절', '개방골절', '뼈 노출'],
    apply: (i) => {
      i.openFracture = true;
    },
  },
  {
    keywords: ['골절', '뼈 부러', '부러짐'],
    negate: ['개방'],
    apply: (i) => {
      i.closedFracture = true;
    },
  },
  {
    keywords: ['압좌', '깔림', '깔렸', '눌림'],
    apply: (i) => {
      i.crushInjury = true;
    },
  },
  {
    keywords: ['기도 폐쇄', '기도폐쇄', '기도 막'],
    apply: (i) => {
      i.airwayObstruction = true;
    },
  },
  {
    keywords: ['기도 확보', '기도확보', '에어웨이 삽입'],
    apply: (_i, t) => {
      t.airwaySecured = true;
    },
  },
  {
    keywords: ['쇼크', '저혈압 쇼크', '쇽'],
    apply: (i) => {
      i.shock = true;
    },
  },
  {
    keywords: ['저체온'],
    apply: (i) => {
      i.hypothermia = true;
    },
  },
  {
    keywords: ['화학', '신경작용제', '독가스', '가스 노출', '작용제'],
    apply: (i, t) => {
      i.chemicalExposure = true;
      t.decontaminationNeeded = true;
    },
  },
  {
    keywords: ['생물학', '생물작용제', '병원체'],
    apply: (i, t) => {
      i.biologicalExposure = true;
      t.isolationNeeded = true;
    },
  },
  {
    keywords: ['방사능', '방사선', '핵 오염'],
    apply: (i, t) => {
      i.radiationExposure = true;
      t.decontaminationNeeded = true;
    },
  },
  {
    keywords: ['오염', '제독 필요'],
    apply: (_i, t) => {
      t.decontaminationNeeded = true;
    },
  },
  {
    keywords: ['전투 스트레스', '공황', '극도 불안'],
    apply: (i) => {
      i.combatStress = true;
    },
  },
  {
    keywords: ['보행 가능', '걸을 수 있', '거동 가능', '스스로 이동'],
    apply: (_i, _t, f) => {
      f.walking = true;
    },
  },
  {
    keywords: ['보행 불가', '걷지 못', '거동 불가', '움직이지 못'],
    apply: (_i, _t, f) => {
      f.walking = false;
    },
  },
  {
    keywords: ['호흡 없', '무호흡', '숨 안 쉼', '숨 안쉼'],
    apply: (_i, _t, f) => {
      f.breathing = false;
    },
  },
  {
    keywords: ['응급처치 완료', '응급처치함', '1차 처치 완료'],
    apply: (_i, t) => {
      t.firstAidComplete = true;
    },
  },
  {
    keywords: ['수액', '수혈', '혈액 필요'],
    apply: (_i, t) => {
      t.fluidOrBloodNeeded = true;
    },
  },
  {
    keywords: ['진통', '진통제 필요', '통증 심'],
    apply: (_i, t) => {
      t.analgesiaNeeded = true;
    },
  },
];

// 의식 상태 키워드
function detectConsciousness(text: string): Consciousness | undefined {
  if (/(무반응|의식\s*없|반응\s*없|의식불명)/.test(text)) return '무반응';
  if (/(통증\s*반응|통증에\s*반응)/.test(text)) return '통증반응';
  if (/(음성\s*반응|불러야\s*반응|소리에\s*반응)/.test(text)) return '음성반응';
  if (/(의식\s*명료|의식\s*있|명료)/.test(text)) return '명료';
  return undefined;
}

// 숫자 + 단위 추출 (혈압 80, SpO2 88, 호흡 30, 맥박 120)
function detectVitals(text: string): ParsedCasualty['vitals'] {
  const vitals: NonNullable<ParsedCasualty['vitals']> = {};
  const bp = text.match(/(?:수축기\s*)?혈압[^\d]{0,4}(\d{2,3})/);
  if (bp) vitals.systolicBp = Number(bp[1]);
  const spo2 = text.match(/(?:spo2|산소포화도|포화도)[^\d]{0,4}(\d{2,3})/i);
  if (spo2) vitals.spo2 = Number(spo2[1]);
  const rr = text.match(/(?:호흡수?|호흡률)[^\d]{0,4}(\d{1,3})/);
  if (rr) vitals.respiratoryRate = Number(rr[1]);
  const pulse = text.match(/(?:맥박|심박수?)[^\d]{0,4}(\d{2,3})/);
  if (pulse) vitals.pulse = Number(pulse[1]);
  return Object.keys(vitals).length > 0 ? vitals : undefined;
}

// 화상 퍼센트 추출 (화상 30%, 30% 화상)
function detectBurnPercent(text: string): number | undefined {
  const m = text.match(/화상[^\d]{0,4}(\d{1,3})\s*%|(\d{1,3})\s*%[^가-힣]{0,3}화상/);
  if (m) return Number(m[1] ?? m[2]);
  return undefined;
}

export function fallbackParse(text: string): ParsedCasualty {
  const lower = text;
  const injuries: Partial<InjuryProfile> = {};
  const treatments: Partial<TreatmentState> = {};
  const flags: { walking?: boolean; breathing?: boolean } = {};
  let matchCount = 0;

  for (const rule of RULES) {
    const negated = rule.negate?.some((n) => lower.includes(n));
    if (negated) continue;
    if (rule.keywords.some((k) => lower.includes(k))) {
      rule.apply(injuries, treatments, flags);
      matchCount += 1;
    }
  }

  const consciousness = detectConsciousness(lower);
  const vitals = detectVitals(lower);
  const burnPercent = detectBurnPercent(lower);
  if (burnPercent !== undefined) {
    injuries.burn = true;
    injuries.burnPercent = burnPercent;
  }

  const totalSignals =
    matchCount +
    (consciousness ? 1 : 0) +
    (vitals ? Object.keys(vitals).length : 0) +
    (flags.walking !== undefined ? 1 : 0) +
    (flags.breathing !== undefined ? 1 : 0);

  // 폴백은 LLM보다 보수적으로 confidence 를 매긴다 (최대 0.7)
  const confidence = Math.min(0.7, totalSignals === 0 ? 0.1 : 0.25 + totalSignals * 0.12);

  return {
    vitals,
    injuries: Object.keys(injuries).length > 0 ? injuries : undefined,
    treatments: Object.keys(treatments).length > 0 ? treatments : undefined,
    consciousness,
    walking: flags.walking,
    breathing: flags.breathing,
    confidence,
    rawText: text,
    source: 'fallback',
    notes:
      totalSignals === 0
        ? '인식된 키워드가 없습니다. 문장을 더 구체적으로 입력하거나 폼에서 직접 수정하세요.'
        : undefined,
  };
}
