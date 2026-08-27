const PROJECT_ROLES = new Set(["owner", "admin", "member"]);
const TASK_STATES = ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"];
const PAGE_SIZE = 200;

export function createWorkshopPlatformAdapter({
  request,
  requestV2,
  listProjects,
  normalizeTask,
  feedbackV2ProjectIds = "*",
  feedbackV2NotificationProjectIds = "*",
  uploadWithPolicy,
  signAttachmentUrl,
  uploadTaskResource,
  signTaskResourceUrl
}) {
  if (typeof request !== "function" || typeof listProjects !== "function" || typeof normalizeTask !== "function") {
    throw new TypeError("Workshop platform adapter requires bounded request, project, and task functions.");
  }

  const v2Projects = projectMatcher(feedbackV2ProjectIds);
  const v2NotificationProjects = projectMatcher(feedbackV2NotificationProjectIds);
  const v2Request = typeof requestV2 === "function" ? requestV2 : unavailableFeedbackV2;

  return {
    isFeedbackV2ProjectEnabled(projectId) {
      return v2Projects(requiredId(projectId, "Project"));
    },

    isFeedbackV2NotificationsProjectEnabled(projectId) {
      const id = requiredId(projectId, "Project");
      return v2Projects(id) && v2NotificationProjects(id);
    },

    async listOrganizations() {
      return listAllPages(request, "/organizations", {}, ["organizations", "items"], normalizeOrganization);
    },

    async listOrganizationMembers(organizationId) {
      const id = requiredId(organizationId, "Organization");
      return listAllPages(
        request,
        `/organizations/${encodeURIComponent(id)}/members`,
        {},
        ["members", "items"],
        (member) => normalizeMember(member, { organizationId: id })
      );
    },

    async listProjects() {
      return listProjects();
    },

    async listOrganizationProjects(organizationId, { visibility = "participating_projects" } = {}) {
      const id = requiredId(organizationId, "Organization");
      const path = visibility === "all_projects" ? "/organization/projects" : "/projects";
      return listAllPages(
        request,
        path,
        { organization_id: id },
        ["projects", "items"],
        (project) => normalizePlatformProject(project, id)
      );
    },

    async listPersonalProjects() {
      return listAllPages(
        request,
        "/projects",
        { organization_id: 0 },
        ["projects", "items"],
        (project) => normalizePlatformProject(project)
      );
    },

    async listProjectMembers(projectId) {
      const id = requiredId(projectId, "Project");
      const projects = await listProjects();
      const project = projects.find((item) => String(item.id) === id);
      if (!project) return [];
      const members = Array.isArray(project.raw?.members) ? project.raw.members : [];
      return members.map((member) => normalizeMember(member, { projectId: id })).filter(Boolean);
    },

    async listProjectTasks(projectId, filters = {}) {
      const id = requiredId(projectId, "Project");
      const query = taskQuery(id, filters);
      return listAllPages(request, "/tasks", query, ["tasks", "items"], (task) => normalizeTask(task, id));
    },

    async listProjectTaskTree(projectId, filters = {}) {
      const id = requiredId(projectId, "Project");
      const query = taskQuery(id, filters, { tree: true });
      const payload = await request("/tasks/tree", { query });
      const roots = extractList(payload, ["tasks", "items"])
        .map((task) => normalizeTaskTree(task, id, normalizeTask))
        .filter(Boolean);
      const flattened = flattenTaskTree(roots);
      const serviceMatchedTotal = paginationTotal(payload);
      return {
        tasks: roots,
        flattened,
        total: finiteCount(payload?.expanded_total ?? payload?.tree_total, flattened.length),
        matched_total: finiteCount(payload?.matched_total ?? payload?.matched_count, Number.isFinite(serviceMatchedTotal) ? serviceMatchedTotal : flattened.filter((task) => task.tree_matched !== false).length)
      };
    },

    async listFeedbackV1(projectId, filters = {}) {
      const id = requiredId(projectId, "Project");
      const query = { project_id: id };
      if (filters.short_id) query.short_id = String(filters.short_id).trim().slice(0, 100);
      if (filters.custom_user_id) query.custom_user_id = String(filters.custom_user_id).trim().slice(0, 200);
      return listAllPages(request, "/feedbacks", query, ["feedbacks", "items"], (feedback) => normalizeFeedbackV1(feedback, id));
    },

    async listFeedbackV2(projectId, filters = {}) {
      const id = enabledV2Project(projectId, v2Projects);
      const query = { project_id: id };
      if (filters.short_id) query.short_id = String(filters.short_id).trim().slice(0, 100);
      if (filters.custom_user_id) query.custom_user_id = String(filters.custom_user_id).trim().slice(0, 200);
      return listAllPages(v2Request, "/feedbacks", query, ["feedbacks", "items"], (feedback) => normalizeFeedbackV2(feedback, id));
    },

    async listFeedbackV2Messages(projectId, feedbackId) {
      enabledV2Project(projectId, v2Projects);
      const id = requiredId(feedbackId, "Feedback");
      return listAllPages(v2Request, `/feedbacks/${encodeURIComponent(id)}/messages`, {}, ["messages", "items"], normalizeFeedbackV2Message, 100);
    },

    async listFeedbackV2Notifications(projectId, input = {}) {
      const id = enabledV2Project(projectId, v2Projects);
      if (!v2NotificationProjects(id)) return { notifications: [], unread_count: 0, available: false };
      const payload = await v2Request("/feedback-notifications", {
        query: compact({
          project_id: numericId(id, "Project"),
          feedback_id: optionalNumericId(input.feedback_id, "Feedback"),
          unread_only: input.unread_only === undefined ? undefined : Boolean(input.unread_only),
          page: 1,
          page_size: 100
        })
      });
      const result = payload && typeof payload === "object" ? payload : {};
      const notifications = extractList(result, ["notifications", "items"]).map(normalizeFeedbackV2Notification).filter(Boolean);
      return { notifications, unread_count: boundedInteger(result.unread_count, 0, Number.MAX_SAFE_INTEGER, 0), available: true };
    },

    async markFeedbackV2NotificationsRead(projectId, input = {}) {
      const id = enabledV2Project(projectId, v2Projects);
      if (!v2NotificationProjects(id)) throw feedbackV2Unavailable("Feedback V2 notifications are not enabled for this project.");
      const payload = await v2Request("/feedback-notifications/read", {
        method: "POST",
        body: compact({
          project_id: numericId(id, "Project"),
          feedback_id: optionalNumericId(input.feedback_id, "Feedback"),
          notification_ids: optionalNumericIds(input.notification_ids, "Notification")
        })
      });
      return { marked_count: boundedInteger(payload?.marked_count, 0, Number.MAX_SAFE_INTEGER, 0) };
    },

    async createFeedbackV2DeveloperMessage(projectId, input = {}) {
      enabledV2Project(projectId, v2Projects);
      const feedbackId = requiredId(input.feedback_id, "Feedback");
      const attachments = normalizeOutgoingFeedbackAttachments(input.attachments);
      const content = optionalText(input.content, 10000);
      if (!content && attachments.length === 0) throw new TypeError("Feedback reply requires text or an attachment.");
      const payload = await v2Request(`/feedbacks/${encodeURIComponent(feedbackId)}/messages`, {
        method: "POST",
        body: { content, metadata: { source: "arcorbit-workset-feedback" }, attachments }
      });
      return normalizeFeedbackV2Message(payload?.message ?? payload);
    },

    async uploadFeedbackV2DeveloperAttachment(projectId, input = {}) {
      enabledV2Project(projectId, v2Projects);
      if (typeof uploadWithPolicy !== "function") throw feedbackV2Unavailable("Feedback attachment upload is unavailable.");
      const feedbackId = requiredId(input.feedback_id, "Feedback");
      const file = normalizeUploadFile(input.file);
      const type = file.mime_type.startsWith("image/") ? "image" : "file";
      const policy = await v2Request(`/feedbacks/${encodeURIComponent(feedbackId)}/upload-policies`, {
        method: "POST",
        body: { type, file_name: file.file_name, mime_type: file.mime_type, size: file.size }
      });
      if (!policy?.object_key || !policy?.upload_url || !policy?.fields) throw new Error("Feedback upload policy is incomplete.");
      await uploadWithPolicy(policy, file);
      return { type, object_key: String(policy.object_key), file_name: file.file_name, mime_type: file.mime_type, size: file.size };
    },

    async getFeedbackV2AttachmentUrl(projectId, input = {}) {
      enabledV2Project(projectId, v2Projects);
      if (typeof signAttachmentUrl !== "function") throw feedbackV2Unavailable("Feedback attachment access is unavailable.");
      const feedbackId = requiredId(input.feedback_id, "Feedback");
      const attachmentId = requiredId(input.attachment_id, "Attachment");
      const objectKey = requiredText(input.object_key, "Attachment object key", 2000).replace(/^\/+/, "");
      const credentials = await v2Request(`/feedbacks/${encodeURIComponent(feedbackId)}/attachments/${encodeURIComponent(attachmentId)}/oss/credentials`);
      return signAttachmentUrl({ objectKey, credentials });
    },

    async ignoreFeedbackV2(projectId, feedbackId) {
      enabledV2Project(projectId, v2Projects);
      const id = requiredId(feedbackId, "Feedback");
      const payload = await v2Request(`/feedbacks/${encodeURIComponent(id)}/ignore`, { method: "POST" });
      return normalizeFeedbackV2(payload?.feedback ?? payload, projectId);
    },

    async restoreFeedbackV2(projectId, feedbackId) {
      enabledV2Project(projectId, v2Projects);
      const id = requiredId(feedbackId, "Feedback");
      const payload = await v2Request(`/feedbacks/${encodeURIComponent(id)}/restore`, { method: "POST" });
      return normalizeFeedbackV2(payload?.feedback ?? payload, projectId);
    },

    async updateFeedbackV2(projectId, feedbackId, input = {}) {
      enabledV2Project(projectId, v2Projects);
      const id = requiredId(feedbackId, "Feedback");
      const payload = await v2Request(`/feedbacks/${encodeURIComponent(id)}`, { method: "PUT", body: feedbackBody(input, { creating: false }) });
      return normalizeFeedbackV2(payload?.feedback ?? payload, projectId);
    },

    async deleteFeedbackV2(projectId, feedbackId) {
      enabledV2Project(projectId, v2Projects);
      return v2Request(`/feedbacks/${encodeURIComponent(requiredId(feedbackId, "Feedback"))}`, { method: "DELETE" });
    },

    async convertFeedbackV2ToTask(projectId, input = {}) {
      enabledV2Project(projectId, v2Projects);
      const feedbackId = requiredId(input.feedback_id, "Feedback");
      return v2Request(`/feedbacks/${encodeURIComponent(feedbackId)}/convert-to-task`, {
        method: "POST",
        body: compact({
          content: optionalProvidedText(input, "content", 10000),
          state: input.state === undefined ? undefined : taskState(input.state),
          executor_id: optionalNumericId(input.executor_id, "Executor"),
          father_id: optionalNumericId(input.father_id, "Parent task"),
          priority: optionalProvidedNumber(input, "priority", 0, 100000),
          tags: optionalProvidedText(input, "tags", 1000)
        })
      });
    },

    async listProjectTags(projectId) {
      const id = requiredId(projectId, "Project");
      return listAllPages(request, `/projects/${encodeURIComponent(id)}/tags`, {}, ["tags", "items"], (tag) => normalizeTag(tag, id));
    },

    async listTaskAttachments(taskId) {
      const id = requiredId(taskId, "Task");
      return listAllPages(request, "/tasks/attachments", { task_id: id }, ["attachments", "items"], normalizeAttachment);
    },

    async uploadTaskAttachmentResource(input = {}) {
      if (typeof uploadTaskResource !== "function") throw new Error("TaskAttachment resource upload is unavailable.");
      const credentials = await request("/oss/credentials");
      return uploadTaskResource({ credentials, kind: input.kind, file: input.file });
    },

    async getTaskAttachmentResourceUrl(objectKey, { download = false } = {}) {
      if (typeof signTaskResourceUrl !== "function") throw new Error("TaskAttachment resource access is unavailable.");
      const credentials = await request("/oss/credentials");
      return signTaskResourceUrl({ objectKey, credentials, download: Boolean(download) });
    },

    createOrganization(input = {}) {
      return request("/organizations", { method: "POST", body: { name: requiredText(input.name, "Organization name", 120), description: optionalText(input.description, 1000) } });
    },
    updateOrganization(organizationId, input = {}) {
      return request(`/organizations/${encodeURIComponent(requiredId(organizationId, "Organization"))}`, { method: "PUT", body: compact({ name: optionalProvidedText(input, "name", 120), description: optionalProvidedText(input, "description", 1000) }) });
    },
    deleteOrganization(organizationId) {
      return request(`/organizations/${encodeURIComponent(requiredId(organizationId, "Organization"))}`, { method: "DELETE" });
    },
    inviteOrganizationMember(organizationId, input = {}) {
      return request(`/organizations/${encodeURIComponent(requiredId(organizationId, "Organization"))}/invitations`, { method: "POST", body: inviteBody(input) });
    },
    joinOrganization(input = {}) {
      return request("/organizations/join", { method: "POST", body: { invite_code: requiredText(input.invite_code, "Invitation code", 200) } });
    },
    updateOrganizationMemberRole(organizationId, input = {}) {
      return request(`/organizations/${encodeURIComponent(requiredId(organizationId, "Organization"))}/members/role`, { method: "PUT", body: { target_user_id: numericId(input.target_user_id, "Target user"), role: memberRole(input.role, false) } });
    },
    deleteOrganizationMember(organizationId, input = {}) {
      return request(`/organizations/${encodeURIComponent(requiredId(organizationId, "Organization"))}/members`, { method: "DELETE", body: { target_user_id: numericId(input.target_user_id, "Target user") } });
    },

    createProject(input = {}) {
      return request("/projects", { method: "POST", body: compact({ name: requiredText(input.name, "Project name", 120), git_url: optionalText(input.git_url, 1000), organization_id: optionalNumericId(input.organization_id, "Organization") }) });
    },
    updateProject(projectId, input = {}) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}`, { method: "PUT", body: compact({ name: optionalProvidedText(input, "name", 120), git_url: optionalProvidedText(input, "git_url", 1000) }) });
    },
    deleteProject(projectId) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}`, { method: "DELETE" });
    },
    inviteProjectMember(projectId, input = {}) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}/invitations`, { method: "POST", body: inviteBody(input) });
    },
    joinProject(input = {}) {
      return request("/projects/join", { method: "POST", body: { invite_code: requiredText(input.invite_code, "Invitation code", 200) } });
    },
    updateProjectMember(projectId, input = {}) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}/members/role`, { method: "PUT", body: compact({ target_user_id: numericId(input.target_user_id, "Target user"), role: input.role === undefined ? undefined : memberRole(input.role, false), duty: input.duty === undefined ? undefined : optionalText(input.duty, 500) }) });
    },
    deleteProjectMember(projectId, input = {}) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}/members`, { method: "DELETE", body: { target_user_id: numericId(input.target_user_id, "Target user") } });
    },

    createTask(input = {}) {
      return request("/tasks", { method: "POST", body: taskBody(input, { creating: true }) });
    },
    updateTask(taskId, input = {}) {
      return request(`/tasks/${encodeURIComponent(requiredId(taskId, "Task"))}`, { method: "PUT", body: taskBody(input, { creating: false }) });
    },
    deleteTask(taskId) {
      return request(`/tasks/${encodeURIComponent(requiredId(taskId, "Task"))}`, { method: "DELETE" });
    },
    createTaskAttachment(input = {}) {
      const type = ["text", "file", "url"].includes(input.type) ? input.type : "text";
      return request("/tasks/attachments", { method: "POST", body: { task_id: numericId(input.task_id, "Task"), type, content: requiredText(input.content, "Attachment content", 10000) } });
    },
    updateTaskAttachment(attachmentId, input = {}) {
      return request(`/tasks/attachments/${encodeURIComponent(requiredId(attachmentId, "Attachment"))}`, { method: "PUT", body: { content: requiredText(input.content, "Attachment content", 10000) } });
    },
    deleteTaskAttachment(attachmentId) {
      return request(`/tasks/attachments/${encodeURIComponent(requiredId(attachmentId, "Attachment"))}`, { method: "DELETE" });
    },
    createTag(projectId, input = {}) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}/tags`, { method: "POST", body: { project_id: numericId(projectId, "Project"), name: requiredText(input.name, "Tag name", 120) } });
    },
    updateTag(tagId, input = {}) {
      return request(`/tags/${encodeURIComponent(requiredId(tagId, "Tag"))}`, { method: "PUT", body: { name: requiredText(input.name, "Tag name", 120) } });
    },
    deleteTag(tagId) {
      return request(`/tags/${encodeURIComponent(requiredId(tagId, "Tag"))}`, { method: "DELETE" });
    },

    createFeedbackV1(input = {}) {
      return request("/feedbacks", { method: "POST", body: feedbackBody(input, { creating: true }) });
    },
    updateFeedbackV1(feedbackId, input = {}) {
      return request(`/feedbacks/${encodeURIComponent(requiredId(feedbackId, "Feedback"))}`, { method: "PUT", body: feedbackBody(input, { creating: false }) });
    },
    deleteFeedbackV1(feedbackId) {
      return request(`/feedbacks/${encodeURIComponent(requiredId(feedbackId, "Feedback"))}`, { method: "DELETE" });
    }
  };
}

