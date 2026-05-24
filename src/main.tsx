import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// #region agent log
function runUiProbe() {
  const probe = document.createElement('div')
  probe.className = 'hidden'
  document.body.appendChild(probe)
  const hiddenWorks = getComputedStyle(probe).display === 'none'
  document.body.removeChild(probe)

  const sheets = Array.from(document.styleSheets)
  let cssRuleCount = 0
  for (const sheet of sheets) {
    try {
      cssRuleCount += sheet.cssRules?.length ?? 0
    } catch {
      /* cross-origin */
    }
  }

  const sidebarCount = document.querySelectorAll('aside').length
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches

  fetch('http://127.0.0.1:7254/ingest/ae257906-c499-4391-91d3-8b22d26243ae', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '37adb3',
    },
    body: JSON.stringify({
      sessionId: '37adb3',
      runId: 'post-fix',
      location: 'main.tsx:ui-probe',
      message: 'Tailwind and layout probe',
      data: {
        hiddenWorks,
        tailwindLikelyActive: hiddenWorks,
        cssRuleCount,
        stylesheetCount: sheets.length,
        sidebarAsideCount: sidebarCount,
        duplicateSidebarLikely: isDesktop ? sidebarCount > 1 : sidebarCount > 0,
        isDesktop,
      },
      timestamp: Date.now(),
      hypothesisId: 'A',
    }),
  }).catch(() => {})
}

window.addEventListener('load', () => {
  setTimeout(runUiProbe, 250)
})
// #endregion
