import {
  DashboardMetrics,
  Facility,
  FacilityType,
  InjuryProfile,
  MarchFlags,
  Patient,
  Point,
  RoadEdge,
  RoadNode,
  RoutePlan,
  ScenarioSettings,
  TransportMode,
  TransportResources,
  TriageCategory,
} from './types';

export const MAP_SIZE = { width: 920, height: 600 };

export const TRIAGE_LABELS: Record<TriageCategory, string> = {
  IMMEDIATE: '즉각처치환자',
  DELAYED: '지연처치환자',
  MINIMAL: '최소처치환자',
  EXPECTANT: '기대처치환자',
};

export const TRIAGE_COLORS: Record<TriageCategory, string> = {
  IMMEDIATE: '#ff5d5d',
  DELAYED: '#f6c653',
  MINIMAL: '#4ade80',
  EXPECTANT: '#1f2937',
};

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  UNIT_AID_STATION: '부대 의무대',
  MILITARY_HOSPITAL: '군병원',
  CBRN_SPECIALTY_HOSPITAL: '화생방 전문치료병원',
  CAPITAL_ARMED_FORCES_HOSPITAL: '국군수도병원',
};

export const DEFAULT_SETTINGS: ScenarioSettings = {
  seed: 20260524,
  incident: { x: 430, y: 312 },
  incidentType: '폭발',
  patientCount: 80,
  timeOfDay: '주간',
  weather: '비',
  roadStatus: '일부 차단',
  threatLevel: '보통',
  constructionMode: '자동 생성',
  roadBlockEvent: false,
  bridgeBlockEvent: false,
};

export const INITIAL_RESOURCES: TransportResources = {
  ambulances: 14,
  armoredAmbulances: 5,
  helicopters: 3,
  medics: 28,
  firstAidKits: 95,
  deconKits: 18,
  bloodUnits: 70,
};

export const ROAD_NODES: RoadNode[] = [
  { id: 'A_GATE', label: 'A부대 정문', x: 118, y: 132 },
  { id: 'A_SPLIT', label: '서측 분기점', x: 198, y: 176 },
  { id: 'NORTH_PASS', label: '북령 고개', x: 300, y: 184 },
  { id: 'BRIDGE_N', label: '교량 B-1', x: 386, y: 203 },
  { id: 'EAST_JCT', label: '동측 교차로', x: 512, y: 214 },
  { id: 'B_GATE', label: 'B부대 정문', x: 786, y: 126 },
  { id: 'H02_JCT', label: 'H-02 진입로', x: 666, y: 180 },
  { id: 'MID_WEST', label: '중앙 서측로', x: 244, y: 304 },
  { id: 'CCP_NODE', label: '환자집결지 접속로', x: 426, y: 318 },
  { id: 'BRIDGE_M', label: '교량 B-2', x: 430, y: 326 },
  { id: 'MID_EAST', label: '동부 보급로', x: 560, y: 324 },
  { id: 'C_GATE', label: 'C부대 정문', x: 786, y: 458 },
  { id: 'SOUTH_PASS', label: '남부 협곡 입구', x: 260, y: 438 },
  { id: 'TUNNEL_W', label: '협곡 터널 서측', x: 358, y: 456 },
  { id: 'BRIDGE_S', label: '교량 B-3', x: 430, y: 456 },
  { id: 'TUNNEL_E', label: '협곡 터널 동측', x: 538, y: 444 },
  { id: 'CAPITAL_JCT', label: '수도병원 분기', x: 704, y: 320 },
  { id: 'CBRN_JCT', label: '제독센터 분기', x: 610, y: 506 },
  { id: 'WEST_MED', label: '서부 의무축', x: 164, y: 350 },
  { id: 'NORTH_HOSP', label: '북부 병원축', x: 568, y: 112 },
];

const BASE_ROADS: Omit<RoadEdge, 'construction' | 'blocked' | 'congestion'>[] = [
  { id: 'R-01', name: '서측 주보급로', from: 'A_GATE', to: 'A_SPLIT', type: 'main', threat: 0.15, mountain: false },
  { id: 'R-02', name: '북령 간선도로', from: 'A_SPLIT', to: 'NORTH_PASS', type: 'main', threat: 0.22, mountain: true },
  { id: 'R-03', name: '북령 교량 접근로', from: 'NORTH_PASS', to: 'BRIDGE_N', type: 'secondary', threat: 0.28, mountain: true },
  { id: 'R-04', name: '교량 B-1 횡단', from: 'BRIDGE_N', to: 'EAST_JCT', type: 'bridge', threat: 0.26, mountain: false, bridgeId: 'B-1' },
  { id: 'R-05', name: '동측 병원 간선', from: 'EAST_JCT', to: 'H02_JCT', type: 'main', threat: 0.2, mountain: false },
  { id: 'R-06', name: 'B부대 북상도로', from: 'H02_JCT', to: 'B_GATE', type: 'secondary', threat: 0.12, mountain: false },
  { id: 'R-07', name: '중앙 집결지 보급로', from: 'A_SPLIT', to: 'MID_WEST', type: 'secondary', threat: 0.35, mountain: false },
  { id: 'R-08', name: '중앙 서측 접근로', from: 'MID_WEST', to: 'CCP_NODE', type: 'secondary', threat: 0.44, mountain: false },
  { id: 'R-09', name: '교량 B-2 횡단', from: 'CCP_NODE', to: 'MID_EAST', type: 'bridge', threat: 0.42, mountain: false, bridgeId: 'B-2' },
  { id: 'R-10', name: '동부 보급로', from: 'MID_EAST', to: 'CAPITAL_JCT', type: 'main', threat: 0.2, mountain: false },
  { id: 'R-11', name: 'C부대 순환도로', from: 'CAPITAL_JCT', to: 'C_GATE', type: 'main', threat: 0.16, mountain: false },
  { id: 'R-12', name: '서부 의무축', from: 'MID_WEST', to: 'WEST_MED', type: 'secondary', threat: 0.2, mountain: false },
  { id: 'R-13', name: '남부 협곡로', from: 'WEST_MED', to: 'SOUTH_PASS', type: 'secondary', threat: 0.3, mountain: true },
  { id: 'R-14', name: '협곡 터널 서측', from: 'SOUTH_PASS', to: 'TUNNEL_W', type: 'tunnel', threat: 0.33, mountain: true },
  { id: 'R-15', name: '교량 B-3 횡단', from: 'TUNNEL_W', to: 'TUNNEL_E', type: 'bridge', threat: 0.31, mountain: true, bridgeId: 'B-3' },
  { id: 'R-16', name: '협곡 터널 동측', from: 'TUNNEL_E', to: 'CBRN_JCT', type: 'tunnel', threat: 0.22, mountain: true },
  { id: 'R-17', name: '제독센터 연결로', from: 'CBRN_JCT', to: 'C_GATE', type: 'secondary', threat: 0.2, mountain: false },
  { id: 'R-18', name: '수도병원 고속축', from: 'MID_EAST', to: 'NORTH_HOSP', type: 'main', threat: 0.18, mountain: false },
  { id: 'R-19', name: '북부 병원 연결로', from: 'NORTH_HOSP', to: 'H02_JCT', type: 'main', threat: 0.12, mountain: false },
  { id: 'R-20', name: '전술 우회로', from: 'SOUTH_PASS', to: 'CCP_NODE', type: 'damaged', threat: 0.52, mountain: true },
  { id: 'R-21', name: '수도병원 진입로', from: 'CAPITAL_JCT', to: 'NORTH_HOSP', type: 'main', threat: 0.1, mountain: false },
  { id: 'R-22', name: 'CBRN 우회 보급로', from: 'MID_EAST', to: 'CBRN_JCT', type: 'secondary', threat: 0.24, mountain: false },
];

