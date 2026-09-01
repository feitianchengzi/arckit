# Feature Specification: 待办管理系统

**Feature Branch**: `master`  
**Created**: 2024-12-19  
**Status**: Draft  
**Input**: User description: "当前要开一新的项目，关于"待办"的网站。初步的想法有：登录/注册、创建查看项目、项目邀请成员、创建待办编辑待办、查看项目所有待办：创建人执行人内容、子待办、待办流转"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 用户注册和登录 (Priority: P1)

用户需要能够创建账户并登录系统，以便使用待办管理功能。这是所有其他功能的基础。

**Why this priority**: 用户必须能够访问系统才能使用任何功能。没有身份验证，无法区分不同用户的数据和权限。

**Independent Test**: 可以独立测试用户注册流程，验证新用户能够成功创建账户、登录系统，并访问个人工作空间。这提供了基本的系统访问能力。

**Acceptance Scenarios**:

1. **Given** 用户访问系统首页，**When** 用户点击注册并填写有效的邮箱、密码和用户名，**Then** 系统创建新账户并自动登录
2. **Given** 用户已注册账户，**When** 用户使用正确的邮箱和密码登录，**Then** 系统验证凭据并允许用户访问系统
3. **Given** 用户尝试使用错误的密码登录，**When** 用户提交登录表单，**Then** 系统显示错误提示，不允许登录
4. **Given** 用户已登录，**When** 用户点击退出，**Then** 系统清除会话并返回登录页面

---

### User Story 2 - 创建和查看项目 (Priority: P1)

用户需要能够创建项目来组织待办事项，并查看自己创建或参与的项目列表。

**Why this priority**: 项目是组织待办事项的基本容器。用户必须能够创建项目才能开始管理待办事项。

**Independent Test**: 可以独立测试项目创建功能，验证登录用户可以创建新项目、设置项目名称和描述，并在项目列表中查看该项目。这提供了基本的项目组织能力。

**Acceptance Scenarios**:

1. **Given** 用户已登录，**When** 用户点击"创建项目"并填写项目名称和描述，**Then** 系统创建项目并在项目列表中显示
2. **Given** 用户已创建多个项目，**When** 用户访问项目列表页面，**Then** 系统显示所有用户创建或参与的项目
3. **Given** 用户已创建项目，**When** 用户点击项目名称，**Then** 系统显示项目详情页面，包括项目信息和待办列表
4. **Given** 用户尝试创建没有名称的项目，**When** 用户提交创建表单，**Then** 系统显示验证错误，不允许创建

---

### User Story 3 - 创建和查看待办事项 (Priority: P1)

用户需要能够在项目中创建待办事项，并查看项目中的所有待办事项及其基本信息（创建人、执行人、内容）。

**Why this priority**: 创建和查看待办是系统的核心功能。这是用户使用系统的主要目的。

**Independent Test**: 可以独立测试待办创建功能，验证用户在项目中能够创建待办事项、设置标题和内容、指定执行人，并在待办列表中查看所有待办及其创建人、执行人信息。这提供了基本的待办管理能力。

**Acceptance Scenarios**:

1. **Given** 用户在项目详情页面，**When** 用户点击"创建待办"并填写标题、内容和执行人，**Then** 系统创建待办事项并在待办列表中显示
2. **Given** 项目中已有多个待办事项，**When** 用户查看项目待办列表，**Then** 系统显示所有待办事项，包括创建人、执行人、内容等基本信息
3. **Given** 用户创建了待办事项，**When** 用户查看待办详情，**Then** 系统显示完整的待办信息，包括创建时间、创建人、执行人、内容等
4. **Given** 用户尝试创建没有标题的待办，**When** 用户提交创建表单，**Then** 系统显示验证错误，不允许创建

---

### User Story 4 - 编辑待办事项 (Priority: P2)

用户需要能够修改已创建的待办事项，包括更新标题、内容、执行人等信息。

**Why this priority**: 待办事项的信息可能会变化，用户需要能够更新这些信息。这是基本的数据维护功能。

**Independent Test**: 可以独立测试待办编辑功能，验证用户能够修改待办事项的各个字段，保存更改后查看更新后的信息。这提供了待办信息的维护能力。

**Acceptance Scenarios**:

