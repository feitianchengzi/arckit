package response

// ErrorDetail 错误详情
type ErrorDetail struct {
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// ErrorResponse 错误响应结构
type ErrorResponse struct {
	Code  string      `json:"code"`
	Error ErrorDetail `json:"error"`
}

// NewErrorResponse 创建错误响应
func NewErrorResponse(code, message string, details interface{}) ErrorResponse {
	return ErrorResponse{
		Code: code,
		Error: ErrorDetail{
			Message: message,
			Details: details,
		},
	}
}

// Meta 分页元数据
type Meta struct {
	Page     int `json:"page,omitempty"`
	PageSize int `json:"page_size,omitempty"`
	Total    int `json:"total,omitempty"`
}

// SuccessResponse 成功响应结构
type SuccessResponse struct {
	Code string      `json:"code"`
	Data interface{} `json:"data"`
	Meta *Meta       `json:"meta,omitempty"`
}

// NewSuccessResponse 创建成功响应
func NewSuccessResponse(data interface{}) SuccessResponse {
	return SuccessResponse{
		Code: "OK",
		Data: data,
		Meta: nil,
	}
}

// NewSuccessResponseWithMeta 创建带分页元数据的成功响应
func NewSuccessResponseWithMeta(data interface{}, meta Meta) SuccessResponse {
	return SuccessResponse{
		Code: "OK",
		Data: data,
		Meta: &meta,
	}
}

// 错误代码常量定义
const (
	// 通用错误
	CodeBadRequest    = "BAD_REQUEST"
	CodeUnauthorized  = "UNAUTHORIZED"
	CodeForbidden     = "FORBIDDEN"
	CodeNotFound      = "NOT_FOUND"
	CodeInternalError = "INTERNAL_ERROR"

	// 用户相关错误
	CodeUserNotFound      = "USER_NOT_FOUND"
	CodeUserCreateFailed  = "USER_CREATE_FAILED"
	CodeUserUpdateFailed  = "USER_UPDATE_FAILED"
	CodeUserQueryFailed   = "USER_QUERY_FAILED"
	CodeUserMissingFields = "USER_MISSING_FIELDS"

	// 项目相关错误
	CodeProjectNotFound      = "PROJECT_NOT_FOUND"
	CodeProjectCreateFailed  = "PROJECT_CREATE_FAILED"
	CodeProjectUpdateFailed  = "PROJECT_UPDATE_FAILED"
	CodeProjectQueryFailed   = "PROJECT_QUERY_FAILED"
	CodeProjectNotMember     = "PROJECT_NOT_MEMBER"
	CodeProjectNoPermission  = "PROJECT_NO_PERMISSION"
	CodeProjectIDEmpty       = "PROJECT_ID_EMPTY"
	CodeProjectInviteInvalid = "PROJECT_INVITE_INVALID"
	CodeProjectInviteUsed    = "PROJECT_INVITE_USED"
	CodeProjectInviteExpired = "PROJECT_INVITE_EXPIRED"
	CodeProjectAlreadyMember = "PROJECT_ALREADY_MEMBER"

	// 任务相关错误
	CodeTaskNotFound              = "TASK_NOT_FOUND"
	CodeTaskCreateFailed          = "TASK_CREATE_FAILED"
	CodeTaskUpdateFailed          = "TASK_UPDATE_FAILED"
	CodeTaskDeleteFailed          = "TASK_DELETE_FAILED"
	CodeTaskQueryFailed           = "TASK_QUERY_FAILED"
	CodeTaskIDEmpty               = "TASK_ID_EMPTY"
	CodeTaskNotMember             = "TASK_NOT_MEMBER"
	CodeTaskNoPermission          = "TASK_NO_PERMISSION"
	CodeTaskInvalidState          = "TASK_INVALID_STATE"
	CodeTaskParentNotFound        = "TASK_PARENT_NOT_FOUND"
	CodeTaskParentMustSameProject = "TASK_PARENT_MUST_SAME_PROJECT"
	CodeTaskCannotBeOwnParent     = "TASK_CANNOT_BE_OWN_PARENT"
	CodeTaskCircularReference     = "TASK_CIRCULAR_REFERENCE"
	CodeTaskExecutorNotMember     = "TASK_EXECUTOR_NOT_MEMBER"

	// 标签相关错误
	CodeTagNotFound     = "TAG_NOT_FOUND"
	CodeTagCreateFailed = "TAG_CREATE_FAILED"
	CodeTagUpdateFailed = "TAG_UPDATE_FAILED"
	CodeTagDeleteFailed = "TAG_DELETE_FAILED"
	CodeTagQueryFailed  = "TAG_QUERY_FAILED"
	CodeTagNotMember    = "TAG_NOT_MEMBER"

	// 数据库相关错误
	CodeDatabaseNotInit = "DATABASE_NOT_INIT"
)
