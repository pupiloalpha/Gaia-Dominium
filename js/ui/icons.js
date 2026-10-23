// icons.js - Catálogo centralizado de ícones SVG do Gaia Dominium
// Substitui emojis por vetores nítidos, padronizados e consistentes em qualquer navegador ou sistema operacional

export const SVG_ICONS = {
  // ==================== RECURSOS ====================
  madeira: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-wood"><ellipse cx="6" cy="12" rx="3" ry="5"/><path d="M6 7h12a3 5 0 0 1 3 5 3 5 0 0 1-3 5H6"/><circle cx="6" cy="12" r="1" fill="currentColor"/></svg>`,
  
  pedra: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-stone"><polygon points="5 16 3 10 8 4 17 4 21 9 19 17 11 20 5 16"/><polyline points="8 4 10 11 19 9"/><polyline points="10 11 11 20"/></svg>`,
  
  ouro: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-gold"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 2"/><path d="M12 9v6M10 10.5h4M10 13.5h4"/></svg>`,
  
  agua: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-water"><path d="M12 2.7l5.3 5.9a7.5 7.5 0 1 1-10.6 0z"/><path d="M10 13a2.5 2.5 0 0 0 2.5 2.5" stroke-linecap="round"/></svg>`,

  // Aliases de recursos em inglês
  wood: null,
  stone: null,
  gold: null,
  water: null,

  // ==================== AÇÕES ====================
  explorar: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-explore"><path d="M14 6l4 4"/><path d="M4 20l9-9"/><path d="M15 4c3-1 6 0 7 2s-1 5-3 6l-2-2 1-3-3 1-2-2c1-2 2-2 2-2z"/></svg>`,
  
  coletar: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-collect"><path d="M2 22s5-3 9-8"/><path d="M11 14c-1-2 0-4 1-5 2-2 5-2 7-2 0 2 0 5-2 7-1 1-3 2-5 1"/><path d="M14 11c-1-2 0-4 1-5 2-2 5-2 7-2 0 2 0 5-2 7-1 1-3 2-5 1"/><path d="M17 8c-1-2 0-4 1-5 2-2 5-2 7-2 0 2 0 5-2 7-1 1-3 2-5 1"/></svg>`,
  
  construir: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-build"><path d="M15 4l5 5"/><path d="M17.5 6.5L9 15l-4-1 1-4 8.5-8.5"/><path d="M5 20l4-4"/><path d="M2 22l3-3"/><path d="M18 2l4 4"/></svg>`,
  
  negociar: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-negotiate"><path d="M7 16l-4-4 4-4"/><path d="M3 12h11a4 4 0 0 1 4 4v2"/><path d="M17 8l4 4-4 4"/><path d="M21 12H10a4 4 0 0 1-4-4V6"/></svg>`,
  
  disputar: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-dispute"><polyline points="14.5 17.5 3 6 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="9.5 17.5 21 6 18 3 6.5 14.5"/><line x1="11" y1="19" x2="5" y2="13"/><line x1="8" y1="16" x2="4" y2="20"/><line x1="5" y1="21" x2="3" y2="19"/></svg>`,
  
  dominar: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-dominate"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  
  ressuscitar: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-resurrect"><circle cx="12" cy="11" r="7"/><path d="M9 18h6v3H9z"/><circle cx="9.5" cy="10.5" r="1.5" fill="currentColor"/><circle cx="14.5" cy="10.5" r="1.5" fill="currentColor"/><path d="M12 13v2"/></svg>`,
  
  // ==================== FLUXO DO TURNO ====================
  endTurn: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-endturn"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><polyline points="21 21 21 16 16 16"/></svg>`,
  
  lightning: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="currentColor" class="svg-icon svg-lightning"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  
  pending: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-pending"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/><circle cx="18" cy="4" r="3" fill="#ef4444" stroke="#ef4444"/></svg>`,
  
  waiting: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-waiting"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`,

  // ==================== ESTRUTURAS ====================
  abrigo: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-shelter"><path d="m3 21 9-18 9 18"/><path d="m9 21 3-6 3 6"/><line x1="2" y1="21" x2="22" y2="21"/></svg>`,
  
  torreVigia: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-watchtower"><path d="M5 21h14"/><path d="M7 21l1.5-13h7L17 21"/><path d="M6 8h12v-3h-2v1h-2v-1h-4v1H8v-1H6z"/><circle cx="12" cy="13" r="1.5"/></svg>`,
  
  mercado: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-market"><path d="M3 9l2-5h14l2 5"/><path d="M21 9a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0"/><path d="M4 12v9h16v-9"/><path d="M10 21v-5h4v5"/></svg>`,
  
  laboratorio: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-lab"><path d="M10 2v5.5L4.5 18a2.5 2.5 0 0 0 2 3.5h11a2.5 2.5 0 0 0 2-3.5L14 7.5V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`,
  
  santuario: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-shrine"><path d="M2 20h20"/><path d="M12 2l8 5H4z"/><path d="M6 7v13"/><path d="M10 7v13"/><path d="M14 7v13"/><path d="M18 7v13"/></svg>`,
  
  estrutura: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-structure"><path d="M2 22h20"/><path d="M4 22V8l8-6 8 6v14"/><path d="M9 22v-6h6v6"/><circle cx="12" cy="8" r="2"/></svg>`,

  // ==================== INTERFACE / SISTEMA ====================
  star: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="currentColor" class="svg-icon svg-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  
  trofeu: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-trophy"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M6 3h12v7a6 6 0 0 1-12 0V3z"/><path d="M12 16v5"/><path d="M8 21h8"/></svg>`,
  
  moedas: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-income"><circle cx="8" cy="8" r="6"/><path d="M18 9a6 6 0 0 1-6 6"/><path d="M18 13a6 6 0 0 1-6 6"/></svg>`,
  
  alerta: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  
  salvar: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  
  robo: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-bot"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`,
  
  usuario: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  
  jogadores: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-users"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  
  evento: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-card"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4"/><path d="m8 8 8 8"/></svg>`,
  
  mascara: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-mask"><path d="M2 12c0 5 4 9 10 9s10-4 10-9c0-4-3-8-10-8S2 8 2 12z"/><path d="M7 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/><path d="M13 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/><path d="M9 16c1.5 1 4.5 1 6 0"/></svg>`,
  
  neutral: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-neutral"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,

  skull: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-skull"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M12.5 17l-.5-1-.5 1"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>`,

  check: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-check"><polyline points="20 6 9 17 4 12"/></svg>`,

  cross: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-cross"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,

  info: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-info"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,

  question: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-question"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,

  book: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-book"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,

  // ==================== FACÇÕES ====================
  faction_forest: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-faction-forest"><path d="M12 2L8 8h3l-4 6h4l-5 6h12l-5-6h4l-4-6h3L12 2z"/></svg>`,
  
  faction_water: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-faction-water"><path d="M12 2v20M5 5v5a7 7 0 0 0 14 0V5M2 17c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/></svg>`,
  
  faction_mountain: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-faction-mountain"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="m4.14 15 .76-1.55L7.9 16l3.1-3.1 3 3"/></svg>`,
  
  faction_trade: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-faction-trade"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1zM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10M12 3v18M3 7h18"/></svg>`,

  // ==================== BIOMAS ====================
  tropical: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-biome-tropical"><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8c0 2.21 1.57 4.08 3.75 4.75V21h3.5v-8.25C11.43 12.08 13 10.21 13 8z"/><path d="M22 8c0-2.76-2.46-5-5.5-5S11 5.24 11 8c0 2.21 1.57 4.08 3.75 4.75V21h3.5v-8.25C20.43 12.08 22 10.21 22 8z"/></svg>`,
  
  temperada: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-biome-temperate"><path d="M12 2 7 9h3l-4 6h4l-5 5h14l-5-5h4l-4-6h3l-5-7z"/><path d="M12 20v2"/></svg>`,
  
  savana: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-biome-savanna"><path d="M12 3a4 4 0 0 0-4 4c0 .7.18 1.36.5 1.94A5.5 5.5 0 0 0 4 14c0 3.04 2.46 5.5 5.5 5.5H12v3h1v-3h1.5c3.04 0 5.5-2.46 5.5-5.5a5.5 5.5 0 0 0-4.5-5.06A4 4 0 0 0 16 7a4 4 0 0 0-4-4z"/><circle cx="19" cy="5" r="2"/></svg>`,
  
  pantano: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-biome-swamp"><path d="M3 20c3 1 6 1 9 0s6-1 9 0M2 16c3 1 6 1 9 0s6-1 9 0"/><path d="M8 17V5c0-1.5 1.5-2 2-2s2 .5 2 2v12M15 17V9c0-1.2 1-1.8 1.5-1.8S18 7.8 18 9v8"/></svg>`,

  // ==================== AVATARES DE JOGADORES (ANIMAIS) ====================
  leao: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-lion"><circle cx="12" cy="12" r="6"/><path d="M12 2a4 4 0 0 0-4 4M12 2a4 4 0 0 1 4 4M4 8a4 4 0 0 1 4-4M20 8a4 4 0 0 0-4-4M2 12a4 4 0 0 0 4 4M22 12a4 4 0 0 1-4 4M4 16a4 4 0 0 0 4 4M20 16a4 4 0 0 1-4 4M12 22a4 4 0 0 1-4-4M12 22a4 4 0 0 0 4-4"/><circle cx="10" cy="11" r=".5" fill="currentColor"/><circle cx="14" cy="11" r=".5" fill="currentColor"/><path d="m11 13 1 1 1-1"/></svg>`,
  
  tigre: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-tiger"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h0A2.5 2.5 0 0 1 10 4.5V6H5v-1.5zM14 6v-1.5A2.5 2.5 0 0 1 16.5 2h0A2.5 2.5 0 0 1 19 4.5V6h-5z"/><circle cx="12" cy="13" r="8"/><path d="M12 5v3M9 8l1 2M15 8l-1 2M8 12l2 1M16 12l-2 1M10 16l2 1 2-1"/></svg>`,
  
  urso: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-bear"><circle cx="6.5" cy="6.5" r="3.5"/><circle cx="17.5" cy="6.5" r="3.5"/><circle cx="12" cy="14" r="7.5"/><ellipse cx="12" cy="15.5" rx="3.5" ry="2.5"/><circle cx="12" cy="14.5" r="1" fill="currentColor"/><circle cx="9.5" cy="11.5" r="1" fill="currentColor"/><circle cx="14.5" cy="11.5" r="1" fill="currentColor"/></svg>`,
  
  raposa: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-fox"><path d="m3 7 4-5 3.5 5.5L12 7l1.5.5L17 2l4 5-3 10-6 4-6-4L3 7z"/><path d="m7.5 13 4.5 4 4.5-4"/><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="16" cy="10" r="1" fill="currentColor"/></svg>`,
  
  lobo: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-wolf"><path d="M4 4l3 7-3 5 4 4 4-2 4 2 4-4-3-5 3-7-6 3-3-2-3 2-6-3z"/><path d="m9 13 3 3 3-3"/><circle cx="8.5" cy="10.5" r="1" fill="currentColor"/><circle cx="15.5" cy="10.5" r="1" fill="currentColor"/></svg>`,
  
  aguia: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-eagle"><path d="M12 2C8 2 4 6 4 10c0 4 3 8 8 12 5-4 8-8 8-12 0-4-4-8-8-8z"/><path d="M12 7c-2 0-3 1.5-3 3 0 2 2 3 3 6 1-3 3-4 3-6 0-1.5-1-3-3-3z"/><circle cx="9.5" cy="7.5" r="1" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1" fill="currentColor"/></svg>`,
  
  dragao: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-dragon"><path d="M4 14c2-5 6-9 12-10 1 3 0 6-2 8l4 1-5 5-2-1-2 4-5-7z"/><path d="m14 12 4 4M7 16l3 3"/><circle cx="12" cy="7" r="1" fill="currentColor"/></svg>`,
  
  tubarao: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-avatar-shark"><path d="M2 13c4-4 10-6 16-3l4-4v9l-4 4c-5 1-10 0-16-6z"/><path d="M10 7l3 3-3 3"/><path d="M7 11v4"/></svg>`,

  // ==================== LOG / SISTEMA ====================
  turn: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-turn"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  
  gear: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-gear"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  
  scroll: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-scroll"><path d="M19 17h2a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"/><path d="M15 22H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2z"/><line x1="8" y1="12" x2="12" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg>`,

  trash: `<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon svg-trash"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
};

SVG_ICONS.manual = SVG_ICONS.book;

// Aliases e sinônimos
SVG_ICONS.wood = SVG_ICONS.madeira;
SVG_ICONS.stone = SVG_ICONS.pedra;
SVG_ICONS.gold = SVG_ICONS.ouro;
SVG_ICONS.water = SVG_ICONS.agua;
SVG_ICONS.explore = SVG_ICONS.explorar;
SVG_ICONS.collect = SVG_ICONS.coletar;
SVG_ICONS.build = SVG_ICONS.construir;
SVG_ICONS.negotiate = SVG_ICONS.negociar;
SVG_ICONS.dispute = SVG_ICONS.disputar;
SVG_ICONS.dominate = SVG_ICONS.dominar;
SVG_ICONS.resurrect = SVG_ICONS.ressuscitar;

// Aliases de estruturas
SVG_ICONS.shelter = SVG_ICONS.abrigo;
SVG_ICONS['Abrigo'] = SVG_ICONS.abrigo;
SVG_ICONS.watchtower = SVG_ICONS.torreVigia;
SVG_ICONS['Torre de Vigia'] = SVG_ICONS.torreVigia;
SVG_ICONS.market = SVG_ICONS.mercado;
SVG_ICONS['Mercado'] = SVG_ICONS.mercado;
SVG_ICONS.lab = SVG_ICONS.laboratorio;
SVG_ICONS['Laboratório'] = SVG_ICONS.laboratorio;
SVG_ICONS.shrine = SVG_ICONS.santuario;
SVG_ICONS['Santuário'] = SVG_ICONS.santuario;
SVG_ICONS.structure = SVG_ICONS.estrutura;

// Aliases de sistema
SVG_ICONS.trophy = SVG_ICONS.trofeu;
SVG_ICONS.coins = SVG_ICONS.moedas;
SVG_ICONS.income = SVG_ICONS.moedas;
SVG_ICONS.alert = SVG_ICONS.alerta;
SVG_ICONS.save = SVG_ICONS.salvar;
SVG_ICONS.disk = SVG_ICONS.salvar;
SVG_ICONS.bot = SVG_ICONS.robo;
SVG_ICONS.ai = SVG_ICONS.robo;
SVG_ICONS.user = SVG_ICONS.usuario;
SVG_ICONS.player = SVG_ICONS.usuario;
SVG_ICONS.users = SVG_ICONS.jogadores;
SVG_ICONS.players = SVG_ICONS.jogadores;
SVG_ICONS.card = SVG_ICONS.evento;
SVG_ICONS.event = SVG_ICONS.evento;
SVG_ICONS.mask = SVG_ICONS.mascara;
SVG_ICONS.pv = SVG_ICONS.star;

// Aliases de biomas
SVG_ICONS['Floresta Tropical'] = SVG_ICONS.tropical;
SVG_ICONS['Floresta Temperada'] = SVG_ICONS.temperada;
SVG_ICONS['Savana'] = SVG_ICONS.savana;
SVG_ICONS['Pântano'] = SVG_ICONS.pantano;

// Aliases de facções
SVG_ICONS.forest_guardians = SVG_ICONS.faction_forest;
SVG_ICONS['Guardiões da Floresta'] = SVG_ICONS.faction_forest;
SVG_ICONS.water_masters = SVG_ICONS.faction_water;
SVG_ICONS['Mestres das Águas'] = SVG_ICONS.faction_water;
SVG_ICONS.mountain_builders = SVG_ICONS.faction_mountain;
SVG_ICONS['Construtores da Montanha'] = SVG_ICONS.faction_mountain;
SVG_ICONS.merchants_barons = SVG_ICONS.faction_trade;
SVG_ICONS['Barões do Comércio'] = SVG_ICONS.faction_trade;

// Aliases de avatares
SVG_ICONS.lion = SVG_ICONS.leao;
SVG_ICONS.tiger = SVG_ICONS.tigre;
SVG_ICONS.bear = SVG_ICONS.urso;
SVG_ICONS.fox = SVG_ICONS.raposa;
SVG_ICONS.wolf = SVG_ICONS.lobo;
SVG_ICONS.eagle = SVG_ICONS.aguia;
SVG_ICONS.dragon = SVG_ICONS.dragao;
SVG_ICONS.shark = SVG_ICONS.tubarao;

// Retrocompatibilidade para conversão transparente de emojis legados
SVG_ICONS['🦁'] = SVG_ICONS.leao;
SVG_ICONS['🐯'] = SVG_ICONS.tigre;
SVG_ICONS['🐻'] = SVG_ICONS.urso;
SVG_ICONS['🦊'] = SVG_ICONS.raposa;
SVG_ICONS['🐺'] = SVG_ICONS.lobo;
SVG_ICONS['🦅'] = SVG_ICONS.aguia;
SVG_ICONS['🐉'] = SVG_ICONS.dragao;
SVG_ICONS['🦈'] = SVG_ICONS.tubarao;
SVG_ICONS['🤖'] = SVG_ICONS.robo;
SVG_ICONS['🌴'] = SVG_ICONS.tropical;
SVG_ICONS['🌲'] = SVG_ICONS.temperada;
SVG_ICONS['🏜️'] = SVG_ICONS.savana;
SVG_ICONS['🌊'] = SVG_ICONS.pantano;
SVG_ICONS['🦌'] = SVG_ICONS.faction_forest;
SVG_ICONS['⛰️'] = SVG_ICONS.faction_mountain;
SVG_ICONS['🪙'] = SVG_ICONS.ouro;
SVG_ICONS['🪵'] = SVG_ICONS.madeira;
SVG_ICONS['🪨'] = SVG_ICONS.pedra;
SVG_ICONS['💧'] = SVG_ICONS.agua;

// Aliases de status e feedback
SVG_ICONS.swords = SVG_ICONS.disputar;
SVG_ICONS.warning = SVG_ICONS.alerta;
SVG_ICONS.error = SVG_ICONS.cross;
SVG_ICONS.success = SVG_ICONS.check;
SVG_ICONS.help = SVG_ICONS.question;
SVG_ICONS.dead = SVG_ICONS.skull;
SVG_ICONS.eliminated = SVG_ICONS.skull;

/**
 * Retorna o SVG em string com dimensões e classes configuráveis
 * @param {string} name - Nome do ícone ou chave
 * @param {Object} options
 * @param {number|string} [options.size=16] - Tamanho em pixels
 * @param {string} [options.className=''] - Classes CSS adicionais
 * @returns {string} String contendo a tag <svg>
 */
export function getIcon(name, { size = 16, className = '' } = {}) {
  if (!name) return '';
  if (typeof name === 'string' && name.trim().startsWith('<svg')) {
    return name;
  }
  const template = SVG_ICONS[name] || '';
  if (!template) return '';
  
  let result = template.replace(/{size}/g, size);
  if (className) {
    result = result.replace('class="', `class="${className} `);
  }
  return result;
}

/**
 * Renderiza o ícone de um jogador — aceita tanto caminhos de imagem (faction icons .webp/.png)
 * quanto nomes de ícone SVG do catálogo.
 */
export function renderPlayerIcon(icon, size = 22) {
  if (!icon) return getIcon('user', { size });
  if (typeof icon === 'string' && (icon.includes('/') || icon.includes('.'))) {
    return `<img src="${icon}" alt="Ícone" class="inline-block object-contain rounded" style="width:${size}px;height:${size}px;">`;
  }
  if (typeof icon === 'string' && icon.trim().startsWith('<svg')) {
    return icon;
  }
  return getIcon(icon, { size }) || getIcon('user', { size });
}
