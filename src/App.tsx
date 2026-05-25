import { useMemo, useRef, useState } from 'react';
import { NaturalLanguageInput } from './nlp/NaturalLanguageInput';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import {
  AlertTriangle,
  Ambulance,
  Ban,
  Building2,
  Crosshair,
  Filter,
  Hospital,
  MapPin,
  RefreshCw,
  Route,
  Search,
  Shield,
  SlidersHorizontal,
  Users,
  Waves,
} from 'lucide-react';
import {
  DEFAULT_SETTINGS,
  FACILITY_TYPE_LABELS,
  MAP_SIZE,
  ROAD_NODES,
  TRIAGE_COLORS,
  TRIAGE_LABELS,
  applyTriage,
  createPatients,
  hasCbrn,
  needsIcu,
  needsSurgery,
  relocatePatientsToCluster,
  runSimulation,
  summarizeInjuries,
} from './simulation';
import {
  Facility,
  FacilityType,
  IncidentType,
  Patient,
  Point,
  RoadEdge,
  ScenarioSettings,
  TriageCategory,
} from './types';

const INCIDENT_TYPES: IncidentType[] = [
  '포격',
  '드론 공격',
  '폭발',
  '화학작용제 의심',
  '생물학적 오염 의심',
  '방사능 노출 의심',
  '대형 교통사고',
  '건물 붕괴',
];

const PATIENT_COUNTS = [30, 50, 80, 100] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function routePoints(path: Point[]): string {
  return path.map((point) => `${point.x},${point.y}`).join(' ');
}

