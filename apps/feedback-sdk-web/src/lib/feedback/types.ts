export type FeedbackStatus = 'submitted' | 'analyzing' | 'reviewing' | 'developing' | 'released' | 'completed' | 'ignored'

export const feedbackStatusFlow: FeedbackStatus[] = ['submitted', 'reviewing', 'developing', 'completed']

export interface TimelineNode {
  status: FeedbackStatus
  title: string
  at: string
  note: string
}

export interface FeedbackItem {
  id: string
  title: string
  summary: string
  createdAt: string
  etaText: string
  status: FeedbackStatus
  timeline: TimelineNode[]
}

export interface AIUnderstanding {
  painPoint: string
  expectation: string
  scenario: string
  confidence: number
}