1. **Given** 用户已创建待办事项，**When** 用户点击编辑并修改待办内容，**Then** 系统保存更改并显示更新后的信息
2. **Given** 用户正在编辑待办事项，**When** 用户修改执行人，**Then** 系统更新执行人信息并在待办列表中显示
3. **Given** 用户尝试编辑其他用户创建的待办，**When** 用户没有编辑权限，**Then** 系统显示权限错误，不允许编辑
4. **Given** 用户正在编辑待办，**When** 用户取消编辑，**Then** 系统放弃更改并返回待办详情页面

---

### User Story 5 - 项目邀请成员 (Priority: P2)

项目创建者需要能够邀请其他用户加入项目，以便协作管理待办事项。

**Why this priority**: 协作是待办管理系统的重要功能。项目创建者需要能够邀请团队成员共同管理项目。

**Independent Test**: 可以独立测试邀请功能，验证项目创建者能够通过邮箱或用户名邀请其他用户，被邀请用户收到通知并能够加入项目。这提供了基本的协作能力。

**Acceptance Scenarios**:

1. **Given** 用户是项目创建者，**When** 用户点击"邀请成员"并输入被邀请用户的邮箱或用户名，**Then** 系统发送邀请并通知被邀请用户
2. **Given** 用户收到项目邀请，**When** 用户接受邀请，**Then** 系统将用户添加到项目成员列表，用户可以访问项目
3. **Given** 用户收到项目邀请，**When** 用户拒绝邀请，**Then** 系统记录拒绝状态，用户不加入项目
4. **Given** 项目创建者邀请不存在的用户，**When** 系统处理邀请，**Then** 系统显示错误提示，邀请失败

---

### User Story 6 - 创建和管理子待办 (Priority: P3)

用户需要能够为待办事项创建子待办，以组织更复杂的任务结构。

**Why this priority**: 子待办功能允许用户将复杂任务分解为更小的子任务，提高任务管理的灵活性。这是增强功能，不是核心MVP的一部分。

**Independent Test**: 可以独立测试子待办功能，验证用户能够为待办事项创建子待办、查看父子关系、编辑和删除子待办。这提供了层次化的任务管理能力。

**Acceptance Scenarios**:

1. **Given** 项目中已有待办事项，**When** 用户点击"创建子待办"并填写子待办信息，**Then** 系统创建子待办并显示在父待办下
2. **Given** 待办事项有多个子待办，**When** 用户查看待办详情，**Then** 系统以层次结构显示所有子待办
3. **Given** 用户创建了子待办，**When** 用户编辑子待办，**Then** 系统保存更改并更新显示
4. **Given** 用户尝试删除有子待办的父待办，**When** 系统处理删除请求，**Then** 系统提示用户先处理子待办或询问是否同时删除子待办

---

### User Story 7 - 待办流转 (Priority: P3)

用户需要能够改变待办事项的状态，实现待办在不同阶段之间的流转（如：待处理、进行中、已完成等）。

**Why this priority**: 待办流转功能允许用户跟踪任务进度，是工作流管理的重要功能。这是增强功能，可以在核心功能稳定后实现。

**Independent Test**: 可以独立测试流转功能，验证用户能够改变待办状态、查看状态历史、系统根据状态显示不同的待办列表。这提供了工作流管理能力。

**Acceptance Scenarios**:

1. **Given** 待办事项处于"待处理"状态，**When** 用户将状态改为"进行中"，**Then** 系统更新状态并在相应状态列表中显示
2. **Given** 待办事项处于"进行中"状态，**When** 用户将状态改为"已完成"，**Then** 系统更新状态并可能移动到已完成列表
3. **Given** 用户查看待办详情，**When** 用户查看状态历史，**Then** 系统显示待办状态变更的时间线和操作人
4. **Given** 用户尝试将待办流转到不允许的状态，**When** 系统验证流转规则，**Then** 系统显示错误提示，不允许流转

---

### Edge Cases

- **当用户删除项目时，项目中的所有待办事项如何处理？**  
  答：当前阶段项目还不能删除，删除计划是下一个版本。

- **当被邀请的用户账户不存在时，邀请如何处理？**  
  答：当前版本项目邀请方案是通过邀请码的方式，不存在用户不存在的情况。任何一个点击了邀请码链接的都是用户。如果当前不存在则开始登录免注册流程。当前已经实现了这套逻辑。