const BASE_FACILITIES: Facility[] = [
  {
    id: 'A_AID',
    name: 'A부대 의무대',
    type: 'UNIT_AID_STATION',
    x: 112,
    y: 102,
    totalBeds: 26,
    availableBeds: 17,
    icuBeds: 0,
    availableIcuBeds: 0,
    operatingRooms: 0,
    availableOperatingRooms: 0,
    traumaTeams: 1,
    availableTraumaTeams: 1,
    bloodUnits: 8,
    ctAvailable: false,
    mriAvailable: false,
    helicopterPad: false,
    decontaminationCapacity: 4,
    isolationBeds: 1,
    cbrnCapabilityScore: 20,
    orthopedicCapabilityScore: 30,
    neurosurgeryCapabilityScore: 10,
    thoracicCapabilityScore: 10,
    burnCapabilityScore: 15,
    currentAssignedPatients: 0,
    overloadStatus: '정상',
    estimatedSaturationTime: '60분 이상',
    notes: '경상자 안정화 및 후송 전 처치에 적합',
  },
  {
    id: 'B_AID',
    name: 'B부대 의무대',
    type: 'UNIT_AID_STATION',
    x: 790,
    y: 96,
    totalBeds: 22,
    availableBeds: 12,
    icuBeds: 0,
    availableIcuBeds: 0,
    operatingRooms: 0,
    availableOperatingRooms: 0,
    traumaTeams: 1,
    availableTraumaTeams: 1,
    bloodUnits: 5,
    ctAvailable: false,
    mriAvailable: false,
    helicopterPad: false,
    decontaminationCapacity: 2,
    isolationBeds: 0,
    cbrnCapabilityScore: 10,
    orthopedicCapabilityScore: 25,
    neurosurgeryCapabilityScore: 10,
    thoracicCapabilityScore: 10,
    burnCapabilityScore: 10,
    currentAssignedPatients: 0,
    overloadStatus: '정상',
    estimatedSaturationTime: '45분',
    notes: 'B부대 인근 경상자 분산 수용',
  },
  {
    id: 'C_AID',
    name: 'C부대 의무대',
    type: 'UNIT_AID_STATION',
    x: 786,
    y: 490,
    totalBeds: 24,
    availableBeds: 15,
    icuBeds: 0,
    availableIcuBeds: 0,
    operatingRooms: 0,
    availableOperatingRooms: 0,
    traumaTeams: 1,
    availableTraumaTeams: 1,
    bloodUnits: 6,
    ctAvailable: false,
    mriAvailable: false,
    helicopterPad: false,
    decontaminationCapacity: 5,
    isolationBeds: 1,
    cbrnCapabilityScore: 25,
    orthopedicCapabilityScore: 25,
    neurosurgeryCapabilityScore: 10,
    thoracicCapabilityScore: 10,
    burnCapabilityScore: 15,
    currentAssignedPatients: 0,
    overloadStatus: '정상',
    estimatedSaturationTime: '50분',
    notes: '남부 축 후송 전 안정화',
  },
  {
    id: 'H02',
    name: 'H-02 전방 군병원',
    type: 'MILITARY_HOSPITAL',
    x: 660,
    y: 154,
    totalBeds: 80,
    availableBeds: 38,
    icuBeds: 10,
    availableIcuBeds: 5,
    operatingRooms: 4,
    availableOperatingRooms: 2,
    traumaTeams: 4,
    availableTraumaTeams: 3,
    bloodUnits: 42,
    ctAvailable: true,
    mriAvailable: false,
    helicopterPad: true,
    decontaminationCapacity: 8,
    isolationBeds: 4,
    cbrnCapabilityScore: 45,
    orthopedicCapabilityScore: 78,
    neurosurgeryCapabilityScore: 48,
    thoracicCapabilityScore: 72,
    burnCapabilityScore: 48,
    currentAssignedPatients: 0,
    overloadStatus: '정상',
    estimatedSaturationTime: '90분',
    notes: '흉부/정형외과 외상 대응 가능',
  },
  {
    id: 'H05',
    name: 'H-05 기동 군병원',
    type: 'MILITARY_HOSPITAL',
    x: 178,
    y: 376,
    totalBeds: 64,
    availableBeds: 31,
    icuBeds: 6,
    availableIcuBeds: 3,
    operatingRooms: 3,
    availableOperatingRooms: 2,
    traumaTeams: 3,
    availableTraumaTeams: 2,
    bloodUnits: 28,
    ctAvailable: true,
    mriAvailable: false,
    helicopterPad: false,
    decontaminationCapacity: 6,
    isolationBeds: 2,
    cbrnCapabilityScore: 35,
    orthopedicCapabilityScore: 70,
    neurosurgeryCapabilityScore: 35,
    thoracicCapabilityScore: 52,
    burnCapabilityScore: 42,
    currentAssignedPatients: 0,
    overloadStatus: '정상',
    estimatedSaturationTime: '75분',
    notes: '서측 축 수술/입원 분산',
  },
  {
    id: 'CBRN01',
    name: '연합 화생방 전문치료병원',
    type: 'CBRN_SPECIALTY_HOSPITAL',
    x: 610,
    y: 532,
    totalBeds: 72,
    availableBeds: 34,
    icuBeds: 8,
    availableIcuBeds: 4,
    operatingRooms: 2,
    availableOperatingRooms: 1,
    traumaTeams: 3,
    availableTraumaTeams: 2,
    bloodUnits: 24,
    ctAvailable: true,
    mriAvailable: false,
    helicopterPad: true,
    decontaminationCapacity: 38,
    isolationBeds: 22,
    cbrnCapabilityScore: 95,
    orthopedicCapabilityScore: 45,
    neurosurgeryCapabilityScore: 30,
    thoracicCapabilityScore: 50,
    burnCapabilityScore: 70,
    currentAssignedPatients: 0,
    overloadStatus: '정상',
    estimatedSaturationTime: '100분',
    notes: '제독, 음압 격리, 독성물질 대응 키트 보유',
  },
  {
    id: 'CAPITAL',
    name: '국군수도병원',
    type: 'CAPITAL_ARMED_FORCES_HOSPITAL',
    x: 724,
    y: 304,
    totalBeds: 150,
    availableBeds: 54,
    icuBeds: 24,
    availableIcuBeds: 10,
    operatingRooms: 8,
    availableOperatingRooms: 4,
    traumaTeams: 7,
    availableTraumaTeams: 5,
    bloodUnits: 90,
    ctAvailable: true,
    mriAvailable: true,
    helicopterPad: true,
    decontaminationCapacity: 16,
    isolationBeds: 12,
    cbrnCapabilityScore: 70,
    orthopedicCapabilityScore: 92,
    neurosurgeryCapabilityScore: 95,
    thoracicCapabilityScore: 94,
    burnCapabilityScore: 86,
    currentAssignedPatients: 0,
    overloadStatus: '정상',
    estimatedSaturationTime: '120분 이상',
    notes: '복합 중증 외상, ICU, 전문외상팀 중심 후송지',
  },
];

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pxToKm(px: number): number {
  return px / 18;
}