export default function App() {
  const [settings, setSettings] = useState<ScenarioSettings>(DEFAULT_SETTINGS);
  const [patients, setPatients] = useState<Patient[]>(() => createPatients(DEFAULT_SETTINGS));
  const [selectedPatientId, setSelectedPatientId] = useState('P-001');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('CAPITAL');
  const [search, setSearch] = useState('');
  const [triageFilter, setTriageFilter] = useState<TriageCategory | 'ALL'>('ALL');
  const [injuryFilter, setInjuryFilter] = useState('ALL');
  const [hospitalFilter, setHospitalFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('전체');
  const [showImmediateOnly, setShowImmediateOnly] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [showCbrnOnly, setShowCbrnOnly] = useState(false);
  const [showSurgeryOnly, setShowSurgeryOnly] = useState(false);
  const [changeLog, setChangeLog] = useState('환자 정보를 수정하면 재분류와 병원 매칭 결과가 이곳에 표시됩니다.');

  const simulation = useMemo(() => runSimulation(patients, settings), [patients, settings]);
  const selectedPatient = simulation.patients.find((patient) => patient.id === selectedPatientId) ?? simulation.patients[0];
  const selectedFacility =
    simulation.facilities.find((facility) => facility.id === selectedFacilityId) ??
    simulation.facilities.find((facility) => facility.id === selectedPatient?.recommendedHospitalId) ??
    simulation.facilities[0];
  const activeRoute =
    selectedPatient?.route ??
    simulation.patients.find((patient) => patient.recommendedHospitalId === selectedFacility?.id && patient.route)?.route ??
    simulation.selectedRoute;

  const filteredPatients = useMemo(() => {
    return simulation.patients.filter((patient) => {
      const matchesSearch = patient.id.toLowerCase().includes(search.toLowerCase().trim());
      const matchesTriage = triageFilter === 'ALL' || patient.triage === triageFilter;
      const matchesHospital = hospitalFilter === 'ALL' || patient.recommendedHospitalId === hospitalFilter;
      const injuryText = summarizeInjuries(patient);
      const matchesInjury = injuryFilter === 'ALL' || injuryText.includes(injuryFilter);
      const matchesImmediate = !showImmediateOnly || patient.triage === 'IMMEDIATE';
      const matchesUnassigned = !showUnassignedOnly || patient.recommendedTransport === '미배정';
      const matchesCbrn = !showCbrnOnly || hasCbrn(patient);
      const matchesSurgery = !showSurgeryOnly || needsSurgery(patient);
      return (
        matchesSearch &&
        matchesTriage &&
        matchesHospital &&
        matchesInjury &&
        matchesImmediate &&
        matchesUnassigned &&
        matchesCbrn &&
        matchesSurgery
      );
    });
  }, [
    hospitalFilter,
    injuryFilter,
    search,
    showCbrnOnly,
    showImmediateOnly,
    showSurgeryOnly,
    showUnassignedOnly,
    simulation.patients,
    triageFilter,
  ]);

  const filteredFacilities = useMemo(() => {
    return simulation.facilities.filter((facility) => {
      if (facilityFilter === '전체') return true;
      if (facilityFilter === '과부하 시설만') return facility.overloadStatus !== '정상';
      if (facilityFilter === '헬기장 보유') return facility.helicopterPad;
      if (facilityFilter === '수술 가능') return facility.availableOperatingRooms > 0;
      if (facilityFilter === 'CBRN 가능') return facility.cbrnCapabilityScore >= 60;
      return FACILITY_TYPE_LABELS[facility.type] === facilityFilter;
    });
  }, [facilityFilter, simulation.facilities]);

  function updateScenario(patch: Partial<ScenarioSettings>, regeneratePatients = false) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (regeneratePatients) {
      const nextPatients = createPatients(next);
      setPatients(nextPatients);
      setSelectedPatientId(nextPatients[0]?.id ?? '');
    }
  }

  function moveIncident(point: Point) {
    const next = {
      ...settings,
      incident: { x: clamp(point.x, 60, MAP_SIZE.width - 60), y: clamp(point.y, 70, MAP_SIZE.height - 70) },
    };
    setSettings(next);
    setPatients((current) => relocatePatientsToCluster(current, next));
  }

  function recalculate() {
    setPatients((current) => relocatePatientsToCluster(current.map(applyTriage), settings));
    setChangeLog('AI 재계산 완료: 환자집결지 기준으로 분류, 병원 매칭, 후송 경로를 다시 산출했습니다.');
  }

  function newScenario() {
    const next = {
      ...settings,
      seed: settings.seed + 97,
      incident: {
        x: clamp(360 + ((settings.seed * 17) % 160), 160, 760),
        y: clamp(250 + ((settings.seed * 29) % 120), 160, 500),
      },
    };
    setSettings(next);
    const nextPatients = createPatients(next);
    setPatients(nextPatients);
    setSelectedPatientId(nextPatients[0]?.id ?? '');
    setChangeLog('새 시나리오 생성 완료: 환자들은 새 사고 지점 주변의 환자집결지에 밀집 배치되었습니다.');
  }

  function updatePatient(patientId: string, patch: Partial<Patient>, detail: string) {
    const before = simulation.patients.find((patient) => patient.id === patientId);
    const base = patients.find((patient) => patient.id === patientId);
    if (!before || !base) return;
    const after = applyTriage({ ...base, ...patch });
    setPatients((current) => current.map((patient) => (patient.id === patientId ? after : patient)));
    const triageChange =
      before.triage !== after.triage
        ? `${TRIAGE_LABELS[before.triage]}에서 ${TRIAGE_LABELS[after.triage]}로 재분류되었습니다.`
        : `${TRIAGE_LABELS[after.triage]} 분류를 유지했습니다.`;
    setChangeLog(`${after.id}: ${detail} 변경으로 ${triageChange} 병원 매칭과 후송 경로가 즉시 재계산되었습니다.`);
  }

  function updatePatientInjury(patientId: string, key: keyof Patient['injuries'], value: boolean | number, detail: string) {
    const base = patients.find((patient) => patient.id === patientId);
    if (!base) return;
    updatePatient(patientId, { injuries: { ...base.injuries, [key]: value } }, detail);
  }

  return (
    <div className="min-h-screen bg-command-bg text-slate-100">
      <header className="border-b border-command-line bg-[#081613]/95 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-command-mint">Rule-Based AI Engine</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">AI 기반 대량전상자 전장 의료 후송 및 자원 최적화 플랫폼</h1>
          </div>
          <div className="max-w-3xl text-right text-xs leading-5 text-slate-300">
            본 시스템은 의무요원과 지휘관의 판단을 보조하는 의사결정 지원 도구입니다. 모든 위치, 병원, 부대, 환자 정보는
            가상 데이터이며 실제 군 작전·의무 교범 또는 비공개 절차를 대체하지 않습니다.
          </div>
        </div>
      </header>

      <main className="space-y-4 p-4">
        <Dashboard metrics={simulation.metrics} />

        <section className="grid grid-cols-[320px_minmax(620px,1fr)_400px] items-start gap-4">
          <aside className="space-y-4">
            <ScenarioPanel
              settings={settings}
              onChange={updateScenario}
              onRecalculate={recalculate}
              onNewScenario={newScenario}
              onResetPatients={() => {
                const reset = createPatients(settings);
                setPatients(reset);
                setSelectedPatientId(reset[0]?.id ?? '');
                setChangeLog('환자 데이터가 현재 시나리오 기준으로 초기화되었습니다.');
              }}
            />
            <FacilityResources
              facilities={filteredFacilities}
              filter={facilityFilter}
              onFilter={setFacilityFilter}
              onSelect={setSelectedFacilityId}
              selectedFacilityId={selectedFacility?.id}
            />
          </aside>

          <div className="space-y-4">
            <TacticalMap
              settings={settings}
              roads={simulation.roadEdges}
              patients={simulation.patients}
              facilities={simulation.facilities}
              selectedPatient={selectedPatient}
              selectedFacility={selectedFacility}
              activeRoute={activeRoute}
              onMoveIncident={moveIncident}
              onSelectPatient={setSelectedPatientId}
              onSelectFacility={setSelectedFacilityId}
            />
            <PatientTable
              patients={filteredPatients}
              facilities={simulation.facilities}
              selectedPatientId={selectedPatient?.id}
              search={search}
              triageFilter={triageFilter}
              injuryFilter={injuryFilter}
              hospitalFilter={hospitalFilter}
              showImmediateOnly={showImmediateOnly}
              showUnassignedOnly={showUnassignedOnly}
              showCbrnOnly={showCbrnOnly}
              showSurgeryOnly={showSurgeryOnly}
              onSearch={setSearch}
              onTriageFilter={setTriageFilter}
              onInjuryFilter={setInjuryFilter}
              onHospitalFilter={setHospitalFilter}
              onImmediateOnly={setShowImmediateOnly}
              onUnassignedOnly={setShowUnassignedOnly}
              onCbrnOnly={setShowCbrnOnly}
              onSurgeryOnly={setShowSurgeryOnly}
              onSelect={setSelectedPatientId}
            />
          </div>

          <aside className="space-y-4">
            <PatientDetail patient={selectedPatient} facility={selectedFacility} onUpdate={updatePatient} onUpdateInjury={updatePatientInjury} />
            <FacilityDetail facility={selectedFacility} selectedPatient={selectedPatient} />
            <AIRecommendations recommendations={simulation.aiRecommendations} changeLog={changeLog} routeDigest={simulation.routeDigest} />
          </aside>
        </section>
      </main>
    </div>
  );
}

