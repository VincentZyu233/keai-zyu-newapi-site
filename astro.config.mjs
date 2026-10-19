import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import vue from '@astrojs/vue';

export default defineConfig({
  site: 'https://vincentzyu233.github.io',
  base: '/keai-zyu-newapi-site',
  integrations: [
    starlight({
      title: 'VincentZyu AI 空间 自建newapi中转站捏',
      favicon: '/favicon.png',
      description: 'VincentZyu 的私人高可用 New API 专属网关文档与模型表格',
      logo: {
        src: './src/assets/logo.png',
        alt: 'VincentZyu Avatar'
      },
      social: {
        github: 'https://github.com/VincentZyu233/keai-zyu-newapi-site'
      },
      customCss: [
        './src/styles/custom.css'
      ],
      sidebar: [
        {
          label: '🌟 欢迎与总览',
          link: '/'
        },
        {
          label: '🚀 极简快速接入',
          slug: 'quickstart'
        },
        {
          label: '📊 动态模型表格',
          slug: 'models'
        },
        {
          label: '🛠️ 系统架构与运维',
          slug: 'ops'
        }
      ]
    }),
    vue()
  ]
});