export function getNode(id: string): RoadNode {
  const node = ROAD_NODES.find((candidate) => candidate.id === id);
  if (!node) {
    throw new Error(`Unknown road node: ${id}`);
  }
  return node;
}

export function getFacilities(): Facility[] {
  return BASE_FACILITIES.map((facility) => ({ ...facility }));
}

export function buildRoadEdges(settings: ScenarioSettings): RoadEdge[] {
  const roadStatusPenalty = settings.roadStatus === '정상' ? 0 : settings.roadStatus === '일부 차단' ? 0.14 : 0.28;
  return BASE_ROADS.map((road, index) => {
    const seeded = mulberry32(settings.seed + hashText(road.id) + index * 37);
    const autoConstruction =
      settings.constructionMode === '자동 생성' && seeded() < (settings.roadStatus === '정상' ? 0.1 : 0.24);
    const manualConstruction = settings.constructionMode === '수동 활성화' && ['R-04', 'R-09', 'R-20'].includes(road.id);
    const roadEventBlocked = settings.roadBlockEvent && ['R-08', 'R-10', 'R-20'].includes(road.id);
    const bridgeEventBlocked = settings.bridgeBlockEvent && road.bridgeId === 'B-2';
    const severeBlocked = settings.roadStatus === '심각한 차단' && ['R-09', 'R-14'].includes(road.id);
    const baseCongestion = 0.18 + seeded() * 0.45;
    return {
      ...road,
      congestion: clamp(baseCongestion + roadStatusPenalty + (autoConstruction || manualConstruction ? 0.18 : 0), 0, 0.95),
      construction: autoConstruction || manualConstruction,
      blocked: roadEventBlocked || bridgeEventBlocked || severeBlocked,
    };
  });
}

function casualtyClusterPoint(index: number, total: number, incident: Point, seed: number): Point {
  const random = mulberry32(seed + index * 7919);
  const angle = index * 2.399963 + random() * 0.34;
  const ring = Math.sqrt((index + 0.5) / Math.max(total, 1));
  const radius = clamp(15 + ring * 20 + (random() - 0.5) * 4, 15, 35);
  const jitter = (random() - 0.5) * 2.5;
  return {
    x: clamp(incident.x + Math.cos(angle) * (radius + jitter), 26, MAP_SIZE.width - 26),
    y: clamp(incident.y + Math.sin(angle) * (radius + jitter), 26, MAP_SIZE.height - 26),
  };
}

function makeInjuryProfile(settings: ScenarioSettings, random: () => number, severityBand: number): InjuryProfile {
  const isBlast = ['폭발', '포격', '드론 공격', '건물 붕괴'].includes(settings.incidentType);
  const isCbrn =
    settings.incidentType === '화학작용제 의심' ||
    settings.incidentType === '생물학적 오염 의심' ||
    settings.incidentType === '방사능 노출 의심';
  const isTraffic = settings.incidentType === '대형 교통사고';
  const serious = severityBand > 0.72;
  const moderate = severityBand > 0.42;

  return {
    massiveHemorrhage: random() < (serious ? 0.58 : moderate ? 0.22 : 0.06),
    tourniquetApplied: random() < 0.45,
    airwayObstruction: random() < (serious ? 0.2 : 0.05),
    tensionPneumothorax: random() < (serious || isBlast ? 0.22 : 0.04),
    penetratingTrauma: random() < (isBlast ? 0.34 : 0.1),
    gunshot: random() < (settings.incidentType === '드론 공격' || settings.incidentType === '포격' ? 0.12 : 0.04),
    fragmentWound: random() < (isBlast ? 0.56 : 0.18),
    blastInjury: random() < (isBlast ? 0.68 : 0.12),
    amputation: random() < (serious && isBlast ? 0.13 : 0.03),
    openFracture: random() < (serious || isTraffic ? 0.22 : 0.07),
    closedFracture: random() < (moderate || isTraffic ? 0.32 : 0.12),
    suspectedSpineInjury: random() < (isTraffic || settings.incidentType === '건물 붕괴' ? 0.16 : 0.06),
    headInjury: random() < (serious ? 0.28 : moderate ? 0.13 : 0.04),
    facialInjury: random() < (isBlast ? 0.18 : 0.07),
    chestInjury: random() < (serious || isBlast ? 0.34 : 0.09),
    abdominalInjury: random() < (serious ? 0.25 : 0.08),
    pelvicInjury: random() < (serious || isTraffic ? 0.18 : 0.04),
    limbInjury: random() < 0.62,
    burn: random() < (isBlast ? 0.26 : settings.incidentType === '건물 붕괴' ? 0.1 : 0.05),
    burnPercent: isBlast ? Math.round(random() * 34) : Math.round(random() * 12),
    inhalationBurn: random() < (isBlast && serious ? 0.18 : 0.03),
    crushInjury: random() < (settings.incidentType === '건물 붕괴' || isTraffic ? 0.24 : 0.06),
    hypothermia: random() < (settings.weather === '비' || settings.weather === '폭우' ? 0.18 : 0.06),
    shock: random() < (serious ? 0.48 : moderate ? 0.14 : 0.03),
    chemicalExposure: settings.incidentType === '화학작용제 의심' && random() < 0.7,
    biologicalExposure: settings.incidentType === '생물학적 오염 의심' && random() < 0.68,
    radiationExposure: settings.incidentType === '방사능 노출 의심' && random() < 0.62,
    combatStress: random() < 0.24,
  };
}

