<template>
  <div class="model-hub-container not-content">
    <!-- 顶部操作控制栏 -->
    <div class="control-panel">
      <!-- 搜索栏 -->
      <div class="search-box">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索短别名 / 上游模型 ID / 梯队 (T1/T2/T3) / 说明..."
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
          GOAT T1 实付 (1.25 折)
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
      <span>已筛选匹配 <strong>{{ filteredModels.length }}</strong> 款模型（包含 <strong>{{ t1Count }}</strong> 款 T1 黄金模型，<strong>{{ blockedCount }}</strong> 款网关拦截保护模型）</span>
      <span class="sort-tip">💡 T1 享 8x 补贴与 95%+ 缓存折扣；T3 高消耗模型已开启网关拦截保护</span>
    </div>

    <!-- 动态动画表格 -->
    <div class="table-wrapper">
      <table class="model-table">
        <thead>
          <tr>
            <th class="th-index">#</th>
            <th class="th-tier">梯队评级</th>
            <th
              class="th-short sortable"
              :class="{ active: sortKey === 'short' }"
              @click="toggleSort('short')"
              title="按短别名排序"
            >
              <div class="th-inner">
                <span>推荐短别名</span>
                <span class="sort-icon">{{ getSortIndicator('short') }}</span>
              </div>
            </th>
            <th
              class="th-id sortable"
              :class="{ active: sortKey === 'id' }"
              @click="toggleSort('id')"
              title="按模型完整 ID 排序"
            >
              <div class="th-inner">
                <span>完整模型 ID</span>
                <span class="sort-icon">{{ getSortIndicator('id') }}</span>
              </div>
            </th>
            <th
              class="th-price sortable"
              :class="{ active: sortKey === 'inPrice' }"
              @click="toggleSort('inPrice')"
              title="按输入费率排序"
            >
              <div class="th-inner price-header">
                <span>输入费率</span>
                <span class="unit-tag">(/1M)</span>
                <span class="sort-icon">{{ getSortIndicator('inPrice') }}</span>
              </div>
            </th>
            <th
              class="th-price sortable"
              :class="{ active: sortKey === 'outPrice' }"
              @click="toggleSort('outPrice')"
              title="按输出费率排序"
            >
              <div class="th-inner price-header">
                <span>输出费率</span>
                <span class="unit-tag">(/1M)</span>
                <span class="sort-icon">{{ getSortIndicator('outPrice') }}</span>
              </div>
            </th>
            <th class="th-desc">特性与说明</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in filteredModels"
            :key="item.uid"
            class="model-row"
            :class="{ 'row-blocked': item.tier === 'T3' }"
          >
            <td class="td-index">{{ index + 1 }}</td>
            <td class="td-tier">
              <span
                class="badge-tier"
                :class="getTierClass(item.tier)"
                :title="getTierTooltip(item.tier)"
              >
                {{ getTierLabel(item.tier) }}
              </span>
            </td>
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
              ${{ formatPrice(item) }}
            </td>
            <td class="td-price out-price">
              ${{ formatPrice(item, true) }}
            </td>
            <td class="td-desc">
              <span v-if="item.tier === 'T3'" class="desc-blocked-tag">[已拦截保护]</span>
              {{ item.desc }}
            </td>
          </tr>
        </tbody>
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
const isDiscountMode = ref(true); // 默认开启实付展示
const toastMsg = ref('');

const categories = ['全部', 'DeepSeek', 'Kimi', 'GLM', 'Qwen', 'Grok', 'MiniMax', 'Xiaomi', '其它'];

