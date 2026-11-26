<template>
  <div class="model-hub-container not-content">
    <!-- 顶部号池总览与一级切换 Tab -->
    <div class="pool-switcher">
      <button
        class="pool-tab-btn"
        :class="{ active: currentPool === 'goat' }"
        @click="switchPool('goat')"
      >
        <span class="pool-icon">🐐</span>
        <div class="pool-info">
          <div class="pool-title-row">
            <span class="pool-title">GOAT Plan 官方渠道</span>
            <span class="pool-badge goat-badge">商业付费 · 1.25 折</span>
          </div>
          <span class="pool-sub">Command Code 优质上游 · 8x 补贴与 95%+ 缓存</span>
        </div>
      </button>

      <button
        class="pool-tab-btn"
        :class="{ active: currentPool === 'workbuddy' }"
        @click="switchPool('workbuddy')"
      >
        <span class="pool-icon">🤖</span>
        <div class="pool-info">
          <div class="pool-title-row">
            <span class="pool-title">WorkBuddy 双活池</span>
            <span class="pool-badge wb-badge">自建双节点 · 100% 免费</span>
          </div>
          <span class="pool-sub">AMD + 天翼云异地灾备 · 独立分组不扣拼车额度</span>
        </div>
      </button>
    </div>

    <!-- 顶部操作控制栏 -->
    <div class="control-panel">
      <!-- 搜索栏 -->
      <div class="search-box">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
      </div>

      <!-- 费率模式切换开关（仅在 GOAT 池显示，WB 池显示免费徽章） -->
      <div v-if="currentPool === 'goat'" class="rate-toggle">
        <span class="toggle-label" :class="{ active: !isDiscountMode }">上游标杆价</span>
        <label class="switch">
          <input type="checkbox" v-model="isDiscountMode" />
          <span class="slider"></span>
        </label>
        <span class="toggle-label highlight" :class="{ active: isDiscountMode }">
          GOAT T1 实付 (1.25 折)
        </span>
      </div>
      <div v-else class="wb-rate-badge">
        <span class="badge-icon">🎉</span>
        <span class="badge-text">全场 100% 免费福利 · 独立分组不扣拼车余额</span>
      </div>
    </div>

    <!-- 品牌厂商分类过滤器 -->
    <div class="category-tabs">
      <button
        v-for="cat in currentCategories"
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
      <span v-if="currentPool === 'goat'">
        已筛选匹配 <strong>{{ filteredModels.length }}</strong> 款模型（包含 <strong>{{ t0Count }}</strong> 款 👑 T0 顶流神卡，<strong>{{ t1Count }}</strong> 款 🔥 T1 黄金主力，<strong>{{ blockedCount }}</strong> 款网关拦截保护）
      </span>
      <span v-else>
        已筛选匹配 <strong>{{ filteredModels.length }}</strong> 款 WorkBuddy 双活模型（包含 <strong>{{ t0Count }}</strong> 款 👑 T0 顶流神卡，<strong>{{ t1Count }}</strong> 款 🔥 T1 黄金主力，全场 100% 免费）
      </span>
      <span v-if="currentPool === 'goat'" class="sort-tip">💡 T0/T1 享 8x 补贴与 95%+ 缓存；T3 高消耗模型已开启网关拦截保护</span>
      <span v-else class="sort-tip">💡 支持 amd/ 和 tyy/ 前缀直接指定单一物理节点，通用模型名走 50:50 自动轮询</span>
    </div>

    <!-- 动态动画表格 -->
    <div class="table-wrapper">
      <table class="model-table">
        <thead>
          <tr>
            <th
              class="th-index sortable"
              :class="{ active: sortKey === 'index' }"
              @click="toggleSort('index')"
              title="按默认推荐序号恢复排序"
            >
              <div class="th-inner">
                <span>#</span>
                <span class="sort-icon">{{ getSortIndicator('index') }}</span>
              </div>
            </th>
            <th
              class="th-tier sortable"
              :class="{ active: sortKey === 'tier' }"
              @click="toggleSort('tier')"
              title="按梯队排序（优先级：梯队等级 -> 费率 -> 模型名）"
            >
              <div class="th-inner">
                <span>梯队评级</span>
                <span class="sort-icon">{{ getSortIndicator('tier') }}</span>
              </div>
            </th>
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
            <th class="th-desc"><span>特性与说明</span></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in filteredModels"
            :key="item.uid"
            class="model-row"
            :class="{ 'row-t0': item.tier === 'T0', 'row-blocked': item.tier === 'T3' && currentPool === 'goat', 'row-wb': currentPool === 'workbuddy' }"
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
            <td class="td-price in-price" :class="{ 'free-price': currentPool === 'workbuddy' }">
              <template v-if="currentPool === 'workbuddy'">
                <span class="price-val">$0.000</span>
                <span class="free-text">免费</span>
              </template>
              <template v-else>
                ${{ formatPrice(item) }}
              </template>
            </td>
            <td class="td-price out-price" :class="{ 'free-price': currentPool === 'workbuddy' }">
              <template v-if="currentPool === 'workbuddy'">
                <span class="price-val">$0.000</span>
                <span class="free-text">免费</span>
              </template>
              <template v-else>
                ${{ formatPrice(item, true) }}
              </template>
            </td>
            <td class="td-desc">
              <span v-if="item.tier === 'T3'" class="desc-blocked-tag">[已拦截保护]</span>
              <span v-if="item.node" class="node-tag" :class="item.node">{{ item.node === 'amd' ? 'AMD 节点' : '天翼云节点' }}</span>
              <span class="desc-text">{{ item.desc }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 搜索无结果占位 -->
      <div v-if="filteredModels.length === 0" class="empty-state">
        <p>🔍 没有找到匹配的模型，试试搜索别的关键词吧～</p>
      </div>
    </div>

    <!-- 底部表头交互与智能排序规则说明及叠甲声明 -->
    <div class="table-footer-legend">
      <div class="legend-header">
        <span class="legend-icon">📐</span>
        <span class="legend-title">表头点击与多级智能排序规则说明：</span>
      </div>
      <div class="legend-grid">
        <div class="legend-item">
          <span class="legend-tag">梯队评级 ↕</span>
          <span class="legend-desc"><strong>梯队优先</strong>（👑 T0 ➔ 🔥 T1 ➔ ⚡ T2 ➔ 🚫/🧪 T3），梯队相同时自动按费率从低到高排列，费率相同按名称 A-Z 字母序。</span>
        </div>
        <div class="legend-item">
          <span class="legend-tag">推荐短别名 / 模型 ID ↕</span>
          <span class="legend-desc"><strong>模型名称首字母 A-Z</strong> 升序或降序排列，同名按梯队等级与费率智能保底。</span>
        </div>
        <div class="legend-item">
          <span class="legend-tag">输入 / 输出费率 ↕</span>
          <span class="legend-desc"><strong>费率升降序</strong>（GOAT 模式下按实付折扣费率计算），费率相同时优先展示高梯队优质模型。</span>
        </div>
        <div class="legend-item">
          <span class="legend-tag"># 序号 ↕</span>
          <span class="legend-desc"><strong>恢复官方默认推荐矩阵顺序</strong>，按平台核心推荐优先级展示。</span>
        </div>
      </div>
      <!-- 叠甲声明 -->
      <div class="disclaimer-row">
        <span class="disclaimer-badge">🛡️ 叠甲声明</span>
        <span class="disclaimer-text">
          上述模型梯队分级（T0 ~ T3）综合搜集参考自互联网公开基准评测、各厂商官方技术白皮书、社区 Coding Agent（Codex / Claude Code / Cursor）实测吞吐与缓存命中表现，可能带有一定主观倾向与时效性差异，仅供选型与避坑参考，不代表绝对官方权威排名，具体体验请以实际业务与请求实测为准。
        </span>
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

const currentPool = ref('goat'); // 'goat' | 'workbuddy'
const searchQuery = ref('');
const selectedCategory = ref('全部');
const sortKey = ref('tier'); // 默认梯队优先排序 (T0 -> T1 -> T2 -> T3)
const sortAsc = ref(true);
const isDiscountMode = ref(true); // 默认开启实付展示
const toastMsg = ref('');

const goatCategories = ['全部', 'DeepSeek', 'Kimi', 'GLM', 'Qwen', 'Grok', 'MiniMax', 'Xiaomi', '其它'];
const wbCategories = ['全部', 'DeepSeek', 'Kimi', 'GLM', '混元', 'MiniMax', 'StepFun', 'Xiaomi', '其它'];

const currentCategories = computed(() => {
  return currentPool.value === 'goat' ? goatCategories : wbCategories;
});

const searchPlaceholder = computed(() => {
  return currentPool.value === 'goat'
    ? '搜索短别名 / 上游模型 ID / 梯队 (T0/T1/T2/T3) / 说明...'
    : '搜索模型名称 / 节点别名 (amd/tyy) / 梯队 (T0/T1/T2/T3) / 特性...';
});

function switchPool(pool) {
  if (currentPool.value === pool) return;
  currentPool.value = pool;
  selectedCategory.value = '全部';
  searchQuery.value = '';
}

// 1. GOAT 渠道 50 款模型清单
const goatRawModels = [
  { short: "qwen-flash", id: "Qwen/Qwen3.8-Flash", vendor: "Qwen", tier: "T1", inPrice: 0.03, outPrice: 0.13, desc: "通义千问极速轻量模型，超低延迟与极低成本" },
  { short: "qwen-omni", id: "Qwen/Qwen3.8-Omni-Flash", vendor: "Qwen", tier: "T1", inPrice: 0.05, outPrice: 0.20, desc: "通义多模态音频与视觉理解轻量版" },
  { short: "qwen-27b", id: "Qwen/Qwen3.8-27B", vendor: "Qwen", tier: "T1", inPrice: 0.08, outPrice: 0.30, desc: "27B 参数紧凑型代码与视觉推理（官方点名满额补贴）" },
  { short: "glm-5.3-flash", id: "z-ai/glm-5.3-flash", vendor: "GLM", tier: "T1", inPrice: 0.10, outPrice: 0.40, desc: "智谱极速高性价比 1M 上下文推理" },
  { short: "minimax", id: "minimax/minimax-m3.1-flash", vendor: "MiniMax", tier: "T2", inPrice: 0.10, outPrice: 0.40, desc: "稀宇科技原生多模态，可调思考深度" },
  { short: "mimo", id: "xiaomi/mimo-v2.6-flash", vendor: "Xiaomi", tier: "T2", inPrice: 0.12, outPrice: 0.50, desc: "小米 1M 上下文轻量高效代码模型" },
  { short: "deepseek-chat", id: "deepseek/deepseek-v4.1-flash", vendor: "DeepSeek", tier: "T0", inPrice: 0.15, outPrice: 0.60, desc: "V4.1 混合注意力超快推理，98% 缓存命中，日常主力首选 [T0 顶流神卡]" },
  { short: "deepseek-v4.1", id: "deepseek/deepseek-v4.1-flash", vendor: "DeepSeek", tier: "T0", inPrice: 0.15, outPrice: 0.60, desc: "DeepSeek V4.1 极速版，高吞吐代码生成 [T0 顶流神卡]" },
  { short: "dsv4f", id: "deepseek/deepseek-v4-flash-fast", vendor: "DeepSeek", tier: "T0", inPrice: 0.15, outPrice: 0.60, desc: "DeepSeek 极速高吞吐响应模式 [T0 顶流神卡]" },
  { short: "qwen-plus", id: "Qwen/Qwen3.7-Plus", vendor: "Qwen", tier: "T1", inPrice: 0.15, outPrice: 0.60, desc: "兼顾性能与成本的通义平衡版（8x 额度补贴）" },
  { short: "gemini-flash", id: "google/gemini-3.8-flash", vendor: "其它", tier: "T3", inPrice: 0.15, outPrice: 0.60, desc: "无官方专有缓存加速，极易烧光 5 小时配额，网关已实施拦截保护" },
  { short: "dsv4fve", id: "deepseek/deepseek-v4-flash-vision-exp", vendor: "DeepSeek", tier: "T1", inPrice: 0.28, outPrice: 0.60, desc: "DeepSeek 多模态视觉解析增强" },
  { short: "qwen", id: "Qwen/Qwen3.8-Max", vendor: "Qwen", tier: "T1", inPrice: 0.40, outPrice: 1.60, desc: "通义旗舰级自主长程逻辑与工具调用" },
  { short: "qwen-max", id: "Qwen/Qwen3.8-Max", vendor: "Qwen", tier: "T1", inPrice: 0.40, outPrice: 1.60, desc: "通义千问 3.8 Max 满血旗舰版" },
  { short: "minimax-m3", id: "MiniMaxAI/MiniMax-M3", vendor: "MiniMax", tier: "T2", inPrice: 0.40, outPrice: 1.20, desc: "稀宇旗舰多模态 Agent" },
  { short: "mimo-pro", id: "xiaomi/mimo-v2.6-pro", vendor: "Xiaomi", tier: "T2", inPrice: 0.50, outPrice: 2.00, desc: "小米旗舰级多模态代码分析" },
  { short: "kimi-k2.5", id: "moonshotai/Kimi-K2.5", vendor: "Kimi", tier: "T2", inPrice: 0.60, outPrice: 3.00, desc: "月之暗面前端全栈编码与多模态" },
  { short: "deepseek-reasoner", id: "deepseek/deepseek-v4-pro", vendor: "DeepSeek", tier: "T0", inPrice: 0.66, outPrice: 1.98, desc: "满血思维链深度推理模型，架构设计与疑难排查首选 [T0 顶流神卡]" },
  { short: "deepseek-v4", id: "deepseek/deepseek-v4-pro", vendor: "DeepSeek", tier: "T0", inPrice: 0.66, outPrice: 1.98, desc: "旗舰架构代码与 Agent 满血思考 [T0 顶流神卡]" },
  { short: "glm-5.2", id: "zai-org/GLM-5.2", vendor: "GLM", tier: "T0", inPrice: 0.80, outPrice: 2.50, desc: "官方白皮书点名享满额 $70 信用补贴，工程代码极其稳定 [T0 顶流神卡]" },
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
  rawIndex: idx,
  uid: `goat__${m.short || 'none'}__${m.id}__${idx}`
}));