export function createPatients(settings: ScenarioSettings): Patient[] {
  const random = mulberry32(settings.seed + settings.patientCount * 13 + hashText(settings.incidentType));
  return Array.from({ length: settings.patientCount }, (_, index) => {
    const severityBand = random();
    const point = casualtyClusterPoint(index, settings.patientCount, settings.incident, settings.seed);
    const injuries = makeInjuryProfile(settings, random, severityBand);
    const serious = severityBand > 0.74;
    const moderate = severityBand > 0.42;
    const breathing = random() > (serious ? 0.06 : 0.01);
    const walking = !serious && random() < (moderate ? 0.32 : 0.78);
    const consciousness = serious
      ? random() < 0.22
        ? '무반응'
        : random() < 0.48
          ? '통증반응'
          : '음성반응'
      : moderate
        ? random() < 0.2
          ? '음성반응'
          : '명료'
        : '명료';

    const patient: Patient = {
      id: `P-${String(index + 1).padStart(3, '0')}`,
      x: point.x,
      y: point.y,
      distanceFromIncident: Math.round(distance(point, settings.incident) * 12),
      foundAt: `${String(8 + Math.floor(index / 18)).padStart(2, '0')}:${String((index * 3) % 60).padStart(2, '0')}`,
      unitZone: ['A구역', 'B구역', 'C구역', '도로축', '환자집결지'][index % 5],
      consciousness,
      breathing,
      respiratoryRate: breathing ? Math.round(12 + random() * 18 + (serious ? random() * 18 : 0)) : 0,
      spo2: Math.round(96 - (serious ? random() * 18 : moderate ? random() * 9 : random() * 4)),
      pulse: Math.round(72 + random() * 38 + (serious ? random() * 45 : 0)),
      systolicBp: Math.round(124 - (serious ? random() * 52 : moderate ? random() * 26 : random() * 10)),
      capillaryRefill: serious ? '매우 지연' : moderate && random() < 0.48 ? '지연' : '정상',
      temperature: Number((36.7 - (injuries.hypothermia ? random() * 2.6 : random() * 0.6)).toFixed(1)),
      walking,
      painScore: Math.round(random() * 4 + (serious ? 6 : moderate ? 4 : 1)),
      injuries,
      treatments: {
        firstAidComplete: random() < 0.38,
        bleedingControlled: !injuries.massiveHemorrhage || random() < 0.48,
        airwaySecured: !injuries.airwayObstruction || random() < 0.34,
        chestDecompressed: !injuries.tensionPneumothorax || random() < 0.2,
        fluidOrBloodNeeded: injuries.shock || injuries.massiveHemorrhage || serious,
        analgesiaNeeded: moderate || serious,
        decontaminationNeeded: injuries.chemicalExposure || injuries.biologicalExposure || injuries.radiationExposure,
        isolationNeeded: injuries.biologicalExposure || injuries.radiationExposure,
      },
      triage: 'MINIMAL',
      marchFlags: { M: '', A: '', R: '', C: '', H: '' },
      priority: 0,
      clinicalReasons: [],
      recommendedTransport: '미배정',
      recommendationReasons: [],
    };

    return applyTriage(patient);
  });
}

export function relocatePatientsToCluster(patients: Patient[], settings: ScenarioSettings): Patient[] {
  return patients.slice(0, settings.patientCount).map((patient, index) => {
    const point = casualtyClusterPoint(index, settings.patientCount, settings.incident, settings.seed);
    return {
      ...patient,
      x: point.x,
      y: point.y,
      distanceFromIncident: Math.round(distance(point, settings.incident) * 12),
    };
  });
}

export function applyTriage(patient: Patient): Patient {
  let clinicalScore = 0;
  const reasons: string[] = [];
  const add = (condition: boolean, points: number, reason: string) => {
    if (condition) {
      clinicalScore += points;
      reasons.push(reason);
    }
  };

  add(patient.consciousness === '무반응', 25, '의식 무반응');
  add(!patient.breathing, 42, '호흡 없음');
  add(patient.breathing && (patient.respiratoryRate < 8 || patient.respiratoryRate > 30), 20, `호흡수 ${patient.respiratoryRate}회/분`);
  add(patient.spo2 < 90, 15, `산소포화도 ${patient.spo2}%`);
  add(patient.systolicBp < 90, 25, `수축기혈압 ${patient.systolicBp}mmHg`);
  add(patient.pulse > 120, 10, `맥박 ${patient.pulse}회/분`);
  add(patient.injuries.massiveHemorrhage, 25, '대량출혈');
  add(patient.injuries.massiveHemorrhage && !patient.treatments.bleedingControlled, 15, '지혈 미완료');
  add(patient.injuries.chestInjury || patient.injuries.tensionPneumothorax, 20, '흉부손상/긴장성 기흉 의심');
  add(patient.injuries.headInjury && patient.consciousness !== '명료', 25, '두부손상과 의식저하');
  add(patient.injuries.abdominalInjury && patient.injuries.shock, 25, '복부손상과 쇼크 의심');
  add(patient.injuries.amputation || patient.injuries.pelvicInjury || patient.injuries.openFracture, 18, '절단/골반손상/개방성 골절');
  add(patient.injuries.burn && patient.injuries.burnPercent >= 20, 20, `화상 ${patient.injuries.burnPercent}%`);
  add(patient.injuries.inhalationBurn, 25, '흡입화상 의심');
  add(hasCbrn(patient), 20, 'CBRN 노출 의심');
  add(patient.walking, -20, '보행 가능');
  add(patient.treatments.firstAidComplete && patient.systolicBp >= 100 && patient.spo2 >= 92, -10, '응급처치 완료 및 활력 안정');

  const catastrophic =
    !patient.breathing ||
    (patient.consciousness === '무반응' && patient.injuries.headInjury && patient.systolicBp < 80) ||
    (patient.injuries.burn && patient.injuries.burnPercent >= 55 && patient.injuries.inhalationBurn);
  const noMajorInjury =
    !patient.injuries.massiveHemorrhage &&
    !patient.injuries.airwayObstruction &&
    !patient.injuries.tensionPneumothorax &&
    !patient.injuries.chestInjury &&
    !patient.injuries.abdominalInjury &&
    !patient.injuries.pelvicInjury &&
    !patient.injuries.headInjury &&
    !hasCbrn(patient);

  let triage: TriageCategory;
  if (catastrophic && clinicalScore >= 65) {
    triage = 'EXPECTANT';
    reasons.push('가용 자원 한계 상황에서 별도 관리 및 반복 재평가 필요');
  } else if (patient.walking && noMajorInjury && patient.systolicBp >= 100 && patient.spo2 >= 92 && patient.respiratoryRate <= 30) {
    triage = 'MINIMAL';
  } else if (clinicalScore >= 45 || patient.injuries.massiveHemorrhage || patient.systolicBp < 90 || patient.spo2 < 90) {
    triage = 'IMMEDIATE';
  } else if (clinicalScore >= 18 || needsSurgery(patient) || hasCbrn(patient)) {
    triage = 'DELAYED';
  } else {
    triage = 'MINIMAL';
  }

  const categoryBase = triage === 'IMMEDIATE' ? 1000 : triage === 'DELAYED' ? 620 : triage === 'MINIMAL' ? 240 : 120;
  return {
    ...patient,
    triage,
    priority: Math.max(1, Math.round(categoryBase + clinicalScore)),
    marchFlags: makeMarchFlags(patient),
    clinicalReasons: reasons.slice(0, 6),
  };
}

function makeMarchFlags(patient: Patient): MarchFlags {
  return {
    M: patient.injuries.massiveHemorrhage
      ? patient.treatments.bleedingControlled
        ? '대량출혈 있음, 지혈 처치됨'
        : '대량출혈 있음, 지혈 미완료'
      : '대량출혈 징후 없음',
    A: patient.injuries.airwayObstruction
      ? patient.treatments.airwaySecured
        ? '기도 폐쇄 의심, 기도 확보됨'
        : '기도 폐쇄 의심'
      : '기도 폐쇄 의심 없음',
    R: `${patient.breathing ? `호흡수 ${patient.respiratoryRate}회/분` : '호흡 없음'}${
      patient.injuries.chestInjury || patient.injuries.tensionPneumothorax ? ', 흉부손상 위험' : ''
    }`,
    C: `수축기혈압 ${patient.systolicBp}mmHg, 말초순환 ${patient.capillaryRefill}`,
    H: `${patient.injuries.hypothermia ? '저체온 위험' : '체온 유지 필요'}${
      patient.injuries.headInjury ? ', 두부손상 의심' : ''
    }`,
  };
}

