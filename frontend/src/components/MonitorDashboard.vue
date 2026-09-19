<template>
  <div style="display:flex;flex-direction:column;height:100vh;background:#0a1929;color:#e0e0e0;font-family:sans-serif;overflow:hidden">
    <header style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:#0d2137;border-bottom:1px solid #1e3a5f;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="font-size:28px">📡</div>
        <div>
          <h1 style="margin:0;font-size:20px;color:#4fc3f7;font-weight:600">IoT 监控大屏</h1>
          <div style="font-size:12px;color:#78909c">实时监控 · 值班模式</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:24px">
        <div style="text-align:right">
          <div style="font-size:24px;font-weight:600;color:#fff;letter-spacing:2px">{{ currentTime }}</div>
          <div style="font-size:12px;color:#78909c">{{ currentDate }}</div>
        </div>
        <button @click="emit('close')" class="dashboard-btn dashboard-btn-close">
          ✕ 退出大屏
        </button>
      </div>
    </header>

    <div style="display:flex;flex:1;gap:12px;padding:12px;overflow:hidden">
      <div style="width:280px;display:flex;flex-direction:column;gap:12px;flex-shrink:0">
        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:16px">
          <div style="font-size:12px;color:#78909c;margin-bottom:8px">设备总数</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="font-size:36px;font-weight:700;color:#4fc3f7">{{ store.deviceCount }}</span>
            <span style="font-size:12px;color:#78909c">台</span>
          </div>
        </div>

        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:16px">
          <div style="font-size:12px;color:#78909c;margin-bottom:8px">在线设备</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="font-size:36px;font-weight:700;color:#4caf50">{{ store.onlineCount }}</span>
            <span style="font-size:14px;color:#78909c">
              {{ store.deviceCount > 0 ? Math.round(store.onlineCount / store.deviceCount * 100) : 0 }}%
            </span>
          </div>
          <div style="margin-top:8px;height:4px;background:#1e3a5f;border-radius:2px;overflow:hidden">
            <div :style="{ width: (store.deviceCount > 0 ? store.onlineCount / store.deviceCount * 100 : 0) + '%', height:'100%', background:'#4caf50', transition:'width 0.5s' }"></div>
          </div>
        </div>

        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:16px">
          <div style="font-size:12px;color:#78909c;margin-bottom:8px">告警设备</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <span style="font-size:36px;font-weight:700;color:#ff9800">{{ store.alertDeviceCount }}</span>
          </div>
        </div>

        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:16px">
          <div style="font-size:12px;color:#78909c;margin-bottom:8px">离线设备</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <span :style="{ fontSize:'36px', fontWeight:700, color: store.offlineCount > 0 ? '#e53935' : '#78909c' }">{{ store.offlineCount }}</span>
          </div>
        </div>

        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:16px">
          <div style="font-size:12px;color:#78909c;margin-bottom:8px">未处理告警</div>
          <div style="display:flex;align-items:baseline;gap:8px">
            <span :style="{ fontSize:'36px', fontWeight:700, color: store.alertCount > 0 ? '#f44336' : '#4caf50', animation: store.alertCount > 0 ? 'pulse 2s infinite' : 'none' }">
              {{ store.alertCount }}
            </span>
          </div>
          <div style="display:flex;gap:8px;margin-top:8px;font-size:11px">
            <span style="color:#f44336">🔴 {{ store.criticalCount }}</span>
            <span style="color:#ff9800">🟠 {{ store.warningCount }}</span>
            <span style="color:#2196f3">🔵 {{ store.infoCount }}</span>
          </div>
        </div>

        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span style="font-size:12px;color:#78909c">围栏数量</span>
            <span style="font-size:24px;font-weight:700;color:#9c27b0">{{ store.fenceCount }}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span style="font-size:12px;color:#78909c">平均电量</span>
            <span :style="{ fontSize:'24px', fontWeight:700, color: store.avgBattery < 30 ? '#ff9800' : '#4caf50' }">
              {{ store.avgBattery }}%
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:#78909c">平均温度</span>
            <span :style="{ fontSize:'24px', fontWeight:700, color: store.avgTemperature > 35 ? '#ff9800' : '#4fc3f7' }">
              {{ store.avgTemperature }}°C
            </span>
          </div>
        </div>
      </div>

      <div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0">
        <div style="flex:1;background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;overflow:hidden;position:relative;min-height:0">
          <div id="monitor-map" style="width:100%;height:100%;filter:brightness(0.85) contrast(1.1)"></div>
          <div style="position:absolute;top:12px;left:12px;background:rgba(13,33,55,0.9);border:1px solid #1e3a5f;border-radius:6px;padding:8px 12px;font-size:12px">
            <div style="display:flex;gap:16px;align-items:center">
              <span style="display:flex;align-items:center;gap:4px">
                <span style="width:8px;height:8px;border-radius:50%;background:#4caf50"></span>
                在线 {{ store.onlineCount }}
              </span>
              <span style="display:flex;align-items:center;gap:4px">
                <span style="width:8px;height:8px;border-radius:50%;background:#ff9800"></span>
                告警 {{ store.alertDeviceCount }}
              </span>
              <span style="display:flex;align-items:center;gap:4px">
                <span style="width:8px;height:8px;border-radius:50%;background:#9e9e9e"></span>
                离线 {{ store.offlineCount }}
              </span>
            </div>
          </div>
        </div>

        <div style="height:220px;background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:12px;display:flex;flex-direction:column;flex-shrink:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-shrink:0">
            <h3 style="margin:0;font-size:14px;color:#4fc3f7;display:flex;align-items:center;gap:8px">
              🔔 最新告警
              <span v-if="store.alertCount > 0"
                style="padding:2px 8px;border-radius:10px;background:#f44336;color:#fff;font-size:11px;font-weight:600;animation:pulse 2s infinite">
                {{ store.alertCount }}
              </span>
            </h3>
            <button @click="toggleAutoScroll"
              :style="{ padding:'4px 12px', borderRadius:'4px', border:'1px solid #37474f', background: autoScroll ? '#1b5e20' : '#1e3a5f', color:'#e0e0e0', cursor:'pointer', fontSize:'12px' }">
              {{ autoScroll ? '⏸ 暂停滚动' : '▶ 自动滚动' }}
            </button>
          </div>
          <div ref="alertScrollContainer" style="flex:1;overflow:hidden;position:relative">
            <div ref="alertScrollContent" :style="{ transition: 'transform 0.5s ease', transform: `translateY(-${scrollOffset}px)` }">
              <div v-for="alert in store.recentAlerts" :key="alert.id"
                :style="{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', marginBottom:'6px', borderRadius:'6px',
                  border:'1px solid ' + getSeverityBorderColor(alert.severity),
                  background: getSeverityBgColor(alert.severity), fontSize:'12px' }">
                <span :style="{ fontSize:'16px' }">{{ getAlertIcon(alert.type) }}</span>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span :style="{ fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }">
                      {{ alert.message }}
                    </span>
                    <span v-if="alert.acknowledged" style="padding:1px 6px;border-radius:8px;background:#2e7d32;color:#a5d6a7;font-size:10px">已确认</span>
                  </div>
                  <div style="font-size:11px;color:#90a4ae;margin-top:2px">
                    {{ getDeviceName(alert.deviceId) }}
                    <span v-if="alert.fenceId" style="margin-left:8px">{{ store.getAlertFenceLabel(alert) }}</span>
                    <span style="margin-left:8px">{{ formatTime(alert.timestamp) }}</span>
                  </div>
                </div>
                <span :style="{ padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:500,
                  background: getSeverityColor(alert.severity) + '20', color: getSeverityColor(alert.severity) }">
                  {{ getSeverityText(alert.severity) }}
                </span>
              </div>
              <div v-for="alert in store.recentAlerts" :key="'dup-' + alert.id"
                :style="{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', marginBottom:'6px', borderRadius:'6px',
                  border:'1px solid ' + getSeverityBorderColor(alert.severity),
                  background: getSeverityBgColor(alert.severity), fontSize:'12px' }">
                <span :style="{ fontSize:'16px' }">{{ getAlertIcon(alert.type) }}</span>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span :style="{ fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }">
                      {{ alert.message }}
                    </span>
                    <span v-if="alert.acknowledged" style="padding:1px 6px;border-radius:8px;background:#2e7d32;color:#a5d6a7;font-size:10px">已确认</span>
                  </div>
                  <div style="font-size:11px;color:#90a4ae;margin-top:2px">
                    {{ getDeviceName(alert.deviceId) }}
                    <span v-if="alert.fenceId" style="margin-left:8px">{{ store.getAlertFenceLabel(alert) }}</span>
                    <span style="margin-left:8px">{{ formatTime(alert.timestamp) }}</span>
                  </div>
                </div>
                <span :style="{ padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:500,
                  background: getSeverityColor(alert.severity) + '20', color: getSeverityColor(alert.severity) }">
                  {{ getSeverityText(alert.severity) }}
                </span>
              </div>
            </div>
            <div v-if="store.recentAlerts.length === 0"
              style="text-align:center;padding:40px 20px;color:#546e7a;font-size:13px">
              <div style="font-size:32px;margin-bottom:8px">✅</div>
              <div>暂无告警</div>
            </div>
          </div>
        </div>
      </div>

      <div style="width:300px;display:flex;flex-direction:column;gap:12px;flex-shrink:0">
        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:12px;display:flex;flex-direction:column;flex:1;min-height:0">
          <h3 style="margin:0 0 12px 0;font-size:14px;color:#4fc3f7;display:flex;align-items:center;gap:8px;flex-shrink:0">
            📊 设备状态排行
          </h3>
          <div style="flex:1;overflow:auto;padding-right:4px">
            <div v-for="(device, index) in store.devicesRanked" :key="device.id"
              @click="handleDeviceClick(device.id)"
              class="device-rank-item"
              :class="{ 'device-rank-item-active': store.highlightedDeviceId === device.id }"
              :style="{ borderColor: store.highlightedDeviceId === device.id ? '#4fc3f7' : '#1e3a5f' }">
              <div :style="{ width:'24px', height:'24px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'12px', fontWeight:700,
                background: index < 3 ? (index === 0 ? '#f44336' : index === 1 ? '#ff9800' : '#ffb300') : '#1e3a5f',
                color: index < 3 ? '#fff' : '#78909c' }">
                {{ index + 1 }}
              </div>
              <span :style="{ width:'10px', height:'10px', borderRadius:'50%', flexShrink:0,
                background: device.status === 'online' ? '#4caf50' : device.status === 'alert' ? '#ff9800' : '#9e9e9e' }"></span>
              <div style="flex:1;min-width:0">
                <div style="fontWeight:500;fontSize:13px;color:#e0e0e0;whiteSpace:'nowrap';overflow:'hidden';textOverflow:'ellipsis'">
                  {{ device.name }}
                </div>
                <div style="fontSize:11px;color:#78909c;marginTop:2px;display:flex;gap:8px">
                  <span>🔋 {{ device.battery }}%</span>
                  <span>🌡 {{ device.temperature }}°C</span>
                </div>
              </div>
              <span :style="{ fontSize:'10px', padding:'2px 6px', borderRadius:'4px',
                background: device.status === 'online' ? '#1b5e20' : device.status === 'alert' ? '#e65100' : '#424242',
                color: device.status === 'online' ? '#a5d6a7' : device.status === 'alert' ? '#ffcc80' : '#9e9e9e' }">
                {{ device.status === 'online' ? '在线' : device.status === 'alert' ? '告警' : '离线' }}
              </span>
            </div>
          </div>
        </div>

        <div style="background:#0d2137;border:1px solid #1e3a5f;border-radius:8px;padding:12px;flex-shrink:0">
          <div style="font-size:12px;color:#78909c;margin-bottom:8px">低电量预警</div>
          <div v-if="store.lowBatteryCount > 0" style="display:flex;align-items:center;gap:8px">
            <span style="font-size:28px;color:#ff9800">⚠️</span>
            <div>
              <div style="font-size:24px;font-weight:700;color:#ff9800">{{ store.lowBatteryCount }}</div>
              <div style="font-size:11px;color:#78909c">台设备电量低于20%</div>
            </div>
          </div>
          <div v-else style="display:flex;align-items:center;gap:8px">
            <span style="font-size:28px;color:#4caf50">✅</span>
            <div>
              <div style="font-size:18px;font-weight:700;color:#4caf50">正常</div>
              <div style="font-size:11px;color:#78909c">所有设备电量充足</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="padding:8px 24px;background:#0d2137;border-top:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#546e7a;flex-shrink:0">
      <div>
        <span :style="{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:'#4caf50', marginRight:'6px', animation:'pulse 2s infinite' }"></span>
        系统运行正常 · 最后更新: {{ lastUpdate }}
      </div>
      <div>IoT Geofence Monitor v1.0.0</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import { useIotStore } from '../stores/iot';
