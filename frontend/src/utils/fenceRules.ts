import type { AlertSeverity, FenceEventName, FenceEventType, FenceRule, FenceSchedule, Geofence } from '../types';

/**
 * 围栏分级规则 / 生效时段的统一口径。
 * 地图提示（弹窗）、告警记录（message）、围栏详情（工作台）都必须通过本模块取文案与判定，
 * 避免三处各写一套导致不一致。
 */

export const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: '严重', color: '#e53935', bg: '#ffebee', border: '#ffcdd2' },
  warning: { label: '警告', color: '#ff9800', bg: '#fff3e0', border: '#ffe0b2' },
  info: { label: '提示', color: '#2196f3', bg: '#e3f2fd', border: '#bbdefb' },
};

export const EVENT_META: Record<FenceEventType, FenceEventName> = {
  enter: { label: '进入围栏', short: '入', icon: '🚨', action: '进入' },
  exit: { label: '离开围栏', short: '出', icon: '🚪', action: '离开' },
  dwell: { label: '停留超时', short: '停', icon: '⏱️', action: '停留超时' },
};

let ruleSeq = 0;
export function createRule(event: FenceEventType, severity: AlertSeverity = 'warning', dwellTimeout?: number): FenceRule {
  ruleSeq += 1;
  return {
    id: 'r' + Date.now().toString(36) + ruleSeq.toString(36),
    event,
    enabled: true,
    severity,
    dwellTimeout: event === 'dwell' ? (dwellTimeout ?? 30) : undefined,
  };
}

export function defaultRules(): FenceRule[] {
  return [createRule('enter', 'critical')];
}

export function defaultSchedule(): FenceSchedule {
  return { enabled: false, startTime: '00:00', endTime: '23:59' };
}

// ---------------- 生效时段 ----------------

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 时段是否跨天（结束时间不晚于开始时间，按跨午夜处理） */
export function isOvernight(schedule: FenceSchedule): boolean {
  return schedule.enabled && toMinutes(schedule.endTime) <= toMinutes(schedule.startTime);
}

/**
 * 判断围栏规则在指定时刻是否处于生效时段内。
 * 未启用时段限制时全天生效；跨天窗口（如 22:00-06:00）按跨过午夜处理。
 */
export function isScheduleActive(schedule: FenceSchedule, at: Date = new Date()): boolean {
  if (!schedule.enabled) return true;
  const cur = at.getHours() * 60 + at.getMinutes();
  const start = toMinutes(schedule.startTime);
  const end = toMinutes(schedule.endTime);
  if (end <= start) {
    return cur >= start || cur < end;
  }
  return cur >= start && cur < end;
}

export function formatSchedule(schedule: FenceSchedule): string {
  if (!schedule.enabled) return '全天生效';
  return `每日 ${schedule.startTime} - ${schedule.endTime}${isOvernight(schedule) ? '（跨天）' : ''}`;
}

// ---------------- 规则读取 ----------------

export function getEnabledRules(fence: Geofence, event: FenceEventType): FenceRule[] {
  return (fence.rules || [])
    .filter(r => r.enabled && r.event === event)
    .sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
}

/** 当前时刻生效（开关启用 + 时段命中）的规则，按严重度降序 */
export function getActiveRules(fence: Geofence, event: FenceEventType, at: Date = new Date()): FenceRule[] {
  if (!isScheduleActive(fence.schedule ?? defaultSchedule(), at)) return [];
  return getEnabledRules(fence, event);
}

export function hasAnyEnabledRule(fence: Geofence): boolean {
  return (fence.rules || []).some(r => r.enabled);
}

export function countEnabledRules(fence: Geofence): number {
  return (fence.rules || []).filter(r => r.enabled).length;
}

/** 取某事件当前命中的最高优先级规则；无生效规则时返回 null（此时不产生围栏告警） */
export function pickActiveRule(fence: Geofence, event: FenceEventType, at: Date = new Date()): FenceRule | null {
  return getActiveRules(fence, event, at)[0] ?? null;
}

// ---------------- 规则冲突与优先级 ----------------

export interface RuleConflict {
  event: FenceEventType;
  eventLabel: string;
  highest: FenceRule;
  others: FenceRule[];
  /** 提示文案，含优先级顺序 */
  message: string;
}

/**
 * 规则冲突检测：同一事件存在多条同时启用、且严重度或停留超时阈值不同的规则时视为冲突。
 * 按严重度（critical>warning>info）提示生效优先级；严重度相同则同优先级，阈值小的先触发。
 * 仅做提示，不阻止保存。
 */