// 2. WorkBuddy 双活池 20 款模型清单
const wbRawModels = [
  { short: "deepseek-v4-pro", id: "deepseek-v4-pro", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, desc: "旗舰满血推理模型，自动在学校 AMD 与天翼云双节点 50:50 轮询负载均衡 [T0 顶流神卡]" },
  { short: "amd/deepseek-v4-pro", id: "amd/deepseek-v4-pro", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, node: "amd", desc: "强制指定路由至学校 AMD 机器节点 (0ms 内网环回极速响应) [T0 顶流神卡]" },
  { short: "tyy/deepseek-v4-pro", id: "tyy/deepseek-v4-pro", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, node: "tyy", desc: "强制指定路由至天翼云电信专网节点 (50ms 异地加密专网灾备) [T0 顶流神卡]" },
  { short: "deepseek-v4.1", id: "deepseek-v4.1-flash", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, desc: "DeepSeek V4.1 极速版，混合注意力机制，超快首字与高吞吐代码生成 [T0 顶流神卡]" },
  { short: "deepseek-v3", id: "deepseek-v3", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, desc: "DeepSeek V3 经典版本别名，网关无缝映射至 V4 Pro 后端服务 [T0 顶流神卡]" },
  { short: "deepseek-chat", id: "deepseek-chat", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, desc: "DeepSeek Chat 官方标准别名，直通双活后端满血服务 [T0 顶流神卡]" },
  { short: "ds-v4-pro-std", id: "deepseek/deepseek-v4-pro", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, desc: "带厂商前缀的标准格式 ID，全面兼容各类自动化智能体与 CLI [T0 顶流神卡]" },
  { short: "ds-v4.1-flash-std", id: "deepseek/deepseek-v4.1-flash", vendor: "DeepSeek", tier: "T0", inPrice: 0, outPrice: 0, desc: "带厂商前缀的标准格式 ID 极速版 [T0 顶流神卡]" },
  { short: "glm-5.3", id: "glm-5.3", vendor: "GLM", tier: "T1", inPrice: 0, outPrice: 0, desc: "智谱前沿自主智能体能力旗舰，长程规划、复杂工具调用与代码重构表现出色" },
  { short: "glm-5.3-flash", id: "glm-5.3-flash", vendor: "GLM", tier: "T1", inPrice: 0, outPrice: 0, desc: "智谱极速高性价比 1M 超长上下文推理模型，日常高频编码首选" },
  { short: "glm-5.2", id: "glm-5.2", vendor: "GLM", tier: "T1", inPrice: 0, outPrice: 0, desc: "智谱经典工程代码旗舰，逻辑扎实、输出极其稳定可靠" },
  { short: "kimi-k3.1-pro", id: "kimi-k3.1-pro", vendor: "Kimi", tier: "T0", inPrice: 0, outPrice: 0, desc: "月之暗面 Kimi 3.1 Pro 旗舰，带满血长思维链思考推理 (Reasoning Tokens) [T0 顶流神卡]" },
  { short: "kimi-k3-1", id: "kimi-k3-1", vendor: "Kimi", tier: "T0", inPrice: 0, outPrice: 0, desc: "Kimi K3.1 兼容格式短别名 [T0 顶流神卡]" },
  { short: "kimi-k2.8", id: "kimi-k2.8-preview", vendor: "Kimi", tier: "T1", inPrice: 0, outPrice: 0, desc: "Kimi K2.8 预览版长上下文工作模型" },
  { short: "hy4std", id: "hy4std", vendor: "混元", tier: "T1", inPrice: 0, outPrice: 0, desc: "腾讯混元大模型 4.0 标准版 (Tencent Hunyuan 4 Standard)" },
  { short: "hy4flash", id: "hy4flash", vendor: "混元", tier: "T1", inPrice: 0, outPrice: 0, desc: "腾讯混元大模型 4.0 极速版 (Tencent Hunyuan 4 Flash)" },
  { short: "minimax-flash", id: "minimax-m3.1-flash", vendor: "MiniMax", tier: "T2", inPrice: 0, outPrice: 0, desc: "MiniMax 原生多模态 M3.1 极速版，可控思考深度" },
  { short: "step-5", id: "step-5-preview", vendor: "StepFun", tier: "T2", inPrice: 0, outPrice: 0, desc: "阶跃星辰 Step-5 稀疏 MoE 架构长文本模型" },
  { short: "mimo-pro", id: "mimo-v2.6-pro", vendor: "Xiaomi", tier: "T2", inPrice: 0, outPrice: 0, desc: "小米旗舰级多模态代码分析模型，长程上下文架构理解扎实" },
  { short: "space-bunny", id: "space-bunny", vendor: "其它", tier: "T3", inPrice: 0, outPrice: 0, desc: "腾讯独家专属实验模型 (Space Bunny)，趣味对话与轻量试玩 [T3 实验试玩]" }
].map((m, idx) => ({
  ...m,
  rawIndex: idx,
  uid: `wb__${m.short || 'none'}__${m.id}__${idx}`
}));