export function normalizeOrganization(value) {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id ?? value.organization_id);
  if (!id) return null;
  return {
    id,
    name: String(value.name || `Organization ${id}`).trim(),
    description: String(value.description || "").trim(),
    creator_id: scalarId(value.creator_id),
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || ""),
    raw: value
  };
}

export function normalizeMember(value, { organizationId = "", projectId = "" } = {}) {
  if (!value || typeof value !== "object") return null;
  const userId = scalarId(value.user_id ?? value.user?.id);
  const id = scalarId(value.id ?? value.member_id) || userId;
  if (!id || !userId) return null;
  const role = PROJECT_ROLES.has(value.role) ? value.role : "member";
  return {
    id,
    user_id: userId,
    organization_id: scalarId(value.organization_id) || String(organizationId),
    project_id: scalarId(value.project_id) || String(projectId),
    username: String(value.username ?? value.user?.username ?? value.user?.name ?? "").trim(),
    avatar: String(value.avatar ?? value.user?.avatar ?? ""),
    role,
    duty: String(value.duty || ""),
    is_external: Boolean(value.is_external),
    is_me: Boolean(value.is_me),
    created_at: String(value.created_at || "")
  };
}

export function normalizePlatformProject(value, fallbackOrganizationId = "") {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id ?? value.project_id);
  if (!id) return null;
  const organizationId = scalarId(value.organization_id) || String(fallbackOrganizationId || "");
  const rawMembers = Array.isArray(value.members) ? value.members : [];
  return {
    id,
    name: String(value.name || `Project ${id}`).trim(),
    description: String(value.description || "").trim(),
    organization_id: organizationId,
    git_url: String(value.git_url || "").trim(),
    creator_id: scalarId(value.creator_id),
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || ""),
    members: rawMembers.map((member) => normalizeMember(member, { projectId: id })).filter(Boolean),
    raw: { ...value, ...(organizationId ? { organization_id: organizationId } : {}) }
  };
}

