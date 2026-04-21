#!/usr/bin/env python3
"""
PULSE DASHBOARD AUTO-PATCHER
=============================
Aplica los 6 patches sobre Dashboard.jsx automáticamente.

USO (PowerShell):
  python patch_dashboard.py

Prerequisito: Este script debe estar en la misma carpeta que Dashboard.jsx
  (C:\\Users\\simon\\pulse-dashboard\\pulse-dashboard\\src\\pages\\)

Lo que hace:
  1. Lee Dashboard.jsx
  2. Aplica 6 patches (Central fix, Venezuela fix, OT columns fix, Download, Colombia safety)
  3. Guarda Dashboard.jsx (sobreescribe el original)
  4. Crea Dashboard.jsx.bak como backup

Patches:
  P1: Central OT header - fix 0/0/0 bug
  P2: Venezuela OT header - better detection
  P3: OT agent columns - remove +1 offset that reads wrong columns
  P4: OT footer columns - same fix for footer totals
  P5: Asia Download button - adds download to Asia tab bar
  P6: Colombia OT header - safety improvement
"""

import os
import sys
import shutil

# Path to Dashboard.jsx - adjust if needed
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_PATH = os.path.join(SCRIPT_DIR, 'Dashboard.jsx')

if not os.path.exists(DASHBOARD_PATH):
    print(f"ERROR: No encontre Dashboard.jsx en {SCRIPT_DIR}")
    print("Asegurate de poner este script en src/pages/")
    sys.exit(1)

# Read original
with open(DASHBOARD_PATH, 'r', encoding='utf-8') as f:
    code = f.read()

original_len = len(code)
print(f"Leyendo Dashboard.jsx ({original_len:,} chars)...")

# Create backup
backup_path = DASHBOARD_PATH + '.bak'
shutil.copy2(DASHBOARD_PATH, backup_path)
print(f"Backup creado: {backup_path}")

patches = []
failed = []

# ═══════════════════════════════════════════════════
# PATCH 1: Central OT header
# ═══════════════════════════════════════════════════
old = "otHeaderIncludes: ['CENTRAL AMERICA', '16:00 - 17:00 PST']"
new = "otHeaderIncludes: ['OT TAKERS', 'OT CENTRAL', 'CENTRAL OT']"
if old in code:
    code = code.replace(old, new, 1)
    patches.append("P1: Central OT header fix")
else:
    failed.append("P1: Central OT header - NOT FOUND (ya aplicado?)")

# ═══════════════════════════════════════════════════
# PATCH 2: Venezuela OT header
# ═══════════════════════════════════════════════════
old = "otHeaderIncludes: ['OT AW GARRET VENEZUELA']"
new = "otHeaderIncludes: ['OT TAKERS', 'OT AW GARRET', 'VENEZUELA OT']"
if old in code:
    code = code.replace(old, new, 1)
    patches.append("P2: Venezuela OT header fix")
else:
    failed.append("P2: Venezuela OT header - NOT FOUND (ya aplicado?)")

# ═══════════════════════════════════════════════════
# PATCH 3: OT agent column offset
# ═══════════════════════════════════════════════════
old = """    let en = 0
    let sp = 0
    if (!inOT) {
      en = safeInt(row[colEn])
      sp = safeInt(row[colSp])
    } else {
      en = safeInt(row[colEn + 1]) || safeInt(row[colEn])
      sp = safeInt(row[colSp + 1]) || safeInt(row[colSp])
    }"""
new = """    const en = safeInt(row[colEn])
    const sp = safeInt(row[colSp])"""
if old in code:
    code = code.replace(old, new, 1)
    patches.append("P3: OT agent column offset fix")
else:
    failed.append("P3: OT agent columns - NOT FOUND (ya aplicado?)")

# ═══════════════════════════════════════════════════
# PATCH 4: OT footer column offset
# ═══════════════════════════════════════════════════
old = """  const getOTFooterTotals = (row) => {
    const en = safeInt(row[colEn + 1]) || safeInt(row[colEn])
    const sp = safeInt(row[colSp + 1]) || safeInt(row[colSp])
    const tot = safeInt(row[colSp + 2]) || (en + sp)
    return { english: en, spanish: sp, total: tot }
  }"""