const currentRawModels = computed(() => {
  return currentPool.value === 'goat' ? goatRawModels : wbRawModels;
});

const t0Count = computed(() => currentRawModels.value.filter(m => m.tier === 'T0').length);
const t1Count = computed(() => currentRawModels.value.filter(m => m.tier === 'T1').length);
const blockedCount = computed(() => currentRawModels.value.filter(m => m.tier === 'T3').length);

function getCategoryCount(cat) {
  if (cat === '全部') return currentRawModels.value.length;
  return currentRawModels.value.filter(m => m.vendor === cat).length;
}

function getTierLabel(tier) {
  if (tier === 'T0') return '👑 T0 顶流';
  if (tier === 'T1') return '🔥 T1 强推';
  if (tier === 'T2') return '⚡ T2 优质';
  if (currentPool.value === 'workbuddy') return '🧪 T3 试玩';
  return '🚫 已拦截';
}

function getTierClass(tier) {
  if (tier === 'T0') return 'tier-t0';
  if (tier === 'T1') return 'tier-t1';
  if (tier === 'T2') return 'tier-t2';
  if (currentPool.value === 'workbuddy') return 'tier-t3-wb';
  return 'tier-t3';
}

function getTierTooltip(tier) {
  if (currentPool.value === 'workbuddy') {
    if (tier === 'T0') return 'T0 顶流神卡：满血 671B 深度思考 / Kimi 3.1 Pro 旗舰，自建双活核心王牌！';
    if (tier === 'T1') return 'T1 黄金主力：国产顶级前沿梯队，高可用双节点负载均衡，日常主力首选！';
    if (tier === 'T2') return 'T2 优质精选：多模态、长文本与垂类专精模型。';
    return 'T3 实验试玩：腾讯独家实验模型，趣味对话与轻量尝鲜。';
  }
  if (tier === 'T0') return 'T0 顶流神卡：享 8x 信用与 98% 专有缓存加速，编程/推理/架构绝对主力，闭眼冲！';
  if (tier === 'T1') return 'T1 黄金主力：官方共建 8x 补贴与 95%+ 缓存命中，高产稳健！';
  if (tier === 'T2') return 'T2 白银梯队：国产优质次旗舰，适合特定任务微调。';
  return 'T3 避坑模型：无专有缓存加速，易烧干 5 小时配额，网关已开启拦截保护。';
}