function Dashboard({ metrics }: { metrics: ReturnType<typeof runSimulation>['metrics'] }) {
  const items = [
    ['총 환자', metrics.totalPatients, Users],
    ['즉각처치', metrics.counts.IMMEDIATE, AlertTriangle],
    ['지연처치', metrics.counts.DELAYED, Shield],
    ['최소처치', metrics.counts.MINIMAL, Users],
    ['기대처치', metrics.counts.EXPECTANT, Ban],
    ['과부하 시설', metrics.overloadedFacilities, Hospital],
    ['구급차 사용', `${metrics.usedAmbulances}`, Ambulance],
    ['장갑구급차 사용', `${metrics.usedArmoredAmbulances}`, Shield],
    ['헬기 사용', `${metrics.usedHelicopters}`, Route],
    ['첫 후송 완료', `${metrics.firstEvacuationComplete}분`, Route],
    ['전체 완료 예상', `${metrics.allEvacuationComplete}분`, Route],
    ['CBRN 의심', metrics.cbrnSuspected, AlertTriangle],
    ['수술 필요', metrics.surgeryNeeded, Hospital],
    ['ICU 필요', metrics.icuNeeded, Hospital],
  ] as const;

  return (
    <section className="grid grid-cols-7 gap-3">
      {items.map(([label, value, Icon]) => (
        <div key={label} className="panel metric-tile">
          <div className="flex items-center justify-between text-slate-400">
            <span>{label}</span>
            <Icon size={15} />
          </div>
          <strong className="mt-1 block text-xl text-white">{value}</strong>
        </div>
      ))}
      <div className="panel col-span-7 flex items-center gap-3 border-command-amber/40 bg-[#171508] text-sm text-amber-100">
        <AlertTriangle size={17} />
        <span>가장 위험한 병목 요소: {metrics.topBottleneck}</span>
      </div>
    </section>
  );
}

function ScenarioPanel({
  settings,
  onChange,
  onRecalculate,
  onNewScenario,
  onResetPatients,
}: {
  settings: ScenarioSettings;
  onChange: (patch: Partial<ScenarioSettings>, regeneratePatients?: boolean) => void;
  onRecalculate: () => void;
  onNewScenario: () => void;
  onResetPatients: () => void;
}) {
  return (
    <aside className="panel space-y-4">
      <PanelTitle icon={<SlidersHorizontal size={16} />} title="시나리오 제어" />
      <SelectRow
        label="사고 유형"
        value={settings.incidentType}
        options={INCIDENT_TYPES}
        onChange={(value) => onChange({ incidentType: value as IncidentType }, true)}
      />
      <SelectRow
        label="환자 수"
        value={String(settings.patientCount)}
        options={PATIENT_COUNTS.map(String)}
        onChange={(value) => onChange({ patientCount: Number(value) as ScenarioSettings['patientCount'] }, true)}
      />
      <SelectRow label="시간대" value={settings.timeOfDay} options={['주간', '야간']} onChange={(value) => onChange({ timeOfDay: value as ScenarioSettings['timeOfDay'] })} />
      <SelectRow label="기상" value={settings.weather} options={['맑음', '비', '폭우', '안개']} onChange={(value) => onChange({ weather: value as ScenarioSettings['weather'] })} />
      <SelectRow label="도로 상태" value={settings.roadStatus} options={['정상', '일부 차단', '심각한 차단']} onChange={(value) => onChange({ roadStatus: value as ScenarioSettings['roadStatus'] })} />
      <SelectRow label="적 위협도" value={settings.threatLevel} options={['낮음', '보통', '높음']} onChange={(value) => onChange({ threatLevel: value as ScenarioSettings['threatLevel'] })} />
      <SelectRow
        label="공사/차단 이벤트"
        value={settings.constructionMode}
        options={['자동 생성', '수동 활성화', '비활성화']}
        onChange={(value) => onChange({ constructionMode: value as ScenarioSettings['constructionMode'] })}
      />
      <div className="grid grid-cols-2 gap-2">
        <ActionButton icon={<RefreshCw size={15} />} label="AI 재계산" onClick={onRecalculate} />
        <ActionButton icon={<Crosshair size={15} />} label="새 시나리오" onClick={onNewScenario} />
        <ActionButton icon={<Ban size={15} />} label="도로 차단" onClick={() => onChange({ roadBlockEvent: !settings.roadBlockEvent })} active={settings.roadBlockEvent} />
        <ActionButton icon={<Waves size={15} />} label="교량 차단" onClick={() => onChange({ bridgeBlockEvent: !settings.bridgeBlockEvent })} active={settings.bridgeBlockEvent} />
      </div>
      <button className="secondary-button w-full" onClick={onResetPatients}>
        환자 데이터 초기화
      </button>
      <div className="rounded-md border border-command-line bg-black/20 p-3 text-xs leading-5 text-slate-300">
        사고 지점 좌표 {Math.round(settings.incident.x)}, {Math.round(settings.incident.y)} / 환자집결지 반경 15~35px
      </div>
    </aside>
  );
}

