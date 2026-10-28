(() => {
  const websites = {
  "positronicalabs.dev": "1079d9e1-4bc8-4494-aaed-d42b6f7ed19f",
  "positronicalabs.netlify.app": "1079d9e1-4bc8-4494-aaed-d42b6f7ed19f",
  "positronica-labs.vercel.app": "1079d9e1-4bc8-4494-aaed-d42b6f7ed19f",
  "giobuilds.com": "cfc40179-c5d1-48fe-ac59-6fd0ea6c808b",
  "www.giobuilds.com": "cfc40179-c5d1-48fe-ac59-6fd0ea6c808b",
  "tallygraph.dev": "f1e10afa-f165-43ce-90ef-109cd4ecbb8a",
  "www.tallygraph.dev": "f1e10afa-f165-43ce-90ef-109cd4ecbb8a",
  "www.hypeman.app": "ae64431d-11a9-437f-be62-55504a6863c1",
  "hypeman.app": "ae64431d-11a9-437f-be62-55504a6863c1",
  "aldava.positronicalabs.dev": "ffe0365c-60ba-47ae-9417-3cdd6c660113",
  "fairfit-ai.netlify.app": "216d9fcd-1ac9-436a-9d0e-5790625cb4ce",
  "fairhire-sigma.vercel.app": "216d9fcd-1ac9-436a-9d0e-5790625cb4ce",
  "hypatia-learning.netlify.app": "fdb98625-f4a4-4d88-af33-eb9e548636ab",
  "hypatia-one.vercel.app": "fdb98625-f4a4-4d88-af33-eb9e548636ab",
  "echo-pronunciation.netlify.app": "6f85ab5b-8698-41af-97c8-c8c6aab246b1",
  "web-rose-eight-19.vercel.app": "1ca1ff63-f8fc-4114-817a-c786bcf8d85e",
  "partproof-527601165113.us-central1.run.app": "796eadd4-90c3-4d0f-9672-52fd2f51e833",
  "partproof-rho.vercel.app": "796eadd4-90c3-4d0f-9672-52fd2f51e833"
}
  const websiteId = Object.hasOwn(websites, window.location.hostname) ? websites[window.location.hostname] : null
  if (!websiteId || window.positronicaAnalyticsLoaded) return
  window.positronicaAnalyticsLoaded = true

  function cleanUrl(value, campaigns) {
    if (!value) return ''
    try {
      const url = new URL(value, window.location.href)
      if (!['http:', 'https:'].includes(url.protocol)) return ''
      const query = new URLSearchParams()
      if (campaigns) {
        for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
          if (url.searchParams.has(key)) query.set(key, url.searchParams.get(key))
        }
      }
      return url.origin + url.pathname + (query.size ? '?' + query : '')
    } catch {
      return ''
    }
  }

  // shortcut: collect pageviews only; add allowlisted events when conversion tracking is requested.
  window.positronicaAnalyticsBeforeSend = (type, payload) => {
    if (type !== 'event' || payload.name) return false
    const url = cleanUrl(payload.url, true)
    if (!url) return false
    return {
      website: websiteId,
      hostname: window.location.hostname,
      screen: payload.screen,
      language: payload.language,
      title: new URL(url).pathname,
      url,
      referrer: cleanUrl(payload.referrer, false),
    }
  }
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://analytics.positronicalabs.dev/script.js'
  script.setAttribute('data-website-id', websiteId)
  script.setAttribute('data-domains', window.location.hostname)
  script.setAttribute('data-do-not-track', 'true')
  script.setAttribute('data-exclude-hash', 'true')
  script.setAttribute('data-before-send', 'positronicaAnalyticsBeforeSend')
  document.head.appendChild(script)
})()