- **当待办事项的执行人离开项目时，待办事项如何处理？**  
  答：交付给待办创建人，并给予提醒，如果创建人也不存在了，给予项目创建人。当前版本项目不能删除，所以项目创建人不能离开。（暂未实现）

- **当用户尝试创建循环的子待办关系时（A是B的子待办，B又是A的子待办），系统如何处理？**  
  答：当前版本，应该不能创建循环子任务，因为已经创建好的任务不能通过其他方式重新选取父任务。

- **当多个用户同时编辑同一个待办事项时，如何处理冲突？**  
  答：这个看请求成功的先后顺序吧。这个按道理说只有创建人和执行人可以编辑待办事项的状态。但是当前后端任何项目的成员都可以修改，所以需要对接后端探讨下。

- **当项目成员数量达到上限时，如何处理新的邀请？**  
  答：当前未处理上限问题，也就是说不存在上限。

- **当待办事项的创建人被移除项目时，待办事项的所有权如何处理？**  
  答：应该是自动交由项目创建人。同时如果创建人本身就是项目创建人，那么任务是不能移除的吧？需要后端对接探讨。

- **当用户尝试将待办流转到已禁用的状态时，如何处理？**  
  答：[待澄清]

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create accounts with email, password, and username
- **FR-002**: System MUST authenticate users with email and password
- **FR-003**: System MUST allow authenticated users to create projects with name and description
- **FR-004**: System MUST allow users to view all projects they created or are members of
- **FR-005**: System MUST allow project creators to invite other users to join projects via invitation code links
- **FR-006**: System MUST allow users to join projects by clicking invitation code links, with automatic user creation if the user does not exist (passwordless registration flow)
- **FR-007**: System MUST allow project members to create todo items with title, content, and assignee
- **FR-008**: System MUST display all todos in a project with creator, assignee, and content information
- **FR-009**: System MUST allow users to edit todos they created or have permission to edit (ideally only creators and assignees, but current backend allows all project members)
- **FR-010**: System MUST allow users to create sub-todos under existing todos
- **FR-011**: System MUST display sub-todos in a hierarchical structure under parent todos
- **FR-011a**: System MUST prevent circular sub-todo relationships (A cannot be a sub-todo of B if B is already a sub-todo of A) by not allowing existing todos to change parent
- **FR-012**: System MUST allow users to change todo status to implement workflow transitions
- **FR-012a**: System MUST prevent users from transitioning todos to disabled/invalid states (implementation: [待澄清])
- **FR-013**: System MUST track and display todo status change history
- **FR-014**: System MUST validate that required fields (project name, todo title) are provided before creation
- **FR-015**: System MUST enforce access control so users can only access projects they created or are members of
- **FR-015a**: System MUST automatically reassign todo ownership to the todo creator when the assignee leaves the project, with notification to the creator. If the creator no longer exists, ownership transfers to the project creator
- **FR-015b**: System MUST automatically transfer todo ownership to the project creator when the todo creator is removed from the project (project creator cannot be removed and todos created by project creator cannot be removed)
- **FR-015c**: System MUST NOT impose limits on project member count (no maximum member limit)
- **FR-015d**: System MUST NOT allow project deletion in current version (planned for next version)
- **FR-016**: System MUST handle concurrent edits using last-write-wins strategy (request success order determines final state)

### Key Entities

- **User**: Represents a system user with email, username, password. Users can create projects, be invited to projects, create todos, and be assigned to todos.
- **Project**: Represents a container for todos with name, description, creator, and members. Projects have a many-to-many relationship with users through membership.
- **Todo**: Represents a task item with title, content, creator, assignee, status, and creation timestamp. Todos belong to a project and can have parent-child relationships with other todos.
- **ProjectInvitation**: Represents an invitation for a user to join a project via invitation code links, with automatic user creation for new users (passwordless registration). Contains invitation code, project, and timestamp.
- **TodoStatusHistory**: Represents a record of todo status changes with todo, previous status, new status, changed by user, and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete registration in under 2 minutes
- **SC-002**: Users can create a new project in under 1 minute
- **SC-003**: Users can create a new todo item in under 30 seconds
- **SC-004**: System displays project todo list with all required information (creator, assignee, content) in under 1 second
- **SC-005**: 90% of users successfully complete their first todo creation on first attempt
- **SC-006**: System supports at least 100 concurrent users without performance degradation
- **SC-007**: Users can invite team members and have them join projects within 5 minutes of invitation
- **SC-008**: 95% of todo status transitions complete successfully without errors