export function normalizeFeedbackV1(value, fallbackProjectId = "") {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id ?? value.feedback_id);
  const projectId = scalarId(value.project_id) || String(fallbackProjectId);
  if (!id || !projectId) return null;
  const metadata = parseFeedbackData(value.data);
  const linkedTaskId = scalarId(value.task_id) || scalarId(metadata.task_id) || scalarId(metadata.converted_task_id);
  const processingState = normalizeFeedbackProcessingState(value, metadata, linkedTaskId);
  return {
    id,
    project_id: projectId,
    short_id: String(value.short_id || ""),
    title: String(value.title || "").trim(),
    content: String(value.content || "").trim(),
    custom_user_id: String(value.custom_user_id || ""),
    user_phone: String(value.user_phone || ""),
    user_email: String(value.user_email || ""),
    file: String(value.file || ""),
    data: String(value.data || ""),
    metadata,
    priority: normalizeFeedbackPriority(metadata),
    ignored: metadata.ignored === true || processingState === "ignored",
    processing_state: processingState,
    triage_status: normalizeFeedbackTriageStatus(value.triage_status),
    linked_task_id: linkedTaskId,
    linked_task_state: String(value.task_state || metadata.task_state || ""),
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || "")
  };
}

export function normalizeFeedbackV2(value, fallbackProjectId = "") {
  const normalized = normalizeFeedbackV1(value, fallbackProjectId);
  if (!normalized) return null;
  const triageStatus = normalizeFeedbackTriageStatus(value.triage_status);
  const customerStatus = String(value.customer_status || "").trim().toLowerCase();
  return {
    ...normalized,
    feedback_source: "v2",
    triage_status: triageStatus,
    customer_status: ["submitted", "reviewing", "developing", "released", "completed", "ignored"].includes(customerStatus) ? customerStatus : "",
    ignored: normalized.ignored || triageStatus === "ignored"
  };
}

