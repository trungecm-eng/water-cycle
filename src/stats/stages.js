import { content } from '../content.js';

export function activeStages(counts) {
  return Object.entries(content.stages).filter(([state]) => counts[state] > 0).map(([, label]) => label);
}
