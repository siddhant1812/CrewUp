import posthog, { isPostHogConfigured } from './posthog'

const posthogLogger = {
  info(message, attributes) {
    if (!isPostHogConfigured) return
    posthog.logger.info(message, attributes)
  },
}

export default posthogLogger