import type { Alert, AlertType, AlertSeverity, Device } from '../types';

const store = useIotStore();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const currentTime = ref('');
const currentDate = ref('');
const lastUpdate = ref('');
const autoScroll = ref(true);
const scrollOffset = ref(0);
const alertScrollContainer = ref<HTMLElement | null>(null);
const alertScrollContent = ref<HTMLElement | null>(null);

const map = ref<any>(null);
const fenceLayers = ref<Map<string, any>>(new Map());
const deviceLayers = ref<Map<string, any>>(new Map());

let timeInterval: number | null = null;
let scrollInterval: number | null = null;

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' });
  lastUpdate.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

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
    case 'critical': return '#f44336';
    case 'warning': return '#ff9800';
    case 'info': return '#2196f3';
    default: return '#666';
  }
}

function getSeverityBorderColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '#c62828';
    case 'warning': return '#ef6c00';
    case 'info': return '#1565c0';
    default: return '#1e3a5f';
  }
}

function getSeverityBgColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return 'rgba(244, 67, 54, 0.1)';
    case 'warning': return 'rgba(255, 152, 0, 0.1)';
    case 'info': return 'rgba(33, 150, 243, 0.1)';
    default: return '#0a1929';
  }
}

function getSeverityText(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical': return '严重';
    case 'warning': return '警告';
    case 'info': return '提示';
    default: return '未知';
  }
}

