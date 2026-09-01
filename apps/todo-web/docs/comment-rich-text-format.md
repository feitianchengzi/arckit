# 评论富文本格式约定

评论**统一使用 type: 'text'** 的附件接口，`content` 为 JSON：`{ text, imageKeys, fileKeys }`。  
**`text` 字段**内：**`[]` 中只写格式类型**，`()` 中写参数；评论区按类型识别并渲染。

## 格式定义

| 类型 | 语法 | 示例 | 展示 |
|------|------|------|------|
| **@ 提及** | `[name](username)` | `[name](戴鹏飞3)` | @戴鹏飞3 |
| **链接** | `[link](url)` 或 `[link](url\|显示名)` | `[link](https://www.baidu.com)`、`[link](https://www.baidu.com\|百度)` | 可点击链接，文案为 url 或「显示名」 |
| **图片** | （当前）使用 `imageKeys` 数组；（后续可）内联 `[image](ossKey)` | - | 输入框上方缩略图 |
| **文件** | （当前）使用 `fileKeys` 数组；（后续可）内联 `[file](ossKey)` | - | 输入框下方附件列表 |

## 链接的写存与展示

- **`[]` 仅类型**：链接类型固定为 `[link]`，不以链接文案当类型。
- 用户输入裸 URL（如 `www.baidu.com`）时，**提交前**转为：`[link](https://www.baidu.com)`，展示时用 URL 当文案。
- 需要自定义文案时用：`[link](url|显示名)`，显示名中不要包含 `|` 或 `)`。
- 评论区识别 `[link](url)`、`[link](url|显示名)` 后渲染为可点击链接。

## 后续可扩展

- 图片：内联 `[image](ossKey)`，`[]` 仍仅类型。
- 文件：内联 `[file](ossKey)` 或 `[file](ossKey|显示名)`。

代码中的格式与解析：`@/lib/api/endpoints/comments`（`COMMENT_RICH_TEXT_FORMAT`、`rawUrlsToLinkFormat`），展示见 `CommentItem` 内 `commentTextToSafeHtml`。
