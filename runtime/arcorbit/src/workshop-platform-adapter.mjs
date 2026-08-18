const PROJECT_ROLES = new Set(["owner", "admin", "member"]);
const TASK_STATES = ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"];

export function createWorkshopPlatformAdapter({ request, listProjects, normalizeTask }) {
  if (typeof request !== "function" || typeof listProjects !== "function" || typeof normalizeTask !== "function") {
    throw new TypeError("Workshop platform adapter requires bounded request, project, and task functions.");
  }

  return {
    async listOrganizations() {
      const payload = await request("/organizations", { query: { page_size: 500 } });
      return extractList(payload, ["organizations", "items"])
        .map(normalizeOrganization)
        .filter(Boolean);
    },

    async listOrganizationMembers(organizationId) {
      const id = requiredId(organizationId, "Organization");
      const payload = await request(`/organizations/${encodeURIComponent(id)}/members`, {
        query: { page_size: 500 }
      });
      return extractList(payload, ["members", "items"])
        .map((member) => normalizeMember(member, { organizationId: id }))
        .filter(Boolean);
    },

    async listProjects() {
      return listProjects();
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
      const query = {
        project_id: id,
        state: normalizedStates(filters.states),
        page_size: 500
      };
      if (filters.search_key) query.search_key = String(filters.search_key).trim().slice(0, 200);
      if (filters.executor_id) query.executor_id = requiredId(filters.executor_id, "Executor");
      if (filters.creator_id) query.creator_id = requiredId(filters.creator_id, "Creator");
      const payload = await request("/tasks", { query });
      return extractList(payload, ["tasks", "items"])
        .map((task) => normalizeTask(task, id))
        .filter(Boolean);
    },

    async listFeedbackV1(projectId, filters = {}) {
      const id = requiredId(projectId, "Project");
      const query = { project_id: id, page_size: 500 };
      if (filters.short_id) query.short_id = String(filters.short_id).trim().slice(0, 100);
      if (filters.custom_user_id) query.custom_user_id = String(filters.custom_user_id).trim().slice(0, 200);
      const payload = await request("/feedbacks", { query });
      return extractList(payload, ["feedbacks", "items"])
        .map((feedback) => normalizeFeedbackV1(feedback, id))
        .filter(Boolean);
    },

    async listProjectTags(projectId) {
      const id = requiredId(projectId, "Project");
      const payload = await request(`/projects/${encodeURIComponent(id)}/tags`, { query: { page_size: 500 } });
      return extractList(payload, ["tags", "items"]).map((tag) => normalizeTag(tag, id)).filter(Boolean);
    },

    async listTaskAttachments(taskId) {
      const id = requiredId(taskId, "Task");
      const payload = await request("/tasks/attachments", { query: { task_id: id, page_size: 500 } });
      return extractList(payload, ["attachments", "items"]).map(normalizeAttachment).filter(Boolean);
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
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}`, { method: "PUT", body: compact({ name: optionalProvidedText(input, "name", 120), git_url: optionalProvidedText(input, "git_url", 1000), organization_id: optionalProvidedNumericId(input, "organization_id", "Organization") }) });
    },
    deleteProject(projectId) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}`, { method: "DELETE" });
    },
    inviteProjectMember(projectId, input = {}) {
      return request(`/projects/${encodeURIComponent(requiredId(projectId, "Project"))}/invitations`, { method: "POST", body: inviteBody(input) });
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
    username: String(value.username ?? value.user?.username ?? value.user?.name ?? `User ${userId}`).trim(),
    avatar: String(value.avatar ?? value.user?.avatar ?? ""),
    role,
    duty: String(value.duty || ""),
    is_external: Boolean(value.is_external),
    is_me: Boolean(value.is_me),
    created_at: String(value.created_at || "")
  };
}

export function normalizeFeedbackV1(value, fallbackProjectId = "") {
  if (!value || typeof value !== "object") return null;
  const id = scalarId(value.id ?? value.feedback_id);
  const projectId = scalarId(value.project_id) || String(fallbackProjectId);
  if (!id || !projectId) return null;
  const metadata = parseFeedbackData(value.data);
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
    priority: ["P1", "P2", "P3"].includes(metadata.priority) ? metadata.priority : "",
    ignored: metadata.ignored === true,
    linked_task_id: scalarId(metadata.task_id),
    linked_task_state: String(metadata.task_state || ""),
    created_at: String(value.created_at || ""),
    updated_at: String(value.updated_at || "")
  };
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
  return { role: memberRole(input.role || "member", true), expires_in: boundedInteger(input.expires_in, 0, 24 * 365, 0), max_uses: boundedInteger(input.max_uses, 1, 10000, 1) };
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

function optionalProvidedNumericId(input, key, label) {
  return Object.hasOwn(input, key) ? optionalNumericId(input[key], label) : undefined;
}

function optionalNullableNumericId(input, key, label) {
  if (!Object.hasOwn(input, key)) return undefined;
  return input[key] === null || input[key] === "" ? null : numericId(input[key], label);
}

function optionalProvidedNumber(input, key, min, max) {
  if (!Object.hasOwn(input, key) || input[key] === "") return undefined;
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

function extractList(payload, keys) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
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