export function normalizeFeedbackV2Message(value) {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id ?? value.message_id);
  const feedbackId = scalarId(value.feedback_id);
  if (!id || !feedbackId) return null;
  const senderType = ["customer", "developer", "system"].includes(value.sender_type) ? value.sender_type : "system";
  return {
    id,
    feedback_id: feedbackId,
    project_id: scalarId(value.project_id),
    sender_type: senderType,
    message_type: String(value.message_type || "text"),
    content: String(value.content || ""),
    attachments: Array.isArray(value.attachments) ? value.attachments.map(normalizeFeedbackV2Attachment).filter(Boolean) : [],
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || "")
  };
}

function normalizeFeedbackV2Attachment(value) {
  if (!value || typeof value !== "object") return null;
  const type = ["image", "file", "url"].includes(value.type) ? value.type : "file";
  return {
    id: scalarId(value.id),
    type,
    object_key: String(value.object_key || ""),
    file_name: String(value.file_name || "").slice(0, 500),
    mime_type: String(value.mime_type || "").slice(0, 200),
    size: boundedInteger(value.size, 0, 100 * 1024 * 1024, 0)
  };
}

function normalizeFeedbackV2Notification(value) {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id);
  const feedbackId = scalarId(value.feedback_id);
  if (!id || !feedbackId) return null;
  return {
    id,
    project_id: scalarId(value.project_id),
    feedback_id: feedbackId,
    feedback_short_id: String(value.feedback_short_id || ""),
    feedback_title: String(value.feedback_title || ""),
    message_preview: String(value.message_preview || "").slice(0, 500),
    sender_type: ["customer", "developer", "system"].includes(value.sender_type) ? value.sender_type : "system",
    type: String(value.type || ""),
    created_at: String(value.created_at || ""),
    read_at: String(value.read_at || "")
  };
}