export function hasCbrn(patient: Patient): boolean {
  return patient.injuries.chemicalExposure || patient.injuries.biologicalExposure || patient.injuries.radiationExposure;
}

export function needsSurgery(patient: Patient): boolean {
  return (
    patient.injuries.massiveHemorrhage ||
    patient.injuries.tensionPneumothorax ||
    patient.injuries.chestInjury ||
    patient.injuries.abdominalInjury ||
    patient.injuries.pelvicInjury ||
    patient.injuries.amputation ||
    patient.injuries.openFracture ||
    patient.injuries.crushInjury
  );
}

export function needsIcu(patient: Patient): boolean {
  return patient.triage === 'IMMEDIATE' || patient.spo2 < 90 || patient.systolicBp < 90 || patient.consciousness === '무반응';
}

function nearestNode(point: Point): RoadNode {
  return ROAD_NODES.reduce((best, node) => (distance(point, node) < distance(point, best) ? node : best), ROAD_NODES[0]);
}

function edgeSpeed(edge: RoadEdge, transport: TransportMode): number {
  const base = edge.type === 'main' ? 58 : edge.type === 'secondary' ? 38 : edge.type === 'tunnel' ? 42 : edge.type === 'bridge' ? 30 : 24;
  if (transport === '장갑구급차') {
    return base * 0.88;
  }
  return base;
}

function weatherGroundPenalty(settings: ScenarioSettings): number {
  const weather = settings.weather === '맑음' ? 1 : settings.weather === '비' ? 1.1 : settings.weather === '폭우' ? 1.36 : 1.24;
  const night = settings.timeOfDay === '야간' ? 1.14 : 1;
  return weather * night;
}

function threatPenalty(edge: RoadEdge, settings: ScenarioSettings, transport: TransportMode): number {
  const threatWeight = settings.threatLevel === '낮음' ? 0.22 : settings.threatLevel === '보통' ? 0.55 : 0.9;
  const protection = transport === '장갑구급차' ? 0.62 : 1;
  return 1 + edge.threat * threatWeight * protection;
}

function edgeCost(edge: RoadEdge, settings: ScenarioSettings, transport: TransportMode): number {
  if (edge.blocked) {
    return Number.POSITIVE_INFINITY;
  }
  const from = getNode(edge.from);
  const to = getNode(edge.to);
  const lengthKm = pxToKm(distance(from, to));
  const minutes = (lengthKm / edgeSpeed(edge, transport)) * 60;
  const mountainPenalty = edge.mountain && transport !== '헬기' ? 1.42 : 1;
  const constructionPenalty = edge.construction ? 1.42 : 1;
  const congestionPenalty = 1 + edge.congestion * 0.72;
  return minutes * mountainPenalty * constructionPenalty * congestionPenalty * weatherGroundPenalty(settings) * threatPenalty(edge, settings, transport);
}

function getEdgesForNode(nodeId: string, edges: RoadEdge[], disabledEdgeIds: Set<string>): RoadEdge[] {
  return edges.filter((edge) => !disabledEdgeIds.has(edge.id) && (edge.from === nodeId || edge.to === nodeId));
}

function otherNode(edge: RoadEdge, nodeId: string): string {
  return edge.from === nodeId ? edge.to : edge.from;
}

function dijkstra(
  startId: string,
  endId: string,
  edges: RoadEdge[],
  settings: ScenarioSettings,
  transport: TransportMode,
  disabledEdgeIds = new Set<string>(),
): { nodeIds: string[]; edgeIds: string[]; minutes: number } {
  const distances = new Map<string, number>();
  const previousNode = new Map<string, string>();
  const previousEdge = new Map<string, string>();
  const unvisited = new Set(ROAD_NODES.map((node) => node.id));

  ROAD_NODES.forEach((node) => distances.set(node.id, Number.POSITIVE_INFINITY));
  distances.set(startId, 0);

  while (unvisited.size > 0) {
    const current = [...unvisited].reduce((best, nodeId) => {
      const currentDistance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      const bestDistance = distances.get(best) ?? Number.POSITIVE_INFINITY;
      return currentDistance < bestDistance ? nodeId : best;
    }, [...unvisited][0]);

    if (current === endId || (distances.get(current) ?? Number.POSITIVE_INFINITY) === Number.POSITIVE_INFINITY) {
      break;
    }
    unvisited.delete(current);

    getEdgesForNode(current, edges, disabledEdgeIds).forEach((edge) => {
      const neighbor = otherNode(edge, current);
      if (!unvisited.has(neighbor)) {
        return;
      }
      const nextDistance = (distances.get(current) ?? Number.POSITIVE_INFINITY) + edgeCost(edge, settings, transport);
      if (nextDistance < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor, nextDistance);
        previousNode.set(neighbor, current);
        previousEdge.set(neighbor, edge.id);
      }
    });
  }

  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  let cursor = endId;
  if (!previousNode.has(cursor) && cursor !== startId) {
    return { nodeIds: [startId, endId], edgeIds: [], minutes: Number.POSITIVE_INFINITY };
  }
  while (cursor) {
    nodeIds.unshift(cursor);
    const edgeId = previousEdge.get(cursor);
    if (edgeId) {
      edgeIds.unshift(edgeId);
    }
    const previous = previousNode.get(cursor);
    if (!previous) {
      break;
    }
    cursor = previous;
  }

  return { nodeIds, edgeIds, minutes: distances.get(endId) ?? Number.POSITIVE_INFINITY };
}

function routeBottlenecks(routeEdges: RoadEdge[], settings: ScenarioSettings): string[] {
  const bottlenecks: string[] = [];
  routeEdges.forEach((edge) => {
    if (edge.construction) bottlenecks.push(`${edge.name} 공사/통제`);
    if (edge.type === 'bridge') bottlenecks.push(`${edge.bridgeId ?? edge.name} 교량 통과`);
    if (edge.mountain) bottlenecks.push(`${edge.name} 산악/협곡 구간`);
    if (edge.congestion > 0.64) bottlenecks.push(`${edge.name} 혼잡`);
    if (settings.threatLevel === '높음' && edge.threat > 0.35) bottlenecks.push(`${edge.name} 위협 노출`);
  });
  if (settings.weather !== '맑음') bottlenecks.push(`${settings.weather} 기상 패널티`);
  if (settings.timeOfDay === '야간') bottlenecks.push('야간 운용 패널티');
  return [...new Set(bottlenecks)].slice(0, 5);
}

function routeRisk(routeEdges: RoadEdge[], settings: ScenarioSettings): '낮음' | '보통' | '높음' {
  const exposure = routeEdges.reduce((sum, edge) => sum + edge.threat + edge.congestion * 0.35 + (edge.construction ? 0.18 : 0), 0);
  const multiplier = settings.threatLevel === '높음' ? 1.35 : settings.threatLevel === '보통' ? 1 : 0.72;
  const value = (exposure / Math.max(routeEdges.length, 1)) * multiplier;
  if (value > 0.72) return '높음';
  if (value > 0.38) return '보통';
  return '낮음';
}

