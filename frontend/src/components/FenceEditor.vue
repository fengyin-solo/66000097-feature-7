<template>
  <div style="width:340px;padding:16px;overflow:auto;border-left:1px solid #e0e0e0;display:flex;flex-direction:column;height:100vh;box-sizing:border-box">
    <h3 style="margin:0 0 12px;display:flex;align-items:center;gap:8px">
      🗺️ 围栏工作台
    </h3>

    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <button @click="startDrawCircle"
        :style="{ flex:1, padding:'8px 12px', borderRadius:'6px', border:'1px solid ' + (store.editMode === 'draw-circle' ? '#1976d2' : '#ccc'),
          background: store.editMode === 'draw-circle' ? '#e3f2fd' : '#fff', color: store.editMode === 'draw-circle' ? '#1976d2' : '#333',
          cursor:'pointer', fontSize:'12px' }">
        ⭕ 画圆形
      </button>
      <button @click="startDrawPolygon"
        :style="{ flex:1, padding:'8px 12px', borderRadius:'6px', border:'1px solid ' + (store.editMode === 'draw-polygon' ? '#1976d2' : '#ccc'),
          background: store.editMode === 'draw-polygon' ? '#e3f2fd' : '#fff', color: store.editMode === 'draw-polygon' ? '#1976d2' : '#333',
          cursor:'pointer', fontSize:'12px' }">
        📐 画多边形
      </button>
    </div>

    <div v-if="drawingHint" style="padding:8px 12px;background:#fff3e0;border-radius:6px;margin-bottom:12px;font-size:12px;color:#e65100">
      {{ drawingHint }}
      <button @click="cancelDraw" style="margin-left:8px;padding:2px 8px;border-radius:4px;border:1px solid #e65100;background:transparent;color:#e65100;cursor:pointer;font-size:11px">取消</button>
    </div>

    <div v-if="editingFence" style="padding:12px;background:#f5f5f5;border-radius:8px;margin-bottom:12px">
      <div style="font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
        ✏️ 编辑围栏
        <button @click="cancelEdit" style="padding:2px 8px;border-radius:4px;border:1px solid #999;background:#fff;color:#666;cursor:pointer;font-size:11px">完成</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <label style="font-size:12px;color:#666">
          围栏名称
          <input v-model="editingFence.name"
            style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;margin-top:4px;font-size:12px;box-sizing:border-box">
        </label>

        <label style="font-size:12px;color:#666">
          颜色
          <div style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
            <button v-for="c in colorOptions" :key="c" @click="editingFence.color = c"
              :style="{ width:'24px', height:'24px', borderRadius:'50%', border:'2px solid ' + (editingFence.color === c ? '#333' : 'transparent'),
                background:c, cursor:'pointer', padding:0 }"></button>
          </div>
        </label>

        <!-- 分级告警规则 -->
        <div style="font-size:12px;color:#666;margin-top:4px">
          <div style="font-weight:600;margin-bottom:6px">分级告警规则</div>

          <div v-for="group in ruleGroups" :key="group.event"
            style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:8px;margin-bottom:6px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <span style="font-weight:500;color:#333">{{ group.icon }} {{ group.label }}</span>
              <button v-if="group.rules.length < 3" @click="addRule(group.event)"
                style="padding:2px 8px;border-radius:4px;border:1px solid #1976d2;background:#fff;color:#1976d2;cursor:pointer;font-size:11px">
                + 添加规则
              </button>
            </div>

            <div v-if="group.rules.length === 0" style="font-size:11px;color:#aaa;padding:2px 0 4px">
              未设置，{{ group.label }}不告警
            </div>

            <div v-for="(rule, idx) in group.rules" :key="rule.id"
              style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap">
              <input type="checkbox" v-model="rule.enabled" style="cursor:pointer" title="启用/停用">
              <select v-model="rule.severity"
                :style="{ padding:'3px 4px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'11px', cursor:'pointer',
                  color: severityMeta[rule.severity].color, background: severityMeta[rule.severity].bg }">
                <option v-for="sev in severityOptions" :key="sev.value" :value="sev.value">{{ sev.label }}</option>
              </select>
              <template v-if="group.event === 'dwell'">
                停留超过
                <input type="number" min="1" v-model.number="rule.dwellTimeout"
                  style="width:52px;padding:3px 4px;border:1px solid #ddd;border-radius:4px;font-size:11px">
                分钟
              </template>
              <span v-else style="font-size:11px;color:#888">触发时告警</span>
              <button @click="removeRule(group.event, idx)"
                style="margin-left:auto;padding:2px 7px;border-radius:4px;border:1px solid #e0e0e0;background:#fff;color:#999;cursor:pointer;font-size:11px">
                移除
              </button>
            </div>
          </div>

          <div style="font-size:10px;color:#999;line-height:1.5">
            同一事件可配置多条不同严重度规则，按 严重＞警告＞提示 取最高优先级触发；全部停用或不设置时围栏仅展示。
          </div>
        </div>

        <!-- 规则冲突优先级提示 -->
        <div v-if="conflicts.length > 0" style="padding:8px 10px;background:#fff8e1;border:1px solid #ffe082;border-radius:6px">
          <div style="font-size:12px;font-weight:600;color:#f57f17;margin-bottom:4px">⚠️ 规则冲突提示</div>
          <div v-for="(conflict, i) in conflicts" :key="i" style="font-size:11px;color:#795548;line-height:1.5;margin-bottom:2px">
            {{ conflict.message }}
          </div>
        </div>

        <!-- 每日生效时段 -->
        <div style="font-size:12px;color:#666;margin-top:2px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:8px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:500;color:#333">
            <input type="checkbox" v-model="editingFence.schedule.enabled" style="cursor:pointer">
            🕐 限定每日生效时段
          </label>
          <div v-if="editingFence.schedule.enabled" style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap">
            <input type="time" v-model="editingFence.schedule.startTime"
              style="padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px">
            <span>至</span>
            <input type="time" v-model="editingFence.schedule.endTime"
              style="padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px">
            <span v-if="editingFence.schedule.startTime === editingFence.schedule.endTime"
              style="font-size:11px;color:#e53935">起止时间不能相同</span>
            <span v-else-if="isEditingOvernight" style="font-size:11px;color:#ff9800">跨午夜时段，按跨天生效</span>
          </div>
          <div v-else style="font-size:11px;color:#999;margin-top:4px">未限定时段，规则全天生效</div>
        </div>

        <!-- 校验错误 -->
        <div v-if="validationErrors.length > 0" style="padding:8px 10px;background:#ffebee;border:1px solid #ef9a9a;border-radius:6px">
          <div v-for="(err, i) in validationErrors" :key="i" style="font-size:11px;color:#c62828;line-height:1.5">
            ❌ {{ err }}
          </div>
        </div>

        <div v-if="editingFence.type === 'circle'" style="font-size:12px;color:#666">
          半径: {{ editingFence.radius }} 米
        </div>

        <div v-if="editingFence.type === 'polygon'" style="font-size:12px;color:#666">
          顶点数: {{ editingFence.paths?.length || 0 }}
        </div>

        <!-- 围栏详情（与地图弹窗、告警记录同一口径） -->
        <div style="font-size:11px;color:#555;background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:8px;line-height:1.7">
          <div style="font-weight:600;color:#333;margin-bottom:2px">围栏详情</div>
          <div v-for="(line, i) in summaryLines" :key="i">{{ line }}</div>
        </div>

        <div style="display:flex;gap:8px;margin-top:8px">
          <button @click="saveFence"
            style="flex:1;padding:8px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">
            💾 保存
          </button>
          <button @click="deleteCurrentFence"
            style="padding:8px 16px;background:#e53935;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div style="margin-top:auto">
      <h4 style="margin:16px 0 8px;font-size:13px;color:#333">现有围栏 ({{ store.fences.length }})</h4>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div v-for="f in store.fences" :key="f.id"
          @click="selectFence(f.id)"
          :style="{ display:'flex', alignItems:'center', gap:'10px', padding:'10px', borderRadius:'6px',
            border:'1px solid ' + (store.selectedFenceId === f.id ? f.color : '#e0e0e0'),
            background: store.selectedFenceId === f.id ? f.color + '15' : '#fff',
            cursor:'pointer', fontSize:'12px' }">
          <span :style="{ width:'12px', height:'12px', borderRadius: f.type === 'circle' ? '50%' : '2px', background: f.color }"></span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:500">{{ f.name }}</div>
            <div style="font-size:10px;color:#888;display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:2px">
              <span>{{ f.type === 'circle' ? '圆形 · ' + f.radius + 'm' : '多边形 · ' + (f.paths?.length || 0) + '点' }}</span>
              <span v-for="chip in fenceChips(f)" :key="chip.key"
                :style="{ padding:'0 5px', borderRadius:'8px', background: chip.bg, color: chip.color, fontSize:'10px', lineHeight:'16px' }">
                {{ chip.label }}
              </span>
              <span v-if="isFenceScheduled(f)" style="color:#ff9800" title="限定每日生效时段">🕐</span>
            </div>
            <div style="font-size:10px;color:#aaa;margin-top:2px">{{ fenceMonitorStatus(f) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useIotStore } from '../stores/iot';
import type { Geofence, FenceRule, FenceEventType, AlertSeverity } from '../types';
import {
  createRule, defaultSchedule,
  SEVERITY_META, EVENT_META,
  findRuleConflicts, validateFenceRules, getFenceSummaryLines, getFenceMonitorStatus,
  getEnabledRules, isScheduleActive, isOvernight, hasAnyEnabledRule,
} from '../utils/fenceRules';

const store = useIotStore();

const colorOptions = ['#4caf50', '#e53935', '#1976d2', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

const severityMeta = SEVERITY_META;
const severityOptions: Array<{ value: AlertSeverity; label: string }> = [
  { value: 'critical', label: '严重' },
  { value: 'warning', label: '警告' },
  { value: 'info', label: '提示' },
];

interface FenceDraft {
  name: string;
  color: string;
  type: 'circle' | 'polygon';
  radius: number;
  center: { lat: number; lng: number };
  paths?: Array<{ lat: number; lng: number }>;
  rules: FenceRule[];
  schedule: Geofence['schedule'];
}

const editingFence = ref<FenceDraft | null>(null);

const drawingHint = computed(() => {
  if (store.editMode === 'draw-circle') return '点击地图设置圆心，拖动调整半径';
  if (store.editMode === 'draw-polygon') return '点击地图添加顶点，双击完成绘制';
  return '';
});

function cloneAsDraft(fence: Geofence): FenceDraft {
  return {
    name: fence.name,
    color: fence.color,
    type: fence.type,
    radius: fence.radius,
    center: { ...fence.center },
    paths: fence.paths ? fence.paths.map(p => ({ ...p })) : undefined,
    rules: fence.rules.map(r => ({ ...r })),
    schedule: { ...fence.schedule },
  };
}

watch(() => store.selectedFence, (fence) => {
  if (fence) {
    editingFence.value = cloneAsDraft(fence);
  } else {
    editingFence.value = null;
  }
}, { immediate: true, deep: true });

const ruleGroups = computed(() => {
  const events: FenceEventType[] = ['enter', 'exit', 'dwell'];
  return events.map(event => ({
    event,
    label: EVENT_META[event].label,
    icon: EVENT_META[event].icon,
    rules: editingFence.value?.rules.filter(r => r.event === event) ?? [],
  }));
});

const isEditingOvernight = computed(() =>
  !!editingFence.value && isOvernight(editingFence.value.schedule)
);

const draftAsGeofence = computed<Geofence | null>(() => {
  if (!editingFence.value) return null;
  return {
    id: store.selectedFenceId ?? 'draft',
    ...editingFence.value,
  };
});

const conflicts = computed(() =>
  draftAsGeofence.value ? findRuleConflicts(draftAsGeofence.value) : []
);

const validationErrors = computed(() =>
  draftAsGeofence.value ? validateFenceRules(draftAsGeofence.value) : []
);

const summaryLines = computed(() =>
  draftAsGeofence.value ? getFenceSummaryLines(draftAsGeofence.value) : []
);

function addRule(event: FenceEventType) {
  if (!editingFence.value) return;
  const fallbackSeverity: AlertSeverity =
    event === 'dwell' ? 'info' : event === 'enter' ? 'critical' : 'warning';
  editingFence.value.rules.push(createRule(event, fallbackSeverity));
}

function removeRule(event: FenceEventType, index: number) {
  if (!editingFence.value) return;
  const groupRuleIds = editingFence.value.rules
    .map((r, i) => ({ r, i }))
    .filter(x => x.r.event === event);
  const target = groupRuleIds[index];
  if (target) {
    editingFence.value.rules.splice(target.i, 1);
  }
}

function fenceChips(f: Geofence) {
  const events: FenceEventType[] = ['enter', 'exit', 'dwell'];
  const chips: Array<{ key: string; label: string; color: string; bg: string }> = [];
  events.forEach((event) => {
    const top = getEnabledRules(f, event)[0];
    if (top) {
      const meta = SEVERITY_META[top.severity];
      const suffix = top.event === 'dwell' ? top.dwellTimeout + '分' : '';
      chips.push({
        key: event,
        label: `${EVENT_META[event].short}${suffix}·${meta.label}`,
        color: meta.color,
        bg: meta.bg,
      });
    }
  });
  if (chips.length === 0) {
    chips.push({ key: 'none', label: '仅展示', color: '#757575', bg: '#f0f0f0' });
  }
  return chips;
}

function isFenceScheduled(f: Geofence): boolean {
  return f.schedule?.enabled ?? false;
}

function fenceMonitorStatus(f: Geofence): string {
  if (!hasAnyEnabledRule(f)) return '未设置/全部停用，仅展示';
  if (!isScheduleActive(f.schedule ?? defaultSchedule())) return '当前非生效时段，暂不触发';
  return getFenceMonitorStatus(f);
}

function startDrawCircle() {
  store.setEditMode('draw-circle');
}

function startDrawPolygon() {
  store.setEditMode('draw-polygon');
}

function cancelDraw() {
  store.setEditMode('none');
}

function cancelEdit() {
  store.setEditMode('none');
  editingFence.value = null;
}

function selectFence(id: string) {
  store.selectFence(id);
}

function saveFence() {
  if (!store.selectedFenceId || !editingFence.value) return;
  if (validationErrors.value.length > 0) {
    store.showFenceToast('保存失败：请先修正规则与生效时段中的错误', 'warning');
    return;
  }

  const draft = editingFence.value;
  store.updateFence(store.selectedFenceId, {
    name: draft.name,
    color: draft.color,
    rules: draft.rules.map(r => ({ ...r })),
    schedule: { ...draft.schedule },
  });

  if (conflicts.value.length > 0) {
    store.showFenceToast(`已保存「${draft.name}」：存在 ${conflicts.value.length} 组规则冲突，仅最高优先级规则生效`, 'warning');
  } else {
    store.showFenceToast(`围栏「${draft.name}」规则已保存`);
  }
}

function deleteCurrentFence() {
  if (store.selectedFenceId && confirm('确定要删除该围栏吗？')) {
    store.deleteFence(store.selectedFenceId);
    editingFence.value = null;
  }
}
</script>