// 50 款模型清单（带 T1/T2/T3 梯队标识与拦截保护标记）
const rawModels = [
  { short: "qwen-flash", id: "Qwen/Qwen3.8-Flash", vendor: "Qwen", tier: "T1", inPrice: 0.03, outPrice: 0.13, desc: "通义千问极速轻量模型，超低延迟与极低成本" },
  { short: "qwen-omni", id: "Qwen/Qwen3.8-Omni-Flash", vendor: "Qwen", tier: "T1", inPrice: 0.05, outPrice: 0.20, desc: "通义多模态音频与视觉理解轻量版" },
  { short: "qwen-27b", id: "Qwen/Qwen3.8-27B", vendor: "Qwen", tier: "T1", inPrice: 0.08, outPrice: 0.30, desc: "27B 参数紧凑型代码与视觉推理（官方点名满额补贴）" },
  { short: "glm-5.3-flash", id: "z-ai/glm-5.3-flash", vendor: "GLM", tier: "T1", inPrice: 0.10, outPrice: 0.40, desc: "智谱极速高性价比 1M 上下文推理" },
  { short: "minimax", id: "minimax/minimax-m3.1-flash", vendor: "MiniMax", tier: "T2", inPrice: 0.10, outPrice: 0.40, desc: "稀宇科技原生多模态，可调思考深度" },
  { short: "mimo", id: "xiaomi/mimo-v2.6-flash", vendor: "Xiaomi", tier: "T2", inPrice: 0.12, outPrice: 0.50, desc: "小米 1M 上下文轻量高效代码模型" },
  { short: "deepseek-chat", id: "deepseek/deepseek-v4.1-flash", vendor: "DeepSeek", tier: "T1", inPrice: 0.15, outPrice: 0.60, desc: "V4.1 混合注意力超快推理，98% 缓存命中，日常主力首选" },
  { short: "deepseek-v4.1", id: "deepseek/deepseek-v4.1-flash", vendor: "DeepSeek", tier: "T1", inPrice: 0.15, outPrice: 0.60, desc: "DeepSeek V4.1 极速版" },
  { short: "dsv4f", id: "deepseek/deepseek-v4-flash-fast", vendor: "DeepSeek", tier: "T1", inPrice: 0.15, outPrice: 0.60, desc: "DeepSeek 极速高吞吐响应模式" },
  { short: "qwen-plus", id: "Qwen/Qwen3.7-Plus", vendor: "Qwen", tier: "T1", inPrice: 0.15, outPrice: 0.60, desc: "兼顾性能与成本的通义平衡版（8x 额度补贴）" },
  { short: "gemini-flash", id: "google/gemini-3.8-flash", vendor: "其它", tier: "T3", inPrice: 0.15, outPrice: 0.60, desc: "无官方专有缓存加速，极易烧光 5 小时配额，网关已实施拦截保护" },
  { short: "dsv4fve", id: "deepseek/deepseek-v4-flash-vision-exp", vendor: "DeepSeek", tier: "T1", inPrice: 0.28, outPrice: 0.60, desc: "DeepSeek 多模态视觉解析增强" },
  { short: "qwen", id: "Qwen/Qwen3.8-Max", vendor: "Qwen", tier: "T1", inPrice: 0.40, outPrice: 1.60, desc: "通义旗舰级自主长程逻辑与工具调用" },
  { short: "qwen-max", id: "Qwen/Qwen3.8-Max", vendor: "Qwen", tier: "T1", inPrice: 0.40, outPrice: 1.60, desc: "通义千问 3.8 Max 满血旗舰版" },
  { short: "minimax-m3", id: "MiniMaxAI/MiniMax-M3", vendor: "MiniMax", tier: "T2", inPrice: 0.40, outPrice: 1.20, desc: "稀宇旗舰多模态 Agent" },
  { short: "mimo-pro", id: "xiaomi/mimo-v2.6-pro", vendor: "Xiaomi", tier: "T2", inPrice: 0.50, outPrice: 2.00, desc: "小米旗舰级多模态代码分析" },
  { short: "kimi-k2.5", id: "moonshotai/Kimi-K2.5", vendor: "Kimi", tier: "T2", inPrice: 0.60, outPrice: 3.00, desc: "月之暗面前端全栈编码与多模态" },
  { short: "deepseek-reasoner", id: "deepseek/deepseek-v4-pro", vendor: "DeepSeek", tier: "T1", inPrice: 0.66, outPrice: 1.98, desc: "满血思维链深度推理模型，架构设计与疑难排查首选" },
  { short: "deepseek-v4", id: "deepseek/deepseek-v4-pro", vendor: "DeepSeek", tier: "T1", inPrice: 0.66, outPrice: 1.98, desc: "旗舰架构代码与 Agent" },
  { short: "glm-5.2", id: "zai-org/GLM-5.2", vendor: "GLM", tier: "T1", inPrice: 0.80, outPrice: 2.50, desc: "官方白皮书点名享满额 $70 信用补贴，工程代码极其稳定" },
  { short: "kimi-k2.6", id: "moonshotai/Kimi-K2.6", vendor: "Kimi", tier: "T2", inPrice: 0.80, outPrice: 3.50, desc: "Kimi 长程 Agent 编程模型" },
  { short: "step-5", id: "stepfun/Step-5-Preview", vendor: "其它", tier: "T2", inPrice: 0.80, outPrice: 2.40, desc: "阶跃星辰 600B 稀疏 MoE 架构" },
  { short: "kimi-k2.7", id: "moonshotai/Kimi-K2.7-Code", vendor: "Kimi", tier: "T2", inPrice: 0.95, outPrice: 4.00, desc: "Kimi 代码与 Agent 架构专精" },
  { short: "kimi-k2.7-fast", id: "moonshotai/Kimi-K2.7-Code-Highspeed", vendor: "Kimi", tier: "T2", inPrice: 0.95, outPrice: 4.00, desc: "Kimi 高速代码响应模式" },
  { short: "glm-5", id: "zai-org/GLM-5", vendor: "GLM", tier: "T1", inPrice: 1.00, outPrice: 3.00, desc: "智谱多模态深度思考与长程规划" },
  { short: "nemotron-550b", id: "nvidia/nemotron-3-ultra-550b-a55b", vendor: "其它", tier: "T2", inPrice: 1.00, outPrice: 3.00, desc: "英伟达 550B 超大参数自主 Agent" },
  { short: "glm-5.3", id: "zai-org/GLM-5.3", vendor: "GLM", tier: "T1", inPrice: 1.50, outPrice: 4.00, desc: "智谱前沿自主智能体能力旗舰" },
  { short: "grok-4.5", id: "xai/grok-4.5", vendor: "Grok", tier: "T3", inPrice: 1.50, outPrice: 5.00, desc: "仅 2x 额度且无官方专有缓存加速，网关已实施拦截保护" },
  { short: "grok", id: "xai/grok-4.7", vendor: "Grok", tier: "T3", inPrice: 2.00, outPrice: 6.00, desc: "消耗高昂，网关已开启拦截保护" },
  { short: "grok-4.7", id: "xai/grok-4.7", vendor: "Grok", tier: "T3", inPrice: 2.00, outPrice: 6.00, desc: "Grok 4.7 旗舰款（已拦截保护）" },
  { short: "mistral-large", id: "mistral/mistral-large-4", vendor: "其它", tier: "T3", inPrice: 2.00, outPrice: 6.00, desc: "欧洲开源旗舰，无 8x 补贴，网关已开启拦截保护" },
  { short: "kimi", id: "moonshotai/Kimi-K3", vendor: "Kimi", tier: "T2", inPrice: 3.00, outPrice: 15.00, desc: "2.8T 参数、100 万长上下文知识工作" },
  { short: "kimi-k3", id: "moonshotai/Kimi-K3", vendor: "Kimi", tier: "T2", inPrice: 3.00, outPrice: 15.00, desc: "Kimi K3 超长窗口旗舰" },
  { short: "llama-70b", id: "meta/llama-3.3-70b-instruct", vendor: "其它", tier: "T2", inPrice: 0.18, outPrice: 0.60, desc: "Meta 开源 Llama 3.3 经典指令微调" },
  { short: "llama-405b", id: "meta/llama-3.1-405b-instruct", vendor: "其它", tier: "T2", inPrice: 1.50, outPrice: 5.00, desc: "Meta 405B 超大参数稠密开源旗舰" },
  { short: "command-r-plus", id: "cohere/command-r-plus-08-2024", vendor: "其它", tier: "T2", inPrice: 2.50, outPrice: 10.00, desc: "Cohere 企业级 RAG 与多语言生成" },
  { short: "yi-lightning", id: "01-ai/yi-lightning", vendor: "其它", tier: "T2", inPrice: 0.14, outPrice: 0.40, desc: "零一万物极速推理与长程对话" },
  { short: "baichuan-4", id: "baichuan/baichuan-4", vendor: "其它", tier: "T2", inPrice: 0.50, outPrice: 1.50, desc: "百川大模型 4 代企业级知识解析" },
  { short: "hunyuan", id: "tencent/hunyuan-large", vendor: "其它", tier: "T1", inPrice: 1.00, outPrice: 3.00, desc: "腾讯混元大模型旗舰版（官方点名享满额补贴）" },
  { short: "sensechat", id: "sensetime/sensechat-5.5", vendor: "其它", tier: "T2", inPrice: 0.60, outPrice: 2.00, desc: "商汤日日新 5.5 大模型" },
  { short: "qwen-coder-32b", id: "alibaba/qwen-2.5-coder-32b-instruct", vendor: "Qwen", tier: "T1", inPrice: 0.10, outPrice: 0.30, desc: "通义代码专用小钢炮模型" },
  { short: "qwen-72b", id: "alibaba/qwen-2.5-72b-instruct", vendor: "Qwen", tier: "T1", inPrice: 0.35, outPrice: 1.20, desc: "通义千问 2.5 72B 开源标杆" },
  { short: "gemma-27b", id: "google/gemma-2-27b-it", vendor: "其它", tier: "T2", inPrice: 0.20, outPrice: 0.60, desc: "谷歌开源轻量紧凑模型" },
  { short: "phi-4", id: "microsoft/phi-4", vendor: "其它", tier: "T2", inPrice: 0.08, outPrice: 0.25, desc: "微软极紧凑小模型数学与推理专精" },
  { short: "deepseek-coder", id: "deepseek/deepseek-coder-v2.5", vendor: "DeepSeek", tier: "T1", inPrice: 0.14, outPrice: 0.28, desc: "DeepSeek 经典代码与数学混合推理" },
  { short: "openchat", id: "openchat/openchat-3.6", vendor: "其它", tier: "T2", inPrice: 0.05, outPrice: 0.15, desc: "轻量开源聊天对话模型" },
  { short: "hermes-70b", id: "nousresearch/hermes-3-llama-3.1-70b", vendor: "其它", tier: "T2", inPrice: 0.25, outPrice: 0.80, desc: "前沿开源 Agent 与对齐调优" },
  { short: "solar-pro", id: "upstage/solar-pro", vendor: "其它", tier: "T2", inPrice: 0.30, outPrice: 1.00, desc: "Solar Pro 深度长文本处理" },
  { short: "claude-3-haiku", id: "anthropic/claude-3-haiku-compatible", vendor: "其它", tier: "T2", inPrice: 0.25, outPrice: 1.25, desc: "轻量快速响应兼容模型" },
  { short: "gpt-4o-mini", id: "openai/gpt-4o-mini-compatible", vendor: "其它", tier: "T2", inPrice: 0.15, outPrice: 0.60, desc: "多模态轻量级极速日常推理" }
].map((m, idx) => ({
  ...m,
  uid: `${m.short || 'none'}__${m.id}__${idx}`
}));

