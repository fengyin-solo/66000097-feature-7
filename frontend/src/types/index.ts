export interface Device {
  id: string; name: string; lat: number; lng: number;
  status: 'online' | 'offline' | 'alert'; lastSeen: string;
  battery: number; temperature: number;
  groupId?: string;
  thresholds?: DeviceThresholds;
}

export interface DeviceThresholds {
  lowBattery: number;
  highTemperature: number;
  offlineTimeout: number;
}

export interface DeviceGroup {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface DeviceRegistrationForm {
  name: string;
  lat: number;
  lng: number;
  battery: number;
  temperature: number;
  groupId?: string;
  thresholds: DeviceThresholds;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type FenceEventType = 'enter' | 'exit' | 'dwell';

export interface FenceEventName {
  label: string;
  short: string;
  icon: string;
  action: string;
}

export interface FenceRule {
  id: string;
  /** enter=进入围栏 / exit=离开围栏 / dwell=停留超时 */
  event: FenceEventType;
  enabled: boolean;
  severity: AlertSeverity;
  /** 仅 dwell 规则使用，单位：分钟 */
  dwellTimeout?: number;
}

export interface FenceSchedule {
  /** 关闭时全天生效；开启时限定每日 startTime-endTime，end<=start 视为跨天 */
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface Geofence {
  id: string; name: string;
  center: { lat: number; lng: number };
  radius: number; type: 'circle' | 'polygon';
  paths?: Array<{ lat: number; lng: number }>;
  color: string;
  /** 分级告警规则（进入/离开/停留超时，各可配多条、不同严重度） */
  rules: FenceRule[];
  /** 每日生效时段 */
  schedule: FenceSchedule;
  /** @deprecated 旧字段，规则以 rules 为准，仅用于兼容旧数据迁移 */
  alertOnEnter?: boolean;
  /** @deprecated 旧字段，规则以 rules 为准，仅用于兼容旧数据迁移 */
  alertOnExit?: boolean;
}

export type AlertType = FenceEventType | 'low_battery' | 'offline';

export interface Alert {
  id: string;
  deviceId: string;
  fenceId?: string;
  ruleId?: string;
  type: AlertType;
  severity: AlertSeverity;
  timestamp: string;
  message: string;
  acknowledged: boolean;
}

export interface MqttMessage {
  topic: string; payload: string; timestamp: string;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  battery?: number;
  temperature?: number;
  isAbnormal?: boolean;
  abnormalType?: 'fence_breach' | 'low_battery' | 'offline' | 'speed';
  abnormalMessage?: string;
}

export interface StayPoint {
  lat: number;
  lng: number;
  startTime: string;
  endTime: string;
  duration: number;
  name?: string;
}

export interface TrackSegment {
  points: TrackPoint[];
  isNormal: boolean;
  abnormalType?: string;
  startTime: string;
  endTime: string;
}

export interface TrackData {
  deviceId: string;
  deviceName: string;
  startTime: string;
  endTime: string;
  points: TrackPoint[];
  segments: TrackSegment[];
  stayPoints: StayPoint[];
  breachEvents: TrackPoint[];
  totalDistance: number;
  totalDuration: number;
}

export interface HealthDataPoint {
  timestamp: string;
  battery: number;
  temperature: number;
  isOnline: boolean;
}

export interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  healthScore: number;
  batteryLevel: number;
  temperatureLevel: number;
  onlineHours: number;
  offlineHours: number;
  alertCount: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  lastAbnormalTime?: string;
  lastAbnormalType?: AlertType;
  priorityRank: number;
  recommendations: string[];
  historyData: HealthDataPoint[];
}

export interface HealthSummary {
  avgHealthScore: number;
  totalAlertCount: number;
  avgOnlineRate: number;
  avgBatteryLevel: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
}