### Performance Criteria (Constitution Compliance)

- **SC-PERF-001**: UI 必须保持 60fps 流畅度
- **SC-PERF-002**: 用户交互响应时间必须 <100ms
- **SC-PERF-003**: 关键场景性能验证通过（使用 Instruments）

### User Experience Criteria (Constitution Compliance)

- **SC-UX-001**: 所有设计值从 DesignTokens 读取，无硬编码颜色/间距/字体
- **SC-UX-002**: 支持 VoiceOver 无障碍功能
- **SC-UX-003**: 支持动态字体大小

### Internationalization Criteria (Constitution Compliance)

- **SC-I18N-001**: 所有用户可见文本必须支持国际化
- **SC-I18N-002**: 至少支持中文和英文两种语言
- **SC-I18N-003**: UI 布局适应不同语言的文本长度变化
- **SC-I18N-004**: 语言切换功能正常工作

## Assumptions

- Users will primarily access the system via web browsers
- Email addresses are used as unique identifiers for user accounts
- Project creators have full administrative rights over their projects and cannot be removed from projects
- Projects cannot be deleted in the current version (planned for next version)
- Todo assignees can be any project member
- When a todo assignee leaves a project, ownership automatically transfers to the todo creator with notification
- When a todo creator is removed from a project (except project creator), ownership automatically transfers to the project creator
- Project member count has no maximum limit
- Default todo statuses include: "待处理" (Pending), "进行中" (In Progress), "已完成" (Completed)
- System will use standard session-based authentication
- Project invitations use invitation code links that enable passwordless registration for new users
- Users can be members of multiple projects simultaneously
- Todos can have unlimited levels of nesting (sub-todos can have their own sub-todos)
- System will support real-time updates for collaborative editing [NEEDS CLARIFICATION: real-time collaboration requirement not specified - needed for conflict resolution?]

## Dependencies

- User authentication and session management system
- Email service for sending invitation notifications
- Database for persisting users, projects, todos, and relationships
- Access control and permission management system

## Clarifications

### Session 2024-12-19

- Q: 当用户删除项目时，项目中的所有待办事项如何处理？ → A: 当前阶段项目还不能删除，删除计划是下一个版本。
- Q: 当被邀请的用户账户不存在时，邀请如何处理？ → A: 当前版本项目邀请方案是通过邀请码的方式，不存在用户不存在的情况。任何一个点击了邀请码链接的都是用户。如果当前不存在则开始登录免注册流程。当前已经实现了这套逻辑。
- Q: 当待办事项的执行人离开项目时，待办事项如何处理？ → A: 交付给待办创建人，并给予提醒，如果创建人也不存在了，给予项目创建人。当前版本项目不能删除，所以项目创建人不能离开。（暂未实现）
- Q: 当用户尝试创建循环的子待办关系时（A是B的子待办，B又是A的子待办），系统如何处理？ → A: 当前版本，应该不能创建循环子任务，因为已经创建好的任务不能通过其他方式重新选取父任务。
- Q: 当多个用户同时编辑同一个待办事项时，如何处理冲突？ → A: 这个看请求成功的先后顺序吧。这个按道理说只有创建人和执行人可以编辑待办事项的状态。但是当前后端任何项目的成员都可以修改，所以需要对接后端探讨下。
- Q: 当项目成员数量达到上限时，如何处理新的邀请？ → A: 当前未处理上限问题，也就是说不存在上限。
- Q: 当待办事项的创建人被移除项目时，待办事项的所有权如何处理？ → A: 应该是自动交由项目创建人。同时如果创建人本身就是项目创建人，那么任务是不能移除的吧？需要后端对接探讨。

## Out of Scope

- Mobile native applications (web-only for initial version)
- File attachments for todos
- Todo comments and discussions
- Todo due dates and reminders
- Todo tags and categories
- Project templates
- Advanced reporting and analytics
- Integration with external task management tools
- Email notifications for todo assignments and status changes (beyond invitation emails)