function formatPrice(item, isOut = false) {
  if (currentPool.value === 'workbuddy') return '0.000';
  const basePrice = isOut ? item.outPrice : item.inPrice;
  if (!isDiscountMode.value) return basePrice.toFixed(basePrice < 0.01 ? 4 : 3);
  
  // T0/T1 享 8x 信用 (10/80 = 0.125 实付)
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
  let list = [...currentRawModels.value];

  if (selectedCategory.value !== '全部') {
    list = list.filter(item => item.vendor === selectedCategory.value);
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(item =>
      (item.short && item.short.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      (item.tier && item.tier.toLowerCase().includes(q)) ||
      (item.node && item.node.toLowerCase().includes(q))
    );
  }

  const tierWeights = { 'T0': 0, 'T1': 1, 'T2': 2, 'T3': 3 };

  list.sort((a, b) => {
    let result = 0;
    if (sortKey.value === 'tier') {
      // 1. 优先梯队排序 (T0 -> T1 -> T2 -> T3)
      const tierA = tierWeights[a.tier] ?? 99;
      const tierB = tierWeights[b.tier] ?? 99;
      result = tierA - tierB;
      if (result === 0) {
        // 2. 梯队相同，按输入价格
        result = a.inPrice - b.inPrice;
        if (result === 0) {
          // 3. 价格相同，按输出价格
          result = a.outPrice - b.outPrice;
          if (result === 0) {
            // 4. 价格相同，按模型名称首字母 A-Z
            const aName = a.short || a.id;
            const bName = b.short || b.id;
            result = aName.localeCompare(bName);
          }
        }
      }
    } else if (sortKey.value === 'inPrice') {
      result = a.inPrice - b.inPrice;
      if (result === 0) {
        result = a.outPrice - b.outPrice;
        if (result === 0) {
          result = (tierWeights[a.tier] ?? 99) - (tierWeights[b.tier] ?? 99);
        }
      }
    } else if (sortKey.value === 'outPrice') {
      result = a.outPrice - b.outPrice;
      if (result === 0) {
        result = a.inPrice - b.inPrice;
        if (result === 0) {
          result = (tierWeights[a.tier] ?? 99) - (tierWeights[b.tier] ?? 99);
        }
      }
    } else if (sortKey.value === 'short') {
      const aVal = a.short || 'zzz';
      const bVal = b.short || 'zzz';
      result = aVal.localeCompare(bVal);
      if (result === 0) {
        result = (tierWeights[a.tier] ?? 99) - (tierWeights[b.tier] ?? 99);
      }
    } else if (sortKey.value === 'id') {
      result = a.id.localeCompare(b.id);
      if (result === 0) {
        result = (tierWeights[a.tier] ?? 99) - (tierWeights[b.tier] ?? 99);
      }
    } else if (sortKey.value === 'index') {
      result = a.rawIndex - b.rawIndex;
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
  font-family: var(--sl-font);
}

/* 顶部号池切换 Tab */
.pool-switcher {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.pool-tab-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  border-radius: 12px;
  border: 2px solid var(--sl-color-gray-5);
  background: var(--sl-color-gray-6);
  color: var(--sl-color-white);
  cursor: pointer;
  text-align: left;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.pool-tab-btn:hover {
  border-color: var(--sl-color-gray-4);
  transform: translateY(-2px);
  background: var(--sl-color-gray-5);
}

.pool-tab-btn.active {
  border-color: var(--sl-color-accent);
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(30, 41, 59, 0.7) 100%);
  box-shadow: 0 4px 20px -2px rgba(244, 63, 94, 0.25);
}

.pool-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.pool-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.pool-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pool-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--sl-color-white);
}

.pool-sub {
  font-size: 0.8rem;
  color: var(--sl-color-gray-3);
  line-height: 1.3;
}

.pool-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-weight: 600;
}

.goat-badge {
  background: rgba(244, 63, 94, 0.2);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.4);
}

