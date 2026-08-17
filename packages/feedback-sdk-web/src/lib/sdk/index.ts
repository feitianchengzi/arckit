export {
  initializeFeedbackSDK,
  configureFeedbackSDK,
  setFeedbackSDKApiKey,
  setFeedbackSDKProjectId,
  setFeedbackSDKCustomUserId,
  setFeedbackSDKSessionToken,
  setFeedbackSDKTheme,
  getFeedbackSDKConfig,
  getFeedbackSDKV2AuthMode,
  isFeedbackSDKV2Enabled,
  isFeedbackSDKV2NotificationsEnabled,
} from './config'

export type { FeedbackSDKConfig, FeedbackSDKV2AuthMode } from './config'
export type { FeedbackSDKTheme } from './theme'

export {
  installFeedbackSDKBridge,
  FEEDBACK_SDK_CONFIGURED_EVENT,
  FEEDBACK_SDK_NATIVE_IMAGE_EVENT,
  FEEDBACK_SDK_UNREAD_CHANGED_EVENT,
  getFeedbackSDKUnreadCount,
  notifyFeedbackSDKUnreadCount,
} from './bridge'
export type { FeedbackSDKBridge, FeedbackSDKNativeImagePayload } from './bridge'
