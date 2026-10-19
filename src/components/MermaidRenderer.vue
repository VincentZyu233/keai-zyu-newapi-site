<template>
  <div v-if="chart" class="mermaid-block" v-html="svgContent"></div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import mermaid from 'mermaid';

const props = defineProps({
  chart: {
    type: String,
    default: ''
  }
});

const svgContent = ref('');

async function renderDiagrams() {
  const isDark = document.documentElement.dataset.theme !== 'light';
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    fontFamily: "'LXGW WenKai', sans-serif",
    themeVariables: {
      primaryColor: '#f43f5e',
      primaryTextColor: '#fff',
      primaryBorderColor: '#fda4af',
      lineColor: isDark ? '#94a3b8' : '#64748b',
      secondaryColor: isDark ? '#1e293b' : '#f1f5f9',
      tertiaryColor: isDark ? '#0f172a' : '#f8fafc',
    }
  });

  // 如果传入了 chart 属性直接渲染
  if (props.chart) {
    const id = 'mermaid-direct-' + Math.random().toString(36).slice(2, 9);
    try {
      const { svg } = await mermaid.render(id, props.chart.trim());
      svgContent.value = svg;
    } catch (e) {
      console.error('Mermaid render error:', e);
    }
  }

  // 扫描页面上的标准 pre data-language="mermaid"
  const preElements = document.querySelectorAll('pre[data-language="mermaid"]');
  for (let i = 0; i < preElements.length; i++) {
    const pre = preElements[i];
    // 避免重复渲染
    if (pre.getAttribute('data-mermaid-processed')) continue;
    pre.setAttribute('data-mermaid-processed', 'true');

    const code = pre.innerText.trim();
    const id = 'mermaid-auto-' + i + '-' + Math.random().toString(36).slice(2, 9);
    try {
      const { svg } = await mermaid.render(id, code);
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-rendered-wrapper';
      wrapper.innerHTML = svg;
      
      // 找到外层的 figure (Expressive Code wrapper) 并替换
      const figure = pre.closest('.expressive-code') || pre;
      figure.parentNode.replaceChild(wrapper, figure);
    } catch (err) {
      console.warn('Failed to render auto mermaid block:', err);
    }
  }
}

onMounted(() => {
  nextTick(() => {
    renderDiagrams();
  });
});
</script>

<style>
.mermaid-rendered-wrapper,
.mermaid-block {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--sl-color-gray-6, #1e293b);
  border: 1px solid var(--sl-color-gray-5, #334155);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  overflow-x: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.mermaid-rendered-wrapper svg,
.mermaid-block svg {
  max-width: 100%;
  height: auto;
}
</style>
