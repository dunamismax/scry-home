import { Mastra } from '@mastra/core'

export { orchestrationProfile } from './profile'

export const mastraRuntime = new Mastra({
  agents: {},
  workflows: {},
})
