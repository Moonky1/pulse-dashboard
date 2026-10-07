// A code-native reconstruction, not a copy of customer records or live URLs.
// Fixed synthetic training values only. No external assets or live dialer calls.
export const SCREEN_WIDTH = 1200, SCREEN_HEIGHT = 760
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
const text = (x, y, value, size = 16, fill = '#111', weight = 'normal', extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" ${extra}>${esc(value)}</text>`
const rect = (x, y, w, h, color = '#fff', border = '#999') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${border}"/>`
const field = (x, y, w, label, value = '') => text(x - 8, y + 19, label, 16, '#111', 'bold', 'text-anchor="end"') + rect(x, y, w, 26) + text(x + 6, y + 19, value)
const button = (x, y, w, label, color = '#ddd') => rect(x, y, w, 25, color, '#999') + text(x + w / 2, y + 18, label, 15, '#111', 'bold', 'text-anchor="middle"')
const link = (x, y, label) => text(x, y, label, 17, '#39218a', 'bold', 'text-decoration="underline"')
export const region = (id, label, x, y, w, h) => ({ id, label, x: x / SCREEN_WIDTH, y: y / SCREEN_HEIGHT, w: w / SCREEN_WIDTH, h: h / SCREEN_HEIGHT })
export function viciScreenSvg(mode = 'paused') {
  const manual = mode === 'manual' || mode === 'manual-filled', live = !manual && !['paused', 'callback', 'home'].includes(mode)
  let svg = rect(0, 0, 1200, 760, '#ededed', '#bbb')
  if (manual) {
    svg += rect(28, 30, 1144, 685, '#e8fae2', '#d3e5cf')
    svg += text(600, 80, 'Enter information below for the new lead you wish to call.', 21, '#111', 'bold', 'text-anchor="middle"')
    svg += text(600, 112, 'Training exercise • no number will be called', 17, '#425344', 'normal', 'text-anchor="middle"')
    svg += field(325, 210, 100, 'Dial Code:', '1') + text(450, 230, '(This is usually a 1 in the USA-Canada)')
    svg += field(325, 260, 250, 'Phone Number:', mode === 'manual-filled' ? '2025550147' : '') + text(600, 280, '(digits only)')
    svg += text(300, 330, 'Search Existing Leads:', 16, '#111', 'bold', 'text-anchor="end"') + rect(325, 314, 20, 20) + text(328, 331, '✓')
    svg += text(370, 330, 'Find this phone number in the system before inserting a new lead.', 16)
    svg += '<path d="M55 430H1145" stroke="#b9d5b1"/>'
    svg += text(55, 477, 'Dial Override is a different field. Use Phone Number for this exercise.', 18)
    svg += field(325, 535, 300, 'Dial Override:') + text(650, 555, '(digits only please)')
    svg += link(340, 650, 'Dial Now') + link(565, 650, 'Preview Call') + link(825, 650, 'Go Back')
  } else {
    svg += text(12, 22, 'Logged in as User: 990001 on Phone: SIP/990001 to campaign: TRAINING', 14)
    svg += '<path d="M15 36h18l-9 16z" fill="#12248c"/><path d="M33 36h18l-9 16z" fill="#8491ad"/><path d="M24 53h18l-9-16z" fill="#4d5b7a"/>'
    svg += text(54, 59, 'VICI', 29, '#142783', 'bold') + text(118, 59, 'dial', 29, '#777', 'bold')
    svg += button(185, 34, 95, 'SCRIPT') + button(288, 34, 85, 'FORM')
    svg += text(735, 48, 'Training session • 8800001', 13) + text(790, 67, 'Calls in Queue: 0', 14)
    svg += link(993, 25, 'GROUPS') + link(1090, 25, 'LOGOUT')
    svg += text(1020, 62, live ? 'LIVE CALL' : 'NO LIVE CALL', 21, live ? '#168529' : '#888', 'bold')
    svg += rect(0, 79, 1200, 30, '#ddd', '#ddd') + text(10, 101, live ? 'STATUS: Incoming: (202)555-0147   UID: TRAINING-ONLY' : 'STATUS:', 17)
    if (!live) svg += rect(10, 126, 188, 30, '#ffff83', '#e4e489') + text(17, 148, 'YOU ARE PAUSED', 19, '#111', 'bold')
    svg += text(18, 181, 'RECORDING FILE:', 14) + text(18, 202, 'TRAINING — synthetic', 13) + text(18, 224, 'RECORD ID: 000000', 14)
    svg += button(10, 232, 185, live ? 'STOP RECORDING' : 'START RECORDING')
    svg += button(10, 285, 185, 'WEB FORM') + button(10, 314, 185, 'WEB FORM 2')
    svg += button(10, 375, 185, 'PARK CALL', '#e9b8f0') + button(10, 404, 185, 'TRANSFER - CONF', '#e9b8f0')
    svg += button(10, 459, 185, 'HANGUP CUSTOMER', '#ffa0a0') + button(35, 520, 136, 'SEND DTMF', '#e9b8f0') + rect(70, 549, 65, 25)
    svg += rect(207, 111, 978, 445, '#fff', '#ddd')
    const values = live ? ['TAYLOR', 'EXAMPLE', '100 TRAINING AVE', 'EXAMPLE CITY', 'TX', '00000'] : ['', '', '', '', '', '']
    svg += field(345, 131, 210, 'First Name', values[0]) + field(730, 131, 250, 'Last Name', values[1])
    svg += field(345, 170, 315, 'Address', values[2]) + field(730, 170, 170, 'City', values[3]) + field(1020, 170, 85, 'State', values[4])
    svg += field(345, 209, 130, 'Zip', values[5]) + field(730, 209, 290, 'Email')
    svg += field(345, 248, 115, 'Vehicle Year') + field(730, 248, 140, 'Vehicle Make') + field(1020, 248, 150, 'Model')
    svg += field(345, 287, 190, 'Odometer') + field(730, 287, 290, 'VIN')
    svg += field(345, 326, 250, 'IP Address') + field(845, 326, 280, 'Vendor Lead Code')
    svg += field(345, 365, 150, 'Loan Balance', live ? '25000' : '') + field(730, 365, 125, 'Loan Monthly Cost', live ? '420' : '') + field(1040, 365, 85, 'Term Length', live ? '72' : '')
    svg += field(345, 404, 205, 'Origination Date', live ? '1/15/2025' : '') + field(730, 404, 150, 'APR Estimate', live ? '6.25' : '')
    svg += field(345, 443, 205, 'Date of Birth', live ? '1/1/1990' : '') + field(730, 443, 170, 'ID NUMBER', live ? 'TRAINING-001' : '')
    if (live) {
      svg += rect(207, 578, 978, 150, '#cec8ff', '#bbb3ee') + text(216, 603, 'TRANSFER CONFERENCE FUNCTIONS:', 15)
      svg += rect(215, 614, 302, 25) + text(220, 632, 'BlindSpanishXfer - Blind Spanish Xfer', 13)
      svg += button(535, 614, 160, 'LOCAL CLOSER', '#a49ce7')
      svg += field(305, 649, 160, 'NUMBER TO CALL:', '2025550199')
      svg += button(945, 600, 200, 'HANGUP XFER LINE', '#ff9b9b') + button(945, 629, 200, 'HANGUP BOTH LINES', '#ff9b9b') + button(945, 658, 200, 'LEAVE 3-WAY CALL', '#b3aaff')
      svg += button(215, 696, 166, 'BLIND TRANSFER', '#a49ce7') + button(391, 696, 196, 'DIAL WITH CUSTOMER', '#8ebcff') + button(599, 696, 190, 'PARK CUSTOMER DIAL', '#a49ce7') + button(805, 696, 120, 'PRESETS', '#a49ce7')
    } else svg += link(365, 686, 'MANUAL DIAL') + link(570, 686, 'FAST DIAL') + link(730, 686, 'VIEW CALL LOG') + link(956, 686, 'ENTER PAUSE CODE')
    if (mode === 'paused') {
      svg += rect(748, 136, 420, 373, '#deffd0', '#c5eabb') + text(958, 169, 'SELECT A PAUSE CODE:', 17, '#111', 'bold', 'text-anchor="middle"')
      svg += text(770, 210, 'PAUSE CODE', 16, '#111', 'bold') + link(770, 254, 'Break - Break') + link(770, 299, 'CB - Callbacks') + link(990, 254, 'Lunch - Lunch') + link(990, 344, 'RR - Restroom')
    }
    if (mode === 'presets' || mode === 'spanish' || mode === 'disposition') {
      svg += rect(660, 295, 500, 246, '#e8e7f0', '#999') + text(683, 332, 'TRANSFER PRESETS', 19, '#111', 'bold')
      svg += text(683, 375, 'Language:', 17, '#111', 'bold') + rect(825, 352, 306, 34) + text(835, 375, mode === 'presets' ? 'English' : 'Spanish', 17)
      svg += button(825, 409, 200, 'LOCAL CLOSER', '#a49ce7')
      svg += text(683, 493, 'Disposition:', 17, '#111', 'bold') + rect(825, 470, 306, 34) + text(835, 493, mode === 'disposition' ? 'Choose a disposition' : '—', 16)
    }
    svg += text(9, 749, 'VERSION: Training reconstruction     Synthetic data only — no live calls', 12, '#666')
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><g font-family="Arial, sans-serif">${svg}</g></svg>`
}
export async function viciScreenFile(mode) {
  const source = URL.createObjectURL(new Blob([viciScreenSvg(mode)], { type: 'image/svg+xml' }))
  try {
    const img = new Image(); img.src = source
    await img.decode()
    const canvas = document.createElement('canvas'); canvas.width = SCREEN_WIDTH; canvas.height = SCREEN_HEIGHT
    canvas.getContext('2d').drawImage(img, 0, 0)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Screen could not be prepared.')
    return new File([blob], `vici-training-${mode}.png`, { type: 'image/png' })
  } finally { URL.revokeObjectURL(source) }
}
