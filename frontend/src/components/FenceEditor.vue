<template>
  <div style="width:320px;padding:16px;overflow:auto;border-left:1px solid #e0e0e0;display:flex;flex-direction:column;height:100vh;box-sizing:border-box">
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

    <div v-if="store.selectedFence" style="padding:12px;background:#f5f5f5;border-radius:8px;margin-bottom:12px">
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

        <div style="font-size:12px;color:#666;margin-top:4px">
          <div style="font-weight:500;margin-bottom:4px">分级告警规则</div>
          <div v-for="rt in ruleTypes" :key="rt.type" style="margin-bottom:6px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="checkbox" v-model="editingRules[rt.type].enabled" style="cursor:pointer">
              {{ rt.name }}
            </label>
            <div v-if="editingRules[rt.type].enabled"
              style="display:flex;align-items:center;gap:6px;margin:4px 0 0 22px;flex-wrap:wrap">
              <template v-if="rt.type === 'dwell'">
                <input type="number" min="1" max="1440" v-model.number="editingRules.dwell.dwellMinutes"
                  style="width:56px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px">
                <span style="color:#888">分钟</span>
              </template>
              <span style="color:#888">严重度</span>
              <select v-model="editingRules[rt.type].severity"
                style="padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px">
                <option value="critical">严重</option>
                <option value="warning">警告</option>
                <option value="info">提示</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="rulePriorityList.length >= 2"
          style="padding:8px;background:#fff8e1;border:1px solid #ffe082;border-radius:6px;font-size:11px;color:#795548">
          <div style="font-weight:600;margin-bottom:4px">⚠️ 规则冲突提示</div>
          <div>多条规则同时命中时，按以下优先级触发：</div>
          <div v-for="(item, idx) in rulePriorityList" :key="item.type" style="margin-top:2px">
            {{ idx + 1 }}. {{ ruleLabel(item.type) }}
          </div>
        </div>

        <div style="font-size:12px;color:#666;margin-top:4px">
          <div style="font-weight:500;margin-bottom:4px">生效时段</div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" v-model="editingSchedule.enabled" style="cursor:pointer">
            限定每日生效时间
          </label>
          <div v-if="editingSchedule.enabled" style="display:flex;align-items:center;gap:6px;margin:6px 0 0 22px">
            <input type="time" v-model="editingSchedule.startTime"
              style="padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px">
            <span style="color:#888">至</span>
            <input type="time" v-model="editingSchedule.endTime"
              style="padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:12px">
          </div>
          <div v-if="editingSchedule.enabled" style="margin:4px 0 0 22px;font-size:11px;color:#999">
            支持跨天时段（如 22:00-06:00）；起止相同视为全天生效
          </div>
        </div>

        <div style="font-size:11px;color:#888;background:#fafafa;border:1px dashed #ddd;border-radius:4px;padding:6px 8px">
          📋 保存后口径：{{ previewSummary }}
        </div>

        <div v-if="editingFence.type === 'circle'" style="font-size:12px;color:#666">
          半径: {{ editingFence.radius }} 米
        </div>

        <div v-if="editingFence.type === 'polygon'" style="font-size:12px;color:#666">
          顶点数: {{ editingFence.paths?.length || 0 }}
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
          <div style="flex:1">
            <div style="font-weight:500">{{ f.name }}</div>
            <div style="font-size:10px;color:#888">
              {{ f.type === 'circle' ? '圆形 · ' + f.radius + 'm' : '多边形 · ' + (f.paths?.length || 0) + '点' }}
              <span v-for="b in fenceBadges(f)" :key="b" style="margin-left:4px">{{ b }}</span>
              <span v-if="fenceBadges(f).length === 0" style="margin-left:4px;color:#bbb">未启用规则</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useIotStore } from '../stores/iot';
import type { Geofence, FenceRules, FenceRuleType, FenceSchedule } from '../types';

const store = useIotStore();

const colorOptions = ['#4caf50', '#e53935', '#1976d2', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];

const ruleTypes: Array<{ type: FenceRuleType; name: string }> = [
  { type: 'enter', name: '进入围栏时告警' },
  { type: 'exit', name: '离开围栏时告警' },
  { type: 'dwell', name: '停留超时告警' }
];

function defaultRules(): FenceRules {
  return {
    enter: { enabled: false, severity: 'critical' },
    exit: { enabled: false, severity: 'warning' },
    dwell: { enabled: false, severity: 'warning', dwellMinutes: 30 }
  };
}

function defaultSchedule(): FenceSchedule {
  return { enabled: false, startTime: '08:00', endTime: '20:00' };
}

const editingFence = ref<Partial<Geofence>>({
  name: '',
  color: '#1976d2',
  alertOnEnter: false,
  alertOnExit: false,
  type: 'circle',
  radius: 100,
  center: { lat: 0, lng: 0 }
});

const editingRules = ref<FenceRules>(defaultRules());
const editingSchedule = ref<FenceSchedule>(defaultSchedule());

const drawingHint = computed(() => {
  if (store.editMode === 'draw-circle') return '点击地图设置圆心，拖动调整半径';
  if (store.editMode === 'draw-polygon') return '点击地图添加顶点，双击完成绘制';
  return '';
});

const rulePriorityList = computed(() => store.getFenceRulePriorityList({ rules: editingRules.value }));

const previewSummary = computed(() =>
  store.getFenceRuleSummary({ rules: editingRules.value, schedule: editingSchedule.value })
);

watch(() => store.selectedFence, (fence) => {
  if (fence) {
    editingFence.value = {
      name: fence.name,
      color: fence.color,
      alertOnEnter: fence.alertOnEnter,
      alertOnExit: fence.alertOnExit,
      type: fence.type,
      radius: fence.radius,
      center: { ...fence.center },
      paths: fence.paths ? [...fence.paths] : undefined
    };
    editingRules.value = JSON.parse(JSON.stringify(store.normalizeFenceRules(fence)));
    editingSchedule.value = { ...store.normalizeFenceSchedule(fence) };
  }
}, { immediate: true, deep: true });

function ruleLabel(type: FenceRuleType): string {
  return store.getFenceRuleLabel({ rules: editingRules.value }, type);
}

function fenceBadges(f: Geofence): string[] {
  const rules = store.normalizeFenceRules(f);
  const badges: string[] = [];
  if (rules.enter.enabled) badges.push('📍入');
  if (rules.exit.enabled) badges.push('📍出');
  if (rules.dwell.enabled) badges.push('⏱️停');
  if (store.normalizeFenceSchedule(f).enabled) badges.push('🕒时段');
  return badges;
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

function resetEditing() {
  editingFence.value = {};
  editingRules.value = defaultRules();
  editingSchedule.value = defaultSchedule();
}

function cancelEdit() {
  store.setEditMode('none');
  resetEditing();
}

function selectFence(id: string) {
  store.selectFence(id);
}

function saveFence() {
  if (store.selectedFenceId && editingFence.value) {
    store.updateFence(store.selectedFenceId, {
      ...editingFence.value,
      rules: JSON.parse(JSON.stringify(editingRules.value)),
      schedule: { ...editingSchedule.value },
      alertOnEnter: editingRules.value.enter.enabled,
      alertOnExit: editingRules.value.exit.enabled
    });
  }
}

function deleteCurrentFence() {
  if (store.selectedFenceId && confirm('确定要删除该围栏吗？')) {
    store.deleteFence(store.selectedFenceId);
    resetEditing();
  }
}
</script>
