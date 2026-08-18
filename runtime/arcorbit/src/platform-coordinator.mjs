import { randomUUID } from "node:crypto";
import { normalizeWorkset } from "./desktop/desktop-store.mjs";

const SECTION_NAMES = new Set(["overview", "organizations", "members", "tasks", "feedback", "tags"]);

export function createPlatformCoordinator({ runManager, platformSource, automationCoordinator, now = () => new Date().toISOString() }) {
  if (!runManager || !platformSource || !automationCoordinator) {
    throw new TypeError("Platform coordinator requires run manager, platform source, and automation coordinator.");
  }

  async function getSnapshot(input = {}) {
    const sections = normalizeSections(input.sections);
    const [store, automation, organizationsResult, projectsResult] = await Promise.all([
      runManager.readDesktopStore(),
      automationCoordinator.getSnapshot({}),
      capture("organizations", () => platformSource.listOrganizations()),
      capture("projects", () => platformSource.listProjects())
    ]);
    const platform = store.platform;
    const worksetId = String(input.workset_id || platform.active_workset_id || "");
    const activeWorkset = platform.worksets.find((item) => item.id === worksetId) || platform.worksets[0];
    const projectCatalog = projectsResult.value || [];
    const selectedIds = new Set(activeWorkset?.project_ids || []);
    const selectedProjects = projectCatalog.filter((project) => selectedIds.has(String(project.id)));
    const automationProjects = new Map((automation.projects || []).map((project) => [String(project.id), project]));
    const errors = [organizationsResult.error, projectsResult.error].filter(Boolean);
    const selectedOrganizationIds = [...new Set(selectedProjects
      .map((project) => String(project.raw?.organization_id || project.organization_id || ""))
      .filter(Boolean))];
    const organizationMemberResults = sections.has("members")
      ? await Promise.all(selectedOrganizationIds.map((organizationId) => (
          capture("organization_members", () => platformSource.listOrganizationMembers(organizationId), organizationId)
        )))
      : [];
    errors.push(...organizationMemberResults.map((result) => result.error).filter(Boolean));
    const organizationMembers = organizationMemberResults.flatMap((result) => result.value || []);

    const detailResults = await Promise.all(selectedProjects.map(async (project) => {
      const projectId = String(project.id);
      const [members, tasks, feedback, tags] = await Promise.all([
        sections.has("members") ? capture("members", () => platformSource.listProjectMembers(projectId), projectId) : emptyResult(),
        sections.has("tasks") || sections.has("overview")
          ? capture("tasks", () => platformSource.listProjectTasks(projectId, input.task_filters || {}), projectId)
          : emptyResult(),
        sections.has("feedback") || sections.has("overview")
          ? capture("feedback", () => platformSource.listFeedbackV1(projectId, input.feedback_filters || {}), projectId)
          : emptyResult(),
        sections.has("tags") || sections.has("tasks") || sections.has("overview")
          ? capture("tags", () => platformSource.listProjectTags(projectId), projectId)
          : emptyResult()
      ]);
      errors.push(...[members.error, tasks.error, feedback.error, tags.error].filter(Boolean));
      return { projectId, members: members.value || [], tasks: tasks.value || [], feedback: feedback.value || [], tags: tags.value || [] };
    }));
    const details = new Map(detailResults.map((item) => [item.projectId, item]));
    const productWorkspaces = selectedProjects.map((project) => buildProductWorkspace({
      project,
      automationProject: automationProjects.get(String(project.id)),
      preference: platform.workspace_preferences[String(project.id)] || {},
      detail: details.get(String(project.id))
    }));

    return {
      generated_at: now(),
      source_status: deriveSourceStatus(automation.source_status, errors),
      user: automation.user,
      worksets: platform.worksets,
      active_workset: activeWorkset || null,
      projects: projectCatalog.map((project) => projectProjection(project, automationProjects.get(String(project.id)))),
      organizations: sections.has("organizations") || sections.has("overview") ? organizationsResult.value || [] : [],
      product_workspaces: productWorkspaces,
      organization_members: organizationMembers,
      members: productWorkspaces.flatMap((workspace) => workspace.members),
      tasks: productWorkspaces.flatMap((workspace) => workspace.tasks),
      feedback_v1: productWorkspaces.flatMap((workspace) => workspace.feedback_v1),
      tags: productWorkspaces.flatMap((workspace) => workspace.tags),
      automation: {
        enabled: automation.enabled,
        queue_paused: automation.queue_paused,
        source_status: automation.source_status,
        health: automation.health,
        queue: automation.queue,
        active_execution: automation.active_execution,
        attention_items: automation.attention_items,
        recovery_items: automation.recovery_items,
        acceptance_feedback_queue: automation.acceptance_feedback_queue,
        acceptance_feedback_counts: automation.acceptance_feedback_counts
      },
      capabilities: {
        organizations: organizationsResult.error ? "degraded" : "available",
        project_members: "managed_with_permissions_except_direct_add",
        project_tasks: "read_write",
        platform_management: "available_with_server_permissions",
        feedback_v1: "read_write",
        feedback_v2: platform.feedback_v2.status === "available" ? "available" : "unavailable",
        direct_add_project_member: "unavailable",
        task_history: "unavailable",
        task_claim_consistency: "weak_claim_consistency"
      },
      errors
    };
  }

  async function createWorkset(input = {}) {
    const timestamp = now();
    const workset = requireWorkset({
      id: `WORKSET-${randomUUID()}`,
      name: input.name,
      project_ids: input.project_ids,
      created_at: timestamp,
      updated_at: timestamp
    });
    await runManager.updateDesktopStore((store) => {
      store.platform.worksets.push(workset);
      store.platform.active_workset_id = workset.id;
      return store;
    });
    return workset;
  }

  async function updateWorkset(input = {}) {
    const id = requiredText(input.id, "Workset id", 120);
    let updated;
    await runManager.updateDesktopStore((store) => {
      const index = store.platform.worksets.findIndex((item) => item.id === id);
      if (index < 0) throw new Error(`Unknown workset: ${id}`);
      updated = requireWorkset({
        ...store.platform.worksets[index],
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.project_ids === undefined ? {} : { project_ids: input.project_ids }),
        updated_at: now()
      });
      store.platform.worksets[index] = updated;
      return store;
    });
    return updated;
  }

  async function deleteWorkset(worksetId) {
    const id = requiredText(worksetId, "Workset id", 120);
    await runManager.updateDesktopStore((store) => {
      if (store.platform.worksets.length <= 1) throw new Error("The last workset cannot be deleted.");
      const index = store.platform.worksets.findIndex((item) => item.id === id);
      if (index < 0) throw new Error(`Unknown workset: ${id}`);
      store.platform.worksets.splice(index, 1);
      if (store.platform.active_workset_id === id) store.platform.active_workset_id = store.platform.worksets[0].id;
      return store;
    });
    return { id, deleted: true };
  }

  async function setActiveWorkset(worksetId) {
    const id = requiredText(worksetId, "Workset id", 120);
    await runManager.updateDesktopStore((store) => {
      if (!store.platform.worksets.some((item) => item.id === id)) throw new Error(`Unknown workset: ${id}`);
      store.platform.active_workset_id = id;
      return store;
    });
    return { id };
  }

  async function setWorkspacePreference(projectId, input = {}) {
    const id = requiredText(projectId, "Project id", 120);
    await runManager.updateDesktopStore((store) => {
      const current = store.platform.workspace_preferences[id] || {};
      store.platform.workspace_preferences[id] = {
        pinned: input.pinned === undefined ? Boolean(current.pinned) : Boolean(input.pinned),
        color: input.color === undefined ? String(current.color || "") : safeColor(input.color),
        last_opened_at: input.mark_opened ? now() : String(current.last_opened_at || "")
      };
      return store;
    });
    return { project_id: id };
  }

  async function executeAction(command, input = {}) {
    const action = requiredText(command, "Platform action", 120);
    const handlers = {
      "organization.create": () => platformSource.createOrganization(input),
      "organization.update": () => platformSource.updateOrganization(input.organization_id, input),
      "organization.delete": () => platformSource.deleteOrganization(input.organization_id),
      "organization.invite": () => platformSource.inviteOrganizationMember(input.organization_id, input),
      "organization.member.update": () => platformSource.updateOrganizationMemberRole(input.organization_id, input),
      "organization.member.delete": () => platformSource.deleteOrganizationMember(input.organization_id, input),
      "project.create": () => platformSource.createProject(input),
      "project.update": () => platformSource.updateProject(input.project_id, input),
      "project.delete": () => platformSource.deleteProject(input.project_id),
      "project.invite": () => platformSource.inviteProjectMember(input.project_id, input),
      "project.member.update": () => platformSource.updateProjectMember(input.project_id, input),
      "project.member.delete": () => platformSource.deleteProjectMember(input.project_id, input),
      "task.create": () => platformSource.createTask(input),
      "task.update": () => platformSource.updateTask(input.task_id, input),
      "task.delete": () => platformSource.deleteTask(input.task_id),
      "task.attachments.list": () => platformSource.listTaskAttachments(input.task_id),
      "task.attachment.create": () => platformSource.createTaskAttachment(input),
      "task.attachment.update": () => platformSource.updateTaskAttachment(input.attachment_id, input),
      "task.attachment.delete": () => platformSource.deleteTaskAttachment(input.attachment_id),
      "tag.create": () => platformSource.createTag(input.project_id, input),
      "tag.update": () => platformSource.updateTag(input.tag_id, input),
      "tag.delete": () => platformSource.deleteTag(input.tag_id),
      "feedback.create": () => platformSource.createFeedbackV1(input),
      "feedback.update": () => platformSource.updateFeedbackV1(input.feedback_id, input),
      "feedback.delete": () => platformSource.deleteFeedbackV1(input.feedback_id),
      "feedback.to_task": async () => {
        const task = await platformSource.createTask({
          project_id: input.project_id,
          content: input.task_content || input.title || input.content,
          state: input.task_state || "pending_review",
          executor_id: input.executor_id,
          priority: input.task_priority,
          tags: input.task_tags
        });
        const taskId = String(task?.id || task?.task_id || "");
        if (!taskId) throw new Error("Workshop created a task without returning its id.");
        const metadata = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {};
        try {
          const feedback = await platformSource.updateFeedbackV1(input.feedback_id, {
            data: { ...metadata, task_id: taskId, task_state: String(task.state || input.task_state || "pending_review") }
          });
          return { status: "completed", task, feedback };
        } catch (error) {
          const partialError = new Error(`${String(error?.message || "Feedback association failed")} Task ${taskId} was created, but the feedback link was not saved.`);
          partialError.code = String(error?.code || "feedback_link_failed_after_task_creation");
          partialError.partial_result = { status: "task_created_feedback_link_failed", task_id: taskId };
          throw partialError;
        }
      }
    };
    const handler = handlers[action];
    if (!handler) throw new TypeError(`Unsupported platform action: ${action}`);
    return handler();
  }

  return { getSnapshot, createWorkset, updateWorkset, deleteWorkset, setActiveWorkset, setWorkspacePreference, executeAction };
}