export function findRuleConflicts(fence: Geofence): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  (['enter', 'exit', 'dwell'] as FenceEventType[]).forEach((event) => {
    const rules = getEnabledRules(fence, event);
    if (rules.length < 2) return;

    const severitySet = new Set(rules.map(r => r.severity));
    const timeoutSet = new Set(
      event === 'dwell' ? rules.map(r => String(r.dwellTimeout ?? 0)) : ['']
    );
    if (severitySet.size === 1 && timeoutSet.size === 1) return;

    const ordered = [...rules].sort(
      (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || (a.dwellTimeout ?? 0) - (b.dwellTimeout ?? 0)
    );
    const [highest, ...others] = ordered;
    const chain = ordered
      .map(r => `${SEVERITY_META[r.severity].label}${r.event === 'dwell' ? '(' + formatDwellTimeout(r.dwellTimeout) + ')' : ''}`)
      .join(' > ');

    conflicts.push({
      event,
      eventLabel: EVENT_META[event].label,
      highest,
      others,
      message: `${EVENT_META[event].label}存在 ${ordered.length} 条启用规则，优先级：${chain}；仅最高优先级（${SEVERITY_META[highest.severity].label}）会产生告警`,
    });
  });
  return conflicts;
}

// ---------------- 统一文案（地图 / 告警 / 详情三处共用） ----------------

export function severityLabel(severity: AlertSeverity): string {
  return SEVERITY_META[severity].label;
}

export function formatDwellTimeout(minutes?: number): string {
  const m = minutes ?? 0;
  if (m <= 0) return '0分钟';
  if (m < 60) return `${m}分钟`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}小时${rest}分钟` : `${h}小时`;
}

export function describeRule(rule: FenceRule): string {
  const sev = SEVERITY_META[rule.severity].label;
  if (rule.event === 'dwell') {
    return `停留超时 ${formatDwellTimeout(rule.dwellTimeout)} · ${sev}`;
  }
  return `${EVENT_META[rule.event].label} · ${sev}`;
}

/** 围栏详情 / 地图弹窗统一摘要行 */
export function getFenceSummaryLines(fence: Geofence, at: Date = new Date()): string[] {
  const lines: string[] = [];
  (['enter', 'exit', 'dwell'] as FenceEventType[]).forEach((event) => {
    getEnabledRules(fence, event).forEach((rule) => {
      const active = isScheduleActive(fence.schedule ?? defaultSchedule(), at);
      lines.push(`${EVENT_META[event].icon} ${describeRule(rule)}${active ? '' : '（非生效时段，暂不触发）'}`);
    });
  });
  if (lines.length === 0) {
    lines.push('🔕 仅展示，不触发告警');
  }
  lines.push(`🕐 ${formatSchedule(fence.schedule ?? defaultSchedule())}`);
  return lines;
}

/** 工作台状态行：一句话说明当前是否监测 */
export function getFenceMonitorStatus(fence: Geofence, at: Date = new Date()): string {
  if (!hasAnyEnabledRule(fence)) return '当前仅展示，不触发告警';
  if (!isScheduleActive(fence.schedule ?? defaultSchedule(), at)) {
    return `非生效时段（${formatSchedule(fence.schedule ?? defaultSchedule())}），暂不触发告警`;
  }
  const activeEvents = (['enter', 'exit', 'dwell'] as FenceEventType[])
    .filter(ev => getEnabledRules(fence, ev).length > 0)
    .map(ev => EVENT_META[ev].label);
  return `生效中：${activeEvents.join('、')}`;
}

/** 告警记录统一文案：map 提示、addAlert message 都调用本函数 */
export function buildFenceAlertMessage(deviceName: string, fenceName: string, rule: FenceRule): string {
  if (rule.event === 'dwell') {
    return `${deviceName} 在 ${fenceName} 停留超过 ${formatDwellTimeout(rule.dwellTimeout)}`;
  }
  return `${deviceName} ${EVENT_META[rule.event].action} ${fenceName}`;
}

// ---------------- 校验 ----------------

export function validateFenceRules(fence: Geofence): string[] {
  const errors: string[] = [];
  (fence.rules || []).forEach((rule) => {
    if (rule.enabled && rule.event === 'dwell') {
      if (!rule.dwellTimeout || rule.dwellTimeout <= 0) {
        errors.push('停留超时规则需要填写大于 0 的超时时间（分钟）');
      }
    }
  });
  if (fence.schedule?.enabled && fence.schedule.startTime === fence.schedule.endTime) {
    errors.push('生效时段的开始时间与结束时间相同，无法构成有效时段');
  }
  return errors;
}

// ---------------- 兼容迁移 ----------------

/**
 * 规整围栏数据：补齐 rules/schedule；旧围栏（只有 alertOnEnter/Exit）自动迁移为分级规则。
 * 未设置任何规则或全部停用时也不报错，围栏照常展示。
 */
export function normalizeFence<T extends Partial<Geofence>>(fence: T): T & { rules: FenceRule[]; schedule: FenceSchedule } {
  let rules: FenceRule[];
  if (Array.isArray(fence.rules) && fence.rules.length > 0) {
    rules = fence.rules.map(r => ({
      ...r,
      dwellTimeout: r.event === 'dwell' ? r.dwellTimeout ?? 30 : undefined,
    }));
  } else if (fence.alertOnEnter || fence.alertOnExit) {
    rules = [];
    if (fence.alertOnEnter) rules.push(createRule('enter', 'critical'));
    if (fence.alertOnExit) rules.push(createRule('exit', 'warning'));
  } else {
    rules = [];
  }
  const schedule: FenceSchedule = fence.schedule
    ? { ...defaultSchedule(), ...fence.schedule }
    : defaultSchedule();
  return { ...fence, rules, schedule };
}