new = """  const getOTFooterTotals = (row) => {
    const en = safeInt(row[colEn])
    const sp = safeInt(row[colSp])
    const tot = en + sp
    return { english: en, spanish: sp, total: tot }
  }"""
if old in code:
    code = code.replace(old, new, 1)
    patches.append("P4: OT footer column offset fix")
else:
    failed.append("P4: OT footer columns - NOT FOUND (ya aplicado?)")

# ═══════════════════════════════════════════════════
# PATCH 5: Asia Download button
# ═══════════════════════════════════════════════════
old_asia_tabs = """<div className="asia-view-tabs"><button className={`view-tab ${asiaView==='stats'?'active':''}`} onClick={()=>setAsiaView('stats')}>\U0001f4ca Stats</button><button className={`view-tab ${asiaView==='charts'?'active':''}`} onClick={()=>setAsiaView('charts')}>\U0001f4c8 Charts</button><button className={`view-tab ${asiaView==='slacks'?'active':''}`} onClick={()=>setAsiaView('slacks')}>\U0001f4ac Slacks</button></div>"""

new_asia_tabs = """<div className="asia-view-tabs"><button className={`view-tab ${asiaView==='stats'?'active':''}`} onClick={()=>setAsiaView('stats')}>\U0001f4ca Stats</button><button className={`view-tab ${asiaView==='charts'?'active':''}`} onClick={()=>setAsiaView('charts')}>\U0001f4c8 Charts</button><button className={`view-tab ${asiaView==='slacks'?'active':''}`} onClick={()=>setAsiaView('slacks')}>\U0001f4ac Slacks</button><button className="view-tab" onClick={()=>downloadTeamDayCsv_({config:{label:'Asia',hasSp:true,id:'asia'},selectedDate,dateLabel:formatDateLabel(selectedDate),goal,totalEn:totalEnglish,totalSp:totalSpanish,totalXf:totalXfers,agents:asiaAgentsFinal})}>\u2B07 Download</button></div>"""

if old_asia_tabs in code:
    code = code.replace(old_asia_tabs, new_asia_tabs, 1)
    patches.append("P5: Asia Download button added")
else:
    failed.append("P5: Asia Download button - NOT FOUND (ya existe?)")

# ═══════════════════════════════════════════════════
# PATCH 6: Colombia OT header safety
# ═══════════════════════════════════════════════════
old = "otHeaderIncludes: ['COLOMBIA OT']"
new = "otHeaderIncludes: ['OT TAKERS', 'COLOMBIA OT', 'OT COLOMBIA']"
if old in code:
    code = code.replace(old, new, 1)
    patches.append("P6: Colombia OT header safety")
else:
    failed.append("P6: Colombia OT header - NOT FOUND (ya aplicado?)")

# ═══════════════════════════════════════════════════
# SAVE
# ═══════════════════════════════════════════════════
with open(DASHBOARD_PATH, 'w', encoding='utf-8') as f:
    f.write(code)

new_len = len(code)

print(f"\n{'='*50}")
print(f"RESULTADO:")
print(f"{'='*50}")
print(f"Archivo: {DASHBOARD_PATH}")
print(f"Original: {original_len:,} chars")
print(f"Parcheado: {new_len:,} chars")
print(f"Diferencia: {new_len - original_len:+,} chars")
print()

if patches:
    print(f"APLICADOS ({len(patches)}):")
    for p in patches:
        print(f"  \u2705 {p}")

if failed:
    print(f"\nNO ENCONTRADOS ({len(failed)}):")
    for f in failed:
        print(f"  \u26a0\ufe0f  {f}")

print(f"\nBackup en: {backup_path}")
print(f"\nSiguiente paso: git add . && git commit -m 'fix: parser Central/Venezuela + download' && git push")