function buildProductWorkspace({ project, automationProject, preference, detail = {} }) {
  const projectId = String(project.id);
  const tasks = (detail.tasks || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }));
  const members = (detail.members || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }));
  const feedback = (detail.feedback || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }));
  return {
    ...projectProjection(project, automationProject),
    preference,
    task_counts: countBy(tasks, "state"),
    feedback_count: feedback.length,
    members,
    tasks,
    feedback_v1: feedback,
    tags: (detail.tags || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }))
  };
}

function projectProjection(project, automationProject) {
  return {
    id: String(project.id),
    name: String(project.name || ""),
    description: String(project.description || ""),
    organization_id: String(project.raw?.organization_id || project.organization_id || ""),
    git_url: String(project.raw?.git_url || project.git_url || ""),
    current_user_id: String(project.current_user_id || ""),
    current_user_role: currentUserRole(project),
    local_project_id: String(automationProject?.local_project_id || ""),
    local_project_name: String(automationProject?.local_project_name || ""),
    local_project_path: String(automationProject?.local_project_path || ""),
    participating: Boolean(automationProject?.participating),
    eligible: Boolean(automationProject?.eligible),
    source_status: String(automationProject?.source_status || "unknown"),
    automation_task_counts: automationProject?.task_counts || {}
  };
}