function normalizeFeedbackPriority(metadata) {
  const rawValue = metadata.priority ?? metadata.ai_priority ?? metadata.priority_level;
  const text = String(rawValue ?? "").trim();
  const named = text.toUpperCase();
  if (["P1", "P2", "P3"].includes(named)) return named;
  if (text) {
    const numeric = Number(text);
    if (Number.isFinite(numeric)) {
      if (numeric <= 1) return "P1";
      if (numeric === 2) return "P2";
      return "P3";
    }
  }
  return "P2";
}

function normalizeFeedbackProcessingState(value, metadata, linkedTaskId) {
  if (linkedTaskId) return "converted";
  const triageStatus = normalizeFeedbackTriageStatus(value.triage_status);
  if (triageStatus === "ignored") return "ignored";
  const rawState = String(metadata.feedback_state || metadata.state || value.status || metadata.status || "").trim().toLowerCase();
  if (["pending", "accepted", "in_progress", "completed", "ignored", "converted"].includes(rawState)) return rawState;
  if (["开发中", "developing", "processing", "inprogress"].includes(rawState)) return "in_progress";
  if (["完成", "已完成", "done", "finished", "released"].includes(rawState)) return "completed";
  if (["已确认", "confirmed", "reviewing"].includes(rawState)) return "accepted";
  if (["已忽略", "rejected"].includes(rawState)) return "ignored";
  if (["待处理", "todo", "submitted", "analyzing"].includes(rawState)) return "pending";
  if (["已流转", "flowed"].includes(rawState)) return "converted";
  return triageStatus === "accepted" ? "accepted" : "pending";
}

function normalizeFeedbackTriageStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return ["pending", "accepted", "ignored"].includes(status) ? status : "";
}

function normalizeTag(value, fallbackProjectId = "") {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id);
  if (!id) return null;
  return { id, project_id: scalarId(value.project_id) || String(fallbackProjectId), name: String(value.name || "").trim() };
}

function normalizeAttachment(value) {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id);
  if (!id) return null;
  return { id, task_id: scalarId(value.task_id), creator_id: scalarId(value.creator_id), type: String(value.type || "text"), content: String(value.content || ""), created_at: String(value.created_at || ""), updated_at: String(value.updated_at || "") };
}

function taskBody(input, { creating }) {
  const body = compact({
    project_id: creating ? numericId(input.project_id, "Project") : undefined,
    content: creating ? requiredText(input.content, "Task content", 10000) : optionalProvidedText(input, "content", 10000),
    state: input.state === undefined ? undefined : taskState(input.state),
    executor_id: optionalNullableNumericId(input, "executor_id", "Executor"),
    father_id: optionalNullableNumericId(input, "father_id", "Parent task"),
    priority: optionalProvidedNumber(input, "priority", 0, 100000),
    tags: input.tags === undefined ? undefined : optionalText(input.tags, 1000)
  });
  if (creating && input.state === undefined) delete body.state;
  return body;
}