function TacticalMap({
  settings,
  roads,
  patients,
  facilities,
  selectedPatient,
  selectedFacility,
  activeRoute,
  onMoveIncident,
  onSelectPatient,
  onSelectFacility,
}: {
  settings: ScenarioSettings;
  roads: RoadEdge[];
  patients: Patient[];
  facilities: Facility[];
  selectedPatient?: Patient;
  selectedFacility?: Facility;
  activeRoute?: Patient['route'];
  onMoveIncident: (point: Point) => void;
  onSelectPatient: (patientId: string) => void;
  onSelectFacility: (facilityId: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function pointerToSvg(event: PointerEvent<SVGSVGElement> | MouseEvent<SVGSVGElement>): Point {
    const svg = svgRef.current;
    if (!svg) return settings.incident;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * MAP_SIZE.width,
      y: ((event.clientY - rect.top) / rect.height) * MAP_SIZE.height,
    };
  }

  function roadStyle(edge: RoadEdge) {
    if (edge.blocked) return { stroke: '#ef4444', width: 4.2, dash: '7 5', opacity: 0.82 };
    if (edge.construction) return { stroke: '#eab308', width: 3.6, dash: '8 4', opacity: 0.72 };
    if (edge.type === 'main') return { stroke: '#8bb8a5', width: 3.2, dash: '', opacity: 0.46 };
    if (edge.type === 'bridge') return { stroke: '#67d3ff', width: 3.7, dash: '', opacity: 0.62 };
    if (edge.type === 'tunnel') return { stroke: '#a78bfa', width: 3, dash: '4 4', opacity: 0.56 };
    if (edge.type === 'damaged') return { stroke: '#b77b4b', width: 2.7, dash: '6 5', opacity: 0.56 };
    return { stroke: '#6b8f85', width: 2.2, dash: '', opacity: 0.4 };
  }

  return (
    <section className="panel map-panel">
      <div className="mb-3 flex items-center justify-between">
        <PanelTitle icon={<MapPin size={16} />} title="가상 전술 지도" />
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="legend-dot bg-[#8bb8a5]" /> 주도로
          <span className="legend-dot bg-[#67d3ff]" /> 교량
          <span className="legend-dot bg-[#eab308]" /> 공사
          <span className="legend-dot bg-[#ef4444]" /> 차단
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`}
        className="tactical-map"
        onPointerMove={(event) => {
          if (dragging) onMoveIncident(pointerToSvg(event));
        }}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        onDoubleClick={(event) => onMoveIncident(pointerToSvg(event))}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#1b342f" strokeWidth="0.6" opacity="0.55" />
          </pattern>
        </defs>
        <rect width={MAP_SIZE.width} height={MAP_SIZE.height} fill="#07110f" />
        <rect width={MAP_SIZE.width} height={MAP_SIZE.height} fill="url(#grid)" />

        <TerrainLayer />

        <g>
          {roads.map((edge) => {
            const from = ROAD_NODES.find((node) => node.id === edge.from)!;
            const to = ROAD_NODES.find((node) => node.id === edge.to)!;
            const style = roadStyle(edge);
            const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
            return (
              <g key={edge.id}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={style.stroke}
                  strokeWidth={style.width + 3}
                  strokeOpacity={0.12}
                  strokeLinecap="round"
                />
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={style.stroke}
                  strokeWidth={style.width}
                  strokeDasharray={style.dash}
                  strokeOpacity={style.opacity}
                  strokeLinecap="round"
                />
                <text x={mid.x} y={mid.y - 4} className="road-label">
                  {edge.name}
                </text>
                {edge.congestion > 0.62 && (
                  <circle cx={mid.x} cy={mid.y + 6} r="3" fill="#f97316" opacity="0.72">
                    <animate attributeName="opacity" values="0.25;0.85;0.25" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
        </g>

        {activeRoute && (
          <g filter="url(#glow)">
            <polyline points={routePoints(activeRoute.path)} fill="none" stroke="#75f7d0" strokeWidth="7" strokeOpacity="0.18" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={routePoints(activeRoute.path)} fill="none" stroke="#75f7d0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {activeRoute.alternatives.slice(0, 2).map((alternative) => (
              <polyline
                key={alternative.label}
                points={routePoints(alternative.path)}
                fill="none"
                stroke="#f6c653"
                strokeWidth="1.8"
                strokeDasharray="7 7"
                strokeOpacity="0.68"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        )}

        <g>
          <circle cx={settings.incident.x} cy={settings.incident.y} r="39" fill="#ff5d5d" opacity="0.05" />
          <circle cx={settings.incident.x} cy={settings.incident.y} r="35" fill="none" stroke="#ff5d5d" strokeWidth="1.5" strokeDasharray="5 6" opacity="0.8" />
          <circle cx={settings.incident.x} cy={settings.incident.y} r="20" fill="#f6c653" opacity="0.08" />
          <text x={settings.incident.x + 42} y={settings.incident.y - 18} className="ccp-label">
            환자집결지 CCP
          </text>
          <text x={settings.incident.x + 42} y={settings.incident.y - 3} className="map-small-label">
            Casualty Collection Point
          </text>
          <g
            onPointerDown={(event) => {
              event.stopPropagation();
              setDragging(true);
            }}
            className="cursor-grab"
          >
            <path
              d={`M ${settings.incident.x - 12} ${settings.incident.y} L ${settings.incident.x + 12} ${settings.incident.y} M ${settings.incident.x} ${settings.incident.y - 12} L ${settings.incident.x} ${settings.incident.y + 12}`}
              stroke="#ff5d5d"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={settings.incident.x} cy={settings.incident.y} r="8" fill="#ff5d5d" />
          </g>
        </g>

        <g>
          {patients.map((patient) => {
            const selected = patient.id === selectedPatient?.id;
            return (
              <circle
                key={patient.id}
                cx={patient.x}
                cy={patient.y}
                r={selected ? 5.5 : 2.3}
                fill={TRIAGE_COLORS[patient.triage]}
                stroke={selected ? '#ffffff' : 'none'}
                strokeWidth={selected ? 1.2 : 0}
                opacity={selected ? 1 : 0.78}
                onClick={() => onSelectPatient(patient.id)}
              />
            );
          })}
        </g>

        <g>
          {facilities.map((facility) => {
            const selected = facility.id === selectedFacility?.id;
            return (
              <g key={facility.id} onClick={() => onSelectFacility(facility.id)} className="cursor-pointer">
                <rect
                  x={facility.x - 10}
                  y={facility.y - 10}
                  width="20"
                  height="20"
                  rx="4"
                  fill={facility.type === 'UNIT_AID_STATION' ? '#4ade80' : facility.type === 'CBRN_SPECIALTY_HOSPITAL' ? '#67e8f9' : facility.type === 'CAPITAL_ARMED_FORCES_HOSPITAL' ? '#f6c653' : '#93c5fd'}
                  opacity={selected ? 1 : 0.86}
                  stroke={selected ? '#ffffff' : '#07110f'}
                  strokeWidth={selected ? 2 : 1}
                />
                <text x={facility.x + 13} y={facility.y + 4} className="facility-label">
                  {facility.name}
                </text>
              </g>
            );
          })}
        </g>

        {activeRoute && (
          <g>
            <rect x="18" y="520" width="330" height="56" rx="8" fill="#07110f" stroke="#1f3a34" opacity="0.94" />
            <text x="34" y="542" className="route-callout">
              권장 경로: {activeRoute.roadNames.slice(0, 4).join(' → ')}
            </text>
            <text x="34" y="562" className="map-small-label">
              {activeRoute.transport} / 예상 {activeRoute.minutes}분 / 위험도 {activeRoute.risk}
            </text>
          </g>
        )}
      </svg>
    </section>
  );
}

function TerrainLayer() {
  return (
    <g>
      <path d="M368,0 C396,80 364,152 410,230 C438,282 412,402 454,600" fill="none" stroke="#38bdf8" strokeWidth="28" opacity="0.16" />
      <path d="M368,0 C396,80 364,152 410,230 C438,282 412,402 454,600" fill="none" stroke="#38bdf8" strokeWidth="8" opacity="0.56" />
      <polygon points="190,38 340,86 368,192 280,258 164,204 116,104" fill="#20322d" opacity="0.52" />
      <polygon points="122,402 256,326 398,416 344,540 180,540" fill="#20322d" opacity="0.48" />
      <polygon points="502,392 664,340 760,442 700,552 560,530" fill="#20322d" opacity="0.44" />
      {[0, 1, 2, 3].map((index) => (
        <path
          key={index}
          d={`M${160 + index * 18},${116 + index * 14} C${224 + index * 12},${76 + index * 10} ${302 - index * 4},${124 + index * 14} ${322 - index * 6},${188 + index * 10}`}
          fill="none"
          stroke="#7dd3a6"
          strokeWidth="1"
          opacity="0.22"
        />
      ))}
      <rect x="500" y="248" width="110" height="72" rx="10" fill="#7f1d1d" opacity="0.16" />
      <text x="514" y="288" className="map-small-label danger">위험지역</text>
      <rect x="248" y="414" width="140" height="54" rx="8" fill="#854d0e" opacity="0.16" />
      <text x="260" y="444" className="map-small-label danger">협곡/터널 축</text>
      <g opacity="0.74">
        <MountainIcon x={170} y={102} />
        <MountainIcon x={236} y={158} />
        <MountainIcon x={594} y={442} />
        <RiverIcon x={420} y={214} />
        <RiverIcon x={432} y={452} />
      </g>
    </g>
  );
}

function MountainIcon({ x, y }: Point) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 18 L14 -8 L28 18 Z" fill="none" stroke="#7dd3a6" strokeWidth="1.2" opacity="0.5" />
      <path d="M9 4 L14 -8 L20 4" fill="none" stroke="#7dd3a6" strokeWidth="1" opacity="0.35" />
    </g>
  );
}

function RiverIcon({ x, y }: Point) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-14 0 C-8 -7 -2 7 5 0 C11 -7 18 7 24 0" fill="none" stroke="#67d3ff" strokeWidth="2" opacity="0.5" />
    </g>
  );
}

function PatientDetail({
  patient,
  facility,
  onUpdate,
  onUpdateInjury,
}: {
  patient?: Patient;
  facility?: Facility;
  onUpdate: (patientId: string, patch: Partial<Patient>, detail: string) => void;
  onUpdateInjury: (patientId: string, key: keyof Patient['injuries'], value: boolean | number, detail: string) => void;
}) {
  if (!patient) return null;
  const marchEntries = [
    { key: 'M', label: '대량출혈', value: patient.marchFlags.M, alert: patient.injuries.massiveHemorrhage },
    { key: 'A', label: '기도', value: patient.marchFlags.A, alert: patient.injuries.airwayObstruction },
    { key: 'R', label: '호흡', value: patient.marchFlags.R, alert: patient.respiratoryRate > 30 || patient.spo2 < 90 || patient.injuries.chestInjury },
    { key: 'C', label: '순환', value: patient.marchFlags.C, alert: patient.systolicBp < 90 || patient.capillaryRefill !== '정상' },
    { key: 'H', label: '저체온/두부', value: patient.marchFlags.H, alert: patient.injuries.hypothermia || patient.injuries.headInjury },
  ];

  return (
    <section className="panel space-y-3">
      <PanelTitle icon={<Users size={16} />} title="환자 상세/수정" />
      <NaturalLanguageInput patient={patient} onUpdate={onUpdate} />
      <div className="flex items-center justify-between">
        <div>
          <strong className="text-lg">{patient.id}</strong>
          <p className="text-xs text-slate-400">{patient.unitZone} / 사고 지점으로부터 {patient.distanceFromIncident}m</p>
        </div>
        <span className="triage-pill" style={{ background: TRIAGE_COLORS[patient.triage], color: patient.triage === 'DELAYED' ? '#111827' : '#fff' }}>
          {TRIAGE_LABELS[patient.triage]}
        </span>
      </div>
      <div className="patient-state-grid">
        <Info label="발견 시각" value={patient.foundAt} />
        <Info label="의식" value={patient.consciousness} />
        <Info label="통증" value={`${patient.painScore}/10`} />
        <Info label="체온" value={`${patient.temperature}℃`} />
        <Info label="추천 후송" value={patient.recommendedTransport} />
        <Info label="후송 시간" value={patient.route ? `${patient.route.minutes}분` : '대기'} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberEdit label="호흡수" value={patient.respiratoryRate} suffix="회/분" onChange={(value) => onUpdate(patient.id, { respiratoryRate: value, breathing: value > 0 }, `호흡수 ${value}회/분`)} />
        <NumberEdit label="SpO2" value={patient.spo2} suffix="%" onChange={(value) => onUpdate(patient.id, { spo2: value }, `산소포화도 ${value}%`)} />
        <NumberEdit label="맥박" value={patient.pulse} suffix="회/분" onChange={(value) => onUpdate(patient.id, { pulse: value }, `맥박 ${value}회/분`)} />
        <NumberEdit label="수축기혈압" value={patient.systolicBp} suffix="mmHg" onChange={(value) => onUpdate(patient.id, { systolicBp: value }, `수축기혈압 ${value}mmHg`)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="field-label">
          의식 상태
          <select
            className="control"
            value={patient.consciousness}
            onChange={(event) => onUpdate(patient.id, { consciousness: event.target.value as Patient['consciousness'] }, `의식 상태 ${event.target.value}`)}
          >
            {['명료', '음성반응', '통증반응', '무반응'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          말초순환
          <select
            className="control"
            value={patient.capillaryRefill}
            onChange={(event) => onUpdate(patient.id, { capillaryRefill: event.target.value as Patient['capillaryRefill'] }, `말초순환 ${event.target.value}`)}
          >
            {['정상', '지연', '매우 지연'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Toggle label="보행 가능" checked={patient.walking} onChange={(value) => onUpdate(patient.id, { walking: value }, value ? '보행 가능' : '보행 불가')} />
        <Toggle label="호흡 있음" checked={patient.breathing} onChange={(value) => onUpdate(patient.id, { breathing: value, respiratoryRate: value ? Math.max(patient.respiratoryRate, 12) : 0 }, value ? '호흡 있음' : '호흡 없음')} />
        <Toggle label="대량출혈" checked={patient.injuries.massiveHemorrhage} onChange={(value) => onUpdateInjury(patient.id, 'massiveHemorrhage', value, value ? '대량출혈 추가' : '대량출혈 해제')} />
        <Toggle label="지혈 완료" checked={patient.treatments.bleedingControlled} onChange={(value) => onUpdate(patient.id, { treatments: { ...patient.treatments, bleedingControlled: value } }, value ? '지혈 완료' : '지혈 미완료')} />
        <Toggle label="기도 폐쇄" checked={patient.injuries.airwayObstruction} onChange={(value) => onUpdateInjury(patient.id, 'airwayObstruction', value, value ? '기도 폐쇄 의심 추가' : '기도 폐쇄 해제')} />
        <Toggle label="기도 확보" checked={patient.treatments.airwaySecured} onChange={(value) => onUpdate(patient.id, { treatments: { ...patient.treatments, airwaySecured: value } }, value ? '기도 확보' : '기도 미확보')} />
        <Toggle label="흉부손상" checked={patient.injuries.chestInjury} onChange={(value) => onUpdateInjury(patient.id, 'chestInjury', value, value ? '흉부손상 추가' : '흉부손상 해제')} />
        <Toggle label="긴장성 기흉" checked={patient.injuries.tensionPneumothorax} onChange={(value) => onUpdateInjury(patient.id, 'tensionPneumothorax', value, value ? '긴장성 기흉 의심 추가' : '긴장성 기흉 해제')} />
        <Toggle label="두부손상" checked={patient.injuries.headInjury} onChange={(value) => onUpdateInjury(patient.id, 'headInjury', value, value ? '두부손상 추가' : '두부손상 해제')} />
        <Toggle label="복부손상" checked={patient.injuries.abdominalInjury} onChange={(value) => onUpdateInjury(patient.id, 'abdominalInjury', value, value ? '복부손상 추가' : '복부손상 해제')} />
        <Toggle label="쇼크 의심" checked={patient.injuries.shock} onChange={(value) => onUpdateInjury(patient.id, 'shock', value, value ? '쇼크 의심 추가' : '쇼크 해제')} />
        <Toggle label="CBRN 의심" checked={hasCbrn(patient)} onChange={(value) => onUpdateInjury(patient.id, 'chemicalExposure', value, value ? 'CBRN 의심 추가' : 'CBRN 의심 해제')} />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-300">MARCH 위험 플래그</p>
        <div className="march-grid">
          {marchEntries.map((entry) => (
            <div key={entry.key} className={`march-card ${entry.alert ? 'alert' : ''}`}>
              <span>{entry.key}</span>
              <strong>{entry.label}</strong>
              <p>{entry.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-command-line bg-black/20 p-3 text-xs leading-5 text-slate-300">
        <p className="font-semibold text-white">추천: {facility?.name ?? '미배정'} / {patient.recommendedTransport}</p>
        {(patient.recommendationReasons.length > 0 ? patient.recommendationReasons : patient.clinicalReasons).map((reason) => (
          <p key={reason}>- {reason}</p>
        ))}
      </div>
    </section>
  );
}

function FacilityDetail({ facility, selectedPatient }: { facility?: Facility; selectedPatient?: Patient }) {
  if (!facility) return null;
  const travel = selectedPatient?.route?.facilityId === facility.id ? selectedPatient.route : undefined;
  return (
    <section className="panel space-y-3">
      <PanelTitle icon={<Hospital size={16} />} title="의료시설 상세" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong>{facility.name}</strong>
          <p className="text-xs text-slate-400">{FACILITY_TYPE_LABELS[facility.type]}</p>
        </div>
        <span className={`status-pill ${facility.overloadStatus === '과부하' ? 'bad' : facility.overloadStatus === '주의' ? 'warn' : 'good'}`}>
          {facility.overloadStatus}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
        <Info label="가용 병상" value={`${facility.availableBeds}/${facility.totalBeds}`} />
        <Info label="ICU" value={`${facility.availableIcuBeds}/${facility.icuBeds}`} />
        <Info label="수술실" value={`${facility.availableOperatingRooms}/${facility.operatingRooms}`} />
        <Info label="외상팀" value={`${facility.availableTraumaTeams}/${facility.traumaTeams}`} />
        <Info label="혈액" value={`${facility.bloodUnits} units`} />
        <Info label="CT/MRI" value={`${facility.ctAvailable ? 'CT' : '-'} / ${facility.mriAvailable ? 'MRI' : '-'}`} />
        <Info label="헬기장" value={facility.helicopterPad ? '있음' : '없음'} />
        <Info label="제독/격리" value={`${facility.decontaminationCapacity} / ${facility.isolationBeds}`} />
      </div>
      <div className="rounded-md border border-command-line bg-black/20 p-3 text-xs leading-5 text-slate-300">
        <p>현재 배정 환자: {facility.currentAssignedPatients}명</p>
        <p>포화 예상: {facility.estimatedSaturationTime}</p>
        {travel && (
          <>
            <p>사고 지점 기준 예상 이동: {travel.minutes}분 / {travel.distanceKm}km</p>
            <p>경로 패널티: {travel.bottlenecks.length > 0 ? travel.bottlenecks.join(', ') : '주요 패널티 없음'}</p>
          </>
        )}
        <p>AI 판단: {facility.notes}</p>
      </div>
    </section>
  );
}

function AIRecommendations({ recommendations, changeLog, routeDigest }: { recommendations: string[]; changeLog: string; routeDigest: string[] }) {
  return (
    <section className="panel space-y-3">
      <PanelTitle icon={<Route size={16} />} title="AI 종합 추천" />
      <div className="space-y-2 text-xs leading-5 text-slate-300">
        {recommendations.map((item) => (
          <p key={item}>- {item}</p>
        ))}
      </div>
      <div className="rounded-md border border-command-line bg-black/20 p-3 text-xs text-command-mint">{changeLog}</div>
      <div className="space-y-1 text-xs text-slate-400">
        {routeDigest.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  );
}

function PatientTable({
  patients,
  facilities,
  selectedPatientId,
  search,
  triageFilter,
  injuryFilter,
  hospitalFilter,
  showImmediateOnly,
  showUnassignedOnly,
  showCbrnOnly,
  showSurgeryOnly,
  onSearch,
  onTriageFilter,
  onInjuryFilter,
  onHospitalFilter,
  onImmediateOnly,
  onUnassignedOnly,
  onCbrnOnly,
  onSurgeryOnly,
  onSelect,
}: {
  patients: Patient[];
  facilities: Facility[];
  selectedPatientId?: string;
  search: string;
  triageFilter: TriageCategory | 'ALL';
  injuryFilter: string;
  hospitalFilter: string;
  showImmediateOnly: boolean;
  showUnassignedOnly: boolean;
  showCbrnOnly: boolean;
  showSurgeryOnly: boolean;
  onSearch: (value: string) => void;
  onTriageFilter: (value: TriageCategory | 'ALL') => void;
  onInjuryFilter: (value: string) => void;
  onHospitalFilter: (value: string) => void;
  onImmediateOnly: (value: boolean) => void;
  onUnassignedOnly: (value: boolean) => void;
  onCbrnOnly: (value: boolean) => void;
  onSurgeryOnly: (value: boolean) => void;
  onSelect: (patientId: string) => void;
}) {
  return (
    <section className="panel">
      <div className="mb-3 flex items-center justify-between">
        <PanelTitle icon={<Search size={16} />} title="환자 목록" />
        <span className="text-xs text-slate-400">검색/필터 결과 {patients.length}명</span>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        <label className="field-label">
          환자 ID
          <input className="control" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="P-001" />
        </label>
        <SelectRow
          label="분류"
          value={triageFilter}
          options={['ALL', ...Object.keys(TRIAGE_LABELS)]}
          display={(value) => (value === 'ALL' ? '전체' : TRIAGE_LABELS[value as TriageCategory])}
          onChange={(value) => onTriageFilter(value as TriageCategory | 'ALL')}
        />
        <SelectRow
          label="손상"
          value={injuryFilter}
          options={['ALL', '대량출혈', '흉부', '두부', '복부', '개방골절', '화상', 'CBRN']}
          display={(value) => (value === 'ALL' ? '전체' : value)}
          onChange={onInjuryFilter}
        />
        <SelectRow
          label="추천 병원"
          value={hospitalFilter}
          options={['ALL', ...facilities.map((facility) => facility.id)]}
          display={(value) => (value === 'ALL' ? '전체' : facilities.find((facility) => facility.id === value)?.name ?? value)}
          onChange={onHospitalFilter}
        />
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterToggle label="즉각처치만" checked={showImmediateOnly} onChange={onImmediateOnly} />
        <FilterToggle label="후송 미배정" checked={showUnassignedOnly} onChange={onUnassignedOnly} />
        <FilterToggle label="CBRN 의심" checked={showCbrnOnly} onChange={onCbrnOnly} />
        <FilterToggle label="수술 필요" checked={showSurgeryOnly} onChange={onSurgeryOnly} />
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>분류</th>
              <th>주요 손상</th>
              <th>추천 후송지</th>
              <th>수단</th>
              <th>우선순위</th>
              <th>예상</th>
            </tr>
          </thead>
          <tbody>
            {patients.slice(0, 120).map((patient) => {
              const facility = facilities.find((item) => item.id === patient.recommendedHospitalId);
              return (
                <tr key={patient.id} className={patient.id === selectedPatientId ? 'selected-row' : ''} onClick={() => onSelect(patient.id)}>
                  <td>{patient.id}</td>
                  <td>
                    <span className="triage-chip" style={{ background: TRIAGE_COLORS[patient.triage], color: patient.triage === 'DELAYED' ? '#111827' : '#fff' }}>
                      {TRIAGE_LABELS[patient.triage]}
                    </span>
                  </td>
                  <td>{summarizeInjuries(patient)}</td>
                  <td>{facility?.name ?? '미배정'}</td>
                  <td>{patient.recommendedTransport}</td>
                  <td>{patient.priority}</td>
                  <td>{patient.route ? `${patient.route.minutes}분` : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FacilityResources({
  facilities,
  filter,
  selectedFacilityId,
  onFilter,
  onSelect,
}: {
  facilities: Facility[];
  filter: string;
  selectedFacilityId?: string;
  onFilter: (value: string) => void;
  onSelect: (facilityId: string) => void;
}) {
  return (
    <section className="panel">
      <div className="mb-3 flex items-center justify-between">
        <PanelTitle icon={<Building2 size={16} />} title="병원 자원 현황" />
        <Filter size={15} className="text-slate-400" />
      </div>
      <SelectRow
        label="시설 필터"
        value={filter}
        options={['전체', '부대 의무대', '군병원', '화생방 전문치료병원', '국군수도병원', '과부하 시설만', '헬기장 보유', '수술 가능', 'CBRN 가능']}
        onChange={onFilter}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {facilities.map((facility) => (
          <button key={facility.id} className={`facility-card ${facility.id === selectedFacilityId ? 'active' : ''}`} onClick={() => onSelect(facility.id)}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-left">
                <strong>{facility.name}</strong>
                <p>{FACILITY_TYPE_LABELS[facility.type]}</p>
              </div>
              <span className={`status-dot ${facility.overloadStatus === '과부하' ? 'bad' : facility.overloadStatus === '주의' ? 'warn' : 'good'}`} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-left text-[11px] text-slate-300">
              <span>병상 {facility.availableBeds}</span>
              <span>ICU {facility.availableIcuBeds}</span>
              <span>수술 {facility.availableOperatingRooms}</span>
              <span>혈액 {facility.bloodUnits}</span>
              <span>제독 {facility.decontaminationCapacity}</span>
              <span>{facility.helicopterPad ? '헬기장' : '지상후송'}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
  display,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  display?: (value: string) => string;
}) {
  return (
    <label className="field-label">
      {label}
      <select className="control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {display ? display(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberEdit({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="field-label">
      {label}
      <div className="flex items-center gap-1">
        <input className="control" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <span className="text-[11px] text-slate-400">{suffix}</span>
      </div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function FilterToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button className={`filter-toggle ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)}>
      {label}
    </button>
  );
}

function ActionButton({ icon, label, onClick, active = false }: { icon: ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button className={`action-button ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-white">
      <span className="text-command-mint">{icon}</span>
      {title}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-command-line bg-black/20 p-2">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}