function currentUserRole(project) {
  const members = Array.isArray(project.raw?.members) ? project.raw.members : [];
  return String(members.find((member) => member?.is_me === true)?.role || "");
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) counts[item[key]] = (counts[item[key]] || 0) + 1;
  return counts;
}

async function capture(section, action, projectId = "") {
  try {
    return { value: await action(), error: null };
  } catch (error) {
    return {
      value: null,
      error: {
        section,
        project_id: String(projectId),
        code: String(error?.code || "platform_source_error"),
        status: Number(error?.status || 0),
        message: String(error?.message || "Platform source error")
      }
    };
  }
}

function emptyResult() {
  return { value: [], error: null };
}

function normalizeSections(value) {
  const requested = Array.isArray(value) ? value.map(String).filter((item) => SECTION_NAMES.has(item)) : [];
  return new Set(requested.length > 0 ? requested : [...SECTION_NAMES]);
}

function deriveSourceStatus(automationStatus, errors) {
  if (["logged_out", "unauthenticated", "unconfigured"].includes(automationStatus)) return automationStatus;
  return errors.length > 0 ? "degraded" : "healthy";
}

function requireWorkset(value) {
  const workset = normalizeWorkset(value);
  if (!workset) throw new TypeError("Workset requires a non-empty name and id.");
  return workset;
}

function requiredText(value, label, maxLength) {
  const text = String(value || "").trim();
  if (!text || text.length > maxLength) throw new TypeError(`${label} is invalid.`);
  return text;
}

function safeColor(value) {
  const text = String(value || "").trim();
  if (text && !/^[a-z0-9-]{1,32}$/i.test(text)) throw new TypeError("Workspace color token is invalid.");
  return text;
}