const t1Count = computed(() => rawModels.filter(m => m.tier === 'T1').length);
const blockedCount = computed(() => rawModels.filter(m => m.tier === 'T3').length);

function getCategoryCount(cat) {
  if (cat === '全部') return rawModels.length;
  return rawModels.filter(m => m.vendor === cat).length;
}

function getTierLabel(tier) {
  if (tier === 'T1') return '🔥 T1 强推';
  if (tier === 'T2') return '⚡ T2 优质';
  return '🚫 已拦截';
}

function getTierClass(tier) {
  if (tier === 'T1') return 'tier-t1';
  if (tier === 'T2') return 'tier-t2';
  return 'tier-t3';
}

function getTierTooltip(tier) {
  if (tier === 'T1') return 'T1 黄金梯队：享 GOAT Plan 8x 信用与 95%+ 缓存命中，闭眼写代码！';
  if (tier === 'T2') return 'T2 白银梯队：国产优质次旗舰，适合特定任务微调。';
  return 'T3 避坑模型：无官方缓存加速，易烧干 5 小时配额，网关已开启拦截保护。';
}

function formatPrice(item, isOut = false) {
  const basePrice = isOut ? item.outPrice : item.inPrice;
  if (!isDiscountMode.value) return basePrice.toFixed(basePrice < 0.01 ? 4 : 3);
  
  // T1 享 8x 信用 (10/80 = 0.125 实付)
  // T2 享 2x 信用 (10/20 = 0.5 实付)
  // T3 标价原样显示或提示
  let discount = 0.125;
  if (item.tier === 'T2') discount = 0.5;
  if (item.tier === 'T3') discount = 1.0;
  
  const actual = basePrice * discount;
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
  let list = rawModels.slice();

  if (selectedCategory.value !== '全部') {
    list = list.filter(item => item.vendor === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(item =>
      (item.short && item.short.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      (item.tier && item.tier.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => {
    let result = 0;
    if (sortKey.value === 'short') {
      const aVal = a.short || 'zzz';
      const bVal = b.short || 'zzz';
      result = aVal.localeCompare(bVal);
    } else if (sortKey.value === 'id') {
      result = a.id.localeCompare(b.id);
    } else if (sortKey.value === 'inPrice') {
      result = a.inPrice - b.inPrice;
    } else if (sortKey.value === 'outPrice') {
      result = a.outPrice - b.outPrice;
    }
    return sortAsc.value ? result : -result;
  });

  return list;
});

function copyText(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    toastMsg.value = `已复制 ${label}: ${text}`;
    setTimeout(() => {
      toastMsg.value = '';
    }, 2000);
  }).catch(() => {
    toastMsg.value = `复制失败，请手动选取`;
    setTimeout(() => {
      toastMsg.value = '';
    }, 2000);
  });
}
</script>

<style scoped>
.model-hub-container {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: var(--sl-font-system, system-ui, -apple-system, sans-serif);
}

/* 控制栏 */
.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sl-color-gray-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.2rem 0.65rem 2.4rem;
  border-radius: 8px;
  border: 1px solid var(--sl-color-gray-5);
  background: var(--sl-color-gray-6);
  color: var(--sl-color-white);
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--sl-color-accent);
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2);
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--sl-color-gray-3);
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.8rem;
  line-height: 1;
}

