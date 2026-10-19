<template>
  <div class="model-hub-container">
    <!-- 顶部操作控制栏 -->
    <div class="control-panel">
      <!-- 搜索栏 -->
      <div class="search-box">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索短别名 / 上游模型 ID / 特性说明 (如 kimi, reasoner, 视觉)..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
      </div>

      <!-- 费率模式切换开关 -->
      <div class="rate-toggle">
        <span class="toggle-label" :class="{ active: !isDiscountMode }">上游标杆价</span>
        <label class="switch">
          <input type="checkbox" v-model="isDiscountMode" />
          <span class="slider"></span>
        </label>
        <span class="toggle-label highlight" :class="{ active: isDiscountMode }">
          GOAT 1.25 折实付
        </span>
      </div>
    </div>

    <!-- 品牌厂商分类过滤器 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat"
        class="tab-btn"
        :class="{ active: selectedCategory === cat }"
        @click="selectedCategory = cat"
      >
        <span class="tab-text">{{ cat }}</span>
        <span class="count-badge">
          {{ getCategoryCount(cat) }}
        </span>
      </button>
    </div>

    <!-- 状态统计栏 -->
    <div class="status-bar">
      <span>已筛选匹配 <strong>{{ filteredModels.length }}</strong> 款模型</span>
      <span class="sort-tip">💡 点击表头可升降序排序，点击模型短名或完整 ID 可直接复制</span>
    </div>

    <!-- 动态动画表格 -->
    <div class="table-wrapper">
      <table class="model-table">
        <thead>
          <tr>
            <th class="th-index">#</th>
            <th class="th-short" @click="toggleSort('short')">
              推荐短别名
              <span class="sort-icon">{{ getSortIndicator('short') }}</span>
            </th>
            <th class="th-id" @click="toggleSort('id')">
              完整模型 ID
              <span class="sort-icon">{{ getSortIndicator('id') }}</span>
            </th>
            <th class="th-price" @click="toggleSort('inPrice')">
              输入费率 (/1M)
              <span class="sort-icon">{{ getSortIndicator('inPrice') }}</span>
            </th>
            <th class="th-price" @click="toggleSort('outPrice')">
              输出费率 (/1M)
              <span class="sort-icon">{{ getSortIndicator('outPrice') }}</span>
            </th>
            <th class="th-desc">特性与说明</th>
          </tr>
        </thead>
        <TransitionGroup name="flip-list" tag="tbody">
          <tr
            v-for="(item, index) in filteredModels"
            :key="item.id"
            class="model-row"
          >
            <td class="td-index">{{ index + 1 }}</td>
            <td class="td-short">
              <span
                v-if="item.short"
                class="code-pill clickable"
                @click="copyText(item.short, '短别名')"
                title="点击复制别名"
              >
                {{ item.short }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="td-id">
              <span
                class="code-full clickable"
                @click="copyText(item.id, '完整模型 ID')"
                title="点击复制模型 ID"
              >
                {{ item.id }}
              </span>
            </td>
            <td class="td-price in-price">
              ${{ formatPrice(item.inPrice) }}
            </td>
            <td class="td-price out-price">
              ${{ formatPrice(item.outPrice) }}
            </td>
            <td class="td-desc">{{ item.desc }}</td>
          </tr>
        </TransitionGroup>
      </table>

      <!-- 搜索无结果占位 -->
      <div v-if="filteredModels.length === 0" class="empty-state">
        <p>🔍 没有找到匹配的模型，试试搜索别的关键词吧～</p>
      </div>
    </div>

    <!-- 复制成功微提示 Toast -->
    <Transition name="fade">
      <div v-if="toastMsg" class="toast-popup">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const selectedCategory = ref('全部');
const sortKey = ref('inPrice');
const sortAsc = ref(true);
const isDiscountMode = ref(true); // 默认开启 1.25 折实付展示
const toastMsg = ref('');

const categories = ['全部', 'DeepSeek', 'Kimi', 'GLM', 'Qwen', 'Grok', 'MiniMax', 'Xiaomi', '其它'];

// 50 款经过实测活下来的全部可用模型清单
const rawModels = [
  { short: "qwen-flash", id: "Qwen/Qwen3.8-Flash", vendor: "Qwen", inPrice: 0.03, outPrice: 0.13, desc: "通义千问极速轻量模型，超低延迟与极低成本" },
  { short: "", id: "Qwen/Qwen3.8-Omni-Flash", vendor: "Qwen", inPrice: 0.05, outPrice: 0.20, desc: "通义多模态音频与视觉理解轻量版" },
  { short: "", id: "Qwen/Qwen3.8-27B", vendor: "Qwen", inPrice: 0.08, outPrice: 0.30, desc: "27B 参数紧凑型代码与视觉推理" },
  { short: "glm-5.3-flash", id: "z-ai/glm-5.3-flash", vendor: "GLM", inPrice: 0.10, outPrice: 0.40, desc: "智谱极速高性价比 1M 上下文推理" },
  { short: "minimax", id: "minimax/minimax-m3.1-flash", vendor: "MiniMax", inPrice: 0.10, outPrice: 0.40, desc: "稀宇科技原生多模态，可调思考深度" },
  { short: "mimo", id: "xiaomi/mimo-v2.6-flash", vendor: "Xiaomi", inPrice: 0.12, outPrice: 0.50, desc: "小米 1M 上下文轻量高效代码模型" },
  { short: "deepseek-chat", id: "deepseek/deepseek-v4.1-flash", vendor: "DeepSeek", inPrice: 0.15, outPrice: 0.60, desc: "V4.1 混合注意力超快推理，日常主力首选" },
  { short: "deepseek-v4.1", id: "deepseek/deepseek-v4.1-flash", vendor: "DeepSeek", inPrice: 0.15, outPrice: 0.60, desc: "DeepSeek V4.1 极速版" },
  { short: "", id: "deepseek/deepseek-v4-flash-fast", vendor: "DeepSeek", inPrice: 0.15, outPrice: 0.60, desc: "DeepSeek 极速高吞吐响应模式" },
  { short: "qwen-plus", id: "Qwen/Qwen3.7-Plus", vendor: "Qwen", inPrice: 0.15, outPrice: 0.60, desc: "兼顾性能与成本的通义平衡版" },
  { short: "gemini-flash", id: "google/gemini-3.8-flash", vendor: "其它", inPrice: 0.15, outPrice: 0.60, desc: "谷歌核心轻量高吞吐推理 Flash 模型" },
  { short: "", id: "deepseek/deepseek-v4-flash-vision-exp", vendor: "DeepSeek", inPrice: 0.28, outPrice: 0.60, desc: "DeepSeek 多模态视觉解析增强" },
  { short: "qwen", id: "Qwen/Qwen3.8-Max", vendor: "Qwen", inPrice: 0.40, outPrice: 1.60, desc: "通义旗舰级自主长程逻辑与工具调用" },
  { short: "qwen-max", id: "Qwen/Qwen3.8-Max", vendor: "Qwen", inPrice: 0.40, outPrice: 1.60, desc: "通义千问 3.8 Max 满血旗舰版" },
  { short: "minimax-m3", id: "MiniMaxAI/MiniMax-M3", vendor: "MiniMax", inPrice: 0.40, outPrice: 1.20, desc: "稀宇旗舰多模态 Agent" },
  { short: "mimo-pro", id: "xiaomi/mimo-v2.6-pro", vendor: "Xiaomi", inPrice: 0.50, outPrice: 2.00, desc: "小米旗舰级多模态代码分析" },
  { short: "kimi-k2.5", id: "moonshotai/Kimi-K2.5", vendor: "Kimi", inPrice: 0.60, outPrice: 3.00, desc: "月之暗面前端全栈编码与多模态" },
  { short: "deepseek-reasoner", id: "deepseek/deepseek-v4-pro", vendor: "DeepSeek", inPrice: 0.66, outPrice: 1.98, desc: "满血思维链深度推理模型" },
  { short: "deepseek-v4", id: "deepseek/deepseek-v4-pro", vendor: "DeepSeek", inPrice: 0.66, outPrice: 1.98, desc: "旗舰架构代码与 Agent" },
  { short: "", id: "zai-org/GLM-5.2", vendor: "GLM", inPrice: 0.80, outPrice: 2.50, desc: "智谱稳定工程代码生成" },
  { short: "", id: "moonshotai/Kimi-K2.6", vendor: "Kimi", inPrice: 0.80, outPrice: 3.50, desc: "Kimi 长程 Agent 编程模型" },
  { short: "", id: "stepfun/Step-5-Preview", vendor: "其它", inPrice: 0.80, outPrice: 2.40, desc: "阶跃星辰 600B 稀疏 MoE 架构" },
  { short: "kimi-k2.7", id: "moonshotai/Kimi-K2.7-Code", vendor: "Kimi", inPrice: 0.95, outPrice: 4.00, desc: "Kimi 代码与 Agent 架构专精" },
  { short: "", id: "moonshotai/Kimi-K2.7-Code-Highspeed", vendor: "Kimi", inPrice: 0.95, outPrice: 4.00, desc: "Kimi 高速代码响应模式" },
  { short: "glm-5", id: "zai-org/GLM-5", vendor: "GLM", inPrice: 1.00, outPrice: 3.00, desc: "智谱多模态深度思考与长程规划" },
  { short: "", id: "nvidia/nemotron-3-ultra-550b-a55b", vendor: "其它", inPrice: 1.00, outPrice: 3.00, desc: "英伟达 550B 超大参数自主 Agent" },
  { short: "glm-5.3", id: "zai-org/GLM-5.3", vendor: "GLM", inPrice: 1.50, outPrice: 4.00, desc: "智谱前沿自主智能体能力旗舰" },
  { short: "grok-4.5", id: "xai/grok-4.5", vendor: "Grok", inPrice: 1.50, outPrice: 5.00, desc: "xAI 编码、数学与知识工作" },
  { short: "grok", id: "xai/grok-4.7", vendor: "Grok", inPrice: 2.00, outPrice: 6.00, desc: "xAI 专为多小时复杂长程任务打造" },
  { short: "grok-4.7", id: "xai/grok-4.7", vendor: "Grok", inPrice: 2.00, outPrice: 6.00, desc: "Grok 4.7 旗舰推理与 Agent" },
  { short: "mistral-large", id: "mistral/mistral-large-4", vendor: "其它", inPrice: 2.00, outPrice: 6.00, desc: "欧洲开源旗舰多模态代码分析" },
  { short: "kimi", id: "moonshotai/Kimi-K3", vendor: "Kimi", inPrice: 3.00, outPrice: 15.00, desc: "2.8T 参数、100 万长上下文知识工作" },
  { short: "kimi-k3", id: "moonshotai/Kimi-K3", vendor: "Kimi", inPrice: 3.00, outPrice: 15.00, desc: "Kimi K3 超长窗口旗舰" },
  { short: "", id: "meta/llama-3.3-70b-instruct", vendor: "其它", inPrice: 0.18, outPrice: 0.60, desc: "Meta 开源 Llama 3.3 经典指令微调" },
  { short: "", id: "meta/llama-3.1-405b-instruct", vendor: "其它", inPrice: 1.50, outPrice: 5.00, desc: "Meta 405B 超大参数稠密开源旗舰" },
  { short: "", id: "cohere/command-r-plus-08-2024", vendor: "其它", inPrice: 2.50, outPrice: 10.00, desc: "Cohere 企业级 RAG 与多语言生成" },
  { short: "", id: "01-ai/yi-lightning", vendor: "其它", inPrice: 0.14, outPrice: 0.40, desc: "零一万物极速推理与长程对话" },
  { short: "", id: "baichuan/baichuan-4", vendor: "其它", inPrice: 0.50, outPrice: 1.50, desc: "百川大模型 4 代企业级知识解析" },
  { short: "", id: "tencent/hunyuan-large", vendor: "其它", inPrice: 1.00, outPrice: 3.00, desc: "腾讯混元大模型旗舰版" },
  { short: "", id: "sensetime/sensechat-5.5", vendor: "其它", inPrice: 0.60, outPrice: 2.00, desc: "商汤日日新 5.5 大模型" },
  { short: "", id: "alibaba/qwen-2.5-coder-32b-instruct", vendor: "Qwen", inPrice: 0.10, outPrice: 0.30, desc: "通义代码专用小钢炮模型" },
  { short: "", id: "alibaba/qwen-2.5-72b-instruct", vendor: "Qwen", inPrice: 0.35, outPrice: 1.20, desc: "通义千问 2.5 72B 开源标杆" },
  { short: "", id: "google/gemma-2-27b-it", vendor: "其它", inPrice: 0.20, outPrice: 0.60, desc: "谷歌开源轻量紧凑模型" },
  { short: "", id: "microsoft/phi-4", vendor: "其它", inPrice: 0.08, outPrice: 0.25, desc: "微软极紧凑小模型数学与推理专精" },
  { short: "", id: "deepseek/deepseek-coder-v2.5", vendor: "DeepSeek", inPrice: 0.14, outPrice: 0.28, desc: "DeepSeek 经典代码与数学混合推理" },
  { short: "", id: "openchat/openchat-3.6", vendor: "其它", inPrice: 0.05, outPrice: 0.15, desc: "轻量开源聊天对话模型" },
  { short: "", id: "nousresearch/hermes-3-llama-3.1-70b", vendor: "其它", inPrice: 0.25, outPrice: 0.80, desc: "前沿开源 Agent 与对齐调优" },
  { short: "", id: "upstage/solar-pro", vendor: "其它", inPrice: 0.30, outPrice: 1.00, desc: "Solar Pro 深度长文本处理" },
  { short: "", id: "anthropic/claude-3-haiku-compatible", vendor: "其它", inPrice: 0.25, outPrice: 1.25, desc: "轻量快速响应兼容模型" },
  { short: "", id: "openai/gpt-4o-mini-compatible", vendor: "其它", inPrice: 0.15, outPrice: 0.60, desc: "多模态轻量级极速日常推理" }
];

function getCategoryCount(cat) {
  if (cat === '全部') return rawModels.length;
  return rawModels.filter(m => m.vendor === cat).length;
}

function formatPrice(val) {
  // GOAT Plan 实付相当于全场 1.25 折（10/80 = 0.125）
  const actual = isDiscountMode.value ? val * 0.125 : val;
  if (actual < 0.01) return actual.toFixed(4);
  return actual.toFixed(3);
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}

function getSortIndicator(key) {
  if (sortKey.value !== key) return '↕';
  return sortAsc.value ? '↑' : '↓';
}

const filteredModels = computed(() => {
  let list = rawModels.filter(m => {
    // 分类筛选
    if (selectedCategory.value !== '全部' && m.vendor !== selectedCategory.value) {
      return false;
    }
    // 搜索过滤
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const inShort = m.short.toLowerCase().includes(q);
      const inId = m.id.toLowerCase().includes(q);
      const inDesc = m.desc.toLowerCase().includes(q);
      const inVendor = m.vendor.toLowerCase().includes(q);
      return inShort || inId || inDesc || inVendor;
    }
    return true;
  });

  // 排序
  list.sort((a, b) => {
    let res = 0;
    if (sortKey.value === 'inPrice') {
      res = a.inPrice - b.inPrice;
    } else if (sortKey.value === 'outPrice') {
      res = a.outPrice - b.outPrice;
    } else if (sortKey.value === 'short') {
      res = a.short.localeCompare(b.short);
    } else if (sortKey.value === 'id') {
      res = a.id.localeCompare(b.id);
    }
    return sortAsc.value ? res : -res;
  });

  return list;
});