function getDeviceName(deviceId: string): string {
  return store.getDeviceById(deviceId)?.name || '未知设备';
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前';
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前';
  } else {
    return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}

function handleDeviceClick(id: string) {
  store.setHighlightedDevice(id);
  panToDevice(id);
}

function panToDevice(deviceId: string) {
  const device = store.getDeviceById(deviceId);
  if (device && map.value) {
    map.value.panTo([device.lat, device.lng], { animate: true, duration: 0.5 });
  }
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value;
}

function renderFence(fence: any) {
  const layer = fenceLayers.value.get(fence.id);
  if (layer) {
    map.value!.removeLayer(layer);
  }

  const style = {
    color: fence.color,
    fillColor: fence.color,
    fillOpacity: 0.15,
    weight: 2,
    dashArray: undefined
  };

  let layerObj: any;

  if (fence.type === 'circle') {
    layerObj = L.circle([fence.center.lat, fence.center.lng], {
      ...style,
      radius: fence.radius
    }).addTo(map.value!);
  } else if (fence.type === 'polygon' && fence.paths && fence.paths.length >= 3) {
    const latlngs = fence.paths.map((p: any) => [p.lat, p.lng] as [number, number]);
    layerObj = L.polygon(latlngs, style).addTo(map.value!);
  }

  if (layerObj) {
    layerObj.bindPopup(`<b>${fence.name}</b><br>${fence.type === 'circle' ? '圆形 · ' + fence.radius + 'm' : '多边形 · ' + (fence.paths?.length || 0) + '点'}<br>${store.getFenceRuleSummary(fence)}`);
    fenceLayers.value.set(fence.id, layerObj);
  }
}

