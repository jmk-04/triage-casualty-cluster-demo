// 자연어 입력 모듈 - Vercel Serverless Function
// 엔드포인트: POST /api/parse-casualty
// 의무요원 무전 메시지(한국어 자연어)를 받아 Anthropic Messages API로 구조화한다.
// API 키는 process.env.ANTHROPIC_API_KEY 로 서버에서만 사용하며 브라우저에 노출되지 않는다.
//
// 키가 설정되지 않았거나 호출이 실패하면 503/502/422 와 에러 코드를 반환한다.
// 그 경우 프론트엔드(src/nlp/parseCasualty.ts)가 규칙 기반 폴백 파서로 자동 대체한다.

export const config = { runtime: 'edge' };

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `당신은 전장 의무 무전 메시지를 구조화하는 보조 도구입니다.
입력된 한국어 무전 메시지에서 환자 상태를 추출해, 아래 JSON 스키마와 정확히 일치하는
JSON 객체 하나만 출력하십시오. 설명 문장, 코드펜스(\`\`\`), 그 외 어떤 텍스트도 출력하지 마십시오.

스키마:
{
  "vitals": {
    "respiratoryRate": number,   // 분당 호흡수
    "spo2": number,              // 산소포화도 %
    "pulse": number,             // 분당 맥박
    "systolicBp": number         // 수축기 혈압 mmHg
  },
  "injuries": {
    "massiveHemorrhage": boolean,    // 대량출혈
    "tourniquetApplied": boolean,    // 지혈대 적용
    "airwayObstruction": boolean,    // 기도 폐쇄
    "tensionPneumothorax": boolean,  // 긴장성 기흉
    "penetratingTrauma": boolean,    // 관통상
    "gunshot": boolean,              // 총상
    "fragmentWound": boolean,        // 파편창
    "blastInjury": boolean,          // 폭발 손상
    "amputation": boolean,           // 절단
    "openFracture": boolean,         // 개방 골절
    "closedFracture": boolean,       // 폐쇄 골절
    "suspectedSpineInjury": boolean, // 척추손상 의심
    "headInjury": boolean,           // 두부손상
    "chestInjury": boolean,          // 흉부손상
    "abdominalInjury": boolean,      // 복부손상
    "pelvicInjury": boolean,         // 골반손상
    "limbInjury": boolean,           // 사지손상
    "burn": boolean,                 // 화상
    "burnPercent": number,           // 화상 면적 %
    "inhalationBurn": boolean,       // 흡입 화상
    "crushInjury": boolean,          // 압좌손상
    "hypothermia": boolean,          // 저체온
    "shock": boolean,                // 쇼크 의심
    "chemicalExposure": boolean,     // 화학작용제 노출
    "biologicalExposure": boolean,   // 생물학적 노출
    "radiationExposure": boolean,    // 방사선 노출
    "combatStress": boolean          // 전투 스트레스
  },
  "treatments": {
    "firstAidComplete": boolean,     // 응급처치 완료
    "bleedingControlled": boolean,   // 지혈 완료
    "airwaySecured": boolean,        // 기도 확보
    "fluidOrBloodNeeded": boolean,   // 수액/수혈 필요
    "analgesiaNeeded": boolean,      // 진통 필요
    "decontaminationNeeded": boolean,// 제독 필요
    "isolationNeeded": boolean       // 격리 필요
  },
  "consciousness": "명료" | "음성반응" | "통증반응" | "무반응",
  "walking": boolean,
  "breathing": boolean,
  "confidence": number              // 0~1, 추출 확신도
}

규칙:
- 메시지에서 명시적으로 언급되거나 강하게 시사된 필드만 포함하고, 나머지는 생략하십시오.
- 추측으로 값을 채우지 마십시오. 불확실하면 해당 필드를 생략하십시오.
- "지혈대"가 언급되면 injuries.tourniquetApplied 와 treatments.bleedingControlled 를 true 로 설정하십시오.
- "절단"이 언급되면 injuries.amputation 과 injuries.massiveHemorrhage 를 true 로 설정하십시오.
- confidence 는 메시지의 명확성에 따라 0~1 사이로 정직하게 매기십시오.`;

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

export default async function handler(req: Request): Promise<Response> {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // 키 미설정 - 프론트엔드가 폴백 파서로 대체한다.
    return json({ ok: false, error: 'no_api_key' }, 503);
  }

  let text = '';
  try {
    const body = (await req.json()) as { text?: unknown };
    text = typeof body.text === 'string' ? body.text : '';
  } catch {
    return json({ ok: false, error: 'invalid_request' }, 400);
  }
  if (!text.trim()) {
    return json({ ok: false, error: 'empty_text' }, 400);
  }

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text.slice(0, 800) }],
      }),
    });
  } catch {
    return json({ ok: false, error: 'network_error' }, 502);
  }

  if (!upstream.ok) {
    return json({ ok: false, error: `upstream_${upstream.status}` }, 502);
  }

  let raw = '';
  try {
    const data = (await upstream.json()) as { content?: AnthropicTextBlock[] };
    raw = (data.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
  } catch {
    return json({ ok: false, error: 'bad_upstream_response' }, 502);
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return json(
      {
        ok: true,
        parsed: {
          ...parsed,
          source: 'llm',
          rawText: text,
          confidence:
            typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        },
      },
      200,
    );
  } catch {
    return json({ ok: false, error: 'parse_failed' }, 422);
  }
}
