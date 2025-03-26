import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  lang: 'zh-CN',
  title: '理解算法',

  theme: plumeTheme({
    logo: '/images/logo.png',
    navbar: [
      { text: "关于本站", link: "/about" }
    ],
    footer: { message: "", copyright: "Copyright © 2024-PRESENT 理解算法" },
    plugins: {
      shiki: {
        theme: { light: 'vitesse-light', dark: 'vitesse-dark' }, 
      }
    }
  }),

  bundler: viteBundler()
})