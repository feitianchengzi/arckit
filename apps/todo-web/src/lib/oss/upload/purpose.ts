/**
 * OSS 上传业务意图（与物理路径解耦）
 * 评论类资源统一挂在 attachments 下：attachments/comment/image、attachments/comment/file
 */

export enum OssUploadPurpose {
  AVATAR = 'AVATAR',
  COMMENT_IMAGE = 'COMMENT_IMAGE',
  COMMENT_FILE = 'COMMENT_FILE',
  DOCUMENTS = 'DOCUMENTS',
  OTHERS = 'OTHERS',
}

/** Purpose → 传给 uploadToOSS 的 directory 字符串（评论挂在 attachments 下） */
export const PURPOSE_TO_DIR: Record<OssUploadPurpose, string> = {
  [OssUploadPurpose.AVATAR]: 'avatars',
  [OssUploadPurpose.COMMENT_IMAGE]: 'attachments/comment/image',
  [OssUploadPurpose.COMMENT_FILE]: 'attachments/comment/file',
  [OssUploadPurpose.DOCUMENTS]: 'documents',
  [OssUploadPurpose.OTHERS]: 'attachments',
}