function renderAllFences() {
  fenceLayers.value.forEach(layer => map.value!.removeLayer(layer));
  fenceLayers.value.clear();
  store.fences.forEach(f => renderFence(f));
}

function renderAllDevices() {
  deviceLayers.value.forEach(d => map.value!.removeLayer(d));
  deviceLayers.value.clear();

  store.devices.forEach(d => {
    const isHighlighted = store.highlightedDeviceId === d.id;
    const color = d.status === 'online' ? '#4caf50' : d.status === 'alert' ? '#ff9800' : '#9e9e9e';
    const baseRadius = 10;
    const radius = isHighlighted ? baseRadius + 8 : baseRadius;
    const weight = isHighlighted ? 4 : 2;

    if (d.status !== 'offline') {
      const pulseCircle = L.circleMarker([d.lat, d.lng], {
        radius: radius + 6,
        color: color,
        fillColor: color,
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '3,3',
        className: 'pulse-ring'
      }).addTo(map.value!);
      deviceLayers.value.set(d.id + '-pulse', pulseCircle);
    }

    const marker = L.circleMarker([d.lat, d.lng], {
      radius,
      color,
      fillColor: color,
      fillOpacity: isHighlighted ? 1 : 0.9,
      weight
    })
      .addTo(map.value!)
      .bindPopup(`<b>${d.name}</b><br>状态: ${d.status === 'online' ? '在线' : d.status === 'alert' ? '告警' : '离线'}<br>电量: ${d.battery}%<br>温度: ${d.temperature}°C`, { className: 'dark-popup' });

    if (isHighlighted) {
      marker.openPopup();
    }

    deviceLayers.value.set(d.id, marker);
  });
}

