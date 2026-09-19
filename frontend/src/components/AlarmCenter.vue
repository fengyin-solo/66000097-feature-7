<template>
  <div style="width:360px;padding:16px;overflow:auto;border-left:1px solid #e0e0e0;display:flex;flex-direction:column;height:100vh;box-sizing:border-box;background:#fafafa">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 style="margin:0;display:flex;align-items:center;gap:8px">
        🔔 实时告警中心
      </h3>
      <span v-if="store.alertCount > 0"
        :style="{ padding:'2px 8px', borderRadius:'10px', background:'#e53935', color:'#fff', fontSize:'12px', fontWeight:600 }">
        {{ store.alertCount }}
      </span>
    </div>

    <div style="display:flex;gap:6px;margin-bottom:12px">
      <button @click="activeTab = 'all'"
        :style="{ flex:1, padding:'6px 8px', borderRadius:'6px', border:'1px solid ' + (activeTab === 'all' ? '#1976d2' : '#ddd'),
          background: activeTab === 'all' ? '#e3f2fd' : '#fff', color: activeTab === 'all' ? '#1976d2' : '#666',
          cursor:'pointer', fontSize:'12px', fontWeight:500 }">
        全部 ({{ store.alertCount }})
      </button>
      <button @click="activeTab = 'critical'"
        :style="{ flex:1, padding:'6px 8px', borderRadius:'6px', border:'1px solid ' + (activeTab === 'critical' ? '#e53935' : '#ddd'),
          background: activeTab === 'critical' ? '#ffebee' : '#fff', color: activeTab === 'critical' ? '#e53935' : '#666',
          cursor:'pointer', fontSize:'12px', fontWeight:500 }">
        严重 ({{ store.criticalCount }})
      </button>
      <button @click="activeTab = 'warning'"
        :style="{ flex:1, padding:'6px 8px', borderRadius:'6px', border:'1px solid ' + (activeTab === 'warning' ? '#ff9800' : '#ddd'),
          background: activeTab === 'warning' ? '#fff3e0' : '#fff', color: activeTab === 'warning' ? '#ff9800' : '#666',
          cursor:'pointer', fontSize:'12px', fontWeight:500 }">
        警告 ({{ store.warningCount }})
      </button>
      <button @click="activeTab = 'info'"
        :style="{ flex:1, padding:'6px 8px', borderRadius:'6px', border:'1px solid ' + (activeTab === 'info' ? '#2196f3' : '#ddd'),
          background: activeTab === 'info' ? '#e3f2fd' : '#fff', color: activeTab === 'info' ? '#2196f3' : '#666',
          cursor:'pointer', fontSize:'12px', fontWeight:500 }">
        提示 ({{ store.infoCount }})
      </button>
    </div>

    <div v-if="currentAlerts.length > 0" style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:#666">
        <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" style="cursor:pointer">
        全选
      </label>
      <button v-if="selectedIds.length > 0" @click="handleBatchAcknowledge"
        :style="{ padding:'5px 12px', borderRadius:'4px', border:'none', background:'#4caf50', color:'#fff',
          cursor:'pointer', fontSize:'12px', fontWeight:500 }">
        ✓ 确认处理 ({{ selectedIds.length }})
      </button>
      <button v-if="store.alertCount > 0" @click="handleAcknowledgeAll"
        :style="{ padding:'5px 12px', borderRadius:'4px', border:'1px solid #999', background:'#fff', color:'#666',
          cursor:'pointer', fontSize:'12px' }">
        全部确认
      </button>
    </div>

    <div style="flex:1;overflow:auto;display:flex;flex-direction:column;gap:8px">
      <template v-if="activeTab === 'all'">
        <div v-if="store.criticalAlerts.length > 0">
          <div style="font-size:11px;color:#e53935;fontWeight:600;marginBottom:6px;paddingLeft:4px">
            🔴 严重告警 ({{ store.criticalAlerts.length }})
          </div>
          <div v-for="alert in store.criticalAlerts" :key="alert.id"
            @click="handleAlertClick(alert)"
            @mouseenter="handleHover(alert.deviceId)"
            @mouseleave="handleHover(null)"
            :style="{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px', marginBottom:'6px',
              borderRadius:'8px', border:'1px solid ' + (store.highlightedDeviceId === alert.deviceId ? '#e53935' : '#ffcdd2'),
              background: store.highlightedDeviceId === alert.deviceId ? '#ffebee' : '#fff',
              cursor:'pointer', position:'relative' }">
            <input type="checkbox" v-model="selectedIds" :value="alert.id"
              @click.stop style="marginTop:2px;cursor:pointer">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;marginBottom:4px">
                <span :style="{ fontSize:'14px' }">{{ getAlertIcon(alert.type) }}</span>
                <span style="fontWeight:600;fontSize:13px;color:#333">{{ alert.message }}</span>
              </div>
              <div style="fontSize:11px;color:#888;marginBottom:4px">
                📱 {{ getDeviceName(alert.deviceId) }}
                <span v-if="alert.fenceId" style="marginLeft:8px">
                  🗺️ {{ getFenceName(alert.fenceId) }}
                </span>
              </div>
              <div style="fontSize:10px;color:#999">
                {{ formatTime(alert.timestamp) }}
              </div>
            </div>
            <button @click.stop="handleAcknowledge(alert.id)"
              :style="{ padding:'3px 8px', borderRadius:'4px', border:'1px solid #e53935', background:'transparent',
                color:'#e53935', cursor:'pointer', fontSize:'11px' }">
              确认
            </button>
          </div>
        </div>

        <div v-if="store.warningAlerts.length > 0" style="marginTop:8px">
          <div style="font-size:11px;color:#ff9800;fontWeight:600;marginBottom:6px;paddingLeft:4px">
            🟠 警告 ({{ store.warningAlerts.length }})
          </div>
          <div v-for="alert in store.warningAlerts" :key="alert.id"
            @click="handleAlertClick(alert)"
            @mouseenter="handleHover(alert.deviceId)"
            @mouseleave="handleHover(null)"
            :style="{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px', marginBottom:'6px',
              borderRadius:'8px', border:'1px solid ' + (store.highlightedDeviceId === alert.deviceId ? '#ff9800' : '#ffe0b2'),
              background: store.highlightedDeviceId === alert.deviceId ? '#fff3e0' : '#fff',
              cursor:'pointer', position:'relative' }">
            <input type="checkbox" v-model="selectedIds" :value="alert.id"
              @click.stop style="marginTop:2px;cursor:pointer">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;marginBottom:4px">
                <span :style="{ fontSize:'14px' }">{{ getAlertIcon(alert.type) }}</span>
                <span style="fontWeight:600;fontSize:13px;color:#333">{{ alert.message }}</span>
              </div>
              <div style="fontSize:11px;color:#888;marginBottom:4px">
                📱 {{ getDeviceName(alert.deviceId) }}
                <span v-if="alert.fenceId" style="marginLeft:8px">
                  🗺️ {{ getFenceName(alert.fenceId) }}
                </span>
              </div>
              <div style="fontSize:10px;color:#999">
                {{ formatTime(alert.timestamp) }}
              </div>
            </div>
            <button @click.stop="handleAcknowledge(alert.id)"
              :style="{ padding:'3px 8px', borderRadius:'4px', border:'1px solid #ff9800', background:'transparent',
                color:'#ff9800', cursor:'pointer', fontSize:'11px' }">
              确认
            </button>
          </div>
        </div>

        <div v-if="store.infoAlerts.length > 0" style="marginTop:8px">
          <div style="font-size:11px;color:#2196f3;fontWeight:600;marginBottom:6px;paddingLeft:4px">
            🔵 提示 ({{ store.infoAlerts.length }})
          </div>
          <div v-for="alert in store.infoAlerts" :key="alert.id"
            @click="handleAlertClick(alert)"
            @mouseenter="handleHover(alert.deviceId)"
            @mouseleave="handleHover(null)"
            :style="{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px', marginBottom:'6px',
              borderRadius:'8px', border:'1px solid ' + (store.highlightedDeviceId === alert.deviceId ? '#2196f3' : '#bbdefb'),
              background: store.highlightedDeviceId === alert.deviceId ? '#e3f2fd' : '#fff',
              cursor:'pointer', position:'relative' }">
            <input type="checkbox" v-model="selectedIds" :value="alert.id"
              @click.stop style="marginTop:2px;cursor:pointer">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;marginBottom:4px">
                <span :style="{ fontSize:'14px' }">{{ getAlertIcon(alert.type) }}</span>
                <span style="fontWeight:600;fontSize:13px;color:#333">{{ alert.message }}</span>
              </div>
              <div style="fontSize:11px;color:#888;marginBottom:4px">
                📱 {{ getDeviceName(alert.deviceId) }}
                <span v-if="alert.fenceId" style="marginLeft:8px">
                  🗺️ {{ getFenceName(alert.fenceId) }}
                </span>
              </div>
              <div style="fontSize:10px;color:#999">
                {{ formatTime(alert.timestamp) }}
              </div>
            </div>
            <button @click.stop="handleAcknowledge(alert.id)"
              :style="{ padding:'3px 8px', borderRadius:'4px', border:'1px solid #2196f3', background:'transparent',
                color:'#2196f3', cursor:'pointer', fontSize:'11px' }">
              确认
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div v-for="alert in currentAlerts" :key="alert.id"
          @click="handleAlertClick(alert)"
          @mouseenter="handleHover(alert.deviceId)"
          @mouseleave="handleHover(null)"
          :style="{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px', marginBottom:'6px',
            borderRadius:'8px', border:'1px solid ' + (store.highlightedDeviceId === alert.deviceId ? getSeverityColor(alert.severity) : getSeverityBorderColor(alert.severity)),
            background: store.highlightedDeviceId === alert.deviceId ? getSeverityBgColor(alert.severity) : '#fff',
            cursor:'pointer', position:'relative' }">
          <input type="checkbox" v-model="selectedIds" :value="alert.id"
            @click.stop style="marginTop:2px;cursor:pointer">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px;marginBottom:4px">
              <span :style="{ fontSize:'14px' }">{{ getAlertIcon(alert.type) }}</span>
              <span style="fontWeight:600;fontSize:13px;color:#333">{{ alert.message }}</span>
            </div>
            <div style="fontSize:11px;color:#888;marginBottom:4px">
              📱 {{ getDeviceName(alert.deviceId) }}
              <span v-if="alert.fenceId" style="marginLeft:8px">
                🗺️ {{ getFenceName(alert.fenceId) }}
              </span>
            </div>
            <div style="fontSize:10px;color:#999">
              {{ formatTime(alert.timestamp) }}
            </div>
          </div>
          <button @click.stop="handleAcknowledge(alert.id)"
            :style="{ padding:'3px 8px', borderRadius:'4px', border:'1px solid ' + getSeverityColor(alert.severity), background:'transparent',
              color: getSeverityColor(alert.severity), cursor:'pointer', fontSize:'11px' }">
            确认
          </button>
        </div>
      </template>

      <div v-if="currentAlerts.length === 0"
        style="textAlign:center;padding:40px 20px;color:#999;fontSize:13px">
        <div style="fontSize:40px;marginBottom:8px">✅</div>
        <div>暂无{{ tabName }}告警</div>
      </div>
    </div>

    <div v-if="store.alertCount > 0" style="marginTop:12px;paddingTop:12px;borderTop:1px solid #e0e0e0">
      <div style="display:flex;align-items:center;justify-content:space-between;fontSize:12px;color:#666">
        <span>模拟告警流</span>
        <button @click="toggleMockStream"
          :style="{ padding:'4px 12px', borderRadius:'4px', border:'1px solid ' + (mockStreamEnabled ? '#4caf50' : '#ccc'),
            background: mockStreamEnabled ? '#e8f5e9' : '#fff', color: mockStreamEnabled ? '#2e7d32' : '#666',
            cursor:'pointer', fontSize:'12px' }">
          {{ mockStreamEnabled ? '● 运行中' : '○ 已停止' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useIotStore } from '../stores/iot';
import type { Alert, AlertType, AlertSeverity } from '../types';

const store = useIotStore();

const activeTab = ref<'all' | 'critical' | 'warning' | 'info'>('all');
const selectedIds = ref<string[]>([]);
const selectAll = ref(false);
const mockStreamEnabled = ref(false);

const currentAlerts = computed(() => {
  switch (activeTab.value) {
    case 'critical':
      return store.criticalAlerts;
    case 'warning':
      return store.warningAlerts;
    case 'info':
      return store.infoAlerts;
    default:
      return store.unacknowledgedAlerts;
  }
});

const tabName = computed(() => {
  switch (activeTab.value) {
    case 'critical': return '严重';
    case 'warning': return '警告';
    case 'info': return '提示';
    default: return '';
  }
});

function getAlertIcon(type: AlertType): string {
  switch (type) {
    case 'enter': return '🚨';
    case 'exit': return '🚪';
    case 'dwell': return '⏱️';
    case 'low_battery': return '🔋';
    case 'offline': return '📵';
    default: return '⚠️';
  }
}

function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '#e53935';
    case 'warning': return '#ff9800';
    case 'info': return '#2196f3';
    default: return '#666';
  }
}

function getSeverityBorderColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '#ffcdd2';
    case 'warning': return '#ffe0b2';
    case 'info': return '#bbdefb';
    default: return '#e0e0e0';
  }
}

function getSeverityBgColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '#ffebee';
    case 'warning': return '#fff3e0';
    case 'info': return '#e3f2fd';
    default: return '#f5f5f5';
  }
}

function getDeviceName(deviceId: string): string {
  return store.getDeviceById(deviceId)?.name || '未知设备';
}

function getFenceName(fenceId: string): string {
  return store.getFenceById(fenceId)?.name || '未知围栏';
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + ' 分钟前';
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + ' 小时前';
  } else {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function handleAlertClick(alert: Alert) {
  store.setHighlightedDevice(alert.deviceId);
}

function handleHover(deviceId: string | null) {
  store.setHighlightedDevice(deviceId);
}

function handleAcknowledge(id: string) {
  store.acknowledgeAlert(id);
  selectedIds.value = selectedIds.value.filter(i => i !== id);
}

function handleBatchAcknowledge() {
  if (selectedIds.value.length > 0) {
    store.batchAcknowledgeAlerts(selectedIds.value);
    selectedIds.value = [];
    selectAll.value = false;
  }
}

function handleAcknowledgeAll() {
  if (confirm('确定要确认所有告警吗？')) {
    store.acknowledgeAllAlerts();
    selectedIds.value = [];
    selectAll.value = false;
  }
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = currentAlerts.value.map(a => a.id);
  } else {
    selectedIds.value = [];
  }
}

watch(currentAlerts, () => {
  const allSelected = currentAlerts.value.length > 0 &&
    currentAlerts.value.every(a => selectedIds.value.includes(a.id));
  selectAll.value = allSelected;
}, { deep: true });

function toggleMockStream() {
  mockStreamEnabled.value = !mockStreamEnabled.value;
  if (mockStreamEnabled.value) {
    store.startMockAlertStream();
  } else {
    store.stopMockAlertStream();
  }
}

onMounted(() => {
});

onUnmounted(() => {
  store.stopMockAlertStream();
  store.setHighlightedDevice(null);
});
</script>