export function calculateGroundRoute(
  origin: Point,
  facility: Facility,
  settings: ScenarioSettings,
  edges: RoadEdge[],
  transport: TransportMode,
  disabledEdgeIds = new Set<string>(),
): RoutePlan {
  const start = nearestNode(origin);
  const end = nearestNode(facility);
  const result = dijkstra(start.id, end.id, edges, settings, transport, disabledEdgeIds);
  const routeEdges = result.edgeIds.map((edgeId) => edges.find((edge) => edge.id === edgeId)).filter((edge): edge is RoadEdge => Boolean(edge));
  const nodePoints = result.nodeIds.map((nodeId) => getNode(nodeId));
  const connectorKm = pxToKm(distance(origin, start) + distance(facility, end));
  const connectorMinutes = (connectorKm / 24) * 60 * weatherGroundPenalty(settings);
  const minutes = result.minutes === Number.POSITIVE_INFINITY ? 999 : Math.round(result.minutes + connectorMinutes);
  const bottlenecks = routeBottlenecks(routeEdges, settings);
  const roadNames = [...new Set(routeEdges.map((edge) => edge.name))];
  const alternatives = buildAlternatives(origin, facility, settings, edges, transport, result.edgeIds);

  return {
    id: `${facility.id}-${transport}-${roadNames.join('-')}`,
    facilityId: facility.id,
    transport,
    minutes,
    distanceKm: Number((pxToKm(distance(origin, facility)) * (1 + routeEdges.length * 0.045)).toFixed(1)),
    risk: routeRisk(routeEdges, settings),
    bottlenecks,
    path: [origin, ...nodePoints, facility],
    roadNames,
    explanation: [
      `${TRIAGE_ROUTE_TRANSPORT_COPY[transport] ?? transport} 기준으로 환자집결지에서 ${facility.name}까지 계산`,
      roadNames.length > 0 ? `권장 도로축: ${roadNames.slice(0, 4).join(' → ')}` : '직접 접근 가능한 도로축이 제한되어 우회 필요',
      bottlenecks.length > 0 ? `반영 요소: ${bottlenecks.slice(0, 3).join(', ')}` : '차단 또는 주요 병목 없음',
    ],
    alternatives,
  };
}

function buildAlternatives(
  origin: Point,
  facility: Facility,
  settings: ScenarioSettings,
  edges: RoadEdge[],
  transport: TransportMode,
  usedEdgeIds: string[],
): RoutePlan['alternatives'] {
  return usedEdgeIds.slice(0, 2).flatMap((edgeId, index) => {
    const disabled = new Set<string>([edgeId]);
    const start = nearestNode(origin);
    const end = nearestNode(facility);
    const result = dijkstra(start.id, end.id, edges, settings, transport, disabled);
    if (!Number.isFinite(result.minutes) || result.edgeIds.length === 0) {
      return [];
    }
    const routeEdges = result.edgeIds.map((id) => edges.find((edge) => edge.id === id)).filter((edge): edge is RoadEdge => Boolean(edge));
    const nodePoints = result.nodeIds.map((nodeId) => getNode(nodeId));
    const connectorKm = pxToKm(distance(origin, start) + distance(facility, end));
    return [
      {
        label: `대체 경로 ${index + 1}`,
        minutes: Math.round(result.minutes + (connectorKm / 24) * 60 * weatherGroundPenalty(settings)),
        bottlenecks: routeBottlenecks(routeEdges, settings).slice(0, 3),
        roadNames: [...new Set(routeEdges.map((edge) => edge.name))],
        path: [origin, ...nodePoints, facility],
      },
    ];
  });
}

function calculateHelicopterRoute(origin: Point, facility: Facility, settings: ScenarioSettings): RoutePlan {
  const directKm = pxToKm(distance(origin, facility));
  const weatherPenalty = settings.weather === '맑음' ? 1 : settings.weather === '비' ? 1.18 : settings.weather === '폭우' ? 1.85 : 1.7;
  const nightPenalty = settings.timeOfDay === '야간' ? 1.22 : 1;
  const minutes = Math.round((directKm / 150) * 60 * weatherPenalty * nightPenalty + 8);
  const bottlenecks = [
    ...(settings.weather === '폭우' || settings.weather === '안개' ? [`${settings.weather} 헬기 운용 제한`] : []),
    ...(settings.timeOfDay === '야간' ? ['야간 착륙 위험'] : []),
    ...(facility.helicopterPad ? [] : ['목적지 헬기장 없음']),
  ];
  return {
    id: `${facility.id}-helicopter`,
    facilityId: facility.id,
    transport: '헬기',
    minutes,
    distanceKm: Number(directKm.toFixed(1)),
    risk: settings.weather === '폭우' || settings.weather === '안개' ? '높음' : settings.timeOfDay === '야간' ? '보통' : '낮음',
    bottlenecks,
    path: [origin, facility],
    roadNames: ['직선 항공 후송축'],
    explanation: [
      '도로 차단 영향을 줄이기 위해 직선 항공 후송축을 우선 검토',
      facility.helicopterPad ? `${facility.name} 헬기장 사용 가능` : '목적지 헬기장 부재로 착륙 후 지상 연계 필요',
      bottlenecks.length > 0 ? `운용 제한: ${bottlenecks.join(', ')}` : '기상과 시간대가 헬기 운용 가능 범위',
    ],
    alternatives: [],
  };
}

const TRIAGE_ROUTE_TRANSPORT_COPY: Partial<Record<TransportMode, string>> = {
  '일반 구급차': '일반 구급차',
  '장갑구급차': '장갑구급차',
  '헬기': '헬기',
};

function hasHelicopterWeather(settings: ScenarioSettings): boolean {
  return settings.weather !== '폭우' && settings.weather !== '안개';
}

function chooseTransportAndRoute(
  patient: Patient,
  facility: Facility,
  settings: ScenarioSettings,
  edges: RoadEdge[],
  resourcesUsed: { ambulances: number; armoredAmbulances: number; helicopters: number },
): RoutePlan {
  if (patient.triage === 'MINIMAL' && facility.type === 'UNIT_AID_STATION') {
    return calculateGroundRoute(settings.incident, facility, settings, edges, '부대 의무대 선처치 후 2차 후송');
  }

  const needsProtectedRoute = settings.threatLevel === '높음' || hasDangerousRoute(settings.incident, facility, settings, edges);
  const groundTransport: TransportMode =
    needsProtectedRoute && resourcesUsed.armoredAmbulances < INITIAL_RESOURCES.armoredAmbulances ? '장갑구급차' : '일반 구급차';
  const groundRoute = calculateGroundRoute(settings.incident, facility, settings, edges, groundTransport);
  const severeLongDistance = patient.triage === 'IMMEDIATE' && (groundRoute.minutes > 38 || needsIcu(patient));

  if (
    severeLongDistance &&
    facility.helicopterPad &&
    hasHelicopterWeather(settings) &&
    resourcesUsed.helicopters < INITIAL_RESOURCES.helicopters
  ) {
    return calculateHelicopterRoute(settings.incident, facility, settings);
  }

  if (patient.triage === 'MINIMAL' && groundRoute.minutes > 28) {
    return {
      ...groundRoute,
      transport: '현장처치 후 대기',
      explanation: ['최소처치환자는 현장/환자집결지에서 처치 후 후송 자원 여유 발생 시 이동'],
    };
  }

  return groundRoute;
}