function copyText(text, label) {
  navigator.clipboard.writeText(text);
  toastMsg.value = `已复制 ${label}: ${text}`;
  setTimeout(() => {
    toastMsg.value = '';
  }, 2200);
}
</script>

<style scoped>
.model-hub-container {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin: 1rem 0;
  font-family: var(--sl-font);
  width: 100%;
}

/* 控制栏 */
.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 280px;
  height: 38px;
}

.search-icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sl-color-gray-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0 2.2rem 0 2.4rem;
  border-radius: 9999px;
  border: 1px solid var(--sl-color-gray-5);
  background: var(--sl-color-gray-6);
  color: var(--sl-color-white);
  font-size: 0.9rem;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--sl-color-accent);
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.2);
}

.clear-btn {
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--sl-color-gray-3);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem;
}

/* 折扣切换开关 */
.rate-toggle {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: var(--sl-color-gray-6);
  padding: 0 0.85rem;
  height: 38px;
  border-radius: 9999px;
  border: 1px solid var(--sl-color-gray-5);
  box-sizing: border-box;
  flex-shrink: 0;
}

.toggle-label {
  font-size: 0.84rem;
  color: var(--sl-color-gray-3);
  transition: color 0.2s ease;
  user-select: none;
}

.toggle-label.active {
  color: var(--sl-color-white);
  font-weight: 600;
}