function feedbackBody(input, { creating }) {
  return compact({
    project_id: creating ? numericId(input.project_id, "Project") : undefined,
    title: creating ? requiredText(input.title, "Feedback title", 500) : optionalProvidedText(input, "title", 500),
    content: creating ? requiredText(input.content, "Feedback content", 10000) : optionalProvidedText(input, "content", 10000),
    custom_user_id: optionalProvidedText(input, "custom_user_id", 500),
    user_phone: optionalProvidedText(input, "user_phone", 100),
    user_email: optionalProvidedText(input, "user_email", 500),
    file: optionalProvidedText(input, "file", 2000),
    data: input.data === undefined ? undefined : typeof input.data === "string" ? input.data : JSON.stringify(input.data)
  });
}

function inviteBody(input) {
  return { role: memberRole(input.role || "member", false), expires_in: boundedInteger(input.expires_in, 0, 24 * 365, 0), max_uses: boundedInteger(input.max_uses, 1, 10000, 1) };
}

function memberRole(value, allowOwner) {
  const roles = allowOwner ? PROJECT_ROLES : new Set(["admin", "member"]);
  if (!roles.has(value)) throw new TypeError("Member role is invalid.");
  return value;
}

function taskState(value) {
  if (!TASK_STATES.includes(value)) throw new TypeError("Task state is invalid.");
  return value;
}

function requiredText(value, label, maxLength) {
  const text = String(value ?? "").trim();
  if (!text || text.length > maxLength) throw new TypeError(`${label} is invalid.`);
  return text;
}

function optionalText(value, maxLength) {
  const text = String(value ?? "").trim();
  if (text.length > maxLength) throw new TypeError("Text input is too long.");
  return text;
}

function optionalProvidedText(input, key, maxLength) {
  return Object.hasOwn(input, key) ? optionalText(input[key], maxLength) : undefined;
}

function numericId(value, label) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new TypeError(`${label} id is invalid.`);
  return id;
}

function optionalNumericId(value, label) {
  return value === undefined || value === null || value === "" ? undefined : numericId(value, label);
}

function optionalNumericIds(value, label) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > 500) throw new TypeError(`${label} ids are invalid.`);
  return value.map((item) => numericId(item, label));
}

function optionalNullableNumericId(input, key, label) {
  if (!Object.hasOwn(input, key)) return undefined;
  return input[key] === null || input[key] === "" ? null : numericId(input[key], label);
}

function optionalProvidedNumber(input, key, min, max) {
  if (!Object.hasOwn(input, key) || input[key] === "") return undefined;
  if (input[key] === null) return null;
  const value = Number(input[key]);
  if (!Number.isFinite(value) || value < min || value > max) throw new TypeError(`${key} is invalid.`);
  return value;
}