function hasDangerousRoute(origin: Point, facility: Facility, settings: ScenarioSettings, edges: RoadEdge[]): boolean {
  const route = calculateGroundRoute(origin, facility, settings, edges, '일반 구급차');
  return route.risk === '높음' || route.bottlenecks.some((item) => item.includes('위협') || item.includes('차단'));
}

function facilityCapabilityScore(patient: Patient, facility: Facility): number {
  let score = 0;
  if (patient.triage === 'MINIMAL' && facility.type === 'UNIT_AID_STATION') score += 45;
  if (patient.triage === 'IMMEDIATE' && facility.type !== 'UNIT_AID_STATION') score += 32;
  if (patient.triage === 'IMMEDIATE' && facility.type === 'CAPITAL_ARMED_FORCES_HOSPITAL') score += 18;
  if (patient.triage === 'DELAYED' && facility.type === 'MILITARY_HOSPITAL') score += 18;
  if (hasCbrn(patient)) score += facility.cbrnCapabilityScore * 0.68;
  if (patient.injuries.openFracture || patient.injuries.closedFracture || patient.injuries.amputation) {
    score += facility.orthopedicCapabilityScore * 0.25;
  }
  if (patient.injuries.headInjury) score += facility.neurosurgeryCapabilityScore * 0.28;
  if (patient.injuries.chestInjury || patient.injuries.tensionPneumothorax) score += facility.thoracicCapabilityScore * 0.3;
  if (patient.injuries.burn) score += facility.burnCapabilityScore * 0.28;
  if (needsSurgery(patient)) score += facility.availableOperatingRooms > 0 && facility.availableTraumaTeams > 0 ? 24 : -35;
  if (needsIcu(patient)) score += facility.availableIcuBeds > 0 ? 18 : -28;
  if (patient.treatments.fluidOrBloodNeeded) score += facility.bloodUnits > 12 ? 10 : -10;
  if (patient.injuries.headInjury && facility.ctAvailable) score += 8;
  if (facility.overloadStatus === '주의') score -= 20;
  if (facility.overloadStatus === '과부하') score -= 50;
  if (facility.availableBeds < 4) score -= 20;
  return score;
}

function recommendationReasons(patient: Patient, facility: Facility, route: RoutePlan): string[] {
  const reasons: string[] = [];
  if (patient.triage === 'MINIMAL') reasons.push('경상/보행 가능 환자는 가까운 의무대 또는 현장처치 우선');
  if (patient.triage === 'IMMEDIATE') reasons.push('즉각처치환자는 수술실, 외상팀, 혈액 보유 시설 우선');
  if (hasCbrn(patient)) reasons.push('CBRN 의심으로 제독/격리 역량을 우선 반영');
  if (needsIcu(patient)) reasons.push('ICU 필요 가능성이 있어 중환자 병상 가용성을 반영');
  if (needsSurgery(patient)) reasons.push('수술 필요 손상으로 수술실/외상팀 가용성 확인');
  reasons.push(`${route.roadNames.slice(0, 3).join(' → ')} 경로 기준 약 ${route.minutes}분`);
  if (route.bottlenecks.length > 0) reasons.push(`주요 병목: ${route.bottlenecks.slice(0, 2).join(', ')}`);
  if (facility.type === 'CAPITAL_ARMED_FORCES_HOSPITAL') reasons.push('국군수도병원은 복합 중증 외상 중심으로 제한 배정');
  return reasons.slice(0, 6);
}

function sortPatientsForAllocation(a: Patient, b: Patient): number {
  const order: Record<TriageCategory, number> = { IMMEDIATE: 0, DELAYED: 1, MINIMAL: 2, EXPECTANT: 3 };
  return order[a.triage] - order[b.triage] || b.priority - a.priority;
}

function updateFacilityAfterAssignment(facility: Facility, patient: Patient): Facility {
  const next = { ...facility };
  next.currentAssignedPatients += 1;
  next.availableBeds = Math.max(0, next.availableBeds - 1);
  if (needsIcu(patient)) next.availableIcuBeds = Math.max(0, next.availableIcuBeds - 1);
  if (needsSurgery(patient)) {
    next.availableOperatingRooms = Math.max(0, next.availableOperatingRooms - 1);
    next.availableTraumaTeams = Math.max(0, next.availableTraumaTeams - 1);
  }
  if (patient.treatments.fluidOrBloodNeeded) next.bloodUnits = Math.max(0, next.bloodUnits - 2);
  if (patient.treatments.decontaminationNeeded) next.decontaminationCapacity = Math.max(0, next.decontaminationCapacity - 1);
  if (patient.treatments.isolationNeeded) next.isolationBeds = Math.max(0, next.isolationBeds - 1);

  const bedPressure = next.availableBeds / Math.max(next.totalBeds, 1);
  const criticalPressure =
    (needsIcu(patient) && next.availableIcuBeds === 0) || (needsSurgery(patient) && next.availableOperatingRooms === 0);
  next.overloadStatus = criticalPressure || bedPressure < 0.06 ? '과부하' : bedPressure < 0.18 ? '주의' : '정상';
  next.estimatedSaturationTime = next.overloadStatus === '과부하' ? '즉시' : next.overloadStatus === '주의' ? '30분 이내' : '60분 이상';
  return next;
}

export function runSimulation(inputPatients: Patient[], settings: ScenarioSettings) {
  const edges = buildRoadEdges(settings);
  let facilities = getFacilities();
  const resourcesUsed = { ambulances: 0, armoredAmbulances: 0, helicopters: 0 };
  const relocated = relocatePatientsToCluster(inputPatients, settings).map(applyTriage);
  const allocated = relocated
    .slice()
    .sort(sortPatientsForAllocation)
    .map((patient, sortedIndex) => {
      let best:
        | {
            facility: Facility;
            route: RoutePlan;
            score: number;
          }
        | undefined;

      facilities.forEach((facility) => {
        const route = chooseTransportAndRoute(patient, facility, settings, edges, resourcesUsed);
        const travelPenalty = route.minutes * (patient.triage === 'IMMEDIATE' ? 1.35 : 0.75);
        const score = facilityCapabilityScore(patient, facility) - travelPenalty - facility.currentAssignedPatients * 2.4;
        if (!best || score > best.score) {
          best = { facility, route, score };
        }
      });

      if (!best) {
        return {
          ...patient,
          priority: sortedIndex + 1,
          recommendedTransport: '미배정' as TransportMode,
          recommendationReasons: ['배정 가능한 후송지 없음. 지휘관 판단과 현장 재평가 필요'],
        };
      }

      let route = best.route;
      if (route.transport === '헬기') resourcesUsed.helicopters += 1;
      if (route.transport === '장갑구급차') resourcesUsed.armoredAmbulances += 1;
      if (route.transport === '일반 구급차') resourcesUsed.ambulances += 1;

      if (route.transport === '일반 구급차' && resourcesUsed.ambulances > INITIAL_RESOURCES.ambulances) {
        route = { ...route, transport: '미배정', explanation: ['일반 구급차 부족으로 후송 대기'] };
      }
      if (route.transport === '장갑구급차' && resourcesUsed.armoredAmbulances > INITIAL_RESOURCES.armoredAmbulances) {
        route = { ...route, transport: '미배정', explanation: ['장갑구급차 부족으로 후송 대기'] };
      }
      if (route.transport === '헬기' && resourcesUsed.helicopters > INITIAL_RESOURCES.helicopters) {
        route = { ...route, transport: '미배정', explanation: ['헬기 부족으로 후송 대기'] };
      }

      facilities = facilities.map((facility) => (facility.id === best?.facility.id ? updateFacilityAfterAssignment(facility, patient) : facility));

      return {
        ...patient,
        priority: sortedIndex + 1,
        recommendedHospitalId: best.facility.id,
        recommendedTransport: route.transport,
        route,
        recommendationReasons: recommendationReasons(patient, best.facility, route),
      };
    });

  const patients = inputPatients.map((patient) => allocated.find((candidate) => candidate.id === patient.id)).filter((patient): patient is Patient => Boolean(patient));
  const metrics = buildMetrics(patients, facilities, resourcesUsed);
  const selectedRoute = patients.find((patient) => patient.route)?.route;
  return {
    patients,
    facilities,
    resources: {
      ...INITIAL_RESOURCES,
      ambulances: INITIAL_RESOURCES.ambulances - resourcesUsed.ambulances,
      armoredAmbulances: INITIAL_RESOURCES.armoredAmbulances - resourcesUsed.armoredAmbulances,
      helicopters: INITIAL_RESOURCES.helicopters - resourcesUsed.helicopters,
    },
    metrics,
    roadEdges: edges,
    selectedRoute,
    aiRecommendations: buildAiRecommendations(patients, facilities, metrics, settings),
    routeDigest: buildRouteDigest(patients),
  };
}

