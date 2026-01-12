package models

import (
	"encoding/json"
	"fmt"
	"strconv"
)

/*
统一错误响应设计规则
==================

1. 错误响应结构
   - 使用 ErrorResponse 结构体，包含：
     * HTTPStatus: HTTP状态码（如 400、401、404、500）
     * HandlerID: 处理器标识ID
     * MessageID: 错误消息ID
     * Message: 错误信息文本
     * Code: 自动计算（通过 MarshalJSON）

2. HandlerID 定义规则
   - 在 models/response.go 中统一管理
   - DefaultHandlerID = 0: 用于通用错误消息
   - 其他 HandlerID: 用于特定服务的错误消息

3. 错误消息ID定义规则

   3.1 通用错误消息（models/response.go）
       - 只放最常用的、通用的错误消息，所有服务共享
       - 使用通用错误消息时，HandlerID 使用 DefaultHandlerID (0)
       - 示例：ErrBadRequest、ErrUnauthorized、ErrNotFound 等

   3.2 服务内自定义错误消息（各 handler 文件）
       - 如果通用错误消息不够用，需要在各自 handler 文件中定义更细粒度的错误消息ID
       - 使用自定义错误消息时，使用对应的 HandlerID（如 UserHandlerID、ProjectHandlerID）
       - 示例场景：
         * 通用：ErrBadRequest = 1（参数错误）
         * 需要区分：没有传参数、传递参数为空、参数格式错误、参数值超出范围
         * 解决方案：在对应的 handler 文件中定义自己的错误消息ID常量

4. 使用规则

   4.1 使用通用错误消息
       c.JSON(http.StatusBadRequest, models.ErrorResponse{
           HTTPStatus: http.StatusBadRequest,
           HandlerID:  models.DefaultHandlerID,  // 使用 DefaultHandlerID
           MessageID:  models.ErrBadRequest,
           Message:    "请求参数错误: " + err.Error(),
       })

   4.2 使用服务内自定义错误消息
       // 在 handler/user.go 中定义
       const (
           UserErrParamMissing = 1  // 参数缺失
           UserErrParamEmpty   = 2  // 参数为空
       )

       // 使用时
       c.JSON(http.StatusBadRequest, models.ErrorResponse{
           HTTPStatus: http.StatusBadRequest,
           HandlerID:  models.UserHandlerID,  // 使用特定的HandlerID
           MessageID:  UserErrParamMissing,     // 使用自定义的MessageID
           Message:    "参数缺失：username 是必填项",
       })

5. Code 计算规则
   - 自动计算：HTTPStatus + HandlerID（3位补0）+ MessageID（3位补0）
   - 示例：
     * 通用错误：HTTPStatus=400, HandlerID=0, MessageID=1 → "400" + "000" + "001" → 400000001
     * 用户自定义错误：HTTPStatus=400, HandlerID=1, MessageID=1 → "400" + "001" + "001" → 400001001

6. 重要原则
   - ❌ 不要修改 models/response.go 中的通用错误消息表
   - ✅ 通用错误消息表只放最常用的、通用的错误类型
   - ✅ 需要更细粒度错误消息时，在各自 handler 文件中定义自己的错误消息ID
   - ✅ 使用自定义错误消息时，使用对应的 HandlerID（如 UserHandlerID、ProjectHandlerID）
*/

// HandlerID定义 - 所有handler的标识ID
const (
	DefaultHandlerID    = 0 // 默认处理器（用于通用错误消息）
	UserHandlerID       = 1 // 用户处理器
	ProjectHandlerID    = 2 // 项目处理器
	TaskHandlerID       = 3 // 任务处理器
	HealthHandlerID     = 4 // 健康检查处理器
	HeaderInfoHandlerID = 5 // Header信息处理器
)

// 错误消息ID定义 - 所有handler共享的通用错误消息
const (
	ErrBadRequest      = 1  // 请求参数错误
	ErrUnauthorized    = 2  // 未授权（未获取到用户信息等）
	ErrForbidden       = 3  // 无权限访问
	ErrNotFound        = 4  // 资源不存在
	ErrMissingFields   = 5  // 缺少必填字段
	ErrInvalidValue    = 6  // 无效的值（状态、角色等）
	ErrAlreadyExists   = 7  // 资源已存在
	ErrDatabaseNotInit = 8  // 数据库连接未初始化
	ErrQueryFailed     = 9  // 查询失败
	ErrCreateFailed    = 10 // 创建失败
	ErrUpdateFailed    = 11 // 更新失败
	ErrDeleteFailed    = 12 // 删除失败
)

// ErrorResponse 错误响应结构
type ErrorResponse struct {
	HTTPStatus int    `json:"http_status"` // HTTP状态码
	HandlerID  int    `json:"handler_id"`  // 处理器ID
	MessageID  int    `json:"message_id"`  // 错误消息ID
	Message    string `json:"message"`     // 错误信息
	// code字段通过MarshalJSON自动计算，不需要在结构体中定义
}

// MarshalJSON 自定义JSON序列化，自动计算Code字段
func (e ErrorResponse) MarshalJSON() ([]byte, error) {
	// 计算Code：将HTTPStatus、HandlerID、MessageID拼接成字符串后转为整数
	// HandlerID和MessageID会被格式化为3位数字（不足3位前面补0）
	// 例如：HTTPStatus=400, HandlerID=2, MessageID=1 -> "400" + "002" + "001" -> 400002001
	// 例如：HTTPStatus=400, HandlerID=12, MessageID=5 -> "400" + "012" + "005" -> 400012005
	codeStr := fmt.Sprintf("%d%03d%03d", e.HTTPStatus, e.HandlerID, e.MessageID)
	code, _ := strconv.Atoi(codeStr)

	type Alias ErrorResponse
	return json.Marshal(&struct {
		Code int `json:"code"`
		*Alias
	}{
		Code:  code,
		Alias: (*Alias)(&e),
	})
}
