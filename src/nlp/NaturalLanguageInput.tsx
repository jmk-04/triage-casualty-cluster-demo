// 자연어 입력 모듈 - UI 컴포넌트
// PatientDetail 패널 안에서 사용한다. 자연어 한 줄을 입력받아 parseCasualty 로 해석하고,
// 사용자가 "적용" 버튼을 눌러야 기존 onUpdate 핸들러로 patch 가 반영된다 (Human-in-the-loop).
//
// === App.tsx 통합 방법 ===
// 1) App.tsx 상단 import 에 추가:
//      import { NaturalLanguageInput } from './nlp/NaturalLanguageInput';
// 2) PatientDetail 컴포넌트 안, <PanelTitle ... /> 바로 다음 줄에 추가:
//      <NaturalLanguageInput patient={patient} onUpdate={onUpdate} />
//    (PatientDetail 은 이미 patient 와 onUpdate 를 props 로 받고 있으므로 그대로 전달하면 된다.)

import { useState } from 'react';
import type { Patient } from '../types';
import type { ParsedCasualty } from './types';
import { parseCasualty } from './parseCasualty';
import { applyParsed, summarizeParsed } from './applyParsed';

export function NaturalLanguageInput({
  patient,
  onUpdate,
}: {
  patient: Patient;
  onUpdate: (patientId: string, patch: Partial<Patient>, detail: string) => void;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedCasualty | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleInterpret() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setParsed(null);
    try {
      const result = await parseCasualty(text);
      setParsed(result);
    } catch {
      setError('해석 중 오류가 발생했습니다. 다시 시도하거나 폼에서 직접 수정하세요.');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!parsed) return;
    const patch = applyParsed(patient, parsed);
    if (Object.keys(patch).length === 0) return;
    const sourceLabel = parsed.source === 'llm' ? 'AI 해석' : '규칙 기반 해석';
    onUpdate(patient.id, patch, `${sourceLabel} 적용`);
    setParsed(null);
    setText('');
  }

  const summary = parsed ? summarizeParsed(parsed) : [];

  return (
    <div className="nl-input rounded-md border border-command-line bg-black/20 p-3 text-xs">
      <p className="mb-2 font-semibold text-white">자연어 환자 보고 입력 (AI 해석)</p>
      <textarea
        className="control w-full"
        rows={2}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="예) 3번 환자 다리 절단, 지혈대 했고 의식 흐려짐, 출혈 심함, 호흡 30"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          className="secondary-button"
          onClick={handleInterpret}
          disabled={loading || !text.trim()}
        >
          {loading ? '해석 중...' : 'AI 해석'}
        </button>
        {parsed && (
          <button className="secondary-button" onClick={handleApply} disabled={summary.length === 0}>
            적용
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-rose-300">{error}</p>}

      {parsed && (
        <div className="mt-2 rounded border border-command-line bg-black/30 p-2">
          <p className="text-slate-300">
            {parsed.source === 'llm' ? 'LLM 해석' : '규칙 기반 해석(폴백)'} · 확신도{' '}
            {Math.round(parsed.confidence * 100)}%
          </p>
          {summary.length > 0 ? (
            <ul className="mt-1 list-disc pl-4 text-slate-200">
              {summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-amber-300">
              {parsed.notes ?? '인식된 항목이 없습니다. 문장을 더 구체적으로 입력하세요.'}
            </p>
          )}
          {summary.length > 0 && (
            <p className="mt-1 text-slate-400">
              내용을 확인한 뒤 [적용]을 누르면 분류·후송 경로·병원 배정이 재계산됩니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
