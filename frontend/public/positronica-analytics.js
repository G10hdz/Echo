(() => {
  const websites = {
  "bio.positronicalabs.dev": "6f67d564-2bcf-4b5e-9852-b835b629a204",
  "positronica-bio.netlify.app": "6f67d564-2bcf-4b5e-9852-b835b629a204",
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
  if (!websiteId) return

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

  if (!window.positronicaAnalyticsLoaded) {
    window.positronicaAnalyticsLoaded = true
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
  }


  if (window.positronicaPosthogLoaded) return
  window.positronicaPosthogLoaded = true

  // Queue calls using PostHog's snippet format until the official SDK loads.
  if (!window.posthog?.__SV && !window.posthog?.__loaded) {
    const posthog = window.posthog || []
    window.posthog = posthog
    posthog._i = []
    posthog.init = (token, options, name = 'posthog') => {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.crossOrigin = 'anonymous'
      script.async = true
      script.src = options.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js'
      const first = document.getElementsByTagName('script')[0]
      first.parentNode.insertBefore(script, first)
      const instance = name === 'posthog' ? posthog : (posthog[name] = [])
      instance.people = instance.people || []
      Object.defineProperty(instance, 'toString', {
        configurable: true, enumerable: true, writable: true,
        value: (plain) => 'posthog' + (name === 'posthog' ? '' : '.' + name) + (plain ? '' : ' (stub)'),
      })
      Object.defineProperty(instance.people, 'toString', {
        configurable: true, enumerable: true, writable: true,
        value: () => instance.toString(true) + '.people (stub)',
      })
      const methods = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'
      for (const method of methods.split(' ')) {
        const [parent, child] = method.split('.')
        const target = child ? instance[parent] : instance
        const methodName = child || parent
        target[methodName] = (...args) => target.push([methodName, ...args])
      }
      posthog._i.push([token, options, name])
    }
    posthog.__SV = 1
  }
  window.posthog.init('phc_kN8chV8Bfvbh2fAqbQEDnMQkhf3H64y9J9xmwEjufoEN', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'never',
    persistence: 'memory',
    disable_persistence: true,
    respect_dnt: true,
    autocapture: false,
    capture_pageview: 'history_change',
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    before_send(event) {
      if (event.event !== '$pageview') return null
      const input = event.properties || {}
      const url = cleanUrl(input.$current_url, true)
      if (!url) return null
      const properties = {}
      for (const key of [
        'token', 'distinct_id', '$device_id', '$session_id', '$window_id',
        '$lib', '$lib_version', '$browser', '$browser_version', '$os', '$os_version',
        '$device_type', '$screen_width', '$screen_height', '$viewport_width', '$viewport_height',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      ]) {
        if (['string', 'number', 'boolean'].includes(typeof input[key])) properties[key] = input[key]
      }
      const parsed = new URL(url)
      properties.$current_url = url
      properties.$pathname = parsed.pathname
      properties.$host = parsed.hostname
      properties.$referrer = cleanUrl(input.$referrer, false)
      properties.$referring_domain = properties.$referrer ? new URL(properties.$referrer).hostname : ''
      properties.$process_person_profile = false
      properties.site = window.location.hostname
      return { event: event.event, properties, timestamp: event.timestamp, uuid: event.uuid }
    },
  })
})()
