// 자연어 입력 모듈 - 파싱 결과를 기존 Patient patch 로 변환
// 이 함수가 만든 Partial<Patient> 를 App.tsx 의 onUpdate 핸들러에 그대로 넘기면
// 기존 applyTriage / runSimulation 파이프라인이 분류·후송 경로·병원 배정을 재계산한다.
// 규칙 기반 엔진(simulation.ts)은 전혀 수정하지 않는다.

import type { Patient } from '../types';
import type { ParsedCasualty } from './types';

// 사람이 검토할 수 있도록, 적용될 변경 항목을 한국어 요약 목록으로 만든다.
export function summarizeParsed(parsed: ParsedCasualty): string[] {
  const lines: string[] = [];
  const v = parsed.vitals;
  if (v?.respiratoryRate !== undefined) lines.push(`호흡수 ${v.respiratoryRate}회/분`);
  if (v?.spo2 !== undefined) lines.push(`SpO2 ${v.spo2}%`);
  if (v?.pulse !== undefined) lines.push(`맥박 ${v.pulse}회/분`);
  if (v?.systolicBp !== undefined) lines.push(`수축기혈압 ${v.systolicBp}mmHg`);
  if (parsed.consciousness) lines.push(`의식 ${parsed.consciousness}`);
  if (parsed.walking !== undefined) lines.push(parsed.walking ? '보행 가능' : '보행 불가');
  if (parsed.breathing !== undefined) lines.push(parsed.breathing ? '호흡 있음' : '호흡 없음');

  const injuryLabels: Record<string, string> = {
    massiveHemorrhage: '대량출혈',
    tourniquetApplied: '지혈대 적용',
    airwayObstruction: '기도 폐쇄',
    tensionPneumothorax: '긴장성 기흉',
    penetratingTrauma: '관통상',
    gunshot: '총상',
    fragmentWound: '파편창',
    blastInjury: '폭발 손상',
    amputation: '절단',
    openFracture: '개방 골절',
    closedFracture: '폐쇄 골절',
    suspectedSpineInjury: '척추손상 의심',
    headInjury: '두부손상',
    facialInjury: '안면손상',
    chestInjury: '흉부손상',
    abdominalInjury: '복부손상',
    pelvicInjury: '골반손상',
    limbInjury: '사지손상',
    burn: '화상',
    inhalationBurn: '흡입 화상',
    crushInjury: '압좌손상',
    hypothermia: '저체온',
    shock: '쇼크 의심',
    chemicalExposure: '화학작용제 노출',
    biologicalExposure: '생물학적 노출',
    radiationExposure: '방사선 노출',
    combatStress: '전투 스트레스',
  };
  if (parsed.injuries) {
    for (const [key, value] of Object.entries(parsed.injuries)) {
      if (key === 'burnPercent') {
        if (typeof value === 'number') lines.push(`화상 ${value}%`);
        continue;
      }
      if (value === true && injuryLabels[key]) lines.push(injuryLabels[key]);
    }
  }

  const treatmentLabels: Record<string, string> = {
    firstAidComplete: '응급처치 완료',
    bleedingControlled: '지혈 완료',
    airwaySecured: '기도 확보',
    chestDecompressed: '흉부 감압',
    fluidOrBloodNeeded: '수액/수혈 필요',
    analgesiaNeeded: '진통 필요',
    decontaminationNeeded: '제독 필요',
    isolationNeeded: '격리 필요',
  };
  if (parsed.treatments) {
    for (const [key, value] of Object.entries(parsed.treatments)) {
      if (value === true && treatmentLabels[key]) lines.push(treatmentLabels[key]);
    }
  }
  return lines;
}

// ParsedCasualty -> Partial<Patient> patch. injuries / treatments 는 기존 값과 병합한다.
export function applyParsed(patient: Patient, parsed: ParsedCasualty): Partial<Patient> {
  const patch: Partial<Patient> = {};

  if (parsed.vitals) {
    if (parsed.vitals.respiratoryRate !== undefined) {
      patch.respiratoryRate = parsed.vitals.respiratoryRate;
      patch.breathing = parsed.vitals.respiratoryRate > 0;
    }
    if (parsed.vitals.spo2 !== undefined) patch.spo2 = parsed.vitals.spo2;
    if (parsed.vitals.pulse !== undefined) patch.pulse = parsed.vitals.pulse;
    if (parsed.vitals.systolicBp !== undefined) patch.systolicBp = parsed.vitals.systolicBp;
  }

  if (parsed.consciousness) patch.consciousness = parsed.consciousness;
  if (parsed.walking !== undefined) patch.walking = parsed.walking;
  if (parsed.breathing !== undefined) patch.breathing = parsed.breathing;

  if (parsed.injuries) {
    patch.injuries = { ...patient.injuries, ...parsed.injuries };
  }
  if (parsed.treatments) {
    patch.treatments = { ...patient.treatments, ...parsed.treatments };
  }

  return patch;
}