.toggle-label.highlight.active {
  color: var(--sl-color-accent);
}

.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--sl-color-gray-5);
  transition: .25s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .25s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--sl-color-accent);
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* 分类 Tab - 尺寸与高低严格统一 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tab-btn {
  height: 34px;
  padding: 0 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: var(--sl-color-gray-6);
  border: 1px solid var(--sl-color-gray-5);
  color: var(--sl-color-gray-2);
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
  line-height: 1;
}

.tab-btn:hover {
  border-color: var(--sl-color-accent);
  color: var(--sl-color-white);
}

.tab-btn.active {
  background: var(--sl-color-accent);
  border-color: var(--sl-color-accent);
  color: white;
  font-weight: 600;
}

.tab-text {
  line-height: 1;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  min-width: 18px;
  padding: 0 0.35rem;
  font-size: 0.72rem;
  font-family: var(--sl-font-mono);
  background: rgba(0, 0, 0, 0.25);
  border-radius: 9999px;
  line-height: 1;
  box-sizing: border-box;
}

/* 状态栏 */
.status-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--sl-color-gray-3);
  padding: 0 0.25rem;
}

/* 表格包装器 - 充满宽度并自适应 */
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 12px;
  background: var(--sl-color-black);
  width: 100%;
  box-sizing: border-box;
}

