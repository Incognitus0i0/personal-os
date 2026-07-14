import { useState, useRef, useEffect } from "react";
import { useSyncedState, useNutritionDays, useMediaItems, useHealthData } from "./db";

// ── Date helpers (local timezone safe) ─────────────────────────
const localISO = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY_ISO = localISO(new Date());
const D = n => { const d=new Date(); d.setDate(d.getDate()+n); return localISO(d); };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  .os{display:flex;height:100vh;min-height:580px;font-family:'Jost','Century Gothic','Futura',system-ui,sans-serif;background:#0F0E0C;overflow:hidden}
  .sidebar{width:220px;flex-shrink:0;background:#0F0E0C;display:flex;flex-direction:column;border-right:1px solid #1E1D1A;overflow-y:auto;scrollbar-width:none}
  .sidebar::-webkit-scrollbar{display:none}
  .sb-logo{padding:22px 20px 18px;border-bottom:1px solid #1E1D1A}
  .sb-logo-name{font-family:'Jost','Century Gothic',system-ui,sans-serif;font-size:15px;font-weight:500;color:#E8E4DC;letter-spacing:.12em;text-transform:uppercase}
  .sb-logo-sub{font-size:9px;color:#3A3835;letter-spacing:.12em;text-transform:uppercase;margin-top:4px;font-weight:400;opacity:.6}
  .nav-group{padding:14px 0 4px}
  .nav-group-label{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#686460;padding:0 20px 8px}
  .nav-item{display:flex;align-items:center;gap:10px;padding:7px 20px;cursor:pointer;color:#706C68;font-size:13px;font-weight:400;letter-spacing:.02em;border-left:2px solid transparent;transition:all .15s;user-select:none}
  .nav-item:hover{color:#C8C4BC;background:#141210}
  .nav-item.active{color:#EBE8E0;border-left-color:#EBE8E0;background:#161412}
  .nav-item.sub{padding-left:34px;font-size:12px;color:#5A5652}
  .nav-item.sub:hover{color:#B0ACA4;background:#141210}
  .nav-item.sub.active{color:#EBE8E0;border-left-color:#EBE8E0;background:#161412}
  .nav-arrow{margin-left:auto;font-size:9px;opacity:.3;transition:transform .2s}
  .nav-arrow.open{transform:rotate(90deg)}
  .ai-btn{margin:auto 14px 18px;padding:10px 14px;background:#161412;border:1px solid #2A2825;border-radius:8px;color:#D0CCC4;font-family:'Jost',system-ui,sans-serif;font-size:12px;letter-spacing:.06em;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .15s;width:calc(100% - 28px);text-align:left;font-weight:400}
  .ai-btn:hover{background:#1E1C18;border-color:#4A4844;color:#EBE8E0}
  .main{flex:1;display:flex;flex-direction:column;background:#F5F5F5;overflow:hidden}
  .topbar{height:48px;display:flex;align-items:center;padding:0 28px;border-bottom:1px solid #EBEBEB;flex-shrink:0;background:#F5F5F5;justify-content:space-between}
  .breadcrumb{font-size:11.5px;color:#A09A90;display:flex;align-items:center;gap:5px;letter-spacing:.03em}
  .bc-sep{opacity:.4}
  .bc-cur{color:#3A3530;font-weight:500}
  .content{flex:1;overflow-y:auto;padding:28px 32px;scroll-behavior:smooth}
  .mod-header{margin-bottom:26px}
  .mod-title{font-family:'Jost','Century Gothic',system-ui,sans-serif;font-size:28px;font-weight:300;color:#1A1815;line-height:1;letter-spacing:.04em}
  .mod-sub{font-size:10px;color:#9A9690;letter-spacing:.14em;text-transform:uppercase;margin-top:8px;font-weight:500}
  .mod-desc{font-size:13.5px;color:#7A7870;margin-top:10px;max-width:480px;line-height:1.65;font-weight:400}
  .filter-bar{display:flex;align-items:center;gap:8px;margin-bottom:22px;flex-wrap:wrap}
  .filter-label{font-size:10px;color:#9A9690;letter-spacing:.1em;text-transform:uppercase;flex-shrink:0;font-weight:500}
  .chip{padding:4px 13px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid #D8D4CC;color:#7A7870;background:transparent;font-family:'Jost',system-ui,sans-serif;transition:all .15s;letter-spacing:.02em}
  .chip:hover{border-color:#3A3530;color:#3A3530}
  .chip.on{background:#2A2825;color:#EBE8E0;border-color:#2A2825;font-weight:500}
  .ghost-table{width:100%;border-collapse:collapse}
  .ghost-table th{text-align:left;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#A09A90;padding:0 20px 12px 0;border-bottom:1px solid #E0DCD4}
  .ghost-row td{padding:13px 20px 13px 0;border-bottom:1px solid #EAE6DE}
  .gbar{height:10px;border-radius:5px;background:#E8E8E8;animation:pulse 2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:.55}50%{opacity:.9}}
  .task-list{display:flex;flex-direction:column;gap:5px}
  .task-item,.t-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:8px;border:1px solid #E8E8E8;background:#FAFAFA;cursor:pointer;transition:border-color .15s}
  .task-item:hover,.t-item:hover{border-color:#C0C0C0}
  .tcheck{width:18px;height:18px;border:1.5px solid #C0BCA8;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:white;transition:all .15s}
  .tcheck.on{background:#2A2825;border-color:#2A2825}
  .tbar{height:12px;border-radius:5px;background:#DED9D0;flex:1;animation:pulse 2s ease-in-out infinite}
  .ttag{font-size:10.5px;padding:2px 9px;border-radius:4px;background:#EBEBEB;color:#909090;flex-shrink:0;white-space:nowrap;letter-spacing:.02em}
  .j-list{display:flex;flex-direction:column;gap:14px}
  .j-entry{padding:20px 24px;background:#FAFAF6;border-radius:10px;border:1px solid #E4E0D8;border-left:2px solid #3A3530}
  .j-date{font-size:10px;color:#A09A90;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;font-weight:500}
  .j-title{height:16px;background:#DED9D0;border-radius:5px;margin-bottom:12px;animation:pulse 2s ease-in-out infinite}
  .j-line{height:10px;background:#EAE6DE;border-radius:4px;animation:pulse 2s ease-in-out infinite}
  .cap-input{width:100%;padding:13px 18px;border:1.5px solid #D8D4CC;border-radius:10px;background:#FAFAF6;font-family:'Jost',system-ui,sans-serif;font-size:14px;color:#3A3530;outline:none;margin-bottom:22px;transition:border-color .15s;letter-spacing:.02em}
  .cap-input:focus{border-color:#3A3530}
  .sec-label{font-size:10px;color:#9A9690;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px;font-weight:500}
  .tags-wrap{display:flex;flex-wrap:wrap;gap:8px}
  .tpill{padding:4px 10px 4px 8px;border-radius:20px;font-size:12px;display:flex;align-items:center;gap:5px;cursor:pointer;letter-spacing:.02em}
  .tdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .cap-items{display:flex;flex-direction:column;gap:8px;margin-top:6px}
  .cap-item{padding:12px 16px;background:white;border-radius:8px;border:1px solid #EBEBEB;display:flex;align-items:center;gap:12px;font-size:13px;color:#3A3530;transition:border-color .15s}
  .cap-item:hover{border-color:#C8C8C8}
  .course-card{background:#FAFAFA;border:1px solid #E8E8E8;border-radius:10px;padding:20px 24px;margin-bottom:14px}
  .ctitle{font-family:'Jost',system-ui,sans-serif;font-size:18px;font-weight:500;color:#2A2520;margin-bottom:4px;letter-spacing:.04em}
  .cmeta{font-size:12px;color:#A0A0A0;margin-bottom:14px;letter-spacing:.02em}
  .cprog{height:3px;background:#E0E0E0;border-radius:2px;margin-bottom:16px;overflow:hidden}
  .cfill{height:100%;background:#2A2825;border-radius:2px}
  .ch-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #EBEBEB;font-size:13px;cursor:pointer;letter-spacing:.02em}
  .chbox{width:16px;height:16px;border:1.5px solid #C0C0C0;border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;transition:all .15s}
  .chbox.on{background:#2A2825;border-color:#2A2825}
  .add-btn{padding:14px 24px;background:#EBEBEB;border-radius:10px;border:1px dashed #C8C8C8;text-align:center;color:#A0A0A0;font-size:13px;cursor:pointer;letter-spacing:.04em}
  .t-add-btn{padding:11px 18px;background:#F5F5F5;border:1px dashed #C8C8C8;border-radius:9px;color:#A0A0A0;font-size:13px;cursor:pointer;display:inline-block;letter-spacing:.02em;transition:all .15s}
  .t-add-btn:hover{border-color:#3A3530;color:#3A3530}
  .t-form{background:white;border:1px solid #E8E8E8;border-radius:10px;padding:18px;margin-bottom:4px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .t-form-input{width:100%;padding:9px 12px;border:1.5px solid #DCDCDC;border-radius:7px;font-family:'Jost',system-ui,sans-serif;font-size:14px;color:#2A2520;outline:none;background:white;margin-bottom:10px}
  .t-form-input:focus{border-color:#3A3530}
  .t-form-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  .t-select{padding:6px 10px;border:1px solid #DCDCDC;border-radius:6px;font-family:'Jost',system-ui,sans-serif;font-size:12.5px;color:#4A4540;background:white;outline:none;cursor:pointer}
  .t-form-actions{display:flex;gap:8px}
  .t-btn-save{padding:7px 16px;background:#2A2825;color:white;border:none;border-radius:6px;font-family:'Jost',system-ui,sans-serif;font-size:12.5px;cursor:pointer;letter-spacing:.03em}
  .t-btn-cancel{padding:7px 16px;background:transparent;color:#A0A0A0;border:1px solid #DCDCDC;border-radius:6px;font-family:'Jost',system-ui,sans-serif;font-size:12.5px;cursor:pointer}
  .t-item{background:#FAFAFA;border:1px solid #E8E8E8;border-radius:9px;margin-bottom:6px;overflow:hidden;transition:border-color .15s}
  .t-item:hover{border-color:#C8C8C8}
  .t-done{opacity:.6}
  .t-main-row{display:flex;align-items:center;gap:11px;padding:12px 14px}
  .t-title{font-size:13.5px;color:#2A2520;font-weight:400;line-height:1.3;letter-spacing:.01em}
  .t-done .t-title{text-decoration:line-through;color:#A0A0A0}
  .t-meta{display:flex;align-items:center;gap:10px;margin-top:4px;flex-wrap:wrap}
  .t-proj{font-size:11px;color:#8080A0;background:#F0F0F8;padding:2px 7px;border-radius:4px;letter-spacing:.02em}
  .t-due{font-size:11px;color:#909090;letter-spacing:.02em}
  .t-overdue{color:#C03030;font-weight:500}
  .t-sub-count{font-size:11px;color:#A0A0A0}
  .t-pri{font-size:10.5px;font-weight:500;padding:3px 9px;border-radius:20px;letter-spacing:.04em;flex-shrink:0}
  .t-expand{font-size:10px;color:#C0C0C0;cursor:pointer;padding:4px 6px;border-radius:4px;flex-shrink:0}
  .t-expand:hover{color:#606060;background:#EBEBEB}
  .t-del{font-size:11px;color:#D0D0D0;cursor:pointer;padding:4px 6px;border-radius:4px;flex-shrink:0;opacity:0;transition:opacity .15s}
  .t-item:hover .t-del{opacity:1}
  .t-del:hover{color:#C03030;background:#FEE8E8}
  .t-subs{border-top:1px solid #EBEBEB;padding:10px 14px 10px 44px;display:flex;flex-direction:column;gap:6px;background:#F8F8F8}
  .t-sub-row{display:flex;align-items:center;gap:9px;cursor:pointer;padding:3px 0}
  .t-sub-new{font-size:11.5px;color:#C0C0C0;cursor:pointer;padding:3px 0;letter-spacing:.02em}
  .t-sub-new:hover{color:#606060}
  .t-sub-inline{font-size:11px;color:#D0D0D0;cursor:pointer;padding:4px 14px 8px 44px;letter-spacing:.02em}
  .t-sub-inline:hover{color:#808080}
  .t-sub-add-form{display:flex;align-items:center;gap:6px}
  .t-sub-input{flex:1;padding:5px 9px;border:1px solid #DCDCDC;border-radius:5px;font-family:'Jost',system-ui,sans-serif;font-size:12.5px;outline:none;background:white}
  .t-inline-edit{width:100%;padding:2px 6px;border:1.5px solid #3A3530;border-radius:5px;font-family:'Jost',system-ui,sans-serif;font-size:13.5px;color:#2A2520;outline:none;background:white;letter-spacing:.01em}
  .t-timeblock{font-size:11px;color:#6080A0;background:#EEF2F8;padding:2px 7px;border-radius:4px;letter-spacing:.01em}
  .t-edit-btn{font-size:12px;color:#D0D0D0;cursor:pointer;padding:4px 5px;border-radius:4px;flex-shrink:0;opacity:0;transition:opacity .15s}
  .t-item:hover .t-edit-btn{opacity:1}
  .t-edit-btn:hover{color:#3A3530;background:#EBEBEB}
  .crm-list{width:260px;flex-shrink:0;border-right:1px solid #E8E8E8;overflow-y:auto;display:flex;flex-direction:column}
  .crm-filters{display:flex;flex-wrap:wrap;gap:5px;padding:0 0 14px}
  .crm-row{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:8px;cursor:pointer;transition:background .12s;margin-bottom:2px}
  .crm-row:hover{background:#EFEFEF}
  .crm-row-active{background:#EBEBEB}
  .crm-avatar{width:36px;height:36px;border-radius:50%;background:#2A2825;color:#EBE8E0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;letter-spacing:.04em;flex-shrink:0}
  .crm-name{font-size:13.5px;color:#2A2520;font-weight:500;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .crm-company{font-size:11.5px;color:#A0A0A0;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .crm-status-badge{font-size:10.5px;font-weight:500;padding:2px 8px;border-radius:20px;letter-spacing:.03em;white-space:nowrap;flex-shrink:0}
  .crm-add-btn{margin:8px 12px;padding:10px;text-align:center;color:#A0A0A0;font-size:12.5px;cursor:pointer;border:1px dashed #D8D8D8;border-radius:8px;letter-spacing:.03em}
  .crm-add-btn:hover{color:#3A3530;border-color:#A0A0A0}
  .crm-detail{flex:1;overflow-y:auto;padding:0 28px 28px;min-width:0}
  .crm-detail-header{display:flex;align-items:center;gap:14px;padding:4px 0 20px;border-bottom:1px solid #E8E8E8;margin-bottom:20px}
  .crm-detail-avatar{width:48px;height:48px;border-radius:50%;background:#2A2825;color:#EBE8E0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:500;letter-spacing:.04em;flex-shrink:0}
  .crm-detail-name{font-size:18px;font-weight:500;color:#1A1815;letter-spacing:.02em}
  .crm-detail-company{font-size:12.5px;color:#A0A0A0;margin-top:2px}
  .crm-section{margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #EEEEEE}
  .crm-section:last-child{border-bottom:none}
  .crm-section-title{font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#A0A0A0;margin-bottom:14px}
  .crm-field{cursor:pointer;border-radius:6px;padding:4px 6px;margin:-4px -6px;transition:background .12s}
  .crm-field:hover{background:#EEEEEE}
  .crm-field-label{font-size:9.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#B0B0B0;margin-bottom:2px}
  .crm-field-value{font-size:13.5px;color:#2A2520;letter-spacing:.01em}
  .crm-inv-row{padding:12px 0;border-top:1px solid #F0F0F0;display:flex;align-items:flex-start;gap:8px}
  .crm-add-inline{font-size:12px;color:#B0B0B0;cursor:pointer;padding:8px 0;letter-spacing:.03em}
  .crm-add-inline:hover{color:#3A3530}
  .crm-note{background:#FAFAFA;border:1px solid #EBEBEB;border-radius:8px;padding:12px 14px;margin-bottom:8px}
  .fin-summary{background:white;border:1px solid #EBEBEB;border-radius:10px;padding:20px 24px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
  .fin-total-label{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#A0A0A0;margin-bottom:4px}
  .fin-total{font-size:28px;font-weight:300;color:#1A1815;letter-spacing:-.01em;margin-bottom:14px}
  .fin-cat-row{display:flex;flex-wrap:wrap;gap:10px}
  .fin-cat-item{display:flex;align-items:center;gap:5px;font-size:12px;color:#707070}
  .fin-cat-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .fin-cat-name{color:#909090}
  .fin-cat-amt{font-weight:500;color:#3A3530}
  .fin-toolbar{margin-bottom:14px}
  .fin-table{width:100%;border-collapse:collapse}
  .fin-table th{text-align:left;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#A0A0A0;padding:0 16px 10px 0;border-bottom:1px solid #E8E8E8}
  .fin-row td{padding:11px 16px 11px 0;border-bottom:1px solid #F2F2F2;font-size:13px;color:#3A3530;vertical-align:middle}
  .fin-row:hover td{background:#FAFAFA}
  .fin-cell-edit{cursor:pointer;padding:2px 5px;border-radius:4px;display:inline-block;transition:background .12s}
  .fin-cell-edit:hover{background:#EBEBEB}
  .fin-inline-input{padding:3px 7px;border:1.5px solid #3A3530;border-radius:5px;font-family:'Jost',system-ui,sans-serif;font-size:13px;outline:none;background:white;color:#2A2520}
  .j-list-panel{width:260px;flex-shrink:0;border-right:1px solid #E8E8E8;overflow-y:auto;padding-right:0}
  .j-list-item{padding:14px 16px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:background .12s;border-left:2px solid transparent}
  .j-list-item:hover{background:#F0F0F0}
  .j-list-active{background:#EBEBEB;border-left-color:#2A2825}
  .j-list-date{font-size:10px;color:#B0B0B0;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px}
  .j-list-title{font-size:13.5px;color:#2A2520;font-weight:500;margin-bottom:4px;letter-spacing:.01em;line-height:1.3}
  .j-list-preview{font-size:11.5px;color:#A0A0A0;line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
  .j-entry-panel{flex:1;overflow-y:auto;min-width:0}
  .j-entry-inner{max-width:640px;margin:0 auto;padding:12px 36px 48px}
  .j-entry-date{font-size:11px;color:#B0B0B0;letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px;cursor:pointer;display:inline-block;padding:2px 4px;border-radius:4px}
  .j-entry-date:hover{background:#EBEBEB;color:#606060}
  .j-edit-date{font-size:11px;letter-spacing:.06em;border:1.5px solid #3A3530;border-radius:5px;padding:3px 8px;outline:none;font-family:'Jost',system-ui,sans-serif;margin-bottom:18px;display:block}
  .j-entry-title{font-family:'Jost',system-ui,sans-serif;font-size:30px;font-weight:300;color:#1A1815;line-height:1.15;letter-spacing:.01em;margin-bottom:18px;cursor:pointer;padding:2px 4px;border-radius:4px}
  .j-entry-title:hover{background:#F0F0F0}
  .j-edit-title{font-family:'Jost',system-ui,sans-serif;font-size:30px;font-weight:300;color:#1A1815;line-height:1.15;letter-spacing:.01em;margin-bottom:18px;border:none;border-bottom:1.5px solid #3A3530;outline:none;background:transparent;width:100%;padding:2px 0}
  .j-entry-divider{height:1px;background:#E8E8E8;margin-bottom:28px}
  .j-entry-content{font-size:15.5px;color:#2A2520;line-height:1.85;cursor:pointer;padding:4px;border-radius:4px;min-height:200px;letter-spacing:.01em}
  .j-entry-content:hover{background:#FAFAFA}
  .j-edit-content{width:100%;min-height:400px;font-family:'Jost',system-ui,sans-serif;font-size:15px;color:#3A3530;line-height:1.8;letter-spacing:.01em;border:none;border-left:2px solid #3A3530;padding:4px 0 4px 16px;outline:none;background:transparent;resize:vertical}
  .j-placeholder{color:#C8C8C8;font-style:italic}
  .j-entry-footer{display:flex;justify-content:"space-between";align-items:center;margin-top:40px;padding-top:16px;border-top:1px solid #F0F0F0}
  .j-word-count{font-size:11px;color:#C0C0C0;letter-spacing:.05em}
  .view-toggle{display:flex;gap:0;margin-bottom:20px;border:1px solid #E0E0E0;border-radius:8px;overflow:hidden;width:fit-content}
  .view-btn{padding:6px 16px;border:none;background:transparent;cursor:pointer;font-family:"Jost",system-ui,sans-serif;font-size:12px;color:#A0A0A0;letter-spacing:.04em;transition:all .12s}
  .view-btn.active{background:#2A2825;color:#EBE8E0}
  .kanban-board{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;align-items:flex-start}
  .kanban-col-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:0 4px}
  .kanban-col-title{font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#707070}
  .kanban-col-count{font-size:11px;color:#B0B0B0;background:#E0E0E0;padding:1px 7px;border-radius:10px}

  .kanban-card{background:#FAFAFA;border:1px solid #E8E8E8;border-radius:8px;padding:11px 12px;margin-bottom:6px;cursor:grab;transition:box-shadow .15s,opacity .15s,transform .15s}
  .kanban-card:active{cursor:grabbing}
  .kanban-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .kanban-card.dragging{opacity:.35;transform:scale(.97)}
  .kanban-col{min-width:240px;width:240px;flex-shrink:0;background:#F2F2F2;border-radius:10px;padding:12px 10px;transition:background .15s,box-shadow .15s}
  .kanban-col.drag-over{background:#E8E8FF;box-shadow:inset 0 0 0 2px #2A50A0}

  .kanban-card-title{font-size:13px;color:#2A2520;line-height:1.35;margin-bottom:6px;font-weight:400}
  .kanban-card-done .kanban-card-title{text-decoration:line-through;color:#A0A0A0}
  .kanban-card-meta{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
  .kanban-card-proj{font-size:10.5px;color:#8080A0;background:#F0F0F8;padding:2px 6px;border-radius:3px}
  .kanban-card-due{font-size:10.5px;color:#909090}
  .kanban-card-due.overdue{color:#C03030;font-weight:500}
  .kanban-card-time{font-size:10.5px;color:#6080A0}
  .kanban-group-toggle{display:flex;gap:6px;margin-bottom:16px;align-items:center}
  .kanban-group-label{font-size:11px;color:#A0A0A0;letter-spacing:.04em}


  .cal-wrap{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden}
  .cal-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:0;flex-shrink:0;padding:16px 24px;border-bottom:1px solid #E8E8E8}
  .cal-nav{display:flex;align-items:center;gap:8px}
  .cal-nav-btn{background:none;border:1px solid #E0E0E0;border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px;color:#606060;display:flex;align-items:center;justify-content:center;transition:all .12s}
  .cal-nav-btn:hover{background:#F0F0F0;border-color:#C0C0C0}
  .cal-period{font-size:15px;font-weight:500;color:#1A1815;letter-spacing:.01em;min-width:180px;text-align:center}
  .cal-today-btn{padding:4px 12px;border:1px solid #E0E0E0;border-radius:6px;background:none;cursor:pointer;font-family:'Jost',system-ui,sans-serif;font-size:12px;color:#606060;transition:all .12s}
  .cal-today-btn:hover{background:#F0F0F0}
  .cal-grid-wrap{flex:1;overflow-y:auto;position:relative;min-height:0;width:100%}
  .cal-time-grid{display:flex;width:100%;min-width:100%}
  .cal-time-col{width:52px;flex-shrink:0}
  .cal-time-label{height:56px;display:flex;align-items:flex-start;padding-top:0;font-size:10.5px;color:#B0B0B0;letter-spacing:.04em;justify-content:flex-end;padding-right:10px;position:relative;top:-8px}
  .cal-cols{flex:1;display:flex;border-left:1px solid #E8E8E8;position:relative}
  .cal-day-col{flex:1;border-right:1px solid #E8E8E8;position:relative;min-width:0}
  .cal-day-col-header{text-align:center;padding:8px 4px 10px;border-bottom:1px solid #E8E8E8;position:sticky;top:0;background:#F5F5F5;z-index:2;min-height:48px}
  .cal-day-name{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#A0A0A0}
  .cal-day-num{font-size:20px;font-weight:300;color:#1A1815;line-height:1.2}
  .cal-day-num.today{background:#2A2825;color:#EBE8E0;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin:2px auto 0;font-size:16px}
  .cal-slot{height:56px;border-bottom:1px solid #F0F0F0;position:relative}
  .cal-slot:hover{background:#FAFAFA}
  .cal-block{position:absolute;left:3px;right:3px;border-radius:5px;padding:3px 6px;font-size:11px;overflow:hidden;cursor:pointer;z-index:1;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  .cal-block-title{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-block-time{opacity:.75;font-size:10px}
  .cal-due-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:3px;font-size:10.5px;margin:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:calc(100% - 4px)}
  .cal-month-grid{display:grid;grid-template-columns:repeat(7,1fr);border-left:1px solid #E8E8E8;border-top:1px solid #E8E8E8}
  .cal-month-cell{border-right:1px solid #E8E8E8;border-bottom:1px solid #E8E8E8;min-height:90px;padding:6px}
  .cal-month-cell.other-month{background:#FAFAFA}
  .cal-month-cell.today-cell{background:#FFFEF8}
  .cal-month-day{font-size:12px;font-weight:500;color:#4A4540;margin-bottom:4px}
  .cal-month-day.today-num{background:#2A2825;color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px}
  .cal-allday-row{display:flex;border-bottom:1px solid #EBEBEB;background:#FAFAFA;flex-shrink:0}
  .cal-allday-label{width:52px;flex-shrink:0;font-size:9.5px;color:#B0B0B0;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;letter-spacing:.04em}
  .cal-allday-cells{flex:1;display:flex;border-left:1px solid #E8E8E8}
  .cal-allday-cell{flex:1;border-right:1px solid #E8E8E8;padding:3px 4px;min-height:28px}
  .cal-now-line{position:absolute;left:0;right:0;height:2px;background:#DC2626;z-index:3;pointer-events:none;opacity:.7}
  .cal-now-line::before{content:'';position:absolute;left:-4px;top:-4px;width:10px;height:10px;border-radius:50%;background:#E03030}
  .ai-panel{position:fixed;right:0;top:0;height:100vh;width:380px;background:#0F0E0C;border-left:1px solid #1E1D1A;display:flex;flex-direction:column;z-index:100;transform:translateX(100%);transition:transform .25s cubic-bezier(.4,0,.2,1)}
  .ai-panel.open{transform:translateX(0)}
  .ai-header{padding:18px 20px;border-bottom:1px solid #1E1D1A;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
  .ai-header-title{font-size:13px;font-weight:500;color:#E8E4DC;letter-spacing:.08em;text-transform:uppercase}
  .ai-close{color:#686460;cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;border-radius:4px;transition:color .12s}
  .ai-close:hover{color:#E8E4DC}
  .ai-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scrollbar-width:none}
  .ai-messages::-webkit-scrollbar{display:none}
  .ai-msg-user{align-self:flex-end;background:#2A2825;color:#EBE8E0;padding:10px 14px;border-radius:12px 12px 2px 12px;font-size:13px;max-width:88%;line-height:1.55;letter-spacing:.01em}
  .ai-msg-ai{align-self:flex-start;color:#C8C4BC;font-size:13px;max-width:92%;line-height:1.65;letter-spacing:.01em;white-space:pre-wrap}
  .ai-msg-ai strong{color:#E8E4DC;font-weight:500}
  .ai-thinking{align-self:flex-start;color:#686460;font-size:13px;font-style:italic;letter-spacing:.02em}
  .ai-suggestions{padding:0 16px 12px;display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0}
  .ai-chip{padding:5px 11px;border:1px solid #2A2825;border-radius:20px;font-size:11.5px;color:#8A8680;cursor:pointer;font-family:"Jost",system-ui,sans-serif;transition:all .12s;letter-spacing:.02em;background:transparent}
  .ai-chip:hover{border-color:#686460;color:#C8C4BC}
  .ai-input-area{padding:12px 16px;border-top:1px solid #1E1D1A;display:flex;gap:8px;flex-shrink:0}
  .ai-input{flex:1;background:#1A1918;border:1px solid #2A2825;border-radius:8px;padding:10px 14px;color:#E8E4DC;font-family:"Jost",system-ui,sans-serif;font-size:13px;outline:none;resize:none;line-height:1.5;letter-spacing:.01em;max-height:100px}
  .ai-input:focus{border-color:#3A3835}
  .ai-input::placeholder{color:#3A3835}
  .ai-send{background:#2A2825;border:none;border-radius:8px;padding:10px 14px;color:#E8E4DC;cursor:pointer;font-size:13px;transition:background .12s;flex-shrink:0}
  .ai-send:hover{background:#3A3835}
  .ai-send:disabled{opacity:.4;cursor:default}

`;

const NAV_GROUPS = [
  { group:"WORK", items:[
    { id:"crm", label:"CRM", icon:"◎" },
    { id:"projektai", label:"Projects", icon:"◫" },
    { id:"tasks", label:"Tasks", icon:"✓" },
    { id:"calendar", label:"Calendar", icon:"▦" },
    { id:"finansai", label:"Finance", icon:"◈", children:[
      { id:"fin-dashboard", label:"Dashboard" },
      { id:"islaidos", label:"Personal" },
      { id:"proj-fin", label:"Projects" }
    ]}
  ]},
  { group:"PERSONAL", items:[
    { id:"capture", label:"Quick Capture", icon:"⊕" },
    { id:"journal", label:"Journal", icon:"◳" },
    { id:"fitness", label:"Fitness", icon:"◉", children:[
      { id:"treniruotes", label:"Workouts" },
      { id:"mityba", label:"Nutrition" },
      { id:"sveikata", label:"Health" }
    ]}
  ]},
  { group:"MEDIA", items:[
    { id:"knygos", label:"Books", icon:"▤" },
    { id:"filmai", label:"Movies", icon:"▷" },
    { id:"zaidimai", label:"Games", icon:"◈" },
    { id:"mokymasis", label:"Learning", icon:"◐" }
  ]}
];

const M = {
  crm:{ title:"CRM", sub:"Client relationship management", desc:"Contacts, communication history, statuses and payments in one place.", fl:"Status", filters:["All","Active","Inactive","Ghosted","Prospect"], cols:["Client","Company","Last contact","Status","Projects"], rows:6 },
  projektai:{ title:"Projects", sub:"Project management", desc:"All projects with client links, stages and Gantt view.", fl:"Stage", filters:["All","Active","On hold","Completed","Idea"], cols:["Project","Client","Stage","Deadline"], rows:5 },
  calendar:{ title:"Calendar", sub:"Schedule & time blocks", desc:"", fl:null, filters:[], cols:null, rows:0 },
  tasks:{ title:"Tasks", sub:"Task list", desc:"All tasks linked to projects. Tick, filter, prioritise.", fl:"Show", filters:["All","To do","Done","Today","This week"], cols:null, rows:8 },
  "fin-dashboard":{ title:"Finance Dashboard", sub:"Overview & insights", desc:"", fl:"Period", filters:["This month","Last month","This year","All time"], cols:null, rows:0 },
  islaidos:{ title:"Personal expenses", sub:"Daily spending tracker", desc:"Everyday expenses with categories — like Monefy, but built into your system.", fl:"Category", filters:["All","Food","Transport","Sport","Entertainment","Other"], cols:["Name","Category","Date","Amount"], rows:7 },
  "proj-fin":{ title:"Project finance", sub:"Expenses and income", desc:"Project expenses, freelance and salary income. Every entry has a name.", fl:"Type", filters:["All","Expenses","Freelance income","Salary"], cols:["Name","Project","Type","Date","Amount"], rows:6 },
  capture:{ title:"Quick Capture", sub:"Notes, files and ideas", desc:"Drop text, files, thoughts. Assign tags. Sort later.", fl:null, filters:[], cols:null, rows:0 },
  journal:{ title:"Journal", sub:"Personal entries", desc:"Daily reflections and thoughts — like memoirs, with date and title.", fl:"Sort", filters:["Newest","Oldest"], cols:null, rows:4 },
  treniruotes:{ title:"Workouts", sub:"Training log", desc:"Training plans, exercises, progressions and weights.", fl:"Type", filters:["All","Push","Pull","Legs","Pole dance","Flexibility"], cols:["Date","Type","Exercises","Duration"], rows:5 },
  mityba:{ title:"Nutrition", sub:"Food tracking", desc:"Calories, macros and a daily food diary.", fl:null, filters:[], cols:["Date","Meal","Calories","Protein","Fat","Carbs"], rows:5 },
  sveikata:{ title:"Health", sub:"Health metrics", desc:"Weight, medical test results and overall health history.", fl:null, filters:[], cols:["Date","Metric","Value","Reference","Notes"], rows:5 },
  knygos:{ title:"Books", sub:"Reading tracker", desc:"Library with Google Books integration — enter a title and info fills in automatically.", fl:"Filter", filters:["All","Reading","Read","Want to read"], cols:["Book","Author","Year","Genre","Rating"], rows:5 },
  filmai:{ title:"Movies", sub:"Movie tracker", desc:"Watched and want-to-watch movies with TMDB integration.", fl:"Filter", filters:["All","Watched","Want to watch","Watching"], cols:["Movie","Year","Genre","Rating"], rows:5 },
  zaidimai:{ title:"Games", sub:"Game tracker", desc:"Games with IGDB integration — year, genre, platform.", fl:"Filter", filters:["All","Playing","Played","Want to play"], cols:["Game","Platform","Genre","Rating"], rows:5 },
  mokymasis:{ title:"Learning", sub:"Courses and skills", desc:"Courses with chapters. Each chapter is a checkbox so you can track progress.", fl:null, filters:[], cols:null, rows:0 }
};

const BC = {
  crm:["Work","CRM"], projektai:["Work","Projects"], tasks:["Work","Tasks"], calendar:["Work","Calendar"],
  "fin-dashboard":["Work","Finance","Dashboard"], islaidos:["Work","Finance","Personal"], "proj-fin":["Work","Finance","Projects"],
  capture:["Personal","Quick Capture"], journal:["Personal","Journal"],
  treniruotes:["Personal","Fitness","Workouts"], mityba:["Personal","Fitness","Nutrition"], sveikata:["Personal","Fitness","Health"],
  knygos:["Media","Books"], filmai:["Media","Movies"], zaidimai:["Media","Games"], mokymasis:["Media","Learning"]
};

const TAGS = [
  {l:"archviz",c:"#1E7A7A",bg:"#E5F5F5"},
  {l:"idea",c:"#B87820",bg:"#FBF3E5"},
  {l:"personal",c:"#8B4A8B",bg:"#F5EAF5"},
  {l:"buy",c:"#2A6CB0",bg:"#E8F0FB"},
  {l:"urgent",c:"#B83030",bg:"#FBE8E8"},
  {l:"later",c:"#686460",bg:"#F0EDEA"}
];

const GW = [[60,32,22,16,28],[48,42,28,22,20],[72,28,32,14,24],[55,38,20,26,18],[50,30,24,20,30],[65,36,18,24,22]];
const TS = [false,false,true,false,false,true,false,false];
const TW = [55,70,45,62,38,72,48,60];
const TT = ["Archviz project",null,"Personal","Archviz project",null,"Personal",null,"Archviz project"];

function GhostTable({mod}) {
  return (
    <table className="ghost-table">
      <thead><tr>{mod.cols.map(c=><th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {Array.from({length:mod.rows},(_,i)=>(
          <tr key={i} className="ghost-row">
            {mod.cols.map((_,j)=>(
              <td key={j}><div className="gbar" style={{width:(GW[i%6][j%5]||28)+"%"}}/></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const PRIORITY_STYLES = {
  High:   { bg:"#FEE8E8", color:"#C03030", label:"High" },
  Medium: { bg:"#FEF3E0", color:"#B07010", label:"Medium" },
  Low:    { bg:"#EAF3EA", color:"#3A8A3A", label:"Low" },
};

const PROJECTS = ["—","Archviz Client A","Archviz Client B","Personal","Side project"];

const INIT_TASKS = [
  { id:1, title:"Prepare mood board for client presentation", done:false, priority:"High",   project:"Apartment Visualisation — Forma", due:D(1),  startTime:"09:00", duration:90,  expanded:false, subtasks:[{id:11,title:"Collect reference images",done:true},{id:12,title:"Export PDF",done:false}] },
  { id:2, title:"MaterialIQ baking workflow research",         done:false, priority:"Medium", project:"Personal",                        due:D(6),  startTime:"14:00", duration:60,  expanded:false, subtasks:[{id:21,title:"Watch tutorial series",done:false}] },
  { id:3, title:"Send invoice — monthly",                      done:false, priority:"High",   project:"Apartment Visualisation — Forma", due:D(-1), startTime:"11:00", duration:30,  expanded:false, subtasks:[] },
  { id:4, title:"Update gym programme — pull day",             done:true,  priority:"Low",    project:"Personal",                        due:D(-4), startTime:"",      duration:0,   expanded:false, subtasks:[] },
  { id:5, title:"Review Blender scene lighting",               done:false, priority:"Medium", project:"Office Interior — Archis Studio", due:D(0),  startTime:"10:30", duration:120, expanded:false, subtasks:[] },
  { id:6, title:"Villa exterior — scope proposal draft",       done:false, priority:"Medium", project:"Villa Exterior — Prospect",       due:D(8),  startTime:"",      duration:0,   expanded:false, subtasks:[] },
];

const DURATIONS = [
  {v:15,l:"15 min"},{v:30,l:"30 min"},{v:45,l:"45 min"},
  {v:60,l:"1 hr"},{v:90,l:"1.5 hr"},{v:120,l:"2 hr"},
  {v:180,l:"3 hr"},{v:240,l:"4 hr"},{v:480,l:"Full day"},
];

function fmtTime(start, dur) {
  if(!start || !dur) return null;
  const [h,m] = start.split(":").map(Number);
  const endMin = h*60+m+dur;
  const eh = Math.floor(endMin/60)%24;
  const em = endMin%60;
  return `${start} – ${String(eh).padStart(2,"0")}:${String(em).padStart(2,"0")} (${dur<60?dur+"m":dur/60+"h"})`;
}


function KanbanView({tasks, setTasks, groupBy, projects}) {
  const today = TODAY_ISO;
  const [draggingId, setDraggingId] = useState(null);
  const [overCol, setOverCol]       = useState(null);

  const update = (id, patch) => setTasks(ts => ts.map(t => t.id===id ? {...t,...patch} : t));

  const cols = groupBy==="priority"
    ? [
        ...["High","Medium","Low"].map(p=>({key:p, label:p, items:tasks.filter(t=>!t.done&&t.priority===p)})),
        {key:"__done__", label:"Done", items:tasks.filter(t=>t.done)}
      ]
    : [
        ...[...new Set(["—", ...(projects||[]).map(p=>p.title), "Personal", "Side project", ...tasks.map(t=>t.project)])]
          .map(proj=>({key:proj, label:proj==="—"?"No project":proj.length>22?proj.slice(0,22)+"…":proj,
            items:tasks.filter(t=>!t.done&&t.project===proj)}))
          .filter(col=>col.items.length>0),
        {key:"__done__", label:"Done", items:tasks.filter(t=>t.done)}
      ];

  const onDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverCol(colKey);
  };

  const onDrop = (e, colKey) => {
    e.preventDefault();
    if(!draggingId) return;
    if(colKey==="__done__") {
      update(draggingId, {done:true});
    } else if(groupBy==="priority") {
      update(draggingId, {priority:colKey, done:false});
    } else {
      update(draggingId, {project:colKey, done:false});
    }
    setDraggingId(null);
    setOverCol(null);
  };

  const onDragEnd = () => { setDraggingId(null); setOverCol(null); };

  return (
    <div className="kanban-board">
      {cols.map(col=>(
        <div key={col.key}
          className={`kanban-col${overCol===col.key?" drag-over":""}`}
          onDragOver={e=>onDragOver(e,col.key)}
          onDrop={e=>onDrop(e,col.key)}
          onDragLeave={()=>setOverCol(null)}>
          <div className="kanban-col-header">
            <span className="kanban-col-title">{col.label}</span>
            <span className="kanban-col-count">{col.items.length}</span>
          </div>
          {col.items.map(t=>{
            const overdue = t.due&&t.due<today&&!t.done;
            const timeStr = t.startTime&&t.duration ? (()=>{
              const [h,m]=t.startTime.split(":").map(Number);
              const em=(h*60+m+t.duration)%1440;
              return t.startTime+"–"+String(Math.floor(em/60)).padStart(2,"0")+":"+String(em%60).padStart(2,"0");
            })() : null;
            return (
              <div key={t.id}
                className={`kanban-card${t.done?" kanban-card-done":""}${draggingId===t.id?" dragging":""}`}
                draggable
                onDragStart={e=>onDragStart(e,t.id)}
                onDragEnd={onDragEnd}
                onClick={()=>update(t.id,{done:!t.done})}>
                <div className="kanban-card-title">{t.title}</div>
                <div className="kanban-card-meta">
                  {t.project&&t.project!=="—"&&(
                    <span className="kanban-card-proj">{t.project.length>18?t.project.slice(0,18)+"…":t.project}</span>
                  )}
                  {t.due&&<span className={`kanban-card-due${overdue?" overdue":""}`}>{overdue?"⚠ ":""}{t.due}</span>}
                  {timeStr&&<span className="kanban-card-time">⏱ {timeStr}</span>}
                  {groupBy==="project"&&<span className="t-pri" style={{background:PRIORITY_STYLES[t.priority]?.bg,color:PRIORITY_STYLES[t.priority]?.color,fontSize:10}}>{t.priority}</span>}
                </div>
              </div>
            );
          })}
          {col.key!=="__done__"&&(
            <div style={{marginTop:6,padding:"6px 4px",fontSize:12,color:"#C0C0C0",cursor:"pointer"}}
              onClick={()=>{
                const title=window.prompt("New task:");
                if(title?.trim()) setTasks(ts=>[...ts,{id:crypto.randomUUID(),title:title.trim(),done:false,
                  priority:groupBy==="priority"?col.key:"Medium",
                  project:groupBy==="project"?col.key:"—",
                  due:"",startTime:"",duration:60,expanded:false,subtasks:[]}]);
              }}>+ Add card</div>
          )}
        </div>
      ))}
    </div>
  );
}


function TaskForm({vals, setV, onSave, onCancel, saveLabel="Save", projectList=null}) {
  return (
    <div className="t-form">
      <input className="t-form-input" placeholder="Task title..." autoFocus
        value={vals.title||""} onChange={e=>setV({...vals,title:e.target.value})}
        onKeyDown={e=>{ if(e.key==="Escape") onCancel(); }}/>
      <div className="t-form-row">
        <select className="t-select" value={vals.priority||"Medium"} onChange={e=>setV({...vals,priority:e.target.value})}>
          {Object.keys(PRIORITY_STYLES).map(p=><option key={p}>{p}</option>)}
        </select>
        <select className="t-select" value={vals.project||"—"} onChange={e=>setV({...vals,project:e.target.value})}>
          {(projectList||PROJECTS).map(p=><option key={p}>{p}</option>)}
        </select>
        <input className="t-select" type="date" value={vals.due||""} onChange={e=>setV({...vals,due:e.target.value})}/>
      </div>
      <div className="t-form-row">
        <span style={{fontSize:11,color:"#A0A0A0",alignSelf:"center",letterSpacing:".04em",flexShrink:0}}>TIME BLOCK</span>
        <input className="t-select" type="time" value={vals.startTime||""} onChange={e=>setV({...vals,startTime:e.target.value})}/>
        <select className="t-select" value={vals.duration||60} onChange={e=>setV({...vals,duration:Number(e.target.value)})}>
          {DURATIONS.map(d=><option key={d.v} value={d.v}>{d.l}</option>)}
        </select>
      </div>
      <div className="t-form-actions">
        <button className="t-btn-save" onClick={onSave}>{saveLabel}</button>
        <button className="t-btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function TasksView({ filter, tasks, setTasks, projects }) {
  const dynamicProjects = [...new Set(["—", ...(projects||[]).map(p=>p.title), "Personal", "Side project"])];
  const [view, setView]           = useState("list");
  const [groupBy, setGroupBy]     = useState("priority");
  const [adding, setAdding]       = useState(false);
  const [newVals, setNewVals]     = useState({title:"",priority:"Medium",project:"—",due:"",startTime:"",duration:60});
  const [editingId, setEditingId] = useState(null);
  const [editVals, setEditVals]   = useState({});
  const [addingSub, setAddingSub] = useState(null);
  const [subTitle, setSubTitle]   = useState("");

  const today   = TODAY_ISO;
  const weekEnd = D(7);

  const visible = tasks.filter(t => {
    if(filter==="To do")     return !t.done;
    if(filter==="Done")      return t.done;
    if(filter==="Today")     return !t.done && t.due===today;
    if(filter==="This week") return !t.done && t.due>=today && t.due<=weekEnd;
    return true;
  });

  const update     = (id, patch) => setTasks(ts => ts.map(t => t.id===id ? {...t,...patch} : t));
  const toggleDone = id => update(id, {done: !tasks.find(t=>t.id===id).done});
  const toggleExp  = id => update(id, {expanded: !tasks.find(t=>t.id===id).expanded});
  const toggleSub  = (tid, sid) => setTasks(ts => ts.map(t => t.id===tid
    ? {...t, subtasks: t.subtasks.map(s => s.id===sid ? {...s,done:!s.done} : s)} : t));
  const deleteTask = id => { setTasks(ts => ts.filter(t => t.id!==id)); if(editingId===id) setEditingId(null); };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditVals({title:t.title, priority:t.priority, project:t.project, due:t.due||"", startTime:t.startTime||"", duration:t.duration||60});
    setAdding(false);
  };
  const saveEdit = (id) => {
    if(editVals.title?.trim()) update(id, {...editVals, title:editVals.title.trim()});
    setEditingId(null);
  };

  const addTask = () => {
    if(!newVals.title.trim()) return;
    setTasks(ts => [...ts, {
      id:crypto.randomUUID(), ...newVals, title:newVals.title.trim(),
      done:false, expanded:false, subtasks:[]
    }]);
    setNewVals({title:"",priority:"Medium",project:"—",due:"",startTime:"",duration:60});
    setAdding(false);
  };

  const addSub = (tid) => {
    if(!subTitle.trim()) return;
    setTasks(ts => ts.map(t => t.id===tid
      ? {...t, subtasks:[...t.subtasks,{id:crypto.randomUUID(),title:subTitle.trim(),done:false}]} : t));
    setSubTitle(""); setAddingSub(null);
  };

  const isOverdue = due => due && due < today;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div className="view-toggle">
          {["list","kanban"].map(v=>(
            <button key={v} className={`view-btn${view===v?" active":""}`} onClick={()=>setView(v)}
              style={{textTransform:"capitalize"}}>{v}</button>
          ))}
        </div>
        {view==="kanban"&&(
          <div className="kanban-group-toggle">
            <span className="kanban-group-label">Group by:</span>
            {["priority","project"].map(g=>(
              <button key={g} className={`chip${groupBy===g?" on":""}`} style={{fontSize:11,padding:"3px 10px"}}
                onClick={()=>setGroupBy(g)}>{g}</button>
            ))}
          </div>
        )}
      </div>

      {view==="kanban" ? <KanbanView tasks={visible} setTasks={setTasks} groupBy={groupBy} projects={projects}/> : (
      <>
      {!adding
        ? <div className="t-add-btn" onClick={()=>{setAdding(true);setEditingId(null);}}>+ Add task</div>
        : <TaskForm vals={newVals} setV={setNewVals} projectList={dynamicProjects}
            onSave={addTask} onCancel={()=>setAdding(false)} saveLabel="Add task"/>
      }

      <div className="task-list" style={{marginTop:16}}>
        {visible.length===0 && (
          <div style={{padding:"40px 0",textAlign:"center",color:"#B0B0B0",fontSize:13,letterSpacing:".04em"}}>No tasks here.</div>
        )}
        {visible.map(t => {
          const ps       = PRIORITY_STYLES[t.priority];
          const overdue  = isOverdue(t.due) && !t.done;
          const hasSubs  = t.subtasks.length > 0;
          const doneSubs = t.subtasks.filter(s=>s.done).length;
          const timeStr  = fmtTime(t.startTime, t.duration);
          const isEdit   = editingId === t.id;
          return (
            <div key={t.id} className={`t-item${t.done?" t-done":""}`}>
              {isEdit ? (
                <div style={{padding:"4px"}}>
                  <TaskForm vals={editVals} setV={setEditVals} projectList={dynamicProjects}
                    onSave={()=>saveEdit(t.id)} onCancel={()=>setEditingId(null)} saveLabel="Save changes"/>
                </div>
              ) : (
                <>
                  <div className="t-main-row">
                    <div className={`tcheck${t.done?" on":""}`} onClick={()=>toggleDone(t.id)}>{t.done&&"✓"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="t-title">{t.title}</div>
                      <div className="t-meta">
                        {t.project!=="—" && <span className="t-proj">{t.project}</span>}
                        {t.due && <span className={`t-due${overdue?" t-overdue":""}`}>{overdue?"⚠ ":""}{t.due}</span>}
                        {timeStr && <span className="t-timeblock">⏱ {timeStr}</span>}
                        {hasSubs && <span className="t-sub-count">{doneSubs}/{t.subtasks.length} subtasks</span>}
                      </div>
                    </div>
                    <span className="t-pri" style={{background:ps.bg,color:ps.color}}>{ps.label}</span>
                    {hasSubs && <span className="t-expand" onClick={()=>toggleExp(t.id)}>{t.expanded?"▲":"▼"}</span>}
                    <span className="t-edit-btn" title="Edit" onClick={()=>startEdit(t)}>✎</span>
                    <span className="t-del" title="Delete" onClick={()=>deleteTask(t.id)}>✕</span>
                  </div>
                  {t.expanded && (
                    <div className="t-subs">
                      {t.subtasks.map(s=>(
                        <div key={s.id} className="t-sub-row" onClick={()=>toggleSub(t.id,s.id)}>
                          <div className={`tcheck${s.done?" on":""}`} style={{width:14,height:14,fontSize:8,borderRadius:3}}>{s.done&&"✓"}</div>
                          <span style={{fontSize:12.5,color:s.done?"#B0B0B0":"#4A4540",textDecoration:s.done?"line-through":"none"}}>{s.title}</span>
                        </div>
                      ))}
                      {addingSub===t.id
                        ? <div className="t-sub-add-form">
                            <input className="t-sub-input" placeholder="Subtask..." autoFocus
                              value={subTitle} onChange={e=>setSubTitle(e.target.value)}
                              onKeyDown={e=>{ if(e.key==="Enter") addSub(t.id); if(e.key==="Escape") setAddingSub(null); }}/>
                            <button className="t-btn-save" style={{padding:"4px 10px",fontSize:11}} onClick={()=>addSub(t.id)}>Add</button>
                            <button className="t-btn-cancel" style={{padding:"4px 10px",fontSize:11}} onClick={()=>setAddingSub(null)}>✕</button>
                          </div>
                        : <div className="t-sub-new" onClick={()=>setAddingSub(t.id)}>+ subtask</div>
                      }
                    </div>
                  )}
                  {!hasSubs && !t.expanded && (
                    addingSub===t.id
                      ? <div className="t-subs"><div className="t-sub-add-form">
                          <input className="t-sub-input" placeholder="Subtask..." autoFocus
                            value={subTitle} onChange={e=>setSubTitle(e.target.value)}
                            onKeyDown={e=>{ if(e.key==="Enter") addSub(t.id); if(e.key==="Escape") setAddingSub(null); }}/>
                          <button className="t-btn-save" style={{padding:"4px 10px",fontSize:11}} onClick={()=>addSub(t.id)}>Add</button>
                          <button className="t-btn-cancel" style={{padding:"4px 10px",fontSize:11}} onClick={()=>setAddingSub(null)}>✕</button>
                        </div></div>
                      : <div className="t-sub-inline" onClick={()=>setAddingSub(t.id)}>+ subtask</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      </>)}
    </div>
  );
}





const PROJECT_STAGES = ["Proposal","In progress","Review","Completed","On hold","Idea"];
const STAGE_STYLE = {
  "In progress": {bg:"#EEF2FB",color:"#2A50A0"},
  "Review":      {bg:"#FEF8E8",color:"#A07020"},
  "Proposal":    {bg:"#F2F2F2",color:"#606060"},
  "Completed":   {bg:"#E8F5EC",color:"#2A7A3A"},
  "On hold":     {bg:"#FEF0F0",color:"#A03030"},
  "Idea":        {bg:"#F5EAF5",color:"#7A3A9A"},
};

const INIT_PROJECTS = [
  { id:"p1", title:"Apartment Visualisation — Forma",  clientId:1, stage:"In progress", startDate:D(-50), due:D(16), desc:"Full render package: 3 exterior + 5 interior views.", notes:[] },
  { id:"p2", title:"Office Interior — Archis Studio",  clientId:2, stage:"Review",      startDate:D(-30), due:D(1),  desc:"Interior concepts, 4 views.", notes:[] },
  { id:"p3", title:"Villa Exterior — Prospect",        clientId:3, stage:"Proposal",    startDate:D(2),   due:D(45), desc:"Needs scope confirmation.", notes:[] },
];

const CRM_STATUSES = ["Active","Prospect","Inactive","Ghosted"];
const STATUS_STYLE = {
  Active:   {bg:"#E8F5EC",color:"#2A7A3A"},
  Prospect: {bg:"#EEF2FB",color:"#2A50A0"},
  Inactive: {bg:"#F2F2F2",color:"#808080"},
  Ghosted:  {bg:"#FEF0F0",color:"#A03030"},
};
const INV_STATUS = ["Pending","Paid","Overdue"];
const INV_STATUS_STYLE = {
  Paid:    {bg:"#E8F5EC",color:"#2A7A3A"},
  Pending: {bg:"#FEF8E8",color:"#A07020"},
  Overdue: {bg:"#FEF0F0",color:"#A03030"},
};

const INIT_CLIENTS = [
  { id:1, name:"Marius Kazlauskas", company:"UAB Forma",    email:"marius@forma.lt",    phone:"+370 600 11111", status:"Active",   lastContact:D(-2),
    notes:[{id:101,date:D(-2),text:"Discussed final render delivery. Client happy with progress."},{id:102,date:D(-18),text:"Kick-off call. Agreed on mood board deadline."}],
    invoices:[{id:201,name:"Deposit – Apt. visualisation",amount:800,status:"Paid",date:D(-28)},{id:202,name:"Final delivery",amount:1200,status:"Pending",date:D(16)}] },
  { id:2, name:"Rūta Petrauskienė", company:"Archis Studio", email:"ruta@archis.lt",   phone:"+370 600 22222", status:"Active",   lastContact:D(-9),
    notes:[{id:103,date:D(-9),text:"Sent revised interior concepts. Awaiting feedback."}],
    invoices:[{id:203,name:"Phase 1 render package",amount:600,status:"Paid",date:D(-45)}] },
  { id:3, name:"Jonas Vaitkus",     company:"Vaitkus OU",   email:"jonas@vaitkus.ee",  phone:"+370 600 33333", status:"Prospect", lastContact:D(-35),
    notes:[{id:104,date:D(-35),text:"Initial inquiry via email. Needs exterior + interior package."}],
    invoices:[] },
  { id:4, name:"Eglė Šimkutė",      company:"—",            email:"egle@gmail.com",    phone:"+370 600 44444", status:"Ghosted",  lastContact:D(-100),
    notes:[{id:105,date:D(-100),text:"Sent proposal. No response since."}],
    invoices:[{id:204,name:"Consultation fee",amount:150,status:"Overdue",date:D(-95)}] },
];

function EditableField({label, value, onChange, type="text", options=null}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const save = () => { onChange(val); setEditing(false); };
  const isObj = Array.isArray(options)&&options.length>0&&typeof options[0]==="object";
  const displayFor = v => isObj ? (options.find(o=>o.v===v)?.l ?? v) : v;
  if(editing) {
    if(options) return (
      <div style={{marginBottom:12}}>
        <div className="crm-field-label">{label}</div>
        <select className="t-select" style={{width:"100%"}} autoFocus value={val}
          onChange={e=>setVal(e.target.value)} onBlur={save}>
          {options.map(o=>isObj
            ? <option key={o.v} value={o.v}>{o.l}</option>
            : <option key={o}>{o}</option>)}
        </select>
      </div>
    );
    return (
      <div style={{marginBottom:12}}>
        <div className="crm-field-label">{label}</div>
        <input className="t-form-input" style={{marginBottom:0}} autoFocus type={type} value={val}
          onChange={e=>setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e=>{ if(e.key==="Enter") save(); if(e.key==="Escape"){setVal(value);setEditing(false);} }}/>
      </div>
    );
  }
  return (
    <div style={{marginBottom:12}} className="crm-field" onClick={()=>{setVal(value);setEditing(true);}}>
      <div className="crm-field-label">{label}</div>
      <div className="crm-field-value">{displayFor(value)||<span style={{color:"#C0C0C0",fontStyle:"italic"}}>—</span>}</div>
    </div>
  );
}

function CrmView({clients, setClients}) {
  const [selectedId, setSelectedId] = useState(1);
  const [addingClient, setAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({name:"",company:"",email:"",phone:"",status:"Prospect"});
  const [newNote, setNewNote]   = useState("");
  const [addingInv, setAddingInv] = useState(false);
  const [newInv, setNewInv]     = useState({name:"",amount:"",status:"Pending",date:""});
  const [filter, setFilter]     = useState("All");

  const visible = clients.filter(c => filter==="All" || c.status===filter);
  const client  = clients.find(c=>c.id===selectedId);

  const updateClient = (id, patch) => setClients(cs => cs.map(c => c.id===id ? {...c,...patch} : c));
  const updateField  = (field) => (val) => updateClient(selectedId, {[field]:val});

  const addNote = () => {
    if(!newNote.trim()) return;
    const note = {id:crypto.randomUUID(), date:TODAY_ISO, text:newNote.trim()};
    updateClient(selectedId, {notes:[note,...client.notes], lastContact:note.date});
    setNewNote("");
  };

  const addInvoice = () => {
    if(!newInv.name.trim()||!newInv.amount) return;
    const inv = {...newInv, id:crypto.randomUUID(), amount:Number(newInv.amount)};
    updateClient(selectedId, {invoices:[...client.invoices, inv]});
    setNewInv({name:"",amount:"",status:"Pending",date:""}); setAddingInv(false);
  };

  const updateInvField = (invId, field, val) => {
    updateClient(selectedId, {invoices: client.invoices.map(i => i.id===invId ? {...i,[field]:val} : i)});
  };

  const deleteInv  = (invId)  => updateClient(selectedId, {invoices: client.invoices.filter(i=>i.id!==invId)});
  const deleteNote = (noteId) => updateClient(selectedId, {notes: client.notes.filter(n=>n.id!==noteId)});

  const saveNewClient = () => {
    if(!newClient.name.trim()) return;
    const c = {...newClient, id:crypto.randomUUID(), lastContact:"", notes:[], invoices:[]};
    setClients(cs=>[...cs,c]); setSelectedId(c.id);
    setNewClient({name:"",company:"",email:"",phone:"",status:"Prospect"}); setAddingClient(false);
  };

  const totalInv  = client ? client.invoices.reduce((s,i)=>s+i.amount,0) : 0;
  const paidInv   = client ? client.invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.amount,0) : 0;

  return (
    <div style={{display:"flex",gap:0,height:"100%",minHeight:0}}>
      {/* LEFT — client list */}
      <div className="crm-list">
        <div className="crm-filters">
          {["All",...CRM_STATUSES].map(s=>(
            <button key={s} className={`chip${filter===s?" on":""}`} onClick={()=>setFilter(s)}>{s}</button>
          ))}
        </div>
        {visible.map(c=>{
          const ss = STATUS_STYLE[c.status];
          return (
            <div key={c.id} className={`crm-row${selectedId===c.id?" crm-row-active":""}`}
              onClick={()=>setSelectedId(c.id)}>
              <div className="crm-avatar">{c.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div className="crm-name">{c.name}</div>
                <div className="crm-company">{c.company!=="—"?c.company:c.email}</div>
              </div>
              <span className="crm-status-badge" style={{background:ss.bg,color:ss.color}}>{c.status}</span>
            </div>
          );
        })}
        {addingClient ? (
          <div className="t-form" style={{margin:"10px 12px"}}>
            <input className="t-form-input" placeholder="Full name" autoFocus value={newClient.name} onChange={e=>setNewClient({...newClient,name:e.target.value})}/>
            <input className="t-form-input" placeholder="Company" style={{marginTop:6}} value={newClient.company} onChange={e=>setNewClient({...newClient,company:e.target.value})}/>
            <input className="t-form-input" placeholder="Email" style={{marginTop:6}} value={newClient.email} onChange={e=>setNewClient({...newClient,email:e.target.value})}/>
            <select className="t-select" style={{marginTop:6,width:"100%"}} value={newClient.status} onChange={e=>setNewClient({...newClient,status:e.target.value})}>
              {CRM_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <div className="t-form-actions" style={{marginTop:10}}>
              <button className="t-btn-save" onClick={saveNewClient}>Add</button>
              <button className="t-btn-cancel" onClick={()=>setAddingClient(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="crm-add-btn" onClick={()=>setAddingClient(true)}>+ New client</div>
        )}
      </div>

      {/* RIGHT — detail panel */}
      {client && (
        <div className="crm-detail">
          {/* Header */}
          <div className="crm-detail-header">
            <div className="crm-detail-avatar">{client.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
            <div style={{flex:1}}>
              <div className="crm-detail-name">{client.name}</div>
              <div className="crm-detail-company">{client.company}</div>
            </div>
            {(() => { const ss=STATUS_STYLE[client.status]; return (
              <span className="crm-status-badge" style={{background:ss.bg,color:ss.color,fontSize:12}}>{client.status}</span>
            );})()}
          </div>

          {/* Contact fields */}
          <div className="crm-section">
            <div className="crm-section-title">Contact details</div>
            <EditableField label="Full name"     value={client.name}        onChange={updateField("name")}/>
            <EditableField label="Company"       value={client.company}     onChange={updateField("company")}/>
            <EditableField label="Email"         value={client.email}       onChange={updateField("email")} type="email"/>
            <EditableField label="Phone"         value={client.phone}       onChange={updateField("phone")} type="tel"/>
            <EditableField label="Status"        value={client.status}      onChange={updateField("status")} options={CRM_STATUSES}/>
            <EditableField label="Last contact"  value={client.lastContact} onChange={updateField("lastContact")} type="date"/>
          </div>

          {/* Invoices */}
          <div className="crm-section">
            <div className="crm-section-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>Invoices</span>
              <span style={{fontWeight:400,fontSize:11,color:"#808080"}}>€{paidInv.toLocaleString()} paid / €{totalInv.toLocaleString()} total</span>
            </div>
            {client.invoices.map(inv=>{
              const is = INV_STATUS_STYLE[inv.status];
              return (
                <div key={inv.id} className="crm-inv-row">
                  <div style={{flex:1,minWidth:0}}>
                    <EditableField label="Description" value={inv.name} onChange={v=>updateInvField(inv.id,"name",v)}/>
                    <div style={{display:"flex",gap:12}}>
                      <EditableField label="Amount (€)" value={String(inv.amount)} onChange={v=>updateInvField(inv.id,"amount",Number(v))} type="number"/>
                      <EditableField label="Date"       value={inv.date}            onChange={v=>updateInvField(inv.id,"date",v)}           type="date"/>
                      <EditableField label="Status"     value={inv.status}          onChange={v=>updateInvField(inv.id,"status",v)}          options={INV_STATUS}/>
                    </div>
                  </div>
                  <span className="crm-status-badge" style={{background:is.bg,color:is.color,alignSelf:"flex-start",marginTop:4}}>{inv.status}</span>
                  <span className="t-del" style={{opacity:1,fontSize:12}} onClick={()=>deleteInv(inv.id)}>✕</span>
                </div>
              );
            })}
            {addingInv ? (
              <div className="t-form" style={{marginTop:8}}>
                <input className="t-form-input" placeholder="Invoice description" autoFocus value={newInv.name} onChange={e=>setNewInv({...newInv,name:e.target.value})}/>
                <div className="t-form-row" style={{marginTop:6}}>
                  <input className="t-select" type="number" placeholder="Amount €" value={newInv.amount} onChange={e=>setNewInv({...newInv,amount:e.target.value})}/>
                  <input className="t-select" type="date" value={newInv.date} onChange={e=>setNewInv({...newInv,date:e.target.value})}/>
                  <select className="t-select" value={newInv.status} onChange={e=>setNewInv({...newInv,status:e.target.value})}>
                    {INV_STATUS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="t-form-actions">
                  <button className="t-btn-save" onClick={addInvoice}>Add invoice</button>
                  <button className="t-btn-cancel" onClick={()=>setAddingInv(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="crm-add-inline" onClick={()=>setAddingInv(true)}>+ Add invoice</div>
            )}
          </div>

          {/* Communication log */}
          <div className="crm-section">
            <div className="crm-section-title">Communication log</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input className="t-form-input" style={{marginBottom:0,flex:1}} placeholder="Add a note..."
                value={newNote} onChange={e=>setNewNote(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") addNote(); }}/>
              <button className="t-btn-save" onClick={addNote}>Add</button>
            </div>
            {client.notes.map(n=>(
              <div key={n.id} className="crm-note">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span className="crm-field-label">{n.date}</span>
                  <span className="t-del" style={{opacity:1,fontSize:11}} onClick={()=>deleteNote(n.id)}>✕</span>
                </div>
                <div style={{fontSize:13,color:"#3A3530",lineHeight:1.55}}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function ProjectsView({tasks, setTasks, clients, projects, setProjects}) {
  const [selectedId, setSelectedId] = useState("p1");
  const [view, setView]           = useState("list");
  const [addingProj, setAddingProj] = useState(false);
  const [newProj, setNewProj]     = useState({title:"",clientId:"",stage:"Proposal",startDate:"",due:"",desc:""});
  const [newNote, setNewNote]     = useState("");
  const [filter, setFilter]       = useState("All");
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask]     = useState({title:"",priority:"Medium",due:"",startTime:"",duration:60});
  const [ganttDrag, setGanttDrag] = useState(null);
  const [ctxMenu, setCtxMenu]     = useState(null); // {x,y,projId}

  const proj = projects.find(p=>p.id===selectedId);
  const projTasks = tasks.filter(t=>t.project===proj?.title);
  const doneTasks = projTasks.filter(t=>t.done).length;

  const updateProj  = (id,patch) => setProjects(ps=>ps.map(p=>p.id===id?{...p,...patch}:p));
  const updateField = field => val => updateProj(selectedId,{[field]:val});

  const addNote = () => {
    if(!newNote.trim()) return;
    const note={id:crypto.randomUUID(),date:TODAY_ISO,text:newNote.trim()};
    updateProj(selectedId,{notes:[note,...(proj.notes||[])]});
    setNewNote("");
  };
  const deleteNote = id => updateProj(selectedId,{notes:proj.notes.filter(n=>n.id!==id)});

  const addTask = () => {
    if(!newTask.title.trim()) return;
    setTasks(ts=>[...ts,{id:crypto.randomUUID(),...newTask,title:newTask.title.trim(),project:proj.title,done:false,expanded:false,subtasks:[]}]);
    setNewTask({title:"",priority:"Medium",due:"",startTime:"",duration:60}); setAddingTask(false);
  };
  const toggleTask = id => setTasks(ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));
  const deleteTask = id => setTasks(ts=>ts.filter(t=>t.id!==id));

  const saveNewProj = () => {
    if(!newProj.title.trim()) return;
    const p={...newProj,id:crypto.randomUUID(),title:newProj.title.trim(),notes:[]};
    setProjects(ps=>[...ps,p]); setSelectedId(p.id);
    setNewProj({title:"",clientId:"",stage:"Proposal",startDate:"",due:"",desc:""}); setAddingProj(false);
  };

  const visible = projects.filter(p=>filter==="All"||p.stage===filter);

  // ── GANTT VIEW ────────────────────────────────────────────────
  if(view==="gantt") {
    const today = TODAY_ISO;
    const _n = new Date();
    const minDate = new Date(_n.getFullYear(), _n.getMonth()-1, 1);
    const maxDate = new Date(_n.getFullYear(), _n.getMonth()+3, 0);
    const totalDays = Math.round((maxDate-minDate)/86400000)+1;
    const cols = Array.from({length:totalDays},(_,i)=>{ const d=new Date(minDate); d.setDate(d.getDate()+i); return d; });
    const isoDate = d=>localISO(d);
    const dayIdx  = ds=>Math.round((new Date(ds)-minDate)/86400000);

    const months = [];
    let cur = null;
    cols.forEach((d,i)=>{ const m=d.toLocaleDateString("en-GB",{month:"short",year:"numeric"}); if(m!==cur){months.push({label:m,start:i,count:0});cur=m;} months[months.length-1].count++; });

    const COL_W = 28;
    const ROW_H = 44;
    const LEFT_W = 200;
    const todayIdx = dayIdx(today);

    const rows = projects.map(p=>{
      const pt=tasks.filter(t=>t.project===p.title);
      const ss=STAGE_STYLE[p.stage]||STAGE_STYLE["Idea"];
      const client=clients.find(c=>c.id===p.clientId);
      return {proj:p, tasks:pt, ss, client};
    });

    // {projId, type:"move"|"resize", startX, origDueIdx, origStartIdx}

    const onBarMouseDown = (e, p, type) => {
      e.stopPropagation(); e.preventDefault();
      const hasDue=!!p.due;
      const dIdx=hasDue?dayIdx(p.due):30;
      const sIdx=Math.max(0,dIdx-45);
      setGanttDrag({projId:p.id, type, startX:e.clientX, origDueIdx:dIdx, origStartIdx:sIdx});
    };

    const onGanttMouseMove = e => {
      if(!ganttDrag) return;
      const dx=e.clientX-ganttDrag.startX;
      const dDays=Math.round(dx/COL_W);
      if(ganttDrag.type==="move") {
        const newDueIdx=Math.max(0,Math.min(totalDays-1,ganttDrag.origDueIdx+dDays));
        const newDue=isoDate(new Date(minDate.getTime()+newDueIdx*86400000));
        updateProj(ganttDrag.projId,{due:newDue});
      } else {
        const newDueIdx=Math.max(ganttDrag.origStartIdx+2,Math.min(totalDays-1,ganttDrag.origDueIdx+dDays));
        const newDue=isoDate(new Date(minDate.getTime()+newDueIdx*86400000));
        updateProj(ganttDrag.projId,{due:newDue});
      }
    };
    const onGanttMouseUp = () => setGanttDrag(null);

    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}
        onMouseMove={onGanttMouseMove} onMouseUp={onGanttMouseUp} onMouseLeave={onGanttMouseUp}
        style={{userSelect:ganttDrag?"none":"auto",display:"flex",flexDirection:"column",height:"100%",minHeight:0,flexShrink:0}}>
        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexShrink:0}}>
          <div className="view-toggle">
            <button className={`view-btn${view==="list"?" active":""}`} onClick={()=>setView("list")}>List</button>
            <button className={`view-btn${view==="gantt"?" active":""}`} onClick={()=>setView("gantt")}>Gantt</button>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["All",...PROJECT_STAGES].map(s=>(
              <button key={s} className={`chip${filter===s?" on":""}`} style={{fontSize:11,padding:"3px 10px"}} onClick={()=>setFilter(s)}>{s}</button>
            ))}
          </div>
          {ganttDrag&&<span style={{fontSize:11,color:"#A0A0A0",fontStyle:"italic"}}>Drag to adjust deadline</span>}
        </div>

        {ctxMenu&&(
          <>
            <div style={{position:"fixed",inset:0,zIndex:49}} onClick={()=>setCtxMenu(null)}/>
            <div style={{position:"fixed",left:ctxMenu.x,top:ctxMenu.y,background:"white",border:"1px solid #E0E0E0",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.12)",zIndex:50,minWidth:160,overflow:"hidden"}}>
              <div style={{padding:"8px 14px",fontSize:13,color:"#2A2520",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#F5F5F5"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                onClick={()=>{ setSelectedId(ctxMenu.projId); setView("list"); setCtxMenu(null); }}>
                📋 Go to List View
              </div>
              <div style={{padding:"8px 14px",fontSize:13,color:"#2A2520",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#F5F5F5"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                onClick={()=>setCtxMenu(null)}>
                ✕ Close
              </div>
            </div>
          </>
        )}
        <div style={{flex:1,overflow:"auto",position:"relative"}}>
          <div style={{display:"flex",minWidth:LEFT_W+totalDays*COL_W}}>
            {/* Fixed left column */}
            <div style={{width:LEFT_W,flexShrink:0,position:"sticky",left:0,zIndex:3,background:"#F5F5F5"}}>
              <div style={{height:56,borderBottom:"1px solid #E0E0E0",borderRight:"1px solid #E0E0E0"}}/>
              {rows.filter(r=>filter==="All"||r.proj.stage===filter).map((r)=>{
                const pt=tasks.filter(t=>t.project===r.proj.title);
                const done=pt.filter(t=>t.done).length;
                return (
                  <div key={r.proj.id} style={{height:ROW_H,display:"flex",alignItems:"center",
                    padding:"0 12px",borderBottom:"1px solid #EEEEEE",borderRight:"1px solid #E0E0E0",
                    background:selectedId===r.proj.id?"#EBEBEB":"#F5F5F5",cursor:"pointer"}}
                    onClick={()=>{setSelectedId(r.proj.id);setView("list");}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12.5,fontWeight:500,color:"#2A2520",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:170}}>{r.proj.title}</div>
                      <div style={{fontSize:10.5,color:"#A0A0A0",marginTop:1}}>{r.client?.name||"—"} · {done}/{pt.length} tasks</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrollable grid */}
            <div style={{flex:1,position:"relative"}}>
              <div style={{display:"flex",height:28,borderBottom:"1px solid #E0E0E0",position:"sticky",top:0,zIndex:2,background:"#F5F5F5"}}>
                {months.map((m,i)=>(
                  <div key={i} style={{width:m.count*COL_W,flexShrink:0,fontSize:10,fontWeight:600,
                    letterSpacing:".08em",textTransform:"uppercase",color:"#808080",
                    borderRight:"1px solid #E0E0E0",padding:"6px 8px",overflow:"hidden",whiteSpace:"nowrap"}}>
                    {m.label}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",height:28,borderBottom:"1px solid #E0E0E0",position:"sticky",top:28,zIndex:2,background:"#FAFAFA"}}>
                {cols.map((d,i)=>{
                  const isToday=isoDate(d)===today, isMon=d.getDay()===1;
                  return (
                    <div key={i} style={{width:COL_W,flexShrink:0,textAlign:"center",fontSize:9.5,
                      color:isToday?"#2A2825":d.getDay()===0||d.getDay()===6?"#C0C0C0":"#B0B0B0",
                      fontWeight:isToday?700:400,borderRight:isMon?"1px solid #E8E8E8":"none",
                      background:isToday?"#F0EFE8":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>

              {rows.filter(r=>filter==="All"||r.proj.stage===filter).map((r,ri)=>{
                const p=r.proj, ss=r.ss;
                const hasDue=!!p.due;
                const hasStart=!!p.startDate;
                const dueIdx=hasDue?dayIdx(p.due):null;
                const startIdx=hasStart?Math.max(0,dayIdx(p.startDate)):hasDue?Math.max(0,dueIdx-45):ri*10;
                const endIdx=hasDue?dueIdx:startIdx+30;
                const barL=startIdx*COL_W;
                const barW=Math.max((endIdx-startIdx+1)*COL_W,COL_W*2);
                const isDragging=ganttDrag?.projId===p.id;
                return (
                  <div key={p.id} style={{position:"relative",height:ROW_H,
                    borderBottom:"1px solid #EEEEEE",background:ri%2===0?"#FAFAFA":"white"}}>
                    {cols.map((d,i)=>(d.getDay()===0||d.getDay()===6)&&(
                      <div key={i} style={{position:"absolute",left:i*COL_W,top:0,width:COL_W,
                        height:"100%",background:"rgba(0,0,0,.025)",pointerEvents:"none"}}/>
                    ))}
                    {todayIdx>=0&&todayIdx<totalDays&&(
                      <div style={{position:"absolute",left:todayIdx*COL_W+COL_W/2,top:0,
                        width:2,height:"100%",background:"#E03030",opacity:.4,pointerEvents:"none"}}/>
                    )}
                    {/* Bar */}
                    <div style={{position:"absolute",left:barL,top:10,width:barW,height:24,
                      background:ss.bg,border:"1.5px solid "+ss.color,borderRadius:4,
                      display:"flex",alignItems:"center",overflow:"hidden",
                      cursor:isDragging?"grabbing":"grab",
                      opacity:isDragging?.85:1,
                      boxShadow:isDragging?"0 4px 12px rgba(0,0,0,.15)":"0 1px 3px rgba(0,0,0,.08)",
                      transition:isDragging?"none":"box-shadow .15s"}}
                      onMouseDown={e=>onBarMouseDown(e,p,"move")}
                      onContextMenu={e=>{ e.preventDefault(); setCtxMenu({x:e.clientX,y:e.clientY,projId:p.id}); }}>
                      <span style={{fontSize:11,color:ss.color,fontWeight:500,whiteSpace:"nowrap",
                        overflow:"hidden",textOverflow:"ellipsis",paddingLeft:8,flex:1}}>
                        {p.title.length>20?p.title.slice(0,20)+"…":p.title}
                      </span>
                      {/* Resize handle (right edge) */}
                      <div onMouseDown={e=>{ e.stopPropagation(); onBarMouseDown(e,p,"resize"); }}
                        style={{width:10,height:"100%",cursor:"ew-resize",flexShrink:0,
                          display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{width:3,height:14,borderRadius:2,background:ss.color,opacity:.5}}/>
                      </div>
                    </div>
                    {/* Due date marker */}
                    {hasDue&&dueIdx>=0&&dueIdx<totalDays&&(
                      <div style={{position:"absolute",left:dueIdx*COL_W+COL_W/2-5,top:5,
                        width:10,height:10,background:ss.color,borderRadius:"50%",
                        border:"2px solid white",zIndex:1,pointerEvents:"none"}}
                        title={"Due: "+p.due}/>
                    )}
                    {/* Due date label when dragging */}
                    {isDragging&&hasDue&&(
                      <div style={{position:"absolute",left:dueIdx*COL_W-20,top:26,
                        background:"#2A2825",color:"white",fontSize:10,padding:"2px 6px",
                        borderRadius:4,whiteSpace:"nowrap",zIndex:2,pointerEvents:"none"}}>
                        {p.due}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (original) ──────────────────────────────────────
  return (
    <div style={{display:"flex",gap:0,height:"100%",minHeight:0}}>
      <div className="crm-list">
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <div className="view-toggle">
            <button className={`view-btn${view==="list"?" active":""}`} onClick={()=>setView("list")}>List</button>
            <button className={`view-btn${view==="gantt"?" active":""}`} onClick={()=>setView("gantt")}>Gantt</button>
          </div>
        </div>
        <div className="crm-filters">
          {["All",...PROJECT_STAGES].map(s=>(
            <button key={s} className={`chip${filter===s?" on":""}`} onClick={()=>setFilter(s)}
              style={{fontSize:11,padding:"3px 10px"}}>{s}</button>
          ))}
        </div>
        {visible.map(p=>{
          const ss=STAGE_STYLE[p.stage]||STAGE_STYLE["Idea"];
          const client=clients.find(c=>c.id===p.clientId);
          const pt=tasks.filter(t=>t.project===p.title);
          const done=pt.filter(t=>t.done).length;
          return (
            <div key={p.id} className={`crm-row${selectedId===p.id?" crm-row-active":""}`}
              onClick={()=>setSelectedId(p.id)}>
              <div style={{flex:1,minWidth:0}}>
                <div className="crm-name">{p.title}</div>
                <div className="crm-company">{client?.name||"—"}{pt.length>0&&<span style={{marginLeft:8,color:"#C0C0C0"}}>{done}/{pt.length} tasks</span>}</div>
                {p.due&&<div style={{fontSize:11,color:"#B0B0B0",marginTop:2}}>{p.due}</div>}
              </div>
              <span className="crm-status-badge" style={{background:ss.bg,color:ss.color}}>{p.stage}</span>
            </div>
          );
        })}
        {addingProj?(
          <div className="t-form" style={{margin:"10px 12px"}}>
            <input className="t-form-input" placeholder="Project title" autoFocus value={newProj.title} onChange={e=>setNewProj({...newProj,title:e.target.value})}/>
            <select className="t-select" style={{width:"100%",marginTop:6}} value={newProj.clientId} onChange={e=>setNewProj({...newProj,clientId:e.target.value})}>
              <option value="">No client</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="t-select" style={{width:"100%",marginTop:6}} value={newProj.stage} onChange={e=>setNewProj({...newProj,stage:e.target.value})}>
              {PROJECT_STAGES.map(s=><option key={s}>{s}</option>)}
            </select>
            <input className="t-select" type="date" style={{width:"100%",marginTop:6}} value={newProj.due} onChange={e=>setNewProj({...newProj,due:e.target.value})}/>
            <div className="t-form-actions" style={{marginTop:10}}>
              <button className="t-btn-save" onClick={saveNewProj}>Add</button>
              <button className="t-btn-cancel" onClick={()=>setAddingProj(false)}>Cancel</button>
            </div>
          </div>
        ):(
          <div className="crm-add-btn" onClick={()=>setAddingProj(true)}>+ New project</div>
        )}
      </div>

      {proj&&(
        <div className="crm-detail">
          <div className="crm-detail-header">
            <div style={{flex:1}}>
              <div className="crm-detail-name">{proj.title}</div>
              <div className="crm-detail-company">{clients.find(c=>c.id===proj.clientId)?.name||"No client"}</div>
            </div>
            {(()=>{const ss=STAGE_STYLE[proj.stage]||STAGE_STYLE["Idea"];return(
              <span className="crm-status-badge" style={{background:ss.bg,color:ss.color,fontSize:12}}>{proj.stage}</span>
            );})()}
          </div>
          {projTasks.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",color:"#A0A0A0"}}>Progress</span>
                <span style={{fontSize:11,color:"#A0A0A0"}}>{doneTasks}/{projTasks.length} tasks</span>
              </div>
              <div style={{height:4,background:"#E8E8E8",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",background:"#2A2825",borderRadius:2,width:(doneTasks/projTasks.length*100)+"%",transition:"width .3s"}}/>
              </div>
            </div>
          )}
          <div className="crm-section">
            <div className="crm-section-title">Project details</div>
            <EditableField label="Title" value={proj.title} onChange={v=>{
              const old=proj.title; updateField("title")(v);
              setTasks(ts=>ts.map(t=>t.project===old?{...t,project:v}:t));
            }}/>
            <EditableField label="Client" value={String(proj.clientId||"")} onChange={updateField("clientId")}
              options={[{v:"",l:"No client"}, ...clients.map(c=>({v:String(c.id),l:c.name}))]}/>
            <EditableField label="Stage"     value={proj.stage}      onChange={updateField("stage")} options={PROJECT_STAGES}/>
            <EditableField label="Start date" value={proj.startDate||""} onChange={updateField("startDate")} type="date"/>
            <EditableField label="Deadline"  value={proj.due}            onChange={updateField("due")} type="date"/>
            <EditableField label="Description" value={proj.desc} onChange={updateField("desc")}/>
          </div>
          <div className="crm-section">
            <div className="crm-section-title">Tasks ({doneTasks}/{projTasks.length} done)</div>
            {projTasks.map(t=>(
              <div key={t.id} className="t-item" style={{marginBottom:5}}>
                <div className="t-main-row">
                  <div className={`tcheck${t.done?" on":""}`} onClick={()=>toggleTask(t.id)}>{t.done&&"✓"}</div>
                  <div style={{flex:1}}>
                    <div className="t-title" style={{textDecoration:t.done?"line-through":"none",color:t.done?"#A0A0A0":"#2A2520"}}>{t.title}</div>
                    {t.due&&<div style={{fontSize:11,color:"#B0B0B0",marginTop:2}}>{t.due}{t.startTime&&" · ⏱ "+fmtTime(t.startTime,t.duration)}</div>}
                  </div>
                  <span className="t-pri" style={{background:PRIORITY_STYLES[t.priority]?.bg,color:PRIORITY_STYLES[t.priority]?.color}}>{t.priority}</span>
                  <span className="t-del" style={{opacity:1}} onClick={()=>deleteTask(t.id)}>✕</span>
                </div>
              </div>
            ))}
            {addingTask?(
              <div className="t-form" style={{marginTop:8}}>
                <input className="t-form-input" placeholder="Task title..." autoFocus
                  value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})}
                  onKeyDown={e=>{if(e.key==="Enter")addTask();if(e.key==="Escape")setAddingTask(false);}}/>
                <div className="t-form-row">
                  <select className="t-select" value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})}>
                    {Object.keys(PRIORITY_STYLES).map(p=><option key={p}>{p}</option>)}
                  </select>
                  <input className="t-select" type="date" value={newTask.due} onChange={e=>setNewTask({...newTask,due:e.target.value})}/>
                </div>
                <div className="t-form-actions">
                  <button className="t-btn-save" onClick={addTask}>Add task</button>
                  <button className="t-btn-cancel" onClick={()=>setAddingTask(false)}>Cancel</button>
                </div>
              </div>
            ):(
              <div className="crm-add-inline" onClick={()=>setAddingTask(true)}>+ Add task</div>
            )}
          </div>
          <div className="crm-section">
            <div className="crm-section-title">Notes</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input className="t-form-input" style={{marginBottom:0,flex:1}} placeholder="Add a note..."
                value={newNote} onChange={e=>setNewNote(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")addNote();}}/>
              <button className="t-btn-save" onClick={addNote}>Add</button>
            </div>
            {(proj.notes||[]).map(n=>(
              <div key={n.id} className="crm-note">
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span className="crm-field-label">{n.date}</span>
                  <span className="t-del" style={{opacity:1,fontSize:11}} onClick={()=>deleteNote(n.id)}>✕</span>
                </div>
                <div style={{fontSize:13,color:"#3A3530",lineHeight:1.55}}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




const EXPENSE_CATS = ["Food","Transport","Sport","Entertainment","Health","Subscriptions","Other"];
const CAT_COLORS = {
  Food:"#E57373", Transport:"#64B5F6", Sport:"#81C784",
  Entertainment:"#FFB74D", Health:"#F06292", Subscriptions:"#9575CD", Other:"#90A4AE"
};
const PROJ_TYPES = ["Project expense","Freelance income","Salary"];
const TYPE_COLOR = {
  "Project expense": {bg:"#FEE8E8",color:"#C03030"},
  "Freelance income":{bg:"#E8F5EC",color:"#2A7A3A"},
  "Salary":          {bg:"#EEF2FB",color:"#2A50A0"},
};
const INIT_EXPENSES = [
  {id:1, name:"Rimi groceries",      category:"Food",          date:D(0),   amount:38.50},
  {id:2, name:"Bus monthly pass",    category:"Transport",     date:D(-1),  amount:22.00},
  {id:3, name:"Gym membership",      category:"Sport",         date:D(-6),  amount:35.00},
  {id:4, name:"Netflix",             category:"Subscriptions", date:D(-6),  amount:12.99},
  {id:5, name:"Pharmacy",            category:"Health",        date:D(-2),  amount:14.20},
  {id:6, name:"Coffee & croissant",  category:"Food",          date:D(-3),  amount:6.80},
  {id:7, name:"Cinema",              category:"Entertainment", date:D(-5),  amount:12.00},
  {id:8, name:"Adobe CC",            category:"Subscriptions", date:D(-38), amount:54.99},
];
const INIT_PROJ_FIN = [
  {id:1, name:"Chaos Cloud subscription", project:"Apartment Visualisation — Forma", type:"Project expense",  date:D(-28), amount:54.00},
  {id:2, name:"Monthly invoice — Forma",  project:"Apartment Visualisation — Forma", type:"Freelance income", date:D(-14), amount:800.00},
  {id:3, name:"Adobe CC split",           project:"Office Interior — Archis Studio", type:"Project expense",  date:D(-24), amount:27.50},
  {id:4, name:"Monthly salary",           project:"—",                               type:"Salary",           date:D(-4),  amount:2100.00},
  {id:5, name:"HDRI pack",                project:"Apartment Visualisation — Forma", type:"Project expense",  date:D(-9),  amount:29.00},
  {id:6, name:"Final invoice — Archis",   project:"Office Interior — Archis Studio", type:"Freelance income", date:D(-1),  amount:600.00},
];

function InlineEdit({value, onChange, type="text", options=null, style={}}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const save = () => { onChange(val); setEditing(false); };
  if(editing) {
    if(options) return (
      <select className="fin-inline-input" autoFocus style={style}
        value={val} onChange={e=>setVal(e.target.value)} onBlur={save}>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    );
    return <input className="fin-inline-input" autoFocus type={type} value={val} style={style}
      onChange={e=>setVal(e.target.value)} onBlur={save}
      onKeyDown={e=>{ if(e.key==="Enter") save(); if(e.key==="Escape"){setVal(value);setEditing(false);} }}/>;
  }
  return <span className="fin-cell-edit" style={style} onClick={()=>{setVal(value);setEditing(true);}}>{value||<span style={{color:"#C0C0C0"}}>—</span>}</span>;
}

function SummaryBar({items, colorFn, labelFn, total}) {
  return (
    <div className="fin-summary">
      <div className="fin-total-label">This month</div>
      <div className="fin-total">€{total.toFixed(2)}</div>
      <div className="fin-cat-row">
        {items.map(([k,v])=>(
          <div key={k} className="fin-cat-item">
            <div className="fin-cat-dot" style={{background:colorFn(k)}}/>
            <span className="fin-cat-name">{labelFn(k)}</span>
            <span className="fin-cat-amt">€{v.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalFinanceView({filter, entries, setEntries}) {
  const [adding, setAdding] = useState(false);
  const [newE, setNewE]     = useState({name:"",category:"Food",date:"",amount:""});

  const visible = entries.filter(e=>filter==="All"||e.category===filter)
    .sort((a,b)=>b.date.localeCompare(a.date));
  const byCat = EXPENSE_CATS.map(cat=>[cat, entries.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0)]).filter(([,v])=>v>0);
  const total = entries.reduce((s,e)=>s+e.amount,0);

  const update = (id,patch) => setEntries(es=>es.map(e=>e.id===id?{...e,...patch}:e));
  const del    = id => setEntries(es=>es.filter(e=>e.id!==id));
  const add    = () => {
    if(!newE.name.trim()||!newE.amount) return;
    setEntries(es=>[{...newE,id:crypto.randomUUID(),amount:Number(newE.amount)},...es]);
    setNewE({name:"",category:"Food",date:"",amount:""}); setAdding(false);
  };

  return (
    <div>
      <SummaryBar items={byCat} colorFn={k=>CAT_COLORS[k]||"#999"} labelFn={k=>k} total={total}/>
      <div className="fin-toolbar">
        <div className="t-add-btn" onClick={()=>setAdding(true)}>+ Add expense</div>
      </div>
      {adding&&(
        <div className="t-form" style={{marginBottom:16}}>
          <input className="t-form-input" placeholder="Description" autoFocus
            value={newE.name} onChange={e=>setNewE({...newE,name:e.target.value})}
            onKeyDown={e=>{if(e.key==="Escape")setAdding(false);}}/>
          <div className="t-form-row">
            <select className="t-select" value={newE.category} onChange={e=>setNewE({...newE,category:e.target.value})}>
              {EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <input className="t-select" type="date" value={newE.date} onChange={e=>setNewE({...newE,date:e.target.value})}/>
            <input className="t-select" type="number" placeholder="Amount €" value={newE.amount} onChange={e=>setNewE({...newE,amount:e.target.value})}/>
          </div>
          <div className="t-form-actions">
            <button className="t-btn-save" onClick={add}>Save</button>
            <button className="t-btn-cancel" onClick={()=>setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <table className="fin-table">
        <thead><tr>
          <th>Description</th><th>Category</th><th>Date</th><th style={{textAlign:"right"}}>Amount</th><th/>
        </tr></thead>
        <tbody>
          {visible.map(e=>(
            <tr key={e.id} className="fin-row">
              <td><InlineEdit value={e.name} onChange={v=>update(e.id,{name:v})} style={{minWidth:160}}/></td>
              <td>
                <InlineEdit value={e.category} onChange={v=>update(e.id,{category:v})} options={EXPENSE_CATS}/>
                <span className="fin-cat-dot" style={{background:CAT_COLORS[e.category]||"#999",display:"inline-block",marginLeft:6,verticalAlign:"middle"}}/>
              </td>
              <td><InlineEdit value={e.date} onChange={v=>update(e.id,{date:v})} type="date"/></td>
              <td style={{textAlign:"right"}}>
                <InlineEdit value={String(e.amount)} onChange={v=>update(e.id,{amount:Number(v)})} type="number" style={{textAlign:"right",maxWidth:80}}/>
                <span style={{marginLeft:3,color:"#A0A0A0",fontSize:12}}>€</span>
              </td>
              <td><span className="t-del" style={{opacity:1}} onClick={()=>del(e.id)}>✕</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectFinanceView({filter, projects, entries, setEntries}) {
  const [adding, setAdding] = useState(false);
  const [newE, setNewE]     = useState({name:"",project:"—",type:"Project expense",date:"",amount:""});
  const projTitles = ["—",...(projects||[]).map(p=>p.title)];
  const visible = entries.filter(e=>filter==="All"||e.type===filter).sort((a,b)=>b.date.localeCompare(a.date));
  const income  = entries.filter(e=>e.type!=="Project expense").reduce((s,e)=>s+e.amount,0);
  const expense = entries.filter(e=>e.type==="Project expense").reduce((s,e)=>s+e.amount,0);
  const net     = income-expense;

  const update = (id,patch) => setEntries(es=>es.map(e=>e.id===id?{...e,...patch}:e));
  const del    = id => setEntries(es=>es.filter(e=>e.id!==id));
  const add    = () => {
    if(!newE.name.trim()||!newE.amount) return;
    setEntries(es=>[...es,{...newE,id:crypto.randomUUID(),amount:Number(newE.amount)}]);
    setNewE({name:"",project:"—",type:"Project expense",date:"",amount:""}); setAdding(false);
  };

  return (
    <div>
      <div className="fin-summary" style={{display:"flex",gap:0,flexWrap:"wrap"}}>
        {[["Income",income,"#2A7A3A"],["Expenses",expense,"#C03030"],["Net",net,net>=0?"#2A50A0":"#C03030"]].map(([l,v,col])=>(
          <div key={l} style={{flex:1,minWidth:120,padding:"16px 20px",borderRight:"1px solid #E8E8E8"}}>
            <div className="fin-total-label">{l}</div>
            <div className="fin-total" style={{color:col}}>€{Math.abs(v).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="fin-toolbar"><div className="t-add-btn" onClick={()=>setAdding(true)}>+ Add entry</div></div>
      {adding&&(
        <div className="t-form" style={{marginBottom:16}}>
          <input className="t-form-input" placeholder="Description" autoFocus
            value={newE.name} onChange={e=>setNewE({...newE,name:e.target.value})}
            onKeyDown={e=>{if(e.key==="Escape")setAdding(false);}}/>
          <div className="t-form-row">
            <select className="t-select" value={newE.type} onChange={e=>setNewE({...newE,type:e.target.value})}>
              {PROJ_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <select className="t-select" value={newE.project} onChange={e=>setNewE({...newE,project:e.target.value})}>
              {projTitles.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="t-form-row">
            <input className="t-select" type="date" value={newE.date} onChange={e=>setNewE({...newE,date:e.target.value})}/>
            <input className="t-select" type="number" placeholder="Amount €" value={newE.amount} onChange={e=>setNewE({...newE,amount:e.target.value})}/>
          </div>
          <div className="t-form-actions">
            <button className="t-btn-save" onClick={add}>Save</button>
            <button className="t-btn-cancel" onClick={()=>setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <table className="fin-table">
        <thead><tr><th>Description</th><th>Project</th><th>Type</th><th>Date</th><th style={{textAlign:"right"}}>Amount</th><th/></tr></thead>
        <tbody>
          {visible.map(e=>{
            const tc=TYPE_COLOR[e.type]||TYPE_COLOR["Project expense"];
            return (
              <tr key={e.id} className="fin-row">
                <td><InlineEdit value={e.name} onChange={v=>update(e.id,{name:v})} style={{minWidth:160}}/></td>
                <td><InlineEdit value={e.project} onChange={v=>update(e.id,{project:v})} options={projTitles}/></td>
                <td><span className="crm-status-badge" style={{background:tc.bg,color:tc.color}}>
                  <InlineEdit value={e.type} onChange={v=>update(e.id,{type:v})} options={PROJ_TYPES}/>
                </span></td>
                <td><InlineEdit value={e.date} onChange={v=>update(e.id,{date:v})} type="date"/></td>
                <td style={{textAlign:"right"}}>
                  <InlineEdit value={String(e.amount)} onChange={v=>update(e.id,{amount:Number(v)})} type="number" style={{textAlign:"right",maxWidth:80}}/>
                  <span style={{marginLeft:3,color:"#A0A0A0",fontSize:12}}>€</span>
                </td>
                <td><span className="t-del" style={{opacity:1}} onClick={()=>del(e.id)}>✕</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


const hashId = (id) => { const s=String(id); let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); };
const BLOCK_COLORS = [
  {bg:"#DBEAFE",col:"#1D4ED8"},{bg:"#D1FAE5",col:"#065F46"},
  {bg:"#FEF3C7",col:"#92400E"},{bg:"#FCE7F3",col:"#9D174D"},
  {bg:"#EDE9FE",col:"#5B21B6"},{bg:"#FEE2E2",col:"#991B1B"},
];

function CalEditPopup({task, onUpdate, onClose}) {
  const [vals, setVals] = useState({
    title:task.title, priority:task.priority, due:task.due||"",
    startTime:task.startTime||"", duration:task.duration||60, project:task.project||"—"
  });
  const save = () => { onUpdate(vals); onClose(); };
  return (
    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
      background:"white",border:"1px solid #E0E0E0",borderRadius:12,padding:24,
      width:320,zIndex:200,boxShadow:"0 8px 32px rgba(0,0,0,.12)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:13,fontWeight:500,color:"#1A1815",letterSpacing:".02em"}}>Edit task</span>
        <span className="t-del" style={{opacity:1,fontSize:14}} onClick={onClose}>✕</span>
      </div>
      <input className="t-form-input" value={vals.title} onChange={e=>setVals({...vals,title:e.target.value})} style={{marginBottom:10}} placeholder="Title"/>
      <div className="t-form-row" style={{marginBottom:10}}>
        <select className="t-select" value={vals.priority} onChange={e=>setVals({...vals,priority:e.target.value})}>
          {["High","Medium","Low"].map(p=><option key={p}>{p}</option>)}
        </select>
        <input className="t-select" type="date" value={vals.due} onChange={e=>setVals({...vals,due:e.target.value})}/>
      </div>
      <div className="t-form-row" style={{marginBottom:16}}>
        <input className="t-select" type="time" value={vals.startTime} onChange={e=>setVals({...vals,startTime:e.target.value})}/>
        <select className="t-select" value={vals.duration} onChange={e=>setVals({...vals,duration:Number(e.target.value)})}>
          {DURATIONS.map(d=><option key={d.v} value={d.v}>{d.l}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="t-btn-save" onClick={save} style={{flex:1}}>Save</button>
        <button className="t-btn-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function CalendarView({tasks, setTasks}) {
  const [view, setView]       = useState("week");
  const [cursor, setCursor]   = useState(new Date());
  const [editing, setEditing] = useState(null);
  const [drag, setDrag]       = useState(null);
  const gridRef = useRef(null);

  const HOURS  = Array.from({length:17},(_,i)=>i+6);
  const SLOT_H = 56;
  const TODAY  = TODAY_ISO;

  const nav     = dir => { const d=new Date(cursor); if(view==="day") d.setDate(d.getDate()+dir); if(view==="week") d.setDate(d.getDate()+dir*7); if(view==="month") d.setMonth(d.getMonth()+dir); setCursor(d); };
  const goToday = () => setCursor(new Date());
  const isoDate = d => localISO(d);

  const getDays = () => {
    if(view==="day") return [new Date(cursor)];
    if(view==="week") { const s=new Date(cursor),dow=s.getDay(); s.setDate(s.getDate()-(dow===0?6:dow-1)); return Array.from({length:7},(_,i)=>{ const d=new Date(s); d.setDate(d.getDate()+i); return d; }); }
    return [];
  };
  const days = getDays();

  const periodLabel = () => {
    if(view==="day") return cursor.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
    if(view==="week") { const d0=days[0],d6=days[6]; return d0.toLocaleDateString("en-GB",{day:"numeric",month:"short"})+" – "+d6.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); }
    return cursor.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
  };

  const taskColor    = t => BLOCK_COLORS[hashId(t.id) % BLOCK_COLORS.length];
  const blockedTasks = ds => tasks.filter(t=>t.due===ds&&t.startTime&&t.duration>0&&!t.done);
  const dueTasks     = ds => tasks.filter(t=>t.due===ds&&(!t.startTime||t.duration===0)&&!t.done);
  const toMinutes    = str => { const [h,m]=str.split(":").map(Number); return h*60+m; };
  const toTimeStr    = min => { const h=Math.floor(min/60)%24,m=min%60; return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0"); };
  const snapTo15     = min => Math.round(min/15)*15;
  const blockStyle   = t => ({ top:((toMinutes(t.startTime)-6*60)/60*SLOT_H)+"px", height:Math.max(t.duration/60*SLOT_H,24)+"px" });

  const updateTask = (id,patch) => setTasks(ts=>ts.map(t=>t.id===id?{...t,...patch}:t));

  const onBlockMouseDown = (e,t,type) => {
    e.stopPropagation(); e.preventDefault();
    setDrag({type,id:t.id,startY:e.clientY,origStart:toMinutes(t.startTime),origDur:t.duration});
  };
  const onMouseMove = e => {
    if(!drag) return;
    const dMin=Math.round((e.clientY-drag.startY)/SLOT_H*60);
    if(drag.type==="move") updateTask(drag.id,{startTime:toTimeStr(Math.max(6*60,Math.min(22*60-15,snapTo15(drag.origStart+dMin))))});
    else updateTask(drag.id,{duration:Math.max(15,snapTo15(drag.origDur+dMin))});
  };
  const onMouseUp = () => setDrag(null);
  const ef = editing ? tasks.find(t=>t.id===editing) : null;

  const ViewToggle = () => (
    <div className="view-toggle" style={{marginLeft:"auto"}}>
      {["day","week","month"].map(v=>(
        <button key={v} className={`view-btn${view===v?" active":""}`} onClick={()=>setView(v)} style={{textTransform:"capitalize"}}>{v}</button>
      ))}
    </div>
  );

  const Toolbar = () => (
    <div className="cal-toolbar">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={()=>nav(-1)}>‹</button>
        <span className="cal-period">{periodLabel()}</span>
        <button className="cal-nav-btn" onClick={()=>nav(1)}>›</button>
      </div>
      <button className="cal-today-btn" onClick={goToday}>Today</button>
      <ViewToggle/>
    </div>
  );

  if(view==="month") {
    const year=cursor.getFullYear(),month=cursor.getMonth();
    const firstDay=new Date(year,month,1);
    const offset=(firstDay.getDay()===0?6:firstDay.getDay()-1);
    const daysInMonth=new Date(year,month+1,0).getDate();
    const cells=Array.from({length:Math.ceil((offset+daysInMonth)/7)*7},(_,i)=>new Date(year,month,1-offset+i));
    const DAY_NAMES=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return (
      <div className="cal-wrap">
        <Toolbar/>
        <div style={{overflowY:"auto",flex:1,minHeight:0}}>
          <div className="cal-month-grid">
            {DAY_NAMES.map(d=>(
              <div key={d} style={{borderRight:"1px solid #E8E8E8",borderBottom:"1px solid #E8E8E8",padding:"6px",textAlign:"center",fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",color:"#A0A0A0",background:"#F5F5F5"}}>{d}</div>
            ))}
            {cells.map((d,i)=>{
              const ds=isoDate(d),isThis=d.getMonth()===month,isToday=ds===TODAY;
              return (
                <div key={i} className={`cal-month-cell${!isThis?" other-month":""}${isToday?" today-cell":""}`}>
                  <div className={`cal-month-day${isToday?" today-num":""}`}>{d.getDate()}</div>
                  {blockedTasks(ds).map(t=>{ const col=taskColor(t); return <div key={t.id} className="cal-due-chip" style={{background:col.bg,color:col.col,cursor:"pointer"}} onClick={()=>setEditing(t.id)}>⏱ {t.title}</div>; })}
                  {dueTasks(ds).map(t=><div key={t.id} className="cal-due-chip" style={{background:"#F0F0F0",color:"#606060",cursor:"pointer"}} onClick={()=>setEditing(t.id)}>{t.title}</div>)}
                </div>
              );
            })}
          </div>
        </div>
        {ef&&<CalEditPopup task={ef} onUpdate={p=>updateTask(ef.id,p)} onClose={()=>setEditing(null)}/>}
      </div>
    );
  }

  return (
    <div className="cal-wrap" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} style={{userSelect:drag?"none":"auto"}}>
      <Toolbar/>
      <div className="cal-allday-row">
        <div className="cal-allday-label">all‑day</div>
        <div className="cal-allday-cells">
          {days.map((d,di)=>(
            <div key={di} className="cal-allday-cell">
              {dueTasks(isoDate(d)).map(t=><div key={t.id} className="cal-due-chip" style={{background:"#F0F0F0",color:"#606060",cursor:"pointer"}} onClick={()=>setEditing(t.id)}>{t.title}</div>)}
            </div>
          ))}
        </div>
      </div>
      <div className="cal-grid-wrap" ref={gridRef}>
        <div className="cal-time-grid">
          <div className="cal-time-col">
            <div style={{height:view==="week"?48:0}}/>
            {HOURS.map(h=><div key={h} className="cal-time-label">{h===12?"12pm":h>12?(h-12)+"pm":h+"am"}</div>)}
          </div>
          <div className="cal-cols">
            {days.map((d,di)=>{
              const ds=isoDate(d),isToday=ds===TODAY;
              const slotTop=min=>((min-6*60)/60)*SLOT_H;
              return (
                <div key={di} className="cal-day-col">
                  {view==="week"&&(
                    <div className="cal-day-col-header">
                      <div className="cal-day-name">{d.toLocaleDateString("en-GB",{weekday:"short"})}</div>
                      <div className={`cal-day-num${isToday?" today":""}`}>{d.getDate()}</div>
                    </div>
                  )}
                  <div style={{position:"relative"}}>
                    {HOURS.map(h=><div key={h} className="cal-slot"/>)}
                    {HOURS.map(h=><div key={"h"+h} style={{position:"absolute",left:0,right:0,top:((h-6)*SLOT_H+SLOT_H/2)+"px",borderTop:"1px dashed #F0F0F0",pointerEvents:"none"}}/>)}
                    {blockedTasks(ds).map(t=>{
                      const {top,height}=blockStyle(t),col=taskColor(t);
                      const endStr=toTimeStr(toMinutes(t.startTime)+t.duration);
                      const isDragging=drag?.id===t.id;
                      return (
                        <div key={t.id} className="cal-block"
                          style={{top,height,background:col.bg,borderLeft:"3px solid "+col.col,color:col.col,
                            cursor:isDragging?"grabbing":"grab",opacity:isDragging?.85:1,
                            boxShadow:isDragging?"0 4px 16px rgba(0,0,0,.15)":"0 1px 3px rgba(0,0,0,.1)"}}>
                          <div style={{flex:1,overflow:"hidden",paddingBottom:8}}
                            onMouseDown={e=>onBlockMouseDown(e,t,"move")}
                            onClick={e=>{ if(!drag){setEditing(t.id);} e.stopPropagation(); }}>
                            <div className="cal-block-title">{t.title}</div>
                            {parseFloat(height)>30&&<div className="cal-block-time">{t.startTime}–{endStr} · {t.duration}m</div>}
                          </div>
                          <div onMouseDown={e=>onBlockMouseDown(e,t,"resize")}
                            style={{position:"absolute",bottom:0,left:0,right:0,height:10,cursor:"ns-resize",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <div style={{width:24,height:3,borderRadius:2,background:col.col,opacity:.4}}/>
                          </div>
                        </div>
                      );
                    })}
                    {isToday&&(()=>{const nm=new Date().getHours()*60+new Date().getMinutes();return nm>=360&&nm<=1380?<div className="cal-now-line" style={{top:slotTop(nm)+"px"}}/>:null;})()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {ef&&<CalEditPopup task={ef} onUpdate={p=>updateTask(ef.id,p)} onClose={()=>setEditing(null)}/>}
    </div>
  );
}

const SUGGESTIONS = [
  "What's due this week?","What tasks are high priority?",
  "How much did I spend this month?","Which project needs attention?",
  "What am I currently reading?","Summarise my active projects",
];

function buildContext(tasks, clients, projects, expenses, projFin) {
  const today = TODAY_ISO;
  const pending = tasks.filter(t=>!t.done);
  const overdue = pending.filter(t=>t.due&&t.due<today);
  const NL = "\n";
  const taskLines = pending.slice(0,20).map(t=>"- ["+t.priority+"] "+t.title+(t.project&&t.project!=="—"?" ("+t.project+")":"")+(t.due?" due "+t.due:"")).join(NL);
  const projLines = projects.map(p=>{ const client=clients.find(c=>c.id===p.clientId); const pt=tasks.filter(t=>t.project===p.title); return "- "+p.title+" ["+p.stage+"]"+(client?" — "+client.name:"")+(p.due?" due "+p.due:"")+" ("+pt.filter(t=>t.done).length+"/"+pt.length+" tasks done)"; }).join(NL);
  const clientLines = clients.map(c=>"- "+c.name+" ["+c.status+"] — last contact: "+(c.lastContact||"unknown")).join(NL);
  return "You are a personal assistant in the user's Personal OS. Today is "+today+"."+NL+NL+
    "TASKS ("+pending.length+" pending, "+overdue.length+" overdue)"+NL+taskLines+NL+NL+
    "PROJECTS"+NL+projLines+NL+NL+
    "CLIENTS"+NL+clientLines+NL+NL+
    "RECENT PERSONAL EXPENSES"+NL+(expenses||[]).slice(0,15).map(e=>"- "+e.name+" ("+e.category+"): €"+e.amount).join(NL)+NL+
    "Total: €"+(expenses||[]).reduce((s,e)=>s+e.amount,0).toFixed(2)+NL+NL+
    "PROJECT FINANCE"+NL+(projFin||[]).slice(0,15).map(e=>"- ["+e.type+"] "+e.name+": €"+e.amount).join(NL)+NL+
    "Income: €"+(projFin||[]).filter(e=>e.type!=="Project expense").reduce((s,e)=>s+e.amount,0).toFixed(2)+" | Expenses: €"+(projFin||[]).filter(e=>e.type==="Project expense").reduce((s,e)=>s+e.amount,0).toFixed(2)+NL+NL+
    "Respond concisely. Plain text, no markdown headers. Reference specific data when helpful.";
}

function AIPanel({open, onClose, tasks, clients, projects, expenses, projFin}) {
  const [messages, setMessages] = useState([
    {role:"assistant", content:"Hey Karolis! I can see your tasks, projects, clients and finances. Ask me anything — what\u2019s overdue, where your money went, or which project needs attention."}
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey]   = useState(localStorage.getItem("anthropic_api_key")||"");
  const [keyInput, setKeyInput] = useState("");
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const send = async (text) => {
    const msg = text||input.trim();
    if(!msg||loading) return;
    setInput("");
    const userMsg = {role:"user",content:msg};
    setMessages(ms=>[...ms,userMsg]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key":apiKey,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system:buildContext(tasks,clients,projects,expenses,projFin),
          messages:[...messages,userMsg].map(m=>({role:m.role,content:m.content}))
        })
      });
      const data = await res.json();
      setMessages(ms=>[...ms,{role:"assistant",content:data.content?.[0]?.text||"Sorry, something went wrong."}]);
    } catch(e) {
      setMessages(ms=>[...ms,{role:"assistant",content:"Connection error. Please try again."}]);
    }
    setLoading(false);
  };

  return (
    <div className={`ai-panel${open?" open":""}`}>
      <div className="ai-header">
        <span className="ai-header-title">✦ AI Assistant</span>
        <span className="ai-close" onClick={onClose}>✕</span>
      </div>
      <div className="ai-messages">
        {messages.map((m,i)=>(
          <div key={i} className={m.role==="user"?"ai-msg-user":"ai-msg-ai"}>{m.content}</div>
        ))}
        {loading&&<div className="ai-thinking">Thinking…</div>}
        <div ref={endRef}/>
      </div>
      {messages.length<=1&&!loading&&(
        <div className="ai-suggestions">
          {SUGGESTIONS.map(s=><button key={s} className="ai-chip" onClick={()=>send(s)}>{s}</button>)}
        </div>
      )}
      {!apiKey&&(
        <div style={{padding:"14px 16px",borderTop:"1px solid #1E1D1A"}}>
          <div style={{fontSize:11.5,color:"#8A8680",lineHeight:1.6,marginBottom:10}}>
            To enable the assistant, paste your Anthropic API key (get one at console.anthropic.com → API keys). It is stored only in this browser.
          </div>
          <div style={{display:"flex",gap:6}}>
            <input className="ai-input" placeholder="sk-ant-..." value={keyInput}
              onChange={e=>setKeyInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&keyInput.trim()){ localStorage.setItem("anthropic_api_key",keyInput.trim()); setApiKey(keyInput.trim()); } }}/>
            <button className="ai-send" onClick={()=>{ if(keyInput.trim()){ localStorage.setItem("anthropic_api_key",keyInput.trim()); setApiKey(keyInput.trim()); } }}>Save</button>
          </div>
        </div>
      )}
      {apiKey&&<div className="ai-input-area">
        <textarea className="ai-input" rows={1} placeholder="Ask anything about your data…"
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}/>
        <button className="ai-send" onClick={()=>send()} disabled={!input.trim()||loading}>↑</button>
      </div>}
    </div>
  );
}


const SHOPPING_CATS = ["Groceries","Pharmacy","Electronics","Clothing","Home","Other"];

function QuickCaptureModule({tasks, setTasks}) {
  const [tab, setTab] = useState("capture");
  const [items, setItems] = useSyncedState("capture_items");
  const [newText, setNewText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterTag, setFilterTag] = useState("all");
  const [dumpText, setDumpText] = useState("");
  const [dumpLines, setDumpLines] = useState([]);
  const [processed, setProcessed] = useState(false);
  const [shopping, setShopping] = useSyncedState("shopping_items");
  const addItem = () => { if(!newText.trim()) return; setItems(is=>[{id:crypto.randomUUID(),text:newText.trim(),tags:selectedTags,date:TODAY_ISO},...is]); setNewText(""); setSelectedTags([]); };
  const updateItem = (id,patch) => setItems(is=>is.map(i=>i.id===id?{...i,...patch}:i));
  const [tagEditId, setTagEditId] = useState(null);
  const toggleTag = t => setSelectedTags(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t]);
  const deleteItem = id => setItems(is=>is.filter(i=>i.id!==id));
  const processDump = () => { const lines=dumpText.split("\n").map(l=>l.trim()).filter(Boolean); setDumpLines(lines.map((text,i)=>({id:i+1,text,action:null}))); setProcessed(true); };
  const setAction = (id,action) => setDumpLines(ls=>ls.map(l=>l.id===id?{...l,action}:l));
  const applyDump = () => {
    dumpLines.forEach(l=>{
      if(l.action==="task") setTasks(ts=>[...ts,{id:crypto.randomUUID(),title:l.text,done:false,priority:"Medium",project:"—",due:"",startTime:"",duration:60,expanded:false,subtasks:[]}]);
      else if(l.action==="capture") setItems(is=>[{id:crypto.randomUUID(),text:l.text,tags:["idea"],date:TODAY_ISO},...is]);
      else if(l.action==="shopping") setShopping(sh=>[...sh,{id:crypto.randomUUID(),text:l.text,category:"Other",done:false}]);
    });
    setDumpText(""); setDumpLines([]); setProcessed(false);
  };
  const ACTION_OPTS = [{v:"task",l:"→ Task",bg:"#EEF2FB",col:"#2A50A0"},{v:"shopping",l:"→ Shopping",bg:"#E8F5EC",col:"#2A7A3A"},{v:"capture",l:"→ Capture",bg:"#FEF8E8",col:"#A07020"},{v:"ignore",l:"Ignore",bg:"#F2F2F2",col:"#909090"}];
  const filtered = filterTag==="all" ? items : items.filter(i=>i.tags.includes(filterTag));
  return (
    <div>
      <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:"1px solid #E8E8E8"}}>
        {["capture","mind dump","shopping"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",border:"none",background:"none",cursor:"pointer",fontFamily:"'Jost',system-ui,sans-serif",fontSize:13,letterSpacing:".04em",color:tab===t?"#1A1815":"#A0A0A0",fontWeight:tab===t?500:400,borderBottom:tab===t?"2px solid #2A2825":"2px solid transparent",marginBottom:-1,transition:"all .15s",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>
      {tab==="capture"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <input className="cap-input" style={{marginBottom:0,flex:1}} placeholder="Write, paste a link, drop a thought..." value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addItem();}}/>
            <button className="t-btn-save" onClick={addItem}>Add</button>
          </div>
          <div className="tags-wrap" style={{marginBottom:16}}>
            {TAGS.map(t=>(
              <div key={t.l} className="tpill" style={{background:selectedTags.includes(t.l)?t.c:t.bg,color:selectedTags.includes(t.l)?"white":t.c,border:"1px solid "+t.c,transition:"all .15s"}} onClick={()=>toggleTag(t.l)}>
                <div className="tdot" style={{background:selectedTags.includes(t.l)?"white":t.c}}/>{t.l}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
            <button className={`chip${filterTag==="all"?" on":""}`} onClick={()=>setFilterTag("all")}>All</button>
            {TAGS.map(t=>(<button key={t.l} className={`chip${filterTag===t.l?" on":""}`} onClick={()=>setFilterTag(filterTag===t.l?"all":t.l)} style={{borderColor:t.c,color:filterTag===t.l?"white":t.c,background:filterTag===t.l?t.c:"transparent"}}>{t.l}</button>))}
          </div>
          <div className="cap-items">
            {filtered.map(item=>{
              const remaining = TAGS.filter(t=>!item.tags.includes(t.l));
              return (
                <div key={item.id}>
                  <div className="cap-item">
                    <span style={{flex:1,fontSize:13.5,color:"#2A2520"}}>
                      <InlineEdit value={item.text} onChange={v=>updateItem(item.id,{text:v})} style={{fontSize:13.5,color:"#2A2520"}}/>
                    </span>
                    <span style={{fontSize:10.5,color:"#C0C0C0",marginRight:8}}>{item.date}</span>
                    <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {item.tags.map(t=>{const tag=TAGS.find(x=>x.l===t)||{bg:"#F0F0F0",c:"#909090"};return (
                        <span key={t} className="tpill" title="Click to remove"
                          style={{background:tag.bg,color:tag.c,fontSize:10.5,padding:"2px 8px 2px 6px",cursor:"pointer"}}
                          onClick={()=>updateItem(item.id,{tags:item.tags.filter(x=>x!==t)})}>
                          <div className="tdot" style={{background:tag.c,width:5,height:5}}/>{t}
                        </span>
                      );})}
                      {remaining.length>0&&(
                        <span className="tpill" title="Add tag"
                          style={{background:tagEditId===item.id?"#2A2825":"#F0F0F0",color:tagEditId===item.id?"#EBE8E0":"#909090",fontSize:10.5,padding:"2px 9px",cursor:"pointer"}}
                          onClick={()=>setTagEditId(tagEditId===item.id?null:item.id)}>+</span>
                      )}
                    </div>
                    <span className="t-del" style={{opacity:1,marginLeft:4}} onClick={()=>deleteItem(item.id)}>✕</span>
                  </div>
                  {tagEditId===item.id&&remaining.length>0&&(
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",padding:"8px 16px 4px",marginTop:-2}}>
                      {remaining.map(t=>(
                        <span key={t.l} className="tpill"
                          style={{background:t.bg,color:t.c,border:"1px dashed "+t.c,fontSize:10.5,padding:"2px 8px 2px 6px",cursor:"pointer"}}
                          onClick={()=>{ updateItem(item.id,{tags:[...item.tags,t.l]}); if(remaining.length===1) setTagEditId(null); }}>
                          <div className="tdot" style={{background:t.c,width:5,height:5}}/>{t.l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length===0&&(
              <div style={{padding:"32px 0",textAlign:"center",color:"#B0B0B0",fontSize:13,letterSpacing:".04em"}}>
                {items.length===0?"Nothing captured yet — drop a thought above.":"No items with this tag."}
              </div>
            )}
          </div>
        </div>
      )}
      {tab==="mind dump"&&(
        <div>
          {!processed?(
            <><p style={{fontSize:13,color:"#A0A0A0",marginBottom:14,lineHeight:1.6}}>Write everything on your mind — one thought per line. Then hit <strong style={{color:"#3A3530"}}>Process</strong> to sort them out.</p>
            <textarea style={{width:"100%",minHeight:260,padding:"16px",border:"1.5px solid #DCDCDC",borderRadius:10,fontFamily:"'Jost',system-ui,sans-serif",fontSize:14,color:"#2A2520",lineHeight:1.8,outline:"none",resize:"vertical",background:"#FAFAFA"}} placeholder="Call back client\nBuy protein powder\nFinish gym programme" value={dumpText} onChange={e=>setDumpText(e.target.value)}/>
            <button className="t-btn-save" style={{marginTop:12}} onClick={processDump} disabled={!dumpText.trim()}>Process →</button></>
          ):(
            <><p style={{fontSize:13,color:"#A0A0A0",marginBottom:16,lineHeight:1.6}}>Assign each item — or ignore it. Then hit <strong style={{color:"#3A3530"}}>Apply</strong>.</p>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {dumpLines.map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#FAFAFA",border:"1px solid #E8E8E8",borderRadius:8}}>
                  <span style={{flex:1,fontSize:13.5,color:"#2A2520"}}>{l.text}</span>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    {ACTION_OPTS.map(a=>(<button key={a.v} onClick={()=>setAction(l.id,l.action===a.v?null:a.v)} style={{padding:"3px 10px",borderRadius:20,border:"1px solid "+a.col,background:l.action===a.v?a.col:a.bg,color:l.action===a.v?"white":a.col,fontFamily:"'Jost',system-ui,sans-serif",fontSize:11.5,cursor:"pointer",transition:"all .12s"}}>{a.l}</button>))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="t-btn-save" onClick={applyDump}>Apply</button>
              <button className="t-btn-cancel" onClick={()=>setProcessed(false)}>← Back</button>
            </div></>
          )}
        </div>
      )}
      {tab==="shopping"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <input className="cap-input" style={{marginBottom:0,flex:1}} placeholder="Add item..." onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){setShopping(sh=>[...sh,{id:crypto.randomUUID(),text:e.target.value.trim(),category:"Other",done:false}]);e.target.value="";}}}/>
          </div>
          {SHOPPING_CATS.filter(cat=>shopping.some(s=>s.category===cat)).map(cat=>{
            const catItems=shopping.filter(s=>s.category===cat);
            if(!catItems.length) return null;
            return (<div key={cat} style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:"#A0A0A0",marginBottom:6}}>{cat}</div>
              {catItems.map(s=>(<div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:s.done?"#F8F8F8":"#FAFAFA",border:"1px solid #E8E8E8",borderRadius:7,marginBottom:4,opacity:s.done?.6:1}}>
                <div className={`tcheck${s.done?" on":""}`} style={{width:16,height:16,fontSize:9,borderRadius:3}} onClick={()=>setShopping(sh=>sh.map(x=>x.id===s.id?{...x,done:!x.done}:x))}>{s.done&&"✓"}</div>
                <span style={{flex:1,fontSize:13.5,color:s.done?"#A0A0A0":"#2A2520",textDecoration:s.done?"line-through":"none"}}>{s.text}</span>
                <span className="t-del" style={{opacity:1}} onClick={()=>setShopping(sh=>sh.filter(x=>x.id!==s.id))}>✕</span>
              </div>))}
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

function JournalModule() {
  const [entries, setEntries] = useSyncedState("journal_entries");
  const [selectedId, setSelectedId] = useState(1);
  const [sort, setSort] = useState("Newest");
  const [editingField, setEditingField] = useState(null);
  const sorted = [...entries].sort((a,b)=>sort==="Newest"?b.date.localeCompare(a.date):a.date.localeCompare(b.date));
  const entry = entries.find(e=>e.id===selectedId);
  const update = (id,patch) => setEntries(es=>es.map(e=>e.id===id?{...e,...patch}:e));
  const addEntry = () => { const e={id:crypto.randomUUID(),date:TODAY_ISO,title:"Untitled entry",content:""}; setEntries(es=>[e,...es]); setSelectedId(e.id); setEditingField("title"); };
  const deleteEntry = id => { setEntries(es=>es.filter(e=>e.id!==id)); const r=entries.filter(e=>e.id!==id); if(r.length>0) setSelectedId(r[0].id); };
  const fmtDate = d => { if(!d) return ""; const dt=new Date(d+"T12:00:00"); return dt.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}); };
  return (
    <div style={{display:"flex",height:"100%",minHeight:0}}>
      <div className="j-list-panel">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",gap:6}}>
            {["Newest","Oldest"].map(s=>(<button key={s} className={`chip${sort===s?" on":""}`} style={{fontSize:11}} onClick={()=>setSort(s)}>{s}</button>))}
          </div>
          <button className="t-btn-save" style={{padding:"5px 12px",fontSize:11}} onClick={addEntry}>+ New</button>
        </div>
        {sorted.map(e=>(<div key={e.id} className={`j-list-item${selectedId===e.id?" j-list-active":""}`} onClick={()=>setSelectedId(e.id)}>
          <div className="j-list-date">{fmtDate(e.date)}</div>
          <div className="j-list-title">{e.title}</div>
          <div className="j-list-preview">{e.content.slice(0,80).replace(/\n/g," ")}…</div>
        </div>))}
      </div>
      {entry&&(<div className="j-entry-panel"><div className="j-entry-inner">
        {editingField==="date"?<input className="j-edit-date" type="date" autoFocus value={entry.date} onChange={e=>update(entry.id,{date:e.target.value})} onBlur={()=>setEditingField(null)}/>:<div className="j-entry-date" onClick={()=>setEditingField("date")}>{fmtDate(entry.date)}</div>}
        {editingField==="title"?<input className="j-edit-title" autoFocus value={entry.title} onChange={e=>update(entry.id,{title:e.target.value})} onBlur={()=>setEditingField(null)} onKeyDown={e=>{if(e.key==="Enter")setEditingField("content");}}/>:<div className="j-entry-title" onClick={()=>setEditingField("title")}>{entry.title}</div>}
        <div className="j-entry-divider"/>
        {editingField==="content"?<textarea className="j-edit-content" autoFocus value={entry.content} onChange={e=>update(entry.id,{content:e.target.value})} onBlur={()=>setEditingField(null)}/>:<div className="j-entry-content" onClick={()=>setEditingField("content")}>{entry.content?entry.content.split("\n").map((p,i)=>p.trim()?<p key={i} style={{marginBottom:"1.1em"}}>{p}</p>:<br key={i}/>):<span className="j-placeholder">Start writing…</span>}</div>}
        <div className="j-entry-footer">
          <span className="j-word-count">{entry.content.split(/\s+/).filter(Boolean).length} words</span>
          <span className="t-del" style={{opacity:.6,fontSize:12}} onClick={()=>deleteEntry(entry.id)}>Delete entry</span>
        </div>
      </div></div>)}
    </div>
  );
}

const WORKOUT_TYPES = ["Push","Pull","Legs","Glutes","Pole dance","Flexibility","Cardio","Full body"];
const WORKOUT_STYLE = {Push:"#EEF2FB",Pull:"#E8F5EC",Legs:"#FEF8E8",Glutes:"#F5EAF5","Pole dance":"#FEE8F0",Flexibility:"#E8F8F5",Cardio:"#FEE8E8","Full body":"#F2F2F2"};
const WORKOUT_COL   = {Push:"#2A50A0",Pull:"#2A7A3A",Legs:"#A07020",Glutes:"#7A3A9A","Pole dance":"#A03060",Flexibility:"#2A8A7A",Cardio:"#C03030","Full body":"#606060"};
const INIT_WORKOUTS = [
  {id:1,date:D(0),type:"Push",duration:65,notes:"Felt strong today.",exercises:[{id:11,name:"Bench Press",sets:[{r:8,w:70},{r:8,w:70},{r:7,w:70}]},{id:12,name:"Overhead Press",sets:[{r:10,w:45},{r:10,w:45},{r:9,w:45}]},{id:13,name:"Lateral raises",sets:[{r:15,w:10},{r:15,w:10},{r:12,w:10}]}]},
  {id:2,date:D(-2),type:"Pull",duration:70,notes:"Increased deadlift by 5kg.",exercises:[{id:21,name:"Deadlift",sets:[{r:5,w:110},{r:5,w:110},{r:5,w:110}]},{id:22,name:"Pull-ups",sets:[{r:7,w:0},{r:6,w:0},{r:5,w:0}]},{id:23,name:"Romanian deadlift",sets:[{r:10,w:65},{r:10,w:65},{r:8,w:65}]}]},
  {id:3,date:D(-4),type:"Pole dance",duration:90,notes:"Held flag for 3 seconds.",exercises:[{id:31,name:"Warm-up spins",sets:[{r:5,w:0}]},{id:32,name:"Flag hold",sets:[{r:3,w:0},{r:3,w:0}]}]},
];
const INIT_NUTRITION = [
  {id:1,date:D(0),meals:[{id:11,name:"Oats + protein shake",calories:480,protein:42,fat:8,carbs:58},{id:12,name:"Chicken rice & veg",calories:620,protein:48,fat:12,carbs:72},{id:13,name:"Greek yogurt",calories:200,protein:18,fat:3,carbs:22},{id:14,name:"Salmon & sweet potato",calories:540,protein:44,fat:18,carbs:48}]},
];
const INIT_HEALTH = {
  weight:[{id:1,date:D(0),value:78.4},{id:2,date:D(-7),value:78.8},{id:3,date:D(-14),value:79.1},{id:4,date:D(-28),value:79.8}],
  bp:[{id:1,date:D(-1),systolic:118,diastolic:76,pulse:62,notes:"Morning, rested"},{id:2,date:D(-15),systolic:122,diastolic:78,pulse:65,notes:""}],
  tests:[{id:1,date:D(-45),metric:"Testosterone",value:"18.2",unit:"nmol/L",ref:"9–29",notes:""},{id:2,date:D(-45),metric:"Vitamin D",value:"62",unit:"nmol/L",ref:"50–125",notes:"Could be higher"},{id:3,date:D(-45),metric:"Ferritin",value:"88",unit:"μg/L",ref:"30–400",notes:""},{id:4,date:D(-45),metric:"Total cholest.",value:"4.2",unit:"mmol/L",ref:"<5.0",notes:""}],
};

function WorkoutsView({filter}) {
  const [sessions,setSessions]=useSyncedState("workouts");
  const [selectedId,setSelectedId]=useState(1);
  const [addingSess,setAddingSess]=useState(false);
  const [newSess,setNewSess]=useState({date:"",type:"Push",duration:"",notes:""});
  const [addingEx,setAddingEx]=useState(false);
  const [newEx,setNewEx]=useState({name:"",sets:3,reps:10,weight:0});
  const sess=sessions.find(s=>s.id===selectedId);
  const visible=[...sessions].filter(s=>filter==="All"||s.type===filter).sort((a,b)=>b.date.localeCompare(a.date));
  const updateSess=(id,patch)=>setSessions(ss=>ss.map(s=>s.id===id?{...s,...patch}:s));
  const updateEx=(sid,eid,patch)=>setSessions(ss=>ss.map(s=>s.id===sid?{...s,exercises:s.exercises.map(e=>e.id===eid?{...e,...patch}:e)}:s));
  const updateSet=(sid,eid,si,patch)=>setSessions(ss=>ss.map(s=>s.id===sid?{...s,exercises:s.exercises.map(e=>e.id===eid?{...e,sets:e.sets.map((st,i)=>i===si?{...st,...patch}:st)}:e)}:s));
  const addSession=()=>{if(!newSess.date)return;const s={...newSess,id:crypto.randomUUID(),duration:Number(newSess.duration)||0,exercises:[]};setSessions(ss=>[s,...ss]);setSelectedId(s.id);setNewSess({date:"",type:"Push",duration:"",notes:""});setAddingSess(false);};
  const addExercise=()=>{if(!newEx.name.trim())return;const sets=Array.from({length:Number(newEx.sets)||3},()=>({r:Number(newEx.reps)||10,w:Number(newEx.weight)||0}));const ex={id:crypto.randomUUID(),name:newEx.name.trim(),sets};updateSess(selectedId,{exercises:[...(sess?.exercises||[]),ex]});setNewEx({name:"",sets:3,reps:10,weight:0});setAddingEx(false);};
  const addSet=(eid)=>setSessions(ss=>ss.map(s=>s.id===selectedId?{...s,exercises:s.exercises.map(e=>e.id===eid?{...e,sets:[...e.sets,{r:e.sets[e.sets.length-1]?.r||10,w:e.sets[e.sets.length-1]?.w||0}]}:e)}:s));
  const delSet=(eid,si)=>setSessions(ss=>ss.map(s=>s.id===selectedId?{...s,exercises:s.exercises.map(e=>e.id===eid?{...e,sets:e.sets.filter((_,i)=>i!==si)}:e)}:s));
  const delEx=(eid)=>updateSess(selectedId,{exercises:sess.exercises.filter(e=>e.id!==eid)});
  const delSess=id=>{setSessions(ss=>ss.filter(s=>s.id!==id));if(selectedId===id&&sessions.length>1)setSelectedId(sessions.find(s=>s.id!==id)?.id);};
  return (
    <div style={{display:"flex",height:"100%",minHeight:0}}>
      <div className="crm-list">
        {visible.map(s=>{const bg=WORKOUT_STYLE[s.type]||"#F2F2F2",col=WORKOUT_COL[s.type]||"#606060";return(
          <div key={s.id} className={`crm-row${selectedId===s.id?" crm-row-active":""}`} onClick={()=>setSelectedId(s.id)}>
            <div style={{flex:1,minWidth:0}}>
              <div className="crm-name">{s.date}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}><span className="crm-status-badge" style={{background:bg,color:col}}>{s.type}</span>{s.duration>0&&<span style={{fontSize:11,color:"#B0B0B0"}}>{s.duration} min</span>}</div>
              <div style={{fontSize:11.5,color:"#A0A0A0",marginTop:3}}>{s.exercises.length} exercises</div>
            </div>
            <span className="t-del" style={{opacity:1,fontSize:11}} onClick={e=>{e.stopPropagation();delSess(s.id);}}>✕</span>
          </div>
        );})}
        {addingSess?(<div className="t-form" style={{margin:"10px 12px"}}>
          <input className="t-form-input" type="date" autoFocus value={newSess.date} onChange={e=>setNewSess({...newSess,date:e.target.value})}/>
          <select className="t-select" style={{width:"100%",marginTop:6}} value={newSess.type} onChange={e=>setNewSess({...newSess,type:e.target.value})}>{WORKOUT_TYPES.map(t=><option key={t}>{t}</option>)}</select>
          <input className="t-select" type="number" placeholder="Duration (min)" style={{width:"100%",marginTop:6}} value={newSess.duration} onChange={e=>setNewSess({...newSess,duration:e.target.value})}/>
          <div className="t-form-actions" style={{marginTop:10}}><button className="t-btn-save" onClick={addSession}>Add</button><button className="t-btn-cancel" onClick={()=>setAddingSess(false)}>Cancel</button></div>
        </div>):(<div className="crm-add-btn" onClick={()=>setAddingSess(true)}>+ New session</div>)}
      </div>
      {sess&&(<div className="crm-detail">
        <div className="crm-detail-header">
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <InlineEdit value={sess.date} onChange={v=>updateSess(sess.id,{date:v})} type="date" style={{fontSize:18,fontWeight:500,color:"#1A1815"}}/>
              <InlineEdit value={sess.type} onChange={v=>updateSess(sess.id,{type:v})} options={WORKOUT_TYPES} style={{fontSize:12}}/>
            </div>
            <div style={{display:"flex",gap:12,marginTop:6,fontSize:12,color:"#A0A0A0"}}>
              <span>⏱ <InlineEdit value={String(sess.duration)} onChange={v=>updateSess(sess.id,{duration:Number(v)})} type="number" style={{fontSize:12,color:"#A0A0A0",display:"inline"}}/> min</span>
              <span>{sess.exercises.length} exercises · {sess.exercises.reduce((s,e)=>s+e.sets.length,0)} sets</span>
            </div>
          </div>
        </div>
        {sess.exercises.map(ex=>(<div key={ex.id} className="crm-section" style={{paddingBottom:16,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{flex:1,fontSize:15,fontWeight:500,color:"#1A1815"}}><InlineEdit value={ex.name} onChange={v=>updateEx(sess.id,ex.id,{name:v})}/></div>
            <span className="t-del" style={{opacity:1,fontSize:11}} onClick={()=>delEx(ex.id)}>✕</span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              <th style={{textAlign:"left",fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:"#A0A0A0",paddingBottom:6,width:40}}>Set</th>
              <th style={{textAlign:"center",fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:"#A0A0A0",paddingBottom:6}}>Reps</th>
              <th style={{textAlign:"center",fontSize:10,letterSpacing:".1em",textTransform:"uppercase",color:"#A0A0A0",paddingBottom:6}}>kg</th>
              <th style={{width:24}}/>
            </tr></thead>
            <tbody>{ex.sets.map((st,i)=>(<tr key={i} style={{borderTop:"1px solid #F2F2F2"}}>
              <td style={{padding:"7px 0",fontSize:12,color:"#B0B0B0",fontWeight:500}}>{i+1}</td>
              <td style={{textAlign:"center",padding:"7px 4px"}}><InlineEdit value={String(st.r)} onChange={v=>updateSet(sess.id,ex.id,i,{r:Number(v)})} type="number" style={{textAlign:"center",width:48}}/></td>
              <td style={{textAlign:"center",padding:"7px 4px"}}><InlineEdit value={String(st.w)} onChange={v=>updateSet(sess.id,ex.id,i,{w:Number(v)})} type="number" style={{textAlign:"center",width:48}}/></td>
              <td><span className="t-del" style={{opacity:.5,fontSize:10}} onClick={()=>delSet(ex.id,i)}>✕</span></td>
            </tr>))}</tbody>
          </table>
          <div className="crm-add-inline" onClick={()=>addSet(ex.id)}>+ set</div>
        </div>))}
        {addingEx?(<div className="t-form">
          <input className="t-form-input" placeholder="Exercise name" autoFocus value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})} onKeyDown={e=>{if(e.key==="Escape")setAddingEx(false);}}/>
          <div className="t-form-row">
            <input className="t-select" type="number" placeholder="Sets" value={newEx.sets} onChange={e=>setNewEx({...newEx,sets:e.target.value})}/>
            <input className="t-select" type="number" placeholder="Reps" value={newEx.reps} onChange={e=>setNewEx({...newEx,reps:e.target.value})}/>
            <input className="t-select" type="number" placeholder="kg" value={newEx.weight} onChange={e=>setNewEx({...newEx,weight:e.target.value})}/>
          </div>
          <div className="t-form-actions"><button className="t-btn-save" onClick={addExercise}>Add exercise</button><button className="t-btn-cancel" onClick={()=>setAddingEx(false)}>Cancel</button></div>
        </div>):(<div className="crm-add-inline" onClick={()=>setAddingEx(true)}>+ Add exercise</div>)}
      </div>)}
    </div>
  );
}

function NutritionView({filter}) {
  const [days,setDays]=useNutritionDays();
  const [selectedDate,setSelectedDate]=useState(TODAY_ISO);
  const [addingMeal,setAddingMeal]=useState(false);
  const [newMeal,setNewMeal]=useState({name:"",calories:"",protein:"",fat:"",carbs:""});
  const day=days.find(d=>d.date===selectedDate)||{date:selectedDate,meals:[],id:crypto.randomUUID()};
  const totals=day.meals.reduce((acc,m)=>({calories:acc.calories+m.calories,protein:acc.protein+m.protein,fat:acc.fat+m.fat,carbs:acc.carbs+m.carbs}),{calories:0,protein:0,fat:0,carbs:0});
  const GOALS={calories:2400,protein:160,fat:80,carbs:240};
  const updateMeal=(mid,patch)=>setDays(ds=>ds.map(d=>d.date===selectedDate?{...d,meals:d.meals.map(m=>m.id===mid?{...m,...patch}:m)}:d));
  const delMeal=mid=>setDays(ds=>ds.map(d=>d.date===selectedDate?{...d,meals:d.meals.filter(m=>m.id!==mid)}:d));
  const addMeal=()=>{if(!newMeal.name.trim())return;const m={...newMeal,id:crypto.randomUUID(),calories:Number(newMeal.calories)||0,protein:Number(newMeal.protein)||0,fat:Number(newMeal.fat)||0,carbs:Number(newMeal.carbs)||0};setDays(ds=>{const exists=ds.find(d=>d.date===selectedDate);if(exists)return ds.map(d=>d.date===selectedDate?{...d,meals:[...d.meals,m]}:d);return [...ds,{id:crypto.randomUUID(),date:selectedDate,meals:[m]}];});setNewMeal({name:"",calories:"",protein:"",fat:"",carbs:""});setAddingMeal(false);};
  const MacroBar=({label,val,goal,color})=>(<div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",color:"#A0A0A0"}}>{label}</span><span style={{fontSize:12,color:"#3A3530",fontWeight:500}}>{val}<span style={{color:"#C0C0C0"}}>/{goal}</span></span></div><div style={{height:4,background:"#E8E8E8",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:color,borderRadius:2,width:Math.min(val/goal*100,100)+"%"}}/></div></div>);
  return (<div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
      <input type="date" className="t-select" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/>
      <div style={{display:"flex",gap:6}}>{days.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(d=>(<button key={d.date} className={`chip${selectedDate===d.date?" on":""}`} style={{fontSize:11}} onClick={()=>setSelectedDate(d.date)}>{d.date.slice(5)}</button>))}</div>
    </div>
    <div className="fin-summary" style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:16}}><div className="fin-total">{totals.calories}</div><div style={{fontSize:13,color:"#A0A0A0"}}>/ {GOALS.calories} kcal</div></div>
      <div style={{display:"flex",gap:20}}><MacroBar label="Protein" val={totals.protein} goal={GOALS.protein} color="#2A50A0"/><MacroBar label="Fat" val={totals.fat} goal={GOALS.fat} color="#C03030"/><MacroBar label="Carbs" val={totals.carbs} goal={GOALS.carbs} color="#A07020"/></div>
    </div>
    <table className="fin-table">
      <thead><tr><th>Meal</th><th style={{textAlign:"center"}}>kcal</th><th style={{textAlign:"center"}}>P</th><th style={{textAlign:"center"}}>F</th><th style={{textAlign:"center"}}>C</th><th/></tr></thead>
      <tbody>{day.meals.map(m=>(<tr key={m.id} className="fin-row">
        <td><InlineEdit value={m.name} onChange={v=>updateMeal(m.id,{name:v})}/></td>
        {[["calories",m.calories],["protein",m.protein],["fat",m.fat],["carbs",m.carbs]].map(([k,v])=>(<td key={k} style={{textAlign:"center"}}><InlineEdit value={String(v)} onChange={val=>updateMeal(m.id,{[k]:Number(val)})} type="number" style={{textAlign:"center",width:52}}/></td>))}
        <td><span className="t-del" style={{opacity:1}} onClick={()=>delMeal(m.id)}>✕</span></td>
      </tr>))}</tbody>
    </table>
    {addingMeal?(<div className="t-form" style={{marginTop:12}}>
      <input className="t-form-input" placeholder="Meal name" autoFocus value={newMeal.name} onChange={e=>setNewMeal({...newMeal,name:e.target.value})}/>
      <div className="t-form-row">{["calories","protein","fat","carbs"].map(k=>(<input key={k} className="t-select" type="number" placeholder={k.slice(0,4)+"."} value={newMeal[k]} onChange={e=>setNewMeal({...newMeal,[k]:e.target.value})}/>))}</div>
      <div className="t-form-actions"><button className="t-btn-save" onClick={addMeal}>Add meal</button><button className="t-btn-cancel" onClick={()=>setAddingMeal(false)}>Cancel</button></div>
    </div>):(<div className="crm-add-inline" style={{marginTop:10}} onClick={()=>setAddingMeal(true)}>+ Add meal</div>)}
  </div>);
}

function HealthView({filter}) {
  const [data,setData]     = useHealthData();
  const [addingW,setAddingW]   = useState(false);
  const [newW,setNewW]     = useState({date:"",value:""});
  const [addingT,setAddingT]   = useState(false);
  const [newT,setNewT]     = useState({date:"",metric:"",value:"",unit:"",ref:"",notes:""});
  const [addingBP,setAddingBP] = useState(false);
  const [newBP,setNewBP]   = useState({date:"",systolic:"",diastolic:"",pulse:"",notes:""});
  const [activeTab,setActiveTab] = useState("weight");

  const updateW = (id,patch) => setData(d=>({...d,weight:d.weight.map(w=>w.id===id?{...w,...patch}:w)}));
  const updateT = (id,patch) => setData(d=>({...d,tests:d.tests.map(t=>t.id===id?{...t,...patch}:t)}));

  const latestW  = [...data.weight].sort((a,b)=>b.date.localeCompare(a.date))[0];
  const oldestW  = [...data.weight].sort((a,b)=>a.date.localeCompare(b.date))[0];
  const weightDiff = latestW&&oldestW&&latestW.id!==oldestW.id ? (latestW.value-oldestW.value).toFixed(1) : null;

  const latestBP = data.bp&&data.bp.length>0 ? [...data.bp].sort((a,b)=>b.date.localeCompare(a.date))[0] : null;
  const bpStatus = latestBP ? (
    latestBP.systolic<120&&latestBP.diastolic<80?"Optimal":
    latestBP.systolic<130&&latestBP.diastolic<80?"Normal":
    latestBP.systolic<140||latestBP.diastolic<90?"Elevated":"High"
  ) : null;
  const bpCol = bpStatus==="Optimal"?"#2A7A3A":bpStatus==="Normal"?"#2A50A0":bpStatus==="Elevated"?"#A07020":"#C03030";

  return (
    <div>
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid #E8E8E8"}}>
        {["weight","blood pressure","test results"].map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"7px 18px",border:"none",background:"none",cursor:"pointer",fontFamily:"'Jost',system-ui,sans-serif",fontSize:12.5,letterSpacing:".04em",color:activeTab===tab?"#1A1815":"#A0A0A0",fontWeight:activeTab===tab?500:400,borderBottom:activeTab===tab?"2px solid #2A2825":"2px solid transparent",marginBottom:-1,textTransform:"capitalize"}}>{tab}</button>
        ))}
      </div>

      {activeTab==="weight"&&(
        <div>
          {latestW&&(
            <div className="fin-summary" style={{display:"flex",alignItems:"baseline",gap:16,marginBottom:20}}>
              <div>
                <div className="fin-total-label">Latest</div>
                <div className="fin-total">{latestW.value} kg</div>
              </div>
              {weightDiff!==null&&(
                <span style={{color:Number(weightDiff)<=0?"#2A7A3A":"#C03030",fontSize:13,marginTop:8}}>
                  {Number(weightDiff)>0?"+":""}{weightDiff} kg since {oldestW.date}
                </span>
              )}
            </div>
          )}
          <table className="fin-table">
            <thead><tr><th>Date</th><th>Weight (kg)</th><th/></tr></thead>
            <tbody>
              {[...data.weight].sort((a,b)=>b.date.localeCompare(a.date)).map(w=>(
                <tr key={w.id} className="fin-row">
                  <td><InlineEdit value={w.date} onChange={v=>updateW(w.id,{date:v})} type="date"/></td>
                  <td><InlineEdit value={String(w.value)} onChange={v=>updateW(w.id,{value:Number(v)})} type="number"/></td>
                  <td><span className="t-del" style={{opacity:1}} onClick={()=>setData(d=>({...d,weight:d.weight.filter(x=>x.id!==w.id)}))}>✕</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {addingW?(
            <div className="t-form" style={{marginTop:12}}>
              <div className="t-form-row">
                <input className="t-select" type="date" autoFocus value={newW.date} onChange={e=>setNewW({...newW,date:e.target.value})}/>
                <input className="t-select" type="number" placeholder="kg" value={newW.value} onChange={e=>setNewW({...newW,value:e.target.value})}/>
              </div>
              <div className="t-form-actions">
                <button className="t-btn-save" onClick={()=>{ if(!newW.date||!newW.value)return; setData(d=>({...d,weight:[{id:crypto.randomUUID(),date:newW.date,value:Number(newW.value)},...d.weight]})); setNewW({date:"",value:""}); setAddingW(false); }}>Save</button>
                <button className="t-btn-cancel" onClick={()=>setAddingW(false)}>Cancel</button>
              </div>
            </div>
          ):(
            <div className="crm-add-inline" onClick={()=>setAddingW(true)}>+ Log weight</div>
          )}
        </div>
      )}

      {activeTab==="blood pressure"&&(
        <div>
          {latestBP&&(
            <div className="fin-summary" style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"baseline",gap:16}}>
                <div>
                  <div className="fin-total-label">Latest reading</div>
                  <div className="fin-total">{latestBP.systolic}/{latestBP.diastolic} <span style={{fontSize:16,color:"#A0A0A0"}}>mmHg</span></div>
                </div>
                <span className="crm-status-badge" style={{background:bpCol+"22",color:bpCol,fontSize:12,alignSelf:"flex-end",marginBottom:4}}>{bpStatus}</span>
                {latestBP.pulse>0&&<div style={{fontSize:13,color:"#A0A0A0",alignSelf:"flex-end",marginBottom:6}}>♥ {latestBP.pulse} bpm</div>}
              </div>
            </div>
          )}
          <table className="fin-table">
            <thead><tr><th>Date</th><th style={{textAlign:"center"}}>Systolic</th><th style={{textAlign:"center"}}>Diastolic</th><th style={{textAlign:"center"}}>Pulse</th><th>Notes</th><th/></tr></thead>
            <tbody>
              {[...(data.bp||[])].sort((a,b)=>b.date.localeCompare(a.date)).map(bp=>(
                <tr key={bp.id} className="fin-row">
                  <td><InlineEdit value={bp.date} onChange={v=>setData(d=>({...d,bp:d.bp.map(x=>x.id===bp.id?{...x,date:v}:x)}))} type="date"/></td>
                  <td style={{textAlign:"center"}}><InlineEdit value={String(bp.systolic)} onChange={v=>setData(d=>({...d,bp:d.bp.map(x=>x.id===bp.id?{...x,systolic:Number(v)}:x)}))} type="number" style={{textAlign:"center",width:52}}/></td>
                  <td style={{textAlign:"center"}}><InlineEdit value={String(bp.diastolic)} onChange={v=>setData(d=>({...d,bp:d.bp.map(x=>x.id===bp.id?{...x,diastolic:Number(v)}:x)}))} type="number" style={{textAlign:"center",width:52}}/></td>
                  <td style={{textAlign:"center"}}><InlineEdit value={String(bp.pulse)} onChange={v=>setData(d=>({...d,bp:d.bp.map(x=>x.id===bp.id?{...x,pulse:Number(v)}:x)}))} type="number" style={{textAlign:"center",width:52}}/></td>
                  <td><InlineEdit value={bp.notes} onChange={v=>setData(d=>({...d,bp:d.bp.map(x=>x.id===bp.id?{...x,notes:v}:x)}))}/></td>
                  <td><span className="t-del" style={{opacity:1}} onClick={()=>setData(d=>({...d,bp:d.bp.filter(x=>x.id!==bp.id)}))}>✕</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {addingBP?(
            <div className="t-form" style={{marginTop:12}}>
              <div className="t-form-row">
                <input className="t-select" type="date" autoFocus value={newBP.date} onChange={e=>setNewBP({...newBP,date:e.target.value})}/>
                <input className="t-select" type="number" placeholder="Systolic" value={newBP.systolic} onChange={e=>setNewBP({...newBP,systolic:e.target.value})}/>
                <input className="t-select" type="number" placeholder="Diastolic" value={newBP.diastolic} onChange={e=>setNewBP({...newBP,diastolic:e.target.value})}/>
                <input className="t-select" type="number" placeholder="Pulse" value={newBP.pulse} onChange={e=>setNewBP({...newBP,pulse:e.target.value})}/>
              </div>
              <input className="t-form-input" placeholder="Notes (optional)" style={{marginTop:6}} value={newBP.notes} onChange={e=>setNewBP({...newBP,notes:e.target.value})}/>
              <div className="t-form-actions">
                <button className="t-btn-save" onClick={()=>{ if(!newBP.date||!newBP.systolic)return; setData(d=>({...d,bp:[{id:crypto.randomUUID(),date:newBP.date,systolic:Number(newBP.systolic),diastolic:Number(newBP.diastolic),pulse:Number(newBP.pulse)||0,notes:newBP.notes},...(d.bp||[])]})); setNewBP({date:"",systolic:"",diastolic:"",pulse:"",notes:""}); setAddingBP(false); }}>Save</button>
                <button className="t-btn-cancel" onClick={()=>setAddingBP(false)}>Cancel</button>
              </div>
            </div>
          ):(
            <div className="crm-add-inline" onClick={()=>setAddingBP(true)}>+ Log reading</div>
          )}
        </div>
      )}

      {activeTab==="test results"&&(
        <div>
          <table className="fin-table">
            <thead><tr><th>Date</th><th>Metric</th><th>Value</th><th>Unit</th><th>Ref. range</th><th>Notes</th><th/></tr></thead>
            <tbody>
              {data.tests.map(row=>(
                <tr key={row.id} className="fin-row">
                  {[["date","date",80],["metric","text",120],["value","text",70],["unit","text",60],["ref","text",80],["notes","text",null]].map(([k,tp,w])=>(
                    <td key={k} style={w?{maxWidth:w}:{}}><InlineEdit value={row[k]} onChange={v=>updateT(row.id,{[k]:v})} type={tp}/></td>
                  ))}
                  <td><span className="t-del" style={{opacity:1}} onClick={()=>setData(d=>({...d,tests:d.tests.filter(x=>x.id!==row.id)}))}>✕</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {addingT?(
            <div className="t-form" style={{marginTop:12}}>
              <div className="t-form-row">
                <input className="t-select" type="date" autoFocus value={newT.date} onChange={e=>setNewT({...newT,date:e.target.value})}/>
                <input className="t-select" placeholder="Metric" value={newT.metric} onChange={e=>setNewT({...newT,metric:e.target.value})}/>
                <input className="t-select" placeholder="Value" value={newT.value} onChange={e=>setNewT({...newT,value:e.target.value})}/>
                <input className="t-select" placeholder="Unit" value={newT.unit} onChange={e=>setNewT({...newT,unit:e.target.value})}/>
                <input className="t-select" placeholder="Ref. range" value={newT.ref} onChange={e=>setNewT({...newT,ref:e.target.value})}/>
              </div>
              <div className="t-form-actions">
                <button className="t-btn-save" onClick={()=>{ if(!newT.metric.trim())return; setData(d=>({...d,tests:[...d.tests,{...newT,id:crypto.randomUUID()}]})); setNewT({date:"",metric:"",value:"",unit:"",ref:"",notes:""}); setAddingT(false); }}>Save</button>
                <button className="t-btn-cancel" onClick={()=>setAddingT(false)}>Cancel</button>
              </div>
            </div>
          ):(
            <div className="crm-add-inline" onClick={()=>setAddingT(true)}>+ Add result</div>
          )}
        </div>
      )}
    </div>
  );
}

const MEDIA_CONFIGS = {
  knygos:{label:"Books",statusOpts:["Reading","Read","Want to read"],defaultStatus:"Want to read",searchPlaceholder:"Search book title or author...",extraField:"pages"},
  filmai:{label:"Movies",statusOpts:["Watching","Watched","Want to watch"],defaultStatus:"Want to watch",searchPlaceholder:"Search movie title...",extraField:null},
  zaidimai:{label:"Games",statusOpts:["Playing","Played","Want to play"],defaultStatus:"Want to play",searchPlaceholder:"Search game title...",extraField:"platform"},
};

async function searchMedia(moduleId, query, keys) {
  if(moduleId==="knygos") {
    const res = await fetch("https://www.googleapis.com/books/v1/volumes?maxResults=8&q="+encodeURIComponent(query));
    if(!res.ok) throw new Error("Google Books request failed");
    const data = await res.json();
    return (data.items||[]).map(it=>{
      const v=it.volumeInfo||{};
      return {
        title: v.title||"Untitled",
        author: (v.authors||[]).join(", "),
        year: v.publishedDate?parseInt(v.publishedDate.slice(0,4)):null,
        genre: (v.categories||[])[0]||"",
        pages: v.pageCount||0,
        cover: v.imageLinks?.thumbnail?.replace("http://","https://")||null,
      };
    });
  }
  if(moduleId==="filmai") {
    if(!keys.tmdb) throw new Error("__nokey__tmdb");
    const res = await fetch("https://api.themoviedb.org/3/search/movie?query="+encodeURIComponent(query)+"&api_key="+keys.tmdb);
    if(!res.ok) throw new Error("TMDB request failed");
    const data = await res.json();
    return (data.results||[]).slice(0,8).map(m=>({
      title: m.title,
      director: "",
      year: m.release_date?parseInt(m.release_date.slice(0,4)):null,
      genre: "",
      cover: m.poster_path?"https://image.tmdb.org/t/p/w200"+m.poster_path:null,
    }));
  }
  if(moduleId==="zaidimai") {
    if(!keys.rawg) throw new Error("__nokey__rawg");
    const res = await fetch("https://api.rawg.io/api/games?key="+keys.rawg+"&search="+encodeURIComponent(query)+"&page_size=8");
    if(!res.ok) throw new Error("RAWG request failed");
    const data = await res.json();
    return (data.results||[]).map(g=>({
      title: g.name,
      platform: (g.platforms||[]).slice(0,2).map(p=>p.platform.name).join(", ")||"—",
      year: g.released?parseInt(g.released.slice(0,4)):null,
      genre: (g.genres||[])[0]?.name||"",
      cover: g.background_image||null,
    }));
  }
  return [];
}

function MediaApiKeysNotice({moduleId, onSave}) {
  const [val, setVal] = useState("");
  const label = moduleId==="filmai" ? "TMDB API key" : "RAWG API key";
  const url   = moduleId==="filmai" ? "themoviedb.org/settings/api" : "rawg.io/apidocs";
  return (
    <div style={{background:"#FAFAFA",border:"1px solid #E8E8E8",borderRadius:10,padding:14,marginBottom:16}}>
      <div style={{fontSize:12.5,color:"#3A3530",lineHeight:1.6,marginBottom:10}}>
        To search real {moduleId==="filmai"?"movies":"games"}, add your free {label} (get one at {url}). Stored only in this browser.
      </div>
      <div style={{display:"flex",gap:6}}>
        <input className="t-form-input" style={{marginBottom:0,flex:1}} placeholder={label}
          value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&val.trim()) onSave(val.trim()); }}/>
        <button className="t-btn-save" onClick={()=>{ if(val.trim()) onSave(val.trim()); }}>Save</button>
      </div>
    </div>
  );
}


function StarRating({value,onChange}) {
  const [hover,setHover]=useState(0);
  return (<div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=>(<span key={i} style={{cursor:"pointer",fontSize:16,color:i<=(hover||value)?"#C4933A":"#D8D8D8",transition:"color .1s"}} onClick={()=>onChange(i===value?0:i)} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}>★</span>))}</div>);
}

function MediaView({moduleId,filter}) {
  const cfg=MEDIA_CONFIGS[moduleId];
  const [items,setItems]=useMediaItems(moduleId);
  const [search,setSearch]=useState("");
  const [searchRes,setSearchRes]=useState([]);
  const [searching,setSearching]=useState(false);
  const [searchErr,setSearchErr]=useState(null); // null | "nokey" | "error" | "empty"
  const [keys,setKeys]=useState({
    tmdb: localStorage.getItem("tmdb_api_key")||"",
    rawg: localStorage.getItem("rawg_api_key")||"",
  });
  const [filterSt,setFilterSt]=useState("All");
  const [expandedId,setExpandedId]=useState(null);
  const [addingDaily,setAddingDaily]=useState(null);
  const [dailyPages,setDailyPages]=useState("");

  const saveKey = (which, val) => {
    localStorage.setItem(which+"_api_key", val);
    setKeys(k=>({...k, [which]:val}));
  };

  const doSearch = async () => {
    if(!search.trim()) return;
    setSearching(true); setSearchErr(null); setSearchRes([]);
    try {
      const res = await searchMedia(moduleId, search.trim(), keys);
      setSearchRes(res);
      if(res.length===0) setSearchErr("empty");
    } catch(e) {
      if(String(e.message).startsWith("__nokey__")) setSearchErr("nokey");
      else setSearchErr("error");
    }
    setSearching(false);
  };

  const addFromSearch=res=>{
    const {cover, ...rest} = res;
    const base={id:crypto.randomUUID(),status:cfg.defaultStatus||cfg.statusOpts[cfg.statusOpts.length-1],rating:0,notes:"",cover:cover||""};
    const item=moduleId==="knygos"?{...base,...rest,pagesRead:0}:{...base,...rest};
    setItems(is=>[item,...is]);setSearch("");setSearchRes([]);setSearchErr(null);
  };
  const update=(id,patch)=>setItems(is=>is.map(i=>i.id===id?{...i,...patch}:i));
  const del=id=>setItems(is=>is.filter(i=>i.id!==id));
  const logPages=id=>{const n=Number(dailyPages);if(!n)return;setItems(is=>is.map(i=>i.id===id?{...i,pagesRead:Math.min(i.pages,i.pagesRead+n)}:i));setDailyPages("");setAddingDaily(null);};
  const visible=items.filter(i=>filterSt==="All"||i.status===filterSt);

  return (<div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <input className="cap-input" style={{marginBottom:0,flex:1}} placeholder={cfg.searchPlaceholder} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")doSearch();}}/>
      <button className="t-btn-save" onClick={doSearch}>{searching?"…":"Search"}</button>
    </div>

    {searchErr==="nokey"&&<MediaApiKeysNotice moduleId={moduleId} onSave={v=>{ saveKey(moduleId==="filmai"?"tmdb":"rawg", v); setSearchErr(null); }}/>}

    {searchErr==="error"&&(
      <div style={{background:"#FEE8E8",border:"1px solid #F0C0C0",borderRadius:10,padding:14,marginBottom:16,fontSize:12.5,color:"#A03030"}}>
        Search failed — please check your connection and try again.
      </div>
    )}

    {searchErr==="empty"&&(
      <div style={{background:"#FAFAFA",border:"1px solid #E8E8E8",borderRadius:10,padding:14,marginBottom:16,fontSize:12.5,color:"#A0A0A0",textAlign:"center"}}>
        No results for "{search}"
      </div>
    )}

    {searchRes.length>0&&(<div style={{background:"#FAFAFA",border:"1px solid #E8E8E8",borderRadius:10,padding:12,marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",color:"#A0A0A0",marginBottom:10}}>Results</div>
      {searchRes.map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderTop:i>0?"1px solid #F0F0F0":"none"}}>
        {r.cover
          ? <img src={r.cover} alt="" style={{width:32,height:46,objectFit:"cover",borderRadius:3,flexShrink:0,background:"#EEE"}}/>
          : <div style={{width:32,height:46,borderRadius:3,flexShrink:0,background:"#EEE"}}/>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,color:"#2A2520",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</div>
          <div style={{fontSize:12,color:"#A0A0A0",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[r.author||r.director||r.platform, r.year, r.genre].filter(Boolean).join(" · ")}</div>
        </div>
        <button className="t-btn-save" style={{padding:"5px 14px",fontSize:12,flexShrink:0}} onClick={()=>addFromSearch(r)}>+ Add</button>
      </div>))}
      <div className="crm-add-inline" style={{marginTop:8,paddingTop:8,borderTop:"1px solid #F0F0F0"}} onClick={()=>{setSearchRes([]);setSearchErr(null);}}>Close</div>
    </div>)}

    <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
      {["All",...cfg.statusOpts].map(s=>(<button key={s} className={`chip${filterSt===s?" on":""}`} onClick={()=>setFilterSt(s)}>{s}</button>))}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {visible.map(item=>{
        const isOpen=expandedId===item.id;
        const prog=moduleId==="knygos"&&item.pages>0?item.pagesRead/item.pages:null;
        return (<div key={item.id} style={{background:"#FAFAFA",border:"1px solid #E8E8E8",borderRadius:10,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer"}} onClick={()=>setExpandedId(isOpen?null:item.id)}>
            {item.cover
              ? <img src={item.cover} alt="" style={{width:36,height:52,objectFit:"cover",borderRadius:4,flexShrink:0,background:"#EEE"}}/>
              : <div style={{width:36,height:52,borderRadius:4,flexShrink:0,background:"#EEE"}}/>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:500,color:"#1A1815",marginBottom:3}}><InlineEdit value={item.title} onChange={v=>update(item.id,{title:v})} style={{fontWeight:500}}/></div>
              <div style={{fontSize:12,color:"#A0A0A0",display:"flex",gap:8,flexWrap:"wrap"}}>
                {item.author&&<InlineEdit value={item.author} onChange={v=>update(item.id,{author:v})} style={{fontSize:12,color:"#A0A0A0"}}/>}
                {item.director&&<InlineEdit value={item.director} onChange={v=>update(item.id,{director:v})} style={{fontSize:12,color:"#A0A0A0"}}/>}
                {item.platform&&<InlineEdit value={item.platform} onChange={v=>update(item.id,{platform:v})} style={{fontSize:12,color:"#A0A0A0"}}/>}
                {item.year&&<span>{item.year}</span>}{item.genre&&<InlineEdit value={item.genre} onChange={v=>update(item.id,{genre:v})} style={{fontSize:12,color:"#A0A0A0"}}/>}
              </div>
              {prog!==null&&(<div style={{marginTop:6}}><div style={{height:3,background:"#E8E8E8",borderRadius:2,overflow:"hidden",maxWidth:200}}><div style={{height:"100%",background:"#2A2825",borderRadius:2,width:(prog*100)+"%"}}/></div><div style={{fontSize:10.5,color:"#B0B0B0",marginTop:3}}>{item.pagesRead}/{item.pages} pages</div></div>)}
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
              <InlineEdit value={item.status} onChange={v=>update(item.id,{status:v})} options={cfg.statusOpts} style={{fontSize:11,color:"#606060"}}/>
              <StarRating value={item.rating} onChange={v=>update(item.id,{rating:v})}/>
            </div>
            <span style={{fontSize:12,color:"#C0C0C0"}}>{isOpen?"▲":"▼"}</span>
          </div>
          {isOpen&&(<div style={{padding:"0 16px 14px",borderTop:"1px solid #F0F0F0"}}>
            <div style={{marginTop:12,marginBottom:8}}><div className="crm-field-label">Notes</div><InlineEdit value={item.notes||""} onChange={v=>update(item.id,{notes:v})} style={{fontSize:13,color:"#3A3530"}}/></div>
            {moduleId==="knygos"&&(<div style={{marginTop:10}}><div className="crm-field-label" style={{marginBottom:6}}>Log reading progress</div>
              {addingDaily===item.id?(<div style={{display:"flex",gap:6,alignItems:"center"}}><input className="t-select" type="number" placeholder="Pages read today" autoFocus value={dailyPages} onChange={e=>setDailyPages(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")logPages(item.id);if(e.key==="Escape")setAddingDaily(null);}} style={{width:160}}/><button className="t-btn-save" style={{padding:"5px 12px",fontSize:12}} onClick={()=>logPages(item.id)}>+ Add</button><button className="t-btn-cancel" style={{padding:"5px 12px",fontSize:12}} onClick={()=>setAddingDaily(null)}>Cancel</button></div>):(<div className="crm-add-inline" onClick={()=>setAddingDaily(item.id)}>+ Log pages</div>)}
            </div>)}
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><span className="t-del" style={{opacity:1,fontSize:12}} onClick={()=>del(item.id)}>Delete</span></div>
          </div>)}
        </div>);
      })}
      {visible.length===0&&(<div style={{padding:"40px 0",textAlign:"center",color:"#B0B0B0",fontSize:13,letterSpacing:".04em"}}>Nothing here yet — search to add.</div>)}
    </div>
  </div>);
}

const INIT_COURSES = [
  {id:1,title:"Blender Advanced Modeling",platform:"Udemy",hours:32,link:"",notes:"Solid fundamentals. Modifiers section especially useful.",chapters:[{id:11,title:"Introduction & interface",done:true,notes:""},{id:12,title:"Mesh modelling basics",done:true,notes:"Good refresher on edge loops."},{id:13,title:"Modifiers",done:false,notes:""},{id:14,title:"UV unwrapping",done:false,notes:""},{id:15,title:"Material basics",done:false,notes:""}]},
  {id:2,title:"Corona Renderer Masterclass",platform:"Downloaded",hours:18,link:"",notes:"",chapters:[{id:21,title:"Physical camera setup",done:true,notes:"f/8, ISO 400, 1/125 — good for interiors."},{id:22,title:"IES lighting",done:true,notes:""},{id:23,title:"PBR materials deep dive",done:false,notes:""},{id:24,title:"Render optimisation",done:false,notes:""}]},
  {id:3,title:"Supabase Full Course",platform:"YouTube",hours:6,link:"https://youtube.com",notes:"",chapters:[{id:31,title:"Setup & auth",done:false,notes:""},{id:32,title:"Database & RLS",done:false,notes:""},{id:33,title:"Storage & Edge functions",done:false,notes:""}]},
];

function LearningView() {
  const [courses,setCourses]=useSyncedState("courses");
  const [selectedId,setSelectedId]=useState(1);
  const [addingCourse,setAddingCourse]=useState(false);
  const [newCourse,setNewCourse]=useState({title:"",platform:"",hours:"",link:"",notes:""});
  const [addingChapter,setAddingChapter]=useState(false);
  const [newChapter,setNewChapter]=useState({title:"",notes:""});
  const [expandedChapter,setExpandedChapter]=useState(null);
  const course=courses.find(c=>c.id===selectedId);
  const done=course?course.chapters.filter(ch=>ch.done).length:0;
  const total=course?course.chapters.length:0;
  const prog=total>0?done/total:0;
  const updateCourse=(id,patch)=>setCourses(cs=>cs.map(c=>c.id===id?{...c,...patch}:c));
  const updateChapter=(cid,chid,patch)=>setCourses(cs=>cs.map(c=>c.id===cid?{...c,chapters:c.chapters.map(ch=>ch.id===chid?{...ch,...patch}:ch)}:c));
  const toggleChapter=chid=>updateChapter(selectedId,chid,{done:!course.chapters.find(ch=>ch.id===chid).done});
  const delChapter=chid=>updateCourse(selectedId,{chapters:course.chapters.filter(ch=>ch.id!==chid)});
  const delCourse=id=>{setCourses(cs=>cs.filter(c=>c.id!==id));if(selectedId===id)setSelectedId(courses.find(c=>c.id!==id)?.id);};
  const addCourse=()=>{if(!newCourse.title.trim())return;const c={...newCourse,id:crypto.randomUUID(),hours:Number(newCourse.hours)||0,chapters:[]};setCourses(cs=>[...cs,c]);setSelectedId(c.id);setNewCourse({title:"",platform:"",hours:"",link:"",notes:""});setAddingCourse(false);};
  const addChapter=()=>{if(!newChapter.title.trim())return;const ch={...newChapter,id:crypto.randomUUID(),done:false};updateCourse(selectedId,{chapters:[...course.chapters,ch]});setNewChapter({title:"",notes:""});setAddingChapter(false);};
  return (<div style={{display:"flex",height:"100%",minHeight:0}}>
    <div className="crm-list">
      {courses.map(co=>{const d=co.chapters.filter(ch=>ch.done).length,t=co.chapters.length,p=t>0?d/t:0;return(<div key={co.id} className={`crm-row${selectedId===co.id?" crm-row-active":""}`} onClick={()=>setSelectedId(co.id)}>
        <div style={{flex:1,minWidth:0}}>
          <div className="crm-name">{co.title}</div>
          <div className="crm-company">{co.platform}{co.hours>0&&" · "+co.hours+"h"}</div>
          <div style={{marginTop:6}}><div style={{height:3,background:"#E0E0E0",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:"#2A2825",borderRadius:2,width:(p*100)+"%"}}/></div><div style={{fontSize:10.5,color:"#B0B0B0",marginTop:3}}>{d}/{t} chapters</div></div>
        </div>
        <span className="t-del" style={{opacity:1,fontSize:11}} onClick={e=>{e.stopPropagation();delCourse(co.id);}}>✕</span>
      </div>);})}
      {addingCourse?(<div className="t-form" style={{margin:"10px 12px"}}>
        <input className="t-form-input" placeholder="Course title" autoFocus value={newCourse.title} onChange={e=>setNewCourse({...newCourse,title:e.target.value})}/>
        <input className="t-form-input" placeholder="Platform" style={{marginTop:6}} value={newCourse.platform} onChange={e=>setNewCourse({...newCourse,platform:e.target.value})}/>
        <div className="t-form-row" style={{marginTop:6}}><input className="t-select" type="number" placeholder="Hours" value={newCourse.hours} onChange={e=>setNewCourse({...newCourse,hours:e.target.value})}/><input className="t-select" placeholder="Link (optional)" value={newCourse.link} onChange={e=>setNewCourse({...newCourse,link:e.target.value})}/></div>
        <div className="t-form-actions" style={{marginTop:10}}><button className="t-btn-save" onClick={addCourse}>Add</button><button className="t-btn-cancel" onClick={()=>setAddingCourse(false)}>Cancel</button></div>
      </div>):(<div className="crm-add-btn" onClick={()=>setAddingCourse(true)}>+ New course</div>)}
    </div>
    {course&&(<div className="crm-detail">
      <div className="crm-detail-header">
        <div style={{flex:1}}>
          <div className="crm-detail-name"><InlineEdit value={course.title} onChange={v=>updateCourse(course.id,{title:v})}/></div>
          <div style={{display:"flex",gap:12,marginTop:4,fontSize:12,color:"#A0A0A0",flexWrap:"wrap"}}>
            <InlineEdit value={course.platform} onChange={v=>updateCourse(course.id,{platform:v})} style={{fontSize:12,color:"#A0A0A0"}}/>
            {course.hours>0&&<span><InlineEdit value={String(course.hours)} onChange={v=>updateCourse(course.id,{hours:Number(v)})} type="number" style={{fontSize:12,color:"#A0A0A0",display:"inline",width:36}}/> hrs</span>}
            {course.link&&<a href={course.link} target="_blank" rel="noopener noreferrer" style={{color:"#2A50A0",fontSize:12}}>↗ Open</a>}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:22,fontWeight:300,color:"#1A1815"}}>{done}/{total}</div><div style={{fontSize:10,color:"#A0A0A0",letterSpacing:".06em",textTransform:"uppercase"}}>chapters</div></div>
      </div>
      <div style={{marginBottom:20}}><div style={{height:5,background:"#E8E8E8",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:"#2A2825",borderRadius:3,width:(prog*100)+"%",transition:"width .3s"}}/></div></div>
      <div className="crm-section"><div className="crm-section-title">Course notes</div>
        <InlineEdit value={course.notes||""} onChange={v=>updateCourse(course.id,{notes:v})} style={{fontSize:13,color:"#3A3530",lineHeight:1.6,display:"block"}}/>
        {!course.link&&(<div style={{marginTop:10}}><div className="crm-field-label">Link (optional)</div><InlineEdit value={course.link||""} onChange={v=>updateCourse(course.id,{link:v})} style={{fontSize:13,color:"#2A50A0"}}/></div>)}
      </div>
      <div className="crm-section"><div className="crm-section-title">Chapters</div>
        {course.chapters.map((ch,i)=>(<div key={ch.id} style={{marginBottom:4}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:i>0?"1px solid #F2F2F2":"none"}}>
            <div className={`tcheck${ch.done?" on":""}`} style={{width:16,height:16,fontSize:9,borderRadius:3,flexShrink:0}} onClick={()=>toggleChapter(ch.id)}>{ch.done&&"✓"}</div>
            <div style={{flex:1}}><div style={{fontSize:13.5,color:ch.done?"#A0A0A0":"#2A2520",textDecoration:ch.done?"line-through":"none"}}><InlineEdit value={ch.title} onChange={v=>updateChapter(course.id,ch.id,{title:v})} style={{color:ch.done?"#A0A0A0":"#2A2520",fontSize:13.5}}/></div>{ch.notes&&<div style={{fontSize:12,color:"#8A8880",marginTop:2,fontStyle:"italic"}}>{ch.notes}</div>}</div>
            <span style={{fontSize:11,color:"#C0C0C0",cursor:"pointer",padding:"2px 5px",borderRadius:4}} onClick={()=>setExpandedChapter(expandedChapter===ch.id?null:ch.id)}>{expandedChapter===ch.id?"▲":"✎"}</span>
            <span className="t-del" style={{opacity:1,fontSize:11}} onClick={()=>delChapter(ch.id)}>✕</span>
          </div>
          {expandedChapter===ch.id&&(<div style={{paddingLeft:26,paddingBottom:10}}><div className="crm-field-label" style={{marginBottom:4}}>Chapter notes</div>
            <textarea style={{width:"100%",padding:"8px 10px",border:"1.5px solid #DCDCDC",borderRadius:7,fontFamily:"'Jost',system-ui,sans-serif",fontSize:13,color:"#3A3530",lineHeight:1.65,outline:"none",resize:"vertical",background:"#FAFAFA",minHeight:70}} placeholder="What was useful here?" value={ch.notes||""} onChange={e=>updateChapter(course.id,ch.id,{notes:e.target.value})}/>
          </div>)}
        </div>))}
        {addingChapter?(<div className="t-form" style={{marginTop:10}}>
          <input className="t-form-input" placeholder="Chapter title" autoFocus value={newChapter.title} onChange={e=>setNewChapter({...newChapter,title:e.target.value})} onKeyDown={e=>{if(e.key==="Enter")addChapter();if(e.key==="Escape")setAddingChapter(false);}}/>
          <input className="t-form-input" placeholder="Notes (optional)" style={{marginTop:6}} value={newChapter.notes} onChange={e=>setNewChapter({...newChapter,notes:e.target.value})}/>
          <div className="t-form-actions"><button className="t-btn-save" onClick={addChapter}>Add chapter</button><button className="t-btn-cancel" onClick={()=>setAddingChapter(false)}>Cancel</button></div>
        </div>):(<div className="crm-add-inline" onClick={()=>setAddingChapter(true)}>+ Add chapter</div>)}
      </div>
    </div>)}
  </div>);
}


function FinanceDashboard({expenses, projFin, filter}) {
  const now = new Date();

  const getRange = () => {
    if(filter==="This month") {
      const s=new Date(now.getFullYear(),now.getMonth(),1);
      const e=new Date(now.getFullYear(),now.getMonth()+1,0);
      return [localISO(s), localISO(e)];
    }
    if(filter==="Last month") {
      const s=new Date(now.getFullYear(),now.getMonth()-1,1);
      const e=new Date(now.getFullYear(),now.getMonth(),0);
      return [localISO(s), localISO(e)];
    }
    if(filter==="This year") {
      return [now.getFullYear()+"-01-01", now.getFullYear()+"-12-31"];
    }
    return ["2000-01-01","2099-12-31"];
  };

  const [from, to] = getRange();
  const inRange = d => d>=from && d<=to;

  const filtExp  = expenses.filter(e=>inRange(e.date));
  const filtProj = projFin.filter(e=>inRange(e.date));

  const totalExp    = filtExp.reduce((s,e)=>s+e.amount, 0);
  const projExp     = filtProj.filter(e=>e.type==="Project expense").reduce((s,e)=>s+e.amount,0);
  const freelance   = filtProj.filter(e=>e.type==="Freelance income").reduce((s,e)=>s+e.amount,0);
  const salary      = filtProj.filter(e=>e.type==="Salary").reduce((s,e)=>s+e.amount,0);
  const totalIncome = freelance+salary;
  const totalSpend  = totalExp+projExp;
  const net         = totalIncome-totalSpend;

  // By category
  const CATS = ["Food","Transport","Sport","Entertainment","Health","Subscriptions","Other"];
  const CAT_COLS = {Food:"#E57373",Transport:"#64B5F6",Sport:"#81C784",Entertainment:"#FFB74D",Health:"#F06292",Subscriptions:"#9575CD",Other:"#90A4AE"};
  const byCat = CATS.map(cat=>[cat, filtExp.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0)]).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const maxCat = byCat.length>0 ? byCat[0][1] : 1;

  // By project income
  const byProj = {};
  filtProj.filter(e=>e.type==="Freelance income").forEach(e=>{
    byProj[e.project]=(byProj[e.project]||0)+e.amount;
  });
  const projIncome = Object.entries(byProj).sort((a,b)=>b[1]-a[1]);

  // Recent transactions
  const recent = [...filtExp.map(e=>({...e,kind:"expense"})),...filtProj.map(e=>({...e,kind:"proj"}))]
    .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);

  const Card = ({label,value,sub,color="#1A1815"}) => (
    <div style={{background:"white",border:"1px solid #EBEBEB",borderRadius:10,padding:"18px 20px",flex:1,minWidth:140,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
      <div style={{fontSize:10,fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:"#A0A0A0",marginBottom:8}}>{label}</div>
      <div style={{fontSize:26,fontWeight:300,color,lineHeight:1}}>€{Math.abs(value).toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
      {sub&&<div style={{fontSize:11.5,color:"#A0A0A0",marginTop:5}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      {/* Summary cards */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <Card label="Total income" value={totalIncome} color="#2A7A3A" sub={`Freelance €${freelance.toFixed(2)} · Salary €${salary.toFixed(2)}`}/>
        <Card label="Total spent" value={totalSpend} color="#C03030" sub={`Personal €${totalExp.toFixed(2)} · Projects €${projExp.toFixed(2)}`}/>
        <Card label="Net" value={net} color={net>=0?"#2A50A0":"#C03030"} sub={net>=0?"Positive balance":"Negative balance"}/>
        <Card label="Transactions" value={filtExp.length+filtProj.length} color="#606060" sub={`${filtExp.length} personal · ${filtProj.length} project`}/>
      </div>

      <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* Spending by category */}
        <div style={{flex:1,minWidth:240,background:"white",border:"1px solid #EBEBEB",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:"#A0A0A0",marginBottom:16}}>Personal spending by category</div>
          {byCat.length===0&&<div style={{color:"#C0C0C0",fontSize:13}}>No data for this period</div>}
          {byCat.map(([cat,val])=>(
            <div key={cat} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12.5,color:"#3A3530",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:CAT_COLS[cat]||"#999",display:"inline-block"}}/>
                  {cat}
                </span>
                <span style={{fontSize:12.5,fontWeight:500,color:"#3A3530"}}>€{val.toFixed(2)}</span>
              </div>
              <div style={{height:5,background:"#F0F0F0",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",background:CAT_COLS[cat]||"#999",borderRadius:3,width:(val/maxCat*100)+"%",transition:"width .4s"}}/>
              </div>
            </div>
          ))}
          {byCat.length>0&&(
            <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #F0F0F0",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11.5,color:"#A0A0A0"}}>Total personal expenses</span>
              <span style={{fontSize:13,fontWeight:500,color:"#3A3530"}}>€{totalExp.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Income breakdown */}
        <div style={{flex:1,minWidth:240,background:"white",border:"1px solid #EBEBEB",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:10,fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:"#A0A0A0",marginBottom:16}}>Income breakdown</div>
          {salary>0&&(
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F5F5F5"}}>
              <span style={{fontSize:13,color:"#3A3530"}}>💼 Salary</span>
              <span style={{fontSize:13,fontWeight:500,color:"#2A7A3A"}}>+€{salary.toFixed(2)}</span>
            </div>
          )}
          {projIncome.map(([proj,val])=>(
            <div key={proj} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F5F5F5"}}>
              <span style={{fontSize:12.5,color:"#3A3530",maxWidth:"60%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{proj==="—"?"Other":proj}</span>
              <span style={{fontSize:13,fontWeight:500,color:"#2A7A3A"}}>+€{val.toFixed(2)}</span>
            </div>
          ))}
          {totalIncome===0&&<div style={{color:"#C0C0C0",fontSize:13}}>No income for this period</div>}
          {totalIncome>0&&(
            <div style={{marginTop:12,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11.5,color:"#A0A0A0"}}>Total income</span>
              <span style={{fontSize:13,fontWeight:500,color:"#2A7A3A"}}>€{totalIncome.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{background:"white",border:"1px solid #EBEBEB",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:".12em",textTransform:"uppercase",color:"#A0A0A0",marginBottom:14}}>Recent transactions</div>
        {recent.length===0&&<div style={{color:"#C0C0C0",fontSize:13}}>No transactions for this period</div>}
        {recent.map((e,i)=>{
          const isIncome=e.kind==="proj"&&e.type!=="Project expense";
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderTop:i>0?"1px solid #F5F5F5":"none"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:isIncome?"#E8F5EC":e.kind==="expense"?"#FEF0F0":"#FEE8E8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                {isIncome?"↗":"↘"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:"#2A2520",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</div>
                <div style={{fontSize:11,color:"#A0A0A0",marginTop:1}}>{e.date}{e.category?" · "+e.category:""}{e.type?" · "+e.type:""}</div>
              </div>
              <span style={{fontSize:13,fontWeight:500,color:isIncome?"#2A7A3A":"#C03030",flexShrink:0}}>
                {isIncome?"+":"-"}€{e.amount.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleContent({id, mod, filter, tasks, setTasks, clients, setClients, projects, setProjects, expenses, setExpenses, projFin, setProjFin}) {
  if(id==="crm")        return <CrmView clients={clients} setClients={setClients}/>;
  if(id==="capture")  return <QuickCaptureModule tasks={tasks} setTasks={setTasks}/>;
  if(id==="calendar")   return <CalendarView tasks={tasks} setTasks={setTasks}/>;
  if(id==="tasks")      return <TasksView filter={filter} tasks={tasks} setTasks={setTasks} projects={projects}/>;
  if(id==="fin-dashboard") return <FinanceDashboard expenses={expenses} projFin={projFin} filter={filter}/>;
  if(id==="islaidos")   return <PersonalFinanceView filter={filter} entries={expenses} setEntries={setExpenses}/>;
  if(id==="proj-fin")   return <ProjectFinanceView filter={filter} projects={projects} entries={projFin} setEntries={setProjFin}/>;
  if(id==="journal")      return <JournalModule/>;
  if(id==="treniruotes") return <WorkoutsView filter={filter}/>;
  if(id==="mityba")      return <NutritionView filter={filter}/>;
  if(id==="sveikata")    return <HealthView filter={filter}/>;
  if(id==="knygos"||id==="filmai"||id==="zaidimai") return <MediaView moduleId={id} filter={filter}/>;
  if(id==="mokymasis") return <LearningView/>;
  if(id==="projektai") return <ProjectsView tasks={tasks} setTasks={setTasks} clients={clients} setClients={setClients} projects={projects} setProjects={setProjects}/>;
  if(mod.cols) return <GhostTable mod={mod}/>;
  return <div style={{padding:"60px 0",textAlign:"center",color:"#B0B0B0",fontSize:13,letterSpacing:".04em"}}>Coming soon</div>;
}

function ModuleView({active, tasks, setTasks, clients, setClients, projects, setProjects, expenses, setExpenses, projFin, setProjFin}) {
  const mod = M[active]||M.crm;
  const [filt, setFilt] = useState(mod.filters[0]||"");
  const bc = BC[active]||[active];
  return (
    <div className="main">
      <div className="topbar">
        <div className="breadcrumb">
          {bc.map((b,i)=>(
            <span key={i}>
              {i<bc.length-1
                ?<><span style={{color:"#8A8278"}}>{b}</span><span className="bc-sep"> / </span></>
                :<span className="bc-cur">{b}</span>}
            </span>
          ))}
        </div>
        <span style={{fontSize:11.5,color:"#A8A49C",letterSpacing:".04em"}}>
          {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
        </span>
      </div>
      {(active==="crm"||active==="projektai"||active==="journal"||active==="treniruotes"||active==="mokymasis"||active==="calendar") ? (
        <div style={{flex:1,display:"flex",overflow:"hidden",padding:active==="calendar"?"0":"20px 24px 20px 28px",gap:0,minHeight:0}}>
          <ModuleContent id={active} mod={mod} filter={filt} tasks={tasks} setTasks={setTasks} clients={clients} setClients={setClients} projects={projects} setProjects={setProjects} expenses={expenses} setExpenses={setExpenses} projFin={projFin} setProjFin={setProjFin}/>
        </div>
      ) : (
        <div className="content">
          <div className="mod-header">
            <div className="mod-title">{mod.title}</div>
            <div className="mod-sub">{mod.sub}</div>
            <div className="mod-desc">{mod.desc}</div>
          </div>
          {mod.filters.length>0&&(
            <div className="filter-bar">
              {mod.fl&&<span className="filter-label">{mod.fl}:</span>}
              {mod.filters.map(f=>(
                <button key={f} className={`chip${filt===f?" on":""}`} onClick={()=>setFilt(f)}>{f}</button>
              ))}
            </div>
          )}
          <ModuleContent id={active} mod={mod} filter={filt} tasks={tasks} setTasks={setTasks} clients={clients} setClients={setClients} projects={projects} setProjects={setProjects} expenses={expenses} setExpenses={setExpenses} projFin={projFin} setProjFin={setProjFin}/>
        </div>
      )}
    </div>
  );
}

function NavItem({item,active,setActive,expanded,toggle}) {
  const hasKids = item.children&&item.children.length>0;
  const isExp = expanded[item.id];
  const childActive = hasKids&&item.children.some(c=>c.id===active);
  return (
    <>
      <div className={`nav-item${active===item.id||(childActive&&!isExp)?" active":""}`}
        onClick={()=>{ if(hasKids) toggle(item.id); else setActive(item.id); }}>
        {item.icon&&<span style={{fontSize:11,opacity:.5,flexShrink:0}}>{item.icon}</span>}
        <span style={{flex:1}}>{item.label}</span>
        {hasKids&&<span className={`nav-arrow${isExp?" open":""}`}>▶</span>}
      </div>
      {hasKids&&isExp&&item.children.map(ch=>(
        <div key={ch.id} className={`nav-item sub${active===ch.id?" active":""}`} onClick={()=>setActive(ch.id)}>
          {ch.label}
        </div>
      ))}
    </>
  );
}

export default function PersonalOS({ userEmail, onSignOut }) {
  const [active, setActive] = useState("crm");
  const [expanded, setExpanded] = useState({finansai:true,fitness:true});
  const [tasks, setTasks]     = useSyncedState("tasks");
  const [clients, setClients] = useSyncedState("clients");
  const [projects, setProjects] = useSyncedState("projects");
  const [expenses, setExpenses] = useSyncedState("expenses");
  const [projFin, setProjFin]   = useSyncedState("project_finance");
  const [aiOpen, setAiOpen] = useState(false);
  const toggle = id => setExpanded(p=>({...p,[id]:!p[id]}));
  return (
    <>
      <style>{CSS}</style>
      <div className="os">
        <nav className="sidebar">
          <div className="sb-logo">
            <div className="sb-logo-name">Personal OS</div>
            <div className="sb-logo-sub">Karolis · 2026</div>
          </div>
          {NAV_GROUPS.map(g=>(
            <div key={g.group} className="nav-group">
              <div className="nav-group-label">{g.group}</div>
              {g.items.map(item=>(
                <NavItem key={item.id} item={item} active={active} setActive={setActive} expanded={expanded} toggle={toggle}/>
              ))}
            </div>
          ))}
          <button className="ai-btn" onClick={()=>setAiOpen(true)}>✦ AI Assistant</button>
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #1E1D1A",display:"flex",alignItems:"center",gap:8}}>
            <span style={{flex:1,fontSize:10.5,color:"#5A5650",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={userEmail}>{userEmail}</span>
            <span onClick={onSignOut} style={{fontSize:10.5,color:"#8A8680",cursor:"pointer",letterSpacing:".04em",flexShrink:0}}>Sign out</span>
          </div>
        </nav>
        <ModuleView key={active} active={active} tasks={tasks} setTasks={setTasks} clients={clients} setClients={setClients} projects={projects} setProjects={setProjects} expenses={expenses} setExpenses={setExpenses} projFin={projFin} setProjFin={setProjFin}/>
        <AIPanel open={aiOpen} onClose={()=>setAiOpen(false)} tasks={tasks} clients={clients} projects={projects} expenses={expenses} projFin={projFin}/>
      </div>
    </>
  );
}