.wb-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.4);
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

/* 开关控件与 WB 免费标签 */
.rate-toggle {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--sl-color-gray-6);
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid var(--sl-color-gray-5);
}

.wb-rate-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #34d399;
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
  transition: 0.3s;
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
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* 品牌厂商分类过滤器 */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  border: 1px solid var(--sl-color-gray-5);
  background: var(--sl-color-gray-6);
  color: var(--sl-color-gray-2);
  font-size: 0.84rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--sl-color-gray-5);
  color: var(--sl-color-white);
  border-color: var(--sl-color-gray-4);
}

.tab-btn.active {
  background: var(--sl-color-accent);
  color: white;
  border-color: var(--sl-color-accent);
  font-weight: 600;
}

.count-badge {
  font-size: 0.72rem;
  padding: 0.05rem 0.35rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.2);
  line-height: 1.2;
}

/* 状态统计栏 */
.status-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: var(--sl-color-gray-3);
  padding: 0.2rem 0;
  border-bottom: 1px dashed var(--sl-color-gray-5);
}

.sort-tip {
  color: var(--sl-color-gray-3);
}

/* 动态动画表格 */
.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--sl-color-gray-5);
  background: var(--sl-color-gray-6);
}

.model-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
  font-family: var(--sl-font);
}

.model-table th {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.75rem 0.85rem;
  font-weight: 600;
  color: var(--sl-color-white);
  border-bottom: 1px solid var(--sl-color-gray-5);
  white-space: nowrap;
  font-family: var(--sl-font);
}