function updateScroll() {
  if (!autoScroll.value || !alertScrollContent.value || !alertScrollContainer.value) return;

  const contentHeight = alertScrollContent.value.scrollHeight / 2;
  scrollOffset.value += 1;

  if (scrollOffset.value >= contentHeight) {
    scrollOffset.value = 0;
  }
}

watch(() => store.fences, () => {
  renderAllFences();
}, { deep: true });

watch(() => store.devices, () => {
  renderAllDevices();
  lastUpdate.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, { deep: true });

watch(() => store.highlightedDeviceId, (newId) => {
  renderAllDevices();
  if (newId) {
    panToDevice(newId);
  }
});

onMounted(() => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .pulse-ring {
      animation: pulse-ring 2s ease-out infinite;
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    .dashboard-btn {
      padding: 8px 16px;
      color: #e0e0e0;
      border: 1px solid #37474f;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .dashboard-btn-close {
      background: #1e3a5f;
    }
    .dashboard-btn-close:hover {
      background: #29434e;
    }
    .device-rank-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      margin-bottom: 6px;
      border-radius: 6px;
      border: 1px solid #1e3a5f;
      background: #0a1929;
      cursor: pointer;
      transition: all 0.2s;
    }
    .device-rank-item:hover {
      background: #132f4c;
    }
    .device-rank-item-active {
      background: #132f4c !important;
    }
    .dark-popup .leaflet-popup-content-wrapper {
      background: #0d2137;
      color: #e0e0e0;
      border-radius: 6px;
      border: 1px solid #1e3a5f;
    }
    .dark-popup .leaflet-popup-tip {
      background: #0d2137;
    }
    .dark-popup .leaflet-popup-close-button {
      color: #78909c !important;
    }
    .leaflet-container {
      background: #0a1929 !important;
    }
    .leaflet-tile {
      filter: brightness(0.7) invert(0.9) hue-rotate(180deg) contrast(1.1) !important;
    }
    .leaflet-control-zoom a {
      background: #0d2137 !important;
      color: #e0e0e0 !important;
      border-color: #1e3a5f !important;
    }
    .leaflet-control-zoom a:hover {
      background: #132f4c !important;
    }
    .leaflet-control-attribution {
      background: rgba(13,33,55,0.8) !important;
      color: #546e7a !important;
    }
    .leaflet-control-attribution a {
      color: #4fc3f7 !important;
    }
  `;
  document.head.appendChild(style);

  map.value = L.map('monitor-map').setView([39.9042, 116.4074], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map.value);

  renderAllFences();
  renderAllDevices();

  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  scrollInterval = window.setInterval(updateScroll, 50);

  store.startMockAlertStream();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  if (scrollInterval) {
    clearInterval(scrollInterval);
  }
  store.stopMockAlertStream();
  store.setHighlightedDevice(null);
});
</script>
