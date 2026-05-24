export type TriageCategory = 'IMMEDIATE' | 'DELAYED' | 'MINIMAL' | 'EXPECTANT';
export type Consciousness = '명료' | '음성반응' | '통증반응' | '무반응';
export type IncidentType =
  | '포격'
  | '드론 공격'
  | '폭발'
  | '화학작용제 의심'
  | '생물학적 오염 의심'
  | '방사능 노출 의심'
  | '대형 교통사고'
  | '건물 붕괴';
export type Weather = '맑음' | '비' | '폭우' | '안개';
export type TimeOfDay = '주간' | '야간';
export type RoadStatus = '정상' | '일부 차단' | '심각한 차단';
export type ThreatLevel = '낮음' | '보통' | '높음';
export type FacilityType =
  | 'UNIT_AID_STATION'
  | 'MILITARY_HOSPITAL'
  | 'CBRN_SPECIALTY_HOSPITAL'
  | 'CAPITAL_ARMED_FORCES_HOSPITAL';
export type TransportMode =
  | '일반 구급차'
  | '장갑구급차'
  | '헬기'
  | '현장처치 후 대기'
  | '부대 의무대 선처치 후 2차 후송'
  | '미배정';

export interface Point {
  x: number;
  y: number;
}

export interface ScenarioSettings {
  seed: number;
  incident: Point;
  incidentType: IncidentType;
  patientCount: number;
  timeOfDay: TimeOfDay;
  weather: Weather;
  roadStatus: RoadStatus;
  threatLevel: ThreatLevel;
  constructionMode: '자동 생성' | '비활성화' | '수동 활성화';
  roadBlockEvent: boolean;
  bridgeBlockEvent: boolean;
}

export interface InjuryProfile {
  massiveHemorrhage: boolean;
  tourniquetApplied: boolean;
  airwayObstruction: boolean;
  tensionPneumothorax: boolean;
  penetratingTrauma: boolean;
  gunshot: boolean;
  fragmentWound: boolean;
  blastInjury: boolean;
  amputation: boolean;
  openFracture: boolean;
  closedFracture: boolean;
  suspectedSpineInjury: boolean;
  headInjury: boolean;
  facialInjury: boolean;
  chestInjury: boolean;
  abdominalInjury: boolean;
  pelvicInjury: boolean;
  limbInjury: boolean;
  burn: boolean;
  burnPercent: number;
  inhalationBurn: boolean;
  crushInjury: boolean;
  hypothermia: boolean;
  shock: boolean;
  chemicalExposure: boolean;
  biologicalExposure: boolean;
  radiationExposure: boolean;
  combatStress: boolean;
}

export interface TreatmentState {
  firstAidComplete: boolean;
  bleedingControlled: boolean;
  airwaySecured: boolean;
  chestDecompressed: boolean;
  fluidOrBloodNeeded: boolean;
  analgesiaNeeded: boolean;
  decontaminationNeeded: boolean;
  isolationNeeded: boolean;
}

export interface MarchFlags {
  M: string;
  A: string;
  R: string;
  C: string;
  H: string;
}

export interface Patient {
  id: string;
  x: number;
  y: number;
  distanceFromIncident: number;
  foundAt: string;
  unitZone: string;
  consciousness: Consciousness;
  breathing: boolean;
  respiratoryRate: number;
  spo2: number;
  pulse: number;
  systolicBp: number;
  capillaryRefill: '정상' | '지연' | '매우 지연';
  temperature: number;
  walking: boolean;
  painScore: number;
  injuries: InjuryProfile;
  treatments: TreatmentState;
  triage: TriageCategory;
  marchFlags: MarchFlags;
  priority: number;
  clinicalReasons: string[];
  recommendedHospitalId?: string;
  recommendedTransport: TransportMode;
  route?: RoutePlan;
  recommendationReasons: string[];
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  x: number;
  y: number;
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  availableIcuBeds: number;
  operatingRooms: number;
  availableOperatingRooms: number;
  traumaTeams: number;
  availableTraumaTeams: number;
  bloodUnits: number;
  ctAvailable: boolean;
  mriAvailable: boolean;
  helicopterPad: boolean;
  decontaminationCapacity: number;
  isolationBeds: number;
  cbrnCapabilityScore: number;
  orthopedicCapabilityScore: number;
  neurosurgeryCapabilityScore: number;
  thoracicCapabilityScore: number;
  burnCapabilityScore: number;
  currentAssignedPatients: number;
  overloadStatus: '정상' | '주의' | '과부하';
  estimatedSaturationTime: string;
  notes: string;
}

export interface RoadNode extends Point {
  id: string;
  label: string;
}

export interface RoadEdge {
  id: string;
  name: string;
  from: string;
  to: string;
  type: 'main' | 'secondary' | 'tunnel' | 'bridge' | 'damaged';
  congestion: number;
  threat: number;
  mountain: boolean;
  construction: boolean;
  blocked: boolean;
  bridgeId?: string;
}

export interface RoutePlan {
  id: string;
  facilityId: string;
  transport: TransportMode;
  minutes: number;
  distanceKm: number;
  risk: '낮음' | '보통' | '높음';
  bottlenecks: string[];
  path: Point[];
  roadNames: string[];
  explanation: string[];
  alternatives: Array<{
    label: string;
    minutes: number;
    bottlenecks: string[];
    roadNames: string[];
    path: Point[];
  }>;
}

export interface TransportResources {
  ambulances: number;
  armoredAmbulances: number;
  helicopters: number;
  medics: number;
  firstAidKits: number;
  deconKits: number;
  bloodUnits: number;
}

export interface DashboardMetrics {
  totalPatients: number;
  counts: Record<TriageCategory, number>;
  overloadedFacilities: number;
  usedAmbulances: number;
  usedArmoredAmbulances: number;
  usedHelicopters: number;
  firstEvacuationComplete: number;
  allEvacuationComplete: number;
  topBottleneck: string;
  cbrnSuspected: number;
  surgeryNeeded: number;
  icuNeeded: number;
}

export interface SimulationResult {
  patients: Patient[];
  facilities: Facility[];
  resources: TransportResources;
  metrics: DashboardMetrics;
  roadEdges: RoadEdge[];
  selectedRoute?: RoutePlan;
  aiRecommendations: string[];
  routeDigest: string[];
}