.model-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.model-table th.sortable:hover {
  background: rgba(255, 255, 255, 0.05);
}

.model-table th.sortable.active {
  color: var(--sl-color-accent);
}

.th-inner {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.price-header {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.unit-tag {
  font-size: 0.7rem;
  color: var(--sl-color-gray-4);
  font-weight: normal;
  font-family: var(--sl-font);
}

.sort-icon {
  font-size: 0.8rem;
  color: var(--sl-color-gray-3);
}

th.sortable.active .sort-icon {
  color: var(--sl-color-accent);
}

.model-table td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
  font-family: var(--sl-font);
}

.model-row {
  transition: background 0.2s ease;
}

.model-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.row-blocked {
  opacity: 0.65;
  background: rgba(239, 68, 68, 0.04);
}

.row-wb:hover {
  background: rgba(16, 185, 129, 0.04);
}

.td-index {
  color: var(--sl-color-gray-4);
  font-size: 0.82rem;
  font-family: var(--sl-font-mono);
  width: 32px;
}

.badge-tier {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.tier-t0 {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.45);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.18);
  font-weight: 700;
}

.tier-t1 {
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.3);
}

.tier-t2 {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.tier-t3 {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.tier-t3-wb {
  background: rgba(168, 85, 247, 0.16);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.35);
}

.row-t0 {
  background: rgba(245, 158, 11, 0.025);
}

.row-t0:hover {
  background: rgba(245, 158, 11, 0.06) !important;
}

.code-pill {
  font-family: var(--sl-font-mono);
  background: rgba(244, 63, 94, 0.1);
  color: #f43f5e;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  font-size: 0.84rem;
  border: 1px solid rgba(244, 63, 94, 0.25);
  white-space: nowrap;
}

.code-full {
  font-family: var(--sl-font-mono);
  background: rgba(255, 255, 255, 0.05);
  color: var(--sl-color-gray-2);
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  font-size: 0.82rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable:hover {
  filter: brightness(1.2);
  border-color: var(--sl-color-accent);
}

.clickable:active {
  transform: scale(0.97);
}

.td-price {
  font-family: var(--sl-font-mono);
  font-weight: 600;
  white-space: nowrap;
}

.in-price {
  color: #34d399;
}

.out-price {
  color: #60a5fa;
}

.free-price {
  color: #10b981 !important;
}

.free-text {
  font-size: 0.72rem;
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  margin-left: 0.3rem;
  font-weight: normal;
}

.td-desc {
  color: var(--sl-color-gray-2);
  font-size: 0.86rem;
  line-height: 1.55;
  font-family: var(--sl-font);
}

.desc-text {
  font-family: var(--sl-font);
  letter-spacing: 0.012em;
  color: var(--sl-color-gray-1);
}

.desc-blocked-tag {
  color: #ef4444;
  font-weight: 600;
  margin-right: 0.35rem;
  font-family: var(--sl-font);
}

.node-tag {
  font-size: 0.72rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 600;
  margin-right: 0.4rem;
  font-family: var(--sl-font);
}

.node-tag.amd {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.node-tag.tyy {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
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

/* 底部排序规则说明与叠甲声明 */
.table-footer-legend {
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--sl-color-gray-5);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-family: var(--sl-font);
}

.legend-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-icon {
  font-size: 0.95rem;
}

.legend-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--sl-color-gray-2);
}

.legend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.65rem;
}

.legend-item {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  font-size: 0.77rem;
  line-height: 1.5;
  color: var(--sl-color-gray-3);
}

.legend-tag {
  flex-shrink: 0;
  font-family: var(--sl-font-mono);
  font-size: 0.72rem;
  background: var(--sl-color-gray-5);
  color: var(--sl-color-gray-1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.legend-desc strong {
  color: var(--sl-color-gray-2);
}

.disclaimer-row {
  margin-top: 0.35rem;
  padding-top: 0.65rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.disclaimer-badge {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 0.12rem 0.45rem;
  border-radius: 4px;
  white-space: nowrap;
}

.disclaimer-text {
  font-size: 0.75rem;
  line-height: 1.55;
  color: var(--sl-color-gray-3);
  letter-spacing: 0.01em;
}
</style>