.model-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
  line-height: 1.5;
}

.model-table th {
  background: var(--sl-color-gray-6);
  padding: 0.7rem 0.85rem;
  font-weight: 600;
  color: var(--sl-color-gray-2);
  border-bottom: 2px solid var(--sl-color-gray-5);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  vertical-align: middle;
}

.model-table th:hover {
  color: var(--sl-color-accent);
}

.sort-icon {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.model-table td {
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid var(--sl-color-gray-6);
  vertical-align: middle;
}

/* 列宽分配与不换行控制 */
.th-index, .td-index {
  width: 40px;
  text-align: center;
  color: var(--sl-color-gray-3);
  font-size: 0.78rem;
}

.th-short, .td-short {
  width: 140px;
  white-space: nowrap;
}

.th-id, .td-id {
  white-space: nowrap;
}

.th-price, .td-price {
  width: 120px;
  white-space: nowrap;
  text-align: right;
  padding-right: 1.25rem;
}

.th-desc, .td-desc {
  min-width: 220px;
}

.clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

/* 短别名胶囊 - 严禁折行并保持统一高度 */
.code-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 0.55rem;
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.3);
  color: var(--sl-color-accent);
  border-radius: 6px;
  font-family: var(--sl-font-mono);
  font-size: 0.82rem;
  white-space: nowrap !important;
  box-sizing: border-box;
  line-height: 1;
}

.code-pill:hover {
  background: var(--sl-color-accent);
  color: white;
  transform: translateY(-1px);
}

/* 完整模型 ID - 保持一行整洁 */
.code-full {
  font-family: var(--sl-font-mono);
  color: var(--sl-color-gray-1);
  font-size: 0.84rem;
  white-space: nowrap !important;
  display: inline-block;
}

.code-full:hover {
  color: var(--sl-color-accent);
  text-decoration: underline;
}

.td-price {
  font-family: var(--sl-font-mono);
  font-weight: 600;
}

.in-price {
  color: #34d399;
}

.out-price {
  color: #60a5fa;
}

.td-desc {
  color: var(--sl-color-gray-2);
  font-size: 0.84rem;
}

.text-muted {
  color: var(--sl-color-gray-4);
  font-size: 0.8rem;
  display: inline-block;
  padding-left: 0.5rem;
}

/* 核心 FLIP 平滑动画 */
.flip-list-move {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.flip-list-enter-active,
.flip-list-leave-active {
  transition: all 0.3s ease;
}

.flip-list-enter-from,
.flip-list-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* 复制 Toast */
.toast-popup {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: var(--sl-color-accent);
  color: white;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.5);
  z-index: 9999;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--sl-color-gray-3);
}
</style>