function buildMetrics(
  patients: Patient[],
  facilities: Facility[],
  resourcesUsed: { ambulances: number; armoredAmbulances: number; helicopters: number },
): DashboardMetrics {
  const counts: Record<TriageCategory, number> = { IMMEDIATE: 0, DELAYED: 0, MINIMAL: 0, EXPECTANT: 0 };
  patients.forEach((patient) => {
    counts[patient.triage] += 1;
  });
  const evacuationTimes = patients.map((patient) => patient.route?.minutes ?? 0).filter(Boolean);
  const bottlenecks = patients.flatMap((patient) => patient.route?.bottlenecks ?? []);
  const topBottleneck = bottlenecks.length > 0 ? mode(bottlenecks) : '주요 병목 없음';
  return {
    totalPatients: patients.length,
    counts,
    overloadedFacilities: facilities.filter((facility) => facility.overloadStatus !== '정상').length,
    usedAmbulances: Math.min(resourcesUsed.ambulances, INITIAL_RESOURCES.ambulances),
    usedArmoredAmbulances: Math.min(resourcesUsed.armoredAmbulances, INITIAL_RESOURCES.armoredAmbulances),
    usedHelicopters: Math.min(resourcesUsed.helicopters, INITIAL_RESOURCES.helicopters),
    firstEvacuationComplete: evacuationTimes.length > 0 ? Math.min(...evacuationTimes) : 0,
    allEvacuationComplete: evacuationTimes.length > 0 ? Math.max(...evacuationTimes) + Math.ceil(patients.length / 8) * 6 : 0,
    topBottleneck,
    cbrnSuspected: patients.filter(hasCbrn).length,
    surgeryNeeded: patients.filter(needsSurgery).length,
    icuNeeded: patients.filter(needsIcu).length,
  };
}

function mode(values: string[]): string {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '주요 병목 없음';
}

function buildAiRecommendations(patients: Patient[], facilities: Facility[], metrics: DashboardMetrics, settings: ScenarioSettings): string[] {
  const immediate = patients.filter((patient) => patient.triage === 'IMMEDIATE');
  const cbrn = patients.filter(hasCbrn);
  const overloaded = facilities.filter((facility) => facility.overloadStatus !== '정상');
  const capitalAssigned = patients.filter((patient) => patient.recommendedHospitalId === 'CAPITAL').length;
  const heliLimited = settings.weather === '폭우' || settings.weather === '안개';

  return [
    `현재 ${patients.length}명 중 즉각처치환자 ${metrics.counts.IMMEDIATE}명, 지연처치환자 ${metrics.counts.DELAYED}명, 최소처치환자 ${metrics.counts.MINIMAL}명, 기대처치환자 ${metrics.counts.EXPECTANT}명으로 분류되었습니다.`,
    immediate.length > 0
      ? `즉각처치환자 ${immediate.length}명은 수술실/외상팀/혈액 보유 시설로 우선 분산하고, 이동 시간이 긴 복합손상 환자만 국군수도병원에 제한 배정합니다.`
      : '즉각처치환자가 없어 의무대 안정화와 지연처치환자 분산 후송을 우선합니다.',
    `가장 큰 병목은 ${metrics.topBottleneck}입니다. 지도에서 강조된 권장 도로축과 대체 경로를 확인해 우회 여부를 판단하십시오.`,
    overloaded.length > 0
      ? `과부하 또는 주의 시설 ${overloaded.length}곳이 있어 후속 환자는 H-02/H-05/화생방 전문치료병원으로 분산하는 것이 권장됩니다.`
      : '현재 병원 과부하는 제한적이며, 중증도와 전문역량에 따라 분산 배정이 가능합니다.',
    cbrn.length > 0
      ? `CBRN 의심 환자 ${cbrn.length}명은 제독/격리 가능 시설을 우선 배정하고, 일반 외상 환자와 동선을 분리하십시오.`
      : 'CBRN 의심 환자는 제한적입니다. 일반 외상 후송축을 우선 운용할 수 있습니다.',
    heliLimited
      ? `${settings.weather} 조건으로 헬기 사용은 제한적입니다. 장갑구급차와 교량 우회 경로를 우선 검토하십시오.`
      : `헬기 운용 가능 조건입니다. 장거리 중증 환자와 전문치료 필요 환자에 우선 배정하십시오.`,
    `국군수도병원 배정은 ${capitalAssigned}명으로 제한되어 있습니다. 모든 환자를 한 곳으로 집중시키지 않고 군병원/의무대/전문치료병원으로 분산했습니다.`,
  ];
}

function buildRouteDigest(patients: Patient[]): string[] {
  return patients
    .filter((patient) => patient.route)
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)
    .map((patient) => {
      const route = patient.route!;
      return `${patient.id}: ${TRIAGE_LABELS[patient.triage]} → ${route.roadNames.slice(0, 3).join(' / ')} → ${route.minutes}분`;
    });
}

export function summarizeInjuries(patient: Patient): string {
  const injuries = [
    patient.injuries.massiveHemorrhage && '대량출혈',
    patient.injuries.chestInjury && '흉부',
    patient.injuries.headInjury && '두부',
    patient.injuries.abdominalInjury && '복부',
    patient.injuries.openFracture && '개방골절',
    patient.injuries.burn && `화상 ${patient.injuries.burnPercent}%`,
    hasCbrn(patient) && 'CBRN',
    patient.injuries.combatStress && '패닉',
  ].filter(Boolean);
  return injuries.length > 0 ? injuries.join(', ') : '경상/관찰';
}

export function cloneWithEditedPatient(patients: Patient[], patientId: string, patch: Partial<Patient>): Patient[] {
  return patients.map((patient) => (patient.id === patientId ? applyTriage({ ...patient, ...patch }) : patient));
}