.clear-btn:hover {
  color: var(--sl-color-white);
}

/* 开关控件 */
.rate-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--sl-color-gray-6);
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid var(--sl-color-gray-5);
}

.toggle-label {
  font-size: 0.84rem;
  color: var(--sl-color-gray-3);
  transition: color 0.2s ease;
}

.toggle-label.active {
  color: var(--sl-color-white);
  font-weight: 500;
}

.toggle-label.highlight.active {
  color: #10b981;
  font-weight: 600;
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
  background-color: var(--sl-color-gray-4);
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* 分类标签栏 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--sl-color-gray-5);
  background: var(--sl-color-gray-6);
  color: var(--sl-color-gray-2);
  font-size: 0.84rem;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.2;
}

.tab-btn:hover {
  border-color: var(--sl-color-gray-4);
  color: var(--sl-color-white);
}

.tab-btn.active {
  background: var(--sl-color-accent);
  border-color: var(--sl-color-accent);
  color: white;
  font-weight: 500;
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

/* 表格包装器 */
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--sl-color-gray-5);
  border-radius: 12px;
  background: var(--sl-color-black);
  width: 100%;
  box-sizing: border-box;
}

.model-table {
  display: table !important;
  width: 100% !important;
  min-width: 1050px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 0.88rem;
  line-height: 1.5;
}