function boundedInteger(value, min, max, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new TypeError("Numeric input is invalid.");
  return number;
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function parseFeedbackData(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizedStates(value) {
  if (!Array.isArray(value) || value.length === 0) return TASK_STATES;
  const states = [...new Set(value.map(String).filter((state) => TASK_STATES.includes(state)))];
  return states.length > 0 ? states : TASK_STATES;
}

function taskQuery(projectId, filters = {}, { tree = false } = {}) {
  const query = compact({
    project_id: projectId,
    state: commaValues(normalizedStates(filters.states), (value) => taskState(value)),
    creator_id: commaValues(filters.creator_ids ?? filters.creator_id, (value) => numericId(value, "Creator")),
    executor_id: commaValues(filters.executor_ids ?? filters.executor_id, (value) => numericId(value, "Executor")),
    tags: commaValues(filters.tag_ids ?? filters.tags, (value) => numericId(value, "Tag")),
    priority: commaValues(filters.priorities ?? filters.priority, (value) => boundedInteger(value, 0, 100000, 0)),
    start_time: optionalDate(filters.start_time, "Start time"),
    end_time: optionalDate(filters.end_time, "End time", { endOfDay: true }),
    updated_after: optionalDate(filters.updated_after, "Updated after"),
    father_id: optionalNumericId(filters.father_id, "Parent task"),
    search_key: filters.search_key ? String(filters.search_key).trim().slice(0, 200) : undefined
  });
  if (tree) validateTreeDateRange(query.start_time, query.end_time);
  return query;
}

function commaValues(value, normalize) {
  if (value === undefined || value === null || value === "") return undefined;
  const values = Array.isArray(value) ? value : String(value).split(",");
  const normalized = [...new Set(values.map((item) => String(item).trim()).filter(Boolean).map(normalize))];
  return normalized.length ? normalized.join(",") : undefined;
}

function optionalDate(value, label, { endOfDay = false } = {}) {
  if (value === undefined || value === null || value === "") return undefined;
  const text = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${label} is invalid.`);
  return date.toISOString();
}

function validateTreeDateRange(startTime, endTime) {
  if (!startTime || !endTime) throw new TypeError("Task tree requires start_time and end_time.");
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (start > end) throw new TypeError("Task tree date range is invalid.");
  if (end - start > 100 * 24 * 60 * 60 * 1000) throw new TypeError("Task tree date range cannot exceed 100 days.");
}

function normalizeTaskTree(value, projectId, normalize, depth = 0, ancestors = []) {
  const task = normalize(value, projectId);
  if (!task) return null;
  const children = (Array.isArray(value.children) ? value.children : [])
    .map((child) => normalizeTaskTree(child, projectId, normalize, depth + 1, [...ancestors, task.id]))
    .filter(Boolean);
  return {
    ...task,
    tree_depth: depth,
    tree_ancestor_ids: ancestors,
    tree_matched: value.matched === undefined && value.is_match === undefined ? true : Boolean(value.matched ?? value.is_match),
    children
  };
}

function flattenTaskTree(tasks) {
  return tasks.flatMap((task) => [{ ...task, children: undefined }, ...flattenTaskTree(task.children || [])]);
}

function finiteCount(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function extractList(payload, keys) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

async function listAllPages(request, path, baseQuery, keys, normalize, pageSize = PAGE_SIZE) {
  const values = [];
  const seen = new Set();
  for (let page = 1; page <= 1000; page += 1) {
    const payload = await request(path, { query: { ...baseQuery, page, page_size: pageSize } });
    const pageValues = extractList(payload, keys);
    let added = 0;
    for (const raw of pageValues) {
      const value = normalize(raw);
      if (!value) continue;
      const key = scalarId(value.id) || JSON.stringify(value);
      if (seen.has(key)) continue;
      seen.add(key);
      values.push(value);
      added += 1;
    }
    const total = paginationTotal(payload);
    if ((Number.isFinite(total) && values.length >= total) || pageValues.length < pageSize || added === 0) break;
  }
  return values;
}

function paginationTotal(payload) {
  const value = Number(payload?.total ?? payload?.meta?.total);
  return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
}

function requiredId(value, label) {
  const id = scalarId(value);
  if (!id) throw new TypeError(`${label} id is required.`);
  return id;
}

function scalarId(value) {
  if (value === undefined || value === null) return "";
  const text = String(value).trim();
  return text && text !== "0" ? text : "";
}

function projectMatcher(value) {
  if (value === "*") return () => true;
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  const ids = new Set(values.map(scalarId).filter(Boolean));
  return (projectId) => ids.has(String(projectId));
}

function enabledV2Project(projectId, matcher) {
  const id = requiredId(projectId, "Project");
  if (!matcher(id)) throw feedbackV2Unavailable("Feedback V2 is not enabled for this project.");
  return id;
}

function unavailableFeedbackV2() {
  throw feedbackV2Unavailable("Feedback V2 adapter is unavailable.");
}

function feedbackV2Unavailable(message) {
  return Object.assign(new Error(message), { code: "feedback_v2_unavailable" });
}

function normalizeOutgoingFeedbackAttachments(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10) throw new TypeError("Feedback attachments are invalid.");
  return value.map((attachment) => {
    if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) throw new TypeError("Feedback attachment is invalid.");
    const type = ["image", "file"].includes(attachment.type) ? attachment.type : "file";
    return {
      type,
      object_key: requiredText(attachment.object_key, "Attachment object key", 2000).replace(/^\/+/, ""),
      file_name: requiredText(attachment.file_name, "Attachment file name", 500),
      mime_type: requiredText(attachment.mime_type, "Attachment MIME type", 200),
      size: boundedInteger(attachment.size, 1, 25 * 1024 * 1024, 0)
    };
  });
}

function normalizeUploadFile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Feedback attachment file is required.");
  const bytes = value.bytes instanceof Uint8Array ? value.bytes : value.bytes instanceof ArrayBuffer ? new Uint8Array(value.bytes) : null;
  if (!bytes || bytes.byteLength === 0 || bytes.byteLength > 25 * 1024 * 1024) throw new TypeError("Feedback attachment bytes are invalid.");
  const size = boundedInteger(value.size, 1, 25 * 1024 * 1024, bytes.byteLength);
  if (size !== bytes.byteLength) throw new TypeError("Feedback attachment size does not match its bytes.");
  return {
    file_name: requiredText(value.file_name, "Attachment file name", 500),
    mime_type: requiredText(value.mime_type, "Attachment MIME type", 200).toLowerCase(),
    size,
    bytes
  };
}