.model-table thead {
  background: var(--sl-color-gray-6);
}

.model-table th {
  background: var(--sl-color-gray-6);
  padding: 0.75rem 0.85rem;
  font-weight: 600;
  color: var(--sl-color-gray-2);
  border-bottom: 2px solid var(--sl-color-gray-5);
  user-select: none;
  white-space: nowrap;
  vertical-align: middle;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.model-table th.sortable {
  cursor: pointer;
}

.model-table th.sortable:hover {
  background: rgba(244, 63, 94, 0.1);
  color: var(--sl-color-accent);
}

.model-table th.sortable.active {
  color: var(--sl-color-accent);
  background: rgba(244, 63, 94, 0.12);
  border-bottom-color: var(--sl-color-accent);
}

.model-table thead tr th:first-child {
  border-top-left-radius: 11px;
}

.model-table thead tr th:last-child {
  border-top-right-radius: 11px;
}

.sort-icon {
  margin-left: 0.25rem;
  font-size: 0.75rem;
  display: inline-block;
  opacity: 0.7;
}

.model-table th.sortable.active .sort-icon {
  opacity: 1;
  font-weight: bold;
}

.model-row {
  transition: background-color 0.15s ease;
}

.model-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.model-row.row-blocked {
  background: rgba(239, 68, 68, 0.04);
}

.model-row.row-blocked:hover {
  background: rgba(239, 68, 68, 0.08);
}

.model-table td {
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid var(--sl-color-gray-6);
  vertical-align: middle;
  box-sizing: border-box;
}

.th-inner {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.price-header {
  justify-content: flex-end;
  width: 100%;
}

.unit-tag {
  font-size: 0.72rem;
  font-family: var(--sl-font-mono);
  color: var(--sl-color-gray-3);
  font-weight: normal;
  letter-spacing: -0.2px;
}

.model-table th.sortable.active .unit-tag {
  color: var(--sl-color-accent);
  opacity: 0.85;
}

/* 列宽精准分配 */
.th-index, .td-index {
  width: 44px;
  text-align: center;
  color: var(--sl-color-gray-3);
  font-size: 0.78rem;
}

.th-tier, .td-tier {
  width: 95px;
  text-align: center;
  white-space: nowrap;
}

.badge-tier {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-tier.tier-t1 {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-tier.tier-t2 {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.badge-tier.tier-t3 {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.th-short, .td-short {
  width: 145px;
  white-space: nowrap;
}

.th-id, .td-id {
  width: 310px;
  white-space: nowrap;
}

.th-price, .td-price {
  width: 125px;
  white-space: nowrap;
  text-align: right;
  padding-right: 0.95rem;
}

.th-desc, .td-desc {
  width: 280px;
  min-width: 220px;
  max-width: 320px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.45;
}

.desc-blocked-tag {
  color: #ef4444;
  font-weight: 600;
  font-size: 0.78rem;
  margin-right: 0.3rem;
}

.th-desc {
  cursor: default !important;
}

.th-desc:hover {
  color: var(--sl-color-gray-2) !important;
}

.clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

/* 短别名胶囊 */
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

/* 完整模型 ID */
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
