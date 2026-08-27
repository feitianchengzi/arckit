import { randomUUID } from "node:crypto";
import { normalizeWorkset } from "./desktop/desktop-store.mjs";
import { normalizeWorkInspectorWidth } from "./desktop/work-inspector-preference.mjs";
import { taskAttachmentHasObjectKey } from "./work-task-attachment-content.mjs";

const SECTION_NAMES = new Set(["overview", "organizations", "members", "tasks", "feedback", "tags"]);
const TASK_STATES = ["pending_review", "pending", "in_progress", "completed", "accepted", "cancelled", "blocked"];

export function createPlatformCoordinator({ runManager, platformSource, workSync, automationCoordinator, now = () => new Date().toISOString() }) {
  if (!runManager || !platformSource || !workSync || !automationCoordinator) {
    throw new TypeError("Platform coordinator requires run manager, platform source, Work Sync, and automation coordinator.");
  }
  const feedbackV2Health = new Map();

  function feedbackV2Enabled(projectId) {
    return typeof platformSource.isFeedbackV2ProjectEnabled === "function" && platformSource.isFeedbackV2ProjectEnabled(projectId);
  }

  function feedbackV2NotificationsEnabled(projectId) {
    return typeof platformSource.isFeedbackV2NotificationsProjectEnabled === "function" && platformSource.isFeedbackV2NotificationsProjectEnabled(projectId);
  }

  async function loadFeedback(projectId, filters) {
    if (!feedbackV2Enabled(projectId) || typeof platformSource.listFeedbackV2 !== "function") {
      const result = await capture("feedback", () => platformSource.listFeedbackV1(projectId, filters), projectId);
      return { ...result, management: unavailableFeedbackManagement(projectId) };
    }
    const v2 = await capture("feedback_v2", () => platformSource.listFeedbackV2(projectId, filters), projectId);
    if (v2.value) {
      let notificationResult = { value: { notifications: [], unread_count: 0, available: false }, error: null };
      if (feedbackV2NotificationsEnabled(projectId) && typeof platformSource.listFeedbackV2Notifications === "function") {
        notificationResult = await capture("feedback_v2_notifications", () => platformSource.listFeedbackV2Notifications(projectId, { unread_only: true }), projectId);
      }
      const current = feedbackV2Health.get(String(projectId));
      const baselineFeatures = {
        messages: true,
        attachments: true,
        notifications: feedbackV2NotificationsEnabled(projectId) && !notificationResult.error,
        mark_read: feedbackV2NotificationsEnabled(projectId) && !notificationResult.error,
        ignore: true,
        convert_to_task: true
      };
      const management = updateFeedbackV2Health(projectId, "snapshot", notificationResult.error ? "degraded" : "available", notificationResult.error, {
        ...baselineFeatures,
        ...(current?.features || {})
      });
      return {
        value: v2.value,
        error: notificationResult.error,
        management: {
          ...management,
          unread_count: Number(notificationResult.value?.unread_count || 0),
          unread_feedback_ids: [...new Set((notificationResult.value?.notifications || []).map((item) => String(item.feedback_id)).filter(Boolean))]
        }
      };
    }
    const fallback = await capture("feedback", () => platformSource.listFeedbackV1(projectId, filters), projectId);
    const management = updateFeedbackV2Health(projectId, "snapshot", "degraded", v2.error, {});
    return { value: fallback.value, error: fallback.error || v2.error, management };
  }

  async function getSnapshot(input = {}) {
    const sections = normalizeSections(input.sections);
    const [store, automation, workProjection, organizationsResult, participatingProjectsResult] = await Promise.all([
      runManager.readDesktopStore(),
      automationCoordinator.getSnapshot({}),
      workSync.getSnapshot(),
      capture("organizations", () => platformSource.listOrganizations()),
      capture("projects", () => platformSource.listProjects())
    ]);
    const platform = store.platform;
    const worksetId = String(input.workset_id || platform.active_workset_id || "");
    const activeWorkset = platform.worksets.find((item) => item.id === worksetId) || platform.worksets[0];
    const organizations = organizationsResult.value || [];
    const errors = [organizationsResult.error, participatingProjectsResult.error].filter(Boolean);
    errors.push(...(workProjection.errors || []).map((error) => ({ section: "tasks", ...error })));
    const governanceRequested = sections.has("organizations") || sections.has("members") || sections.has("overview");
    const organizationMemberResults = governanceRequested
      ? await Promise.all(organizations.map((organization) => {
          const organizationId = String(organization.id);
          return capture("organization_members", () => platformSource.listOrganizationMembers(organizationId), organizationId);
        }))
      : [];
    errors.push(...organizationMemberResults.map((result) => result.error).filter(Boolean));
    const organizationMembers = organizationMemberResults.flatMap((result) => result.value || []);

    const currentOrganizationRoles = new Map(organizations.map((organization) => {
      const me = organizationMembers.find((member) => String(member.organization_id) === String(organization.id)
        && (member.is_me || String(member.user_id) === String(automation.user?.id || "")));
      return [String(organization.id), String(me?.role || "")];
    }));
    const organizationProjectResults = governanceRequested
      ? await Promise.all(organizations.map((organization) => {
          const organizationId = String(organization.id);
          const role = currentOrganizationRoles.get(organizationId);
          const visibility = ["owner", "admin"].includes(role) ? "all_projects" : "participating_projects";
          const action = typeof platformSource.listOrganizationProjects === "function"
            ? () => platformSource.listOrganizationProjects(organizationId, { visibility })
            : () => Promise.resolve((participatingProjectsResult.value || []).filter((project) => projectOrganizationId(project) === organizationId));
          return capture("organization_projects", action, organizationId).then((result) => ({ ...result, organizationId, visibility }));
        }))
      : [];
    errors.push(...organizationProjectResults.map((result) => result.error).filter(Boolean));
    const personalProjectsResult = governanceRequested && typeof platformSource.listPersonalProjects === "function"
      ? await capture("personal_projects", () => platformSource.listPersonalProjects())
      : { value: (participatingProjectsResult.value || []).filter((project) => !projectOrganizationId(project)), error: null };
    if (personalProjectsResult.error) errors.push(personalProjectsResult.error);

    const organizationProjects = organizationProjectResults.flatMap((result) => result.value || []);
    const knownOrganizationIds = new Set(organizations.map((organization) => String(organization.id)));
    const personalProjects = dedupeProjects([
      ...(personalProjectsResult.value || []),
      ...(participatingProjectsResult.value || []).filter((project) => {
        const organizationId = projectOrganizationId(project);
        return !organizationId || !knownOrganizationIds.has(organizationId);
      })
    ]).filter((project) => {
      const organizationId = projectOrganizationId(project);
      return !organizationId || !knownOrganizationIds.has(organizationId);
    });
    const projectCatalog = dedupeProjects([
      ...(participatingProjectsResult.value || []),
      ...organizationProjects,
      ...personalProjects
    ]);
    const selectedIds = new Set(activeWorkset?.project_ids || []);
    const selectedProjects = projectCatalog.filter((project) => selectedIds.has(String(project.id)));
    const automationProjects = new Map((automation.projects || []).map((project) => [String(project.id), project]));

    const governanceProjectMemberResults = governanceRequested
      ? await Promise.all(projectCatalog.map((project) => {
          const embedded = embeddedProjectMembers(project);
          return embedded.length > 0
            ? Promise.resolve({ value: embedded, error: null, projectId: String(project.id) })
            : capture("project_members", () => platformSource.listProjectMembers(String(project.id)), String(project.id));
        }))
      : [];
    errors.push(...governanceProjectMemberResults.map((result) => result.error).filter(Boolean));
    const projectMembers = governanceProjectMemberResults.flatMap((result) => result.value || []);

    const detailResults = await Promise.all(selectedProjects.map(async (project) => {
      const projectId = String(project.id);
      const embeddedMembers = projectMembers.filter((member) => String(member.project_id) === projectId);
      const taskFilters = input.task_filters || {};
      const treeRequested = Boolean(taskFilters.tree);
      const [members, tasks, taskCountSource, feedback, tags] = await Promise.all([
        sections.has("members")
          ? embeddedMembers.length > 0 ? Promise.resolve({ value: embeddedMembers, error: null }) : capture("members", () => platformSource.listProjectMembers(projectId), projectId)
          : emptyResult(),
        sections.has("tasks") || sections.has("overview")
          ? localTaskResult(workProjection, projectId, taskFilters, { tree: treeRequested })
          : emptyResult(),
        sections.has("tasks") && treeRequested
          ? localTaskResult(workProjection, projectId, { states: TASK_STATES }, { tree: false })
          : emptyResult(),
        sections.has("feedback") || sections.has("overview")
          ? loadFeedback(projectId, input.feedback_filters || {})
          : emptyResult(),
        sections.has("tags") || sections.has("tasks") || sections.has("overview")
          ? Promise.resolve({ value: workProjection.tags.filter((tag) => String(tag.project_id) === projectId), error: null })
          : emptyResult()
      ]);
      errors.push(...[members.error, tasks.error, taskCountSource.error, feedback.error, tags.error].filter(Boolean));
      const taskValue = tasks.value || [];
      return {
        projectId,
        members: members.value || [],
        tasks: Array.isArray(taskValue) ? taskValue : taskValue.flattened || [],
        taskTree: Array.isArray(taskValue) ? null : taskValue,
        taskCounts: treeRequested && Array.isArray(taskCountSource.value) ? countBy(taskCountSource.value, "state") : null,
        feedback: feedback.value || [],
        feedbackManagement: feedback.management || unavailableFeedbackManagement(projectId),
        tags: tags.value || []
      };
    }));
    const details = new Map(detailResults.map((item) => [item.projectId, item]));
    const productWorkspaces = selectedProjects.map((project) => buildProductWorkspace({
      project,
      automationProject: automationProjects.get(String(project.id)),
      preference: platform.workspace_preferences[String(project.id)] || {},
      detail: details.get(String(project.id))
    }));
    const organizationScopes = organizations.map((organization) => {
      const organizationId = String(organization.id);
      const result = organizationProjectResults.find((item) => item.organizationId === organizationId);
      const role = currentOrganizationRoles.get(organizationId);
      const visibility = result?.visibility || (["owner", "admin"].includes(role) ? "all_projects" : "participating_projects");
      const projects = (result?.value || []).map((project) => projectProjection(project, automationProjects.get(String(project.id))));
      return {
        ...organization,
        current_user_role: role,
        project_visibility: visibility,
        members: organizationMembers.filter((member) => String(member.organization_id) === organizationId),
        projects,
        degraded: Boolean(result?.error)
      };
    });

    return {
      generated_at: now(),
      source_status: deriveSourceStatus(automation.source_status, errors),
      user: automation.user,
      worksets: platform.worksets,
      active_workset: activeWorkset || null,
      ui_preferences: platform.ui_preferences,
      projects: projectCatalog.map((project) => projectProjection(project, automationProjects.get(String(project.id)))),
      organizations: governanceRequested ? organizations : [],
      organization_scopes: governanceRequested ? organizationScopes : [],
      personal_projects: governanceRequested ? personalProjects.map((project) => projectProjection(project, automationProjects.get(String(project.id)))) : [],
      product_workspaces: productWorkspaces,
      organization_members: organizationMembers,
      project_members: projectMembers.map((member) => ({ ...member, project_name: projectCatalog.find((project) => String(project.id) === String(member.project_id))?.name || "" })),
      members: productWorkspaces.flatMap((workspace) => workspace.members),
      tasks: productWorkspaces.flatMap((workspace) => workspace.tasks),
      task_trees: productWorkspaces.map((workspace) => workspace.task_tree).filter(Boolean),
      feedback_v1: productWorkspaces.flatMap((workspace) => workspace.feedback_v1),
      tags: productWorkspaces.flatMap((workspace) => workspace.tags),
      task_replacements: workProjection.task_replacements || [],
      automation: {
        enabled: automation.enabled,
        queue_paused: automation.queue_paused,
        source_status: automation.source_status,
        health: automation.health,
        queue: automation.queue,
        active_execution: automation.active_execution,
        attention_items: automation.attention_items,
        recovery_items: automation.recovery_items
      },
      capabilities: {
        organizations: organizationsResult.error ? "degraded" : "available",
        organization_governance: errors.some((item) => ["organization_members", "organization_projects", "personal_projects"].includes(item.section)) ? "degraded" : "available",
        project_members: "managed_with_permissions_except_direct_add",
        invitation_lifecycle: "create_once_no_list_or_revoke",
        project_tasks: "read_write",
        task_project_replacement: "create_then_delete_with_recovery",
        platform_management: "available_with_server_permissions",
        feedback_v1: "read_write",
        feedback_v2: aggregateFeedbackV2Capability(productWorkspaces),
        direct_add_project_member: "unavailable",
        task_history: "unavailable",
        task_claim_consistency: "weak_claim_consistency"
      },
      errors
    };
  }

  async function queryWork(input = {}) {
    const queryKey = requiredText(input.query_key, "Work query key", 4000);
    const taskState = TASK_STATES.includes(String(input.state)) ? String(input.state) : "pending";
    const offset = Math.max(0, Math.trunc(Number(input.offset) || 0));
    const limit = Math.min(200, Math.max(1, Math.trunc(Number(input.limit) || 80)));
    const [store, workProjection] = await Promise.all([
      runManager.readDesktopStore(),
      workSync.getSnapshot()
    ]);
    const platform = store.platform;
    const worksetId = String(input.workset_id || platform.active_workset_id || "");
    const activeWorkset = platform.worksets.find((item) => item.id === worksetId) || platform.worksets[0] || null;
    const selectedIds = new Set(activeWorkset?.project_ids || []);
    const requestedProjectId = String(input.project_id || "all");
    const selectedProjects = (workProjection.project_catalog || []).filter((project) => (
      selectedIds.has(String(project.id)) && (requestedProjectId === "all" || String(project.id) === requestedProjectId)
    ));
    const taskFilters = {
      tree: true,
      states: [taskState],
      search_key: String(input.search_key || "").trim().slice(0, 200),
      creator_ids: boundedValues(input.creator_ids),
      executor_ids: boundedValues(input.executor_ids),
      tag_ids: boundedValues(input.tag_ids),
      priorities: boundedValues(input.priorities),
      start_time: String(input.start_time || "").slice(0, 40),
      end_time: String(input.end_time || "").slice(0, 40)
    };
    const errors = [...(workProjection.errors || [])];
    const detailResults = selectedProjects.map((project) => {
      const projectId = String(project.id);
      const tasks = localTaskResult(workProjection, projectId, taskFilters, { tree: true });
      const countedTasks = localTaskResult(workProjection, projectId, { ...taskFilters, states: TASK_STATES }, { tree: false }).value || [];
      const taskValue = tasks.value || [];
      const flattened = Array.isArray(taskValue) ? taskValue : taskValue.flattened || [];
      return {
        project,
        tasks: flattened,
        taskTree: Array.isArray(taskValue) ? null : taskValue,
        taskCounts: Object.fromEntries(TASK_STATES.map((state) => [state, countedTasks.filter((task) => task.state === state).length])),
        tags: workProjection.tags.filter((tag) => String(tag.project_id) === projectId)
      };
    });
    const allTasks = detailResults.flatMap((detail) => detail.tasks.map((task) => ({
      ...task,
      project_id: String(detail.project.id),
      project_name: String(detail.project.name || "")
    })));
    const matchedTasks = allTasks.filter((task) => task.tree_matched !== false && task.state === taskState);
    const matchedWindow = matchedTasks.slice(offset, offset + limit);
    const visibleTaskIds = new Set(matchedWindow.flatMap((task) => [
      `${task.project_id}:${task.id}`,
      ...(task.tree_ancestor_ids || []).map((id) => `${task.project_id}:${id}`)
    ]));
    const windowTasks = allTasks.filter((task) => visibleTaskIds.has(`${task.project_id}:${task.id}`));
    const productWorkspaces = detailResults.map((detail) => buildProductWorkspace({
      project: detail.project,
      preference: platform.workspace_preferences[String(detail.project.id)] || {},
      detail: {
        tasks: detail.tasks.filter((task) => visibleTaskIds.has(`${detail.project.id}:${task.id}`)),
        taskTree: detail.taskTree ? { ...detail.taskTree, tasks: [] } : null,
        taskCounts: detail.taskCounts,
        tags: detail.tags
      }
    }));
    return {
      schema_version: "arcorbit-work-query/v1",
      query_key: queryKey,
      generated_at: now(),
      source_status: workProjection.source_status,
      active_workset: activeWorkset,
      projects: selectedProjects.map((project) => projectProjection(project)),
      product_workspaces: productWorkspaces,
      tasks: windowTasks,
      task_trees: productWorkspaces.map((workspace) => workspace.task_tree).filter(Boolean),
      tags: productWorkspaces.flatMap((workspace) => workspace.tags),
      task_replacements: workProjection.task_replacements || [],
      window: { offset, limit, returned: matchedWindow.length, total: matchedTasks.length, has_more: offset + matchedWindow.length < matchedTasks.length },
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
    await workSync.reconcile({ dispatch: false, reason: "workset-created" });
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
    await workSync.reconcile({ dispatch: false, reason: "workset-updated" });
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
    await workSync.reconcile({ dispatch: false, reason: "workset-deleted" });
    return { id, deleted: true };
  }

  async function setActiveWorkset(worksetId) {
    const id = requiredText(worksetId, "Workset id", 120);
    await runManager.updateDesktopStore((store) => {
      if (!store.platform.worksets.some((item) => item.id === id)) throw new Error(`Unknown workset: ${id}`);
      store.platform.active_workset_id = id;
      return store;
    });
    await workSync.reconcile({ dispatch: false, reason: "workset-activated" });
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

  async function setWorkInspectorWidth(widthPx) {
    const width = normalizeWorkInspectorWidth(widthPx);
    await runManager.updateDesktopStore((store) => {
      store.platform.ui_preferences.work_inspector_width_px = width;
      return store;
    });
    return { work_inspector_width_px: width };
  }

  async function executeAction(command, input = {}) {
    const action = requiredText(command, "Platform action", 120);
    const handlers = {
      "organization.create": () => platformSource.createOrganization(input),
      "organization.update": () => platformSource.updateOrganization(input.organization_id, input),
      "organization.delete": () => platformSource.deleteOrganization(input.organization_id),
      "organization.invite": () => platformSource.inviteOrganizationMember(input.organization_id, input),
      "organization.join": () => platformSource.joinOrganization(input),
      "organization.member.update": () => platformSource.updateOrganizationMemberRole(input.organization_id, input),
      "organization.member.delete": () => platformSource.deleteOrganizationMember(input.organization_id, input),
      "project.create": () => platformSource.createProject(input),
      "project.update": () => platformSource.updateProject(input.project_id, input),
      "project.delete": () => platformSource.deleteProject(input.project_id),
      "project.invite": () => platformSource.inviteProjectMember(input.project_id, input),
      "project.join": () => platformSource.joinProject(input),
      "project.member.update": () => platformSource.updateProjectMember(input.project_id, input),
      "project.member.delete": () => platformSource.deleteProjectMember(input.project_id, input),
      "task.create": () => createWorkTask(input),
      "task.subtask.create": async () => {
        const projectId = requiredText(input.project_id, "Project id", 120);
        const parentId = requiredText(input.father_id, "Parent task id", 120);
        const tasks = (await workSync.getSnapshot()).tasks.filter((task) => String(task.project_id) === projectId);
        if (!(tasks || []).some((task) => String(task.id) === parentId)) throw new Error("父待办不属于当前产品。");
        return createWorkTask({ ...input, project_id: projectId, father_id: parentId });
      },
      "task.reparent": async () => {
        const projectId = requiredText(input.project_id, "Project id", 120);
        const taskId = requiredText(input.task_id, "Task id", 120);
        const parentId = input.father_id === undefined || input.father_id === null || input.father_id === "" ? "" : requiredText(input.father_id, "Parent task id", 120);
        const tasks = (await workSync.getSnapshot()).tasks.filter((task) => String(task.project_id) === projectId);
        validateTaskParentChange(tasks, taskId, parentId);
        return workSync.updateTask(taskId, { father_id: parentId || null });
      },
      "task.update": async () => {
        const { task_id: taskId, expected_state: expectedState = "", ...changes } = input;
        if (changes.state !== undefined && !TASK_STATES.includes(changes.state)) {
          throw new TypeError(`Unsupported task state: ${changes.state}`);
        }
        return workSync.updateTask(taskId, changes, { expectedState });
      },
      "task.replace_project": () => replaceWorkTaskProject(input),
      "task.replace_project.retry_delete": () => workSync.retryTaskProjectReplacement({ replacement_id: input.replacement_id }),
      "task.replace_project.keep_both": () => workSync.keepTaskProjectReplacement({ replacement_id: input.replacement_id }),
      "task.delete": () => workSync.deleteTask(input.task_id),
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
      "feedback.link_task": async () => {
        const projectId = requiredText(input.project_id, "Project id", 120);
        const feedbackId = requiredText(input.feedback_id, "Feedback id", 120);
        const taskId = requiredText(input.task_id, "Task id", 120);
        const [tasks, feedbackItems] = await Promise.all([
          workSync.getSnapshot().then((projection) => projection.tasks.filter((task) => String(task.project_id) === projectId)),
          platformSource.listFeedbackV1(projectId)
        ]);
        const task = (tasks || []).find((item) => String(item.id) === taskId);
        if (!task) throw new Error(`Task ${taskId} is not available in project ${projectId}.`);
        const currentFeedback = (feedbackItems || []).find((item) => String(item.id) === feedbackId);
        if (!currentFeedback) throw new Error(`Feedback ${feedbackId} is not available in project ${projectId}.`);
        if (currentFeedback.linked_task_id && String(currentFeedback.linked_task_id) !== taskId) {
          throw new Error(`Feedback ${feedbackId} is already linked to task ${currentFeedback.linked_task_id}.`);
        }
        if (String(currentFeedback.linked_task_id || "") === taskId) {
          return { status: "completed", task, feedback: currentFeedback, already_linked: true };
        }
        const feedback = await platformSource.updateFeedbackV1(feedbackId, {
          data: feedbackTaskLinkData(currentFeedback.metadata, taskId, task.state || input.task_state)
        });
        return { status: "completed", task, feedback, already_linked: false };
      },
      "feedback.to_task": async () => {
        const task = await workSync.createTask({
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
            data: feedbackTaskLinkData(metadata, taskId, task.state || input.task_state)
          });
          return { status: "completed", task, feedback };
        } catch (error) {
          return {
            status: "partial",
            error: {
              code: String(error?.code || "feedback_link_failed_after_task_creation"),
              message: `${String(error?.message || "Feedback association failed")} Task ${taskId} was created, but the feedback link was not saved.`
            },
            partial_result: {
              status: "task_created_feedback_link_failed",
              task_id: taskId,
              task_state: String(task.state || input.task_state || "pending_review")
            }
          };
        }
      }
    };
    const handler = handlers[action];
    if (!handler) throw new TypeError(`Unsupported platform action: ${action}`);
    return handler();
  }

  async function createWorkTask(input = {}) {
    const projectId = requiredText(input.project_id, "Project id", 120);
    const state = input.state || "pending_review";
    if (!TASK_STATES.includes(state)) throw new TypeError(`Unsupported task state: ${state}`);
    return workSync.createTask({ ...input, project_id: projectId, state });
  }

  async function replaceWorkTaskProject(input = {}) {
    const sourceTaskId = requiredText(input.source_task_id, "Source task id", 120);
    const targetProjectId = requiredText(input.target_project_id, "Target project id", 120);
    const [store, projection] = await Promise.all([runManager.readDesktopStore(), workSync.getSnapshot()]);
    const sourceTask = projection.tasks.find((task) => String(task.id) === sourceTaskId);
    if (!sourceTask) throw new Error(`Unknown source task: ${sourceTaskId}`);
    if (String(sourceTask.project_id) === targetProjectId) throw new Error("目标产品必须不同于当前产品。");
    const activeWorkset = store.platform.worksets.find((item) => item.id === store.platform.active_workset_id) || store.platform.worksets[0];
    if (!(activeWorkset?.project_ids || []).map(String).includes(targetProjectId)) {
      throw new Error("目标产品不在当前产品集中。");
    }
    if (!(projection.project_catalog || []).some((project) => String(project.id) === targetProjectId)) {
      throw new Error("目标产品当前不可写或已不可用。");
    }
    const state = input.state === undefined ? sourceTask.state : input.state;
    if (!TASK_STATES.includes(state)) throw new TypeError(`Unsupported task state: ${state}`);
    if (input.father_id) {
      const parent = projection.tasks.find((task) => String(task.id) === String(input.father_id) && String(task.project_id) === targetProjectId);
      if (!parent) throw new Error("父待办不属于目标产品。");
    }
    return workSync.replaceTaskProject({
      source_task_id: sourceTaskId,
      target_project_id: targetProjectId,
      content: input.content === undefined ? sourceTask.content : input.content,
      state,
      priority: input.priority,
      executor_id: input.executor_id,
      father_id: input.father_id,
      tags: input.tags
    });
  }

  async function getFeedbackV2Messages(input = {}) {
    return runFeedbackV2Action(input.project_id, "messages", () => platformSource.listFeedbackV2Messages(input.project_id, input.feedback_id));
  }

  async function sendFeedbackV2Reply(input = {}) {
    return runFeedbackV2Action(input.project_id, "messages", async () => {
      const attachments = input.file
        ? [await platformSource.uploadFeedbackV2DeveloperAttachment(input.project_id, { feedback_id: input.feedback_id, file: input.file })]
        : [];
      return platformSource.createFeedbackV2DeveloperMessage(input.project_id, {
        feedback_id: input.feedback_id,
        content: input.content,
        attachments
      });
    });
  }

  async function markFeedbackV2Read(input = {}) {
    return runFeedbackV2Action(input.project_id, "mark_read", () => platformSource.markFeedbackV2NotificationsRead(input.project_id, {
      feedback_id: input.feedback_id,
      notification_ids: input.notification_ids
    }));
  }

  async function ignoreFeedbackV2(input = {}) {
    return runFeedbackV2Action(input.project_id, "ignore", () => platformSource.ignoreFeedbackV2(input.project_id, input.feedback_id));
  }

  async function restoreFeedbackV2(input = {}) {
    return runFeedbackV2Action(input.project_id, "restore", () => platformSource.restoreFeedbackV2(input.project_id, input.feedback_id));
  }

  async function updateFeedbackV2(input = {}) {
    return runFeedbackV2Action(input.project_id, "update", () => platformSource.updateFeedbackV2(input.project_id, input.feedback_id, input));
  }

  async function deleteFeedbackV2(input = {}) {
    return runFeedbackV2Action(input.project_id, "delete", () => platformSource.deleteFeedbackV2(input.project_id, input.feedback_id));
  }

  async function convertFeedbackV2ToTask(input = {}) {
    return runFeedbackV2Action(input.project_id, "convert_to_task", () => platformSource.convertFeedbackV2ToTask(input.project_id, input));
  }

  async function getFeedbackV2AttachmentUrl(input = {}) {
    return runFeedbackV2Action(input.project_id, "attachments", () => platformSource.getFeedbackV2AttachmentUrl(input.project_id, input));
  }

  async function getFeedbackAttachmentUrl(input = {}) {
    const projectId = requiredText(input.project_id, "Project id", 120);
    const feedbackId = requiredText(input.feedback_id, "Feedback id", 120);
    const useV2 = input.feedback_source === "v2" && feedbackV2Enabled(projectId) && typeof platformSource.listFeedbackV2 === "function";
    const feedback = (await (useV2 ? platformSource.listFeedbackV2(projectId) : platformSource.listFeedbackV1(projectId)))
      .find((item) => String(item.id) === feedbackId);
    const url = String(feedback?.file || "").trim();
    if (!url) throw new Error("图片不属于当前反馈记录。");
    return url;
  }

  async function uploadTaskAttachmentResource(input = {}) {
    const projectId = requiredText(input.project_id, "Project id", 120);
    const taskId = requiredText(input.task_id, "Task id", 120);
    const tasks = (await workSync.getSnapshot()).tasks.filter((task) => String(task.project_id) === projectId);
    if (!(tasks || []).some((task) => String(task.id) === taskId)) throw new Error("待办不属于当前产品或当前账户不可见。");
    return platformSource.uploadTaskAttachmentResource({ kind: input.kind, file: input.file });
  }

  async function getTaskAttachmentResourceUrl(input = {}) {
    const taskId = requiredText(input.task_id, "Task id", 120);
    const attachmentId = requiredText(input.attachment_id, "Attachment id", 120);
    const attachments = await platformSource.listTaskAttachments(taskId);
    const attachment = (attachments || []).find((item) => String(item.id) === attachmentId);
    if (!attachment || !taskAttachmentHasObjectKey(attachment, input.object_key)) throw new Error("评论资源不属于该待办记录。");
    return platformSource.getTaskAttachmentResourceUrl(input.object_key, { download: Boolean(input.download) });
  }

  async function runFeedbackV2Action(projectId, feature, action) {
    const id = requiredText(projectId, "Project id", 120);
    if (!feedbackV2Enabled(id)) throw Object.assign(new Error("该项目未启用开发者反馈管理。"), { code: "feedback_v2_unavailable" });
    try {
      const result = await action();
      updateFeedbackV2Health(id, feature, "available", null, { [feature]: true });
      return result;
    } catch (error) {
      updateFeedbackV2Health(id, feature, "degraded", error, { [feature]: false });
      throw error;
    }
  }

  function updateFeedbackV2Health(projectId, feature, status, error, features = {}) {
    const id = String(projectId);
    const current = feedbackV2Health.get(id) || unavailableFeedbackManagement(id);
    const errors = {
      ...current.errors,
      [feature]: error ? safePlatformError(error) : ""
    };
    const nextStatus = Object.values(errors).some(Boolean) ? "degraded" : status;
    const next = {
      ...current,
      status: nextStatus,
      checked_at: nextStatus === "available" ? now() : current.checked_at,
      features: { ...current.features, ...features },
      errors
    };
    feedbackV2Health.set(id, next);
    return next;
  }

  return {
    getSnapshot,
    queryWork,
    createWorkset,
    updateWorkset,
    deleteWorkset,
    setActiveWorkset,
    setWorkspacePreference,
    setWorkInspectorWidth,
    executeAction,
    getFeedbackV2Messages,
    sendFeedbackV2Reply,
    markFeedbackV2Read,
    ignoreFeedbackV2,
    restoreFeedbackV2,
    updateFeedbackV2,
    deleteFeedbackV2,
    convertFeedbackV2ToTask,
    getFeedbackAttachmentUrl,
    getFeedbackV2AttachmentUrl,
    uploadTaskAttachmentResource,
    getTaskAttachmentResourceUrl
  };
}

function feedbackTaskLinkData(metadata, taskId, taskState) {
  const current = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  return {
    ...current,
    feedback_state: "converted",
    status: "developing",
    task_id: taskId,
    converted_task_id: taskId,
    converted_at: new Date().toISOString(),
    task_state: String(taskState || "pending_review")
  };
}

function buildProductWorkspace({ project, automationProject, preference, detail = {} }) {
  const projectId = String(project.id);
  const tasks = (detail.tasks || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }));
  const members = (detail.members || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }));
  const feedback = (detail.feedback || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }));
  return {
    ...projectProjection(project, automationProject),
    preference,
    task_counts: detail.taskCounts || countBy(tasks, "state"),
    feedback_count: feedback.length,
    feedback_management: detail.feedbackManagement || unavailableFeedbackManagement(projectId),
    members,
    tasks,
    task_tree: detail.taskTree ? {
      project_id: projectId,
      total: Number.isFinite(detail.taskTree.total) ? detail.taskTree.total : tasks.length,
      matched_total: Number.isFinite(detail.taskTree.matched_total) ? detail.taskTree.matched_total : tasks.filter((task) => task.tree_matched !== false).length,
      tasks: (detail.taskTree.tasks || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }))
    } : null,
    feedback_v1: feedback,
    tags: (detail.tags || []).map((item) => ({ ...item, project_id: projectId, project_name: project.name }))
  };
}

function unavailableFeedbackManagement(projectId) {
  return {
    project_id: String(projectId),
    status: "unavailable",
    checked_at: "",
    unread_count: 0,
    unread_feedback_ids: [],
    features: {},
    errors: {}
  };
}

function aggregateFeedbackV2Capability(workspaces) {
  const statuses = (workspaces || []).map((workspace) => workspace.feedback_management?.status);
  if (statuses.includes("available")) return "available";
  if (statuses.includes("degraded")) return "degraded";
  return "unavailable";
}

function safePlatformError(error) {
  return {
    code: String(error?.code || "platform_source_error"),
    status: Number(error?.status || 0),
    message: String(error?.message || "Platform source error").slice(0, 500)
  };
}

function projectProjection(project, automationProject) {
  const userMember = currentUserMember(project);
  return {
    id: String(project.id),
    name: String(project.name || ""),
    description: String(project.description || ""),
    organization_id: String(project.raw?.organization_id || project.organization_id || ""),
    git_url: String(project.raw?.git_url || project.git_url || ""),
    current_user_id: String(project.current_user_id || ""),
    current_user_role: String(userMember?.role || ""),
    external_participation: Boolean(userMember?.is_external),
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
  return String(currentUserMember(project)?.role || "");
}

function currentUserMember(project) {
  const members = Array.isArray(project.raw?.members) ? project.raw.members : [];
  return members.find((member) => member?.is_me === true) || null;
}

function projectOrganizationId(project) {
  return String(project?.organization_id || project?.raw?.organization_id || "");
}

function dedupeProjects(projects) {
  const values = new Map();
  for (const project of projects) {
    const id = String(project?.id || "");
    if (!id) continue;
    values.set(id, { ...(values.get(id) || {}), ...project });
  }
  return [...values.values()];
}

function embeddedProjectMembers(project) {
  const rawMembers = Array.isArray(project?.members) ? project.members : Array.isArray(project?.raw?.members) ? project.raw.members : [];
  return rawMembers.map((member) => {
    const userId = String(member?.user_id ?? member?.user?.id ?? "");
    const id = String(member?.id ?? member?.member_id ?? userId);
    if (!id || !userId) return null;
    return {
      id,
      user_id: userId,
      project_id: String(project.id),
      username: String(member?.username ?? member?.user?.username ?? member?.user?.name ?? `User ${userId}`),
      avatar: String(member?.avatar ?? member?.user?.avatar ?? ""),
      role: ["owner", "admin", "member"].includes(member?.role) ? member.role : "member",
      duty: String(member?.duty || ""),
      is_external: Boolean(member?.is_external),
      is_me: Boolean(member?.is_me),
      created_at: String(member?.created_at || "")
    };
  }).filter(Boolean);
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) counts[item[key]] = (counts[item[key]] || 0) + 1;
  return counts;
}

function localTaskResult(projection, projectId, filters = {}, { tree = false } = {}) {
  const all = (projection.tasks || []).filter((task) => String(task.project_id) === String(projectId));
  const matched = all.filter((task) => matchesLocalTask(task, filters));
  if (!tree) return { value: matched, error: null };
  const byId = new Map(all.map((task) => [String(task.id), task]));
  const included = new Set(matched.map((task) => String(task.id)));
  for (const task of matched) {
    let parentId = String(task.father_id || "");
    const seen = new Set();
    while (parentId && byId.has(parentId) && !seen.has(parentId)) {
      included.add(parentId);
      seen.add(parentId);
      parentId = String(byId.get(parentId)?.father_id || "");
    }
  }
  const flattened = all.filter((task) => included.has(String(task.id))).map((task) => {
    const ancestors = taskAncestors(task, byId);
    return {
      ...task,
      tree_depth: ancestors.length,
      tree_ancestor_ids: ancestors,
      tree_matched: matched.some((item) => String(item.id) === String(task.id))
    };
  });
  return {
    value: {
      tasks: flattened.filter((task) => !task.father_id || !included.has(String(task.father_id))),
      flattened,
      total: flattened.length,
      matched_total: matched.length
    },
    error: null
  };
}

function matchesLocalTask(task, filters) {
  const states = boundedValues(filters.states);
  if (states.length > 0 && !states.includes(String(task.state))) return false;
  const search = String(filters.search_key || "").trim().toLocaleLowerCase();
  if (search && !String(task.content || "").toLocaleLowerCase().includes(search)) return false;
  if (!matchesBoundedValue(task.creator_id, filters.creator_ids)) return false;
  if (!matchesBoundedValue(task.executor_id, filters.executor_ids)) return false;
  if (!matchesBoundedValue(task.priority, filters.priorities)) return false;
  const selectedTags = boundedValues(filters.tag_ids);
  if (selectedTags.length > 0) {
    const taskTags = Array.isArray(task.tags)
      ? task.tags.map((tag) => String(tag?.id ?? tag))
      : String(task.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
    if (!selectedTags.some((tag) => taskTags.includes(tag))) return false;
  }
  const createdAt = Date.parse(task.created_at || "");
  const start = Date.parse(filters.start_time || "");
  const endText = String(filters.end_time || "");
  const end = endText ? Date.parse(endText.length <= 10 ? `${endText}T23:59:59.999Z` : endText) : Number.NaN;
  if (Number.isFinite(start) && (!Number.isFinite(createdAt) || createdAt < start)) return false;
  if (Number.isFinite(end) && (!Number.isFinite(createdAt) || createdAt > end)) return false;
  return true;
}

function matchesBoundedValue(value, selected) {
  const values = boundedValues(selected);
  return values.length === 0 || values.includes(String(value ?? ""));
}

function taskAncestors(task, byId) {
  const ancestors = [];
  const seen = new Set();
  let parentId = String(task.father_id || "");
  while (parentId && byId.has(parentId) && !seen.has(parentId)) {
    ancestors.unshift(parentId);
    seen.add(parentId);
    parentId = String(byId.get(parentId)?.father_id || "");
  }
  return ancestors;
}

function validateTaskParentChange(tasks, taskId, parentId) {
  const byId = new Map((tasks || []).map((task) => [String(task.id), task]));
  if (!byId.has(taskId)) throw new Error("待办不属于当前产品。");
  if (!parentId) return;
  if (!byId.has(parentId)) throw new Error("父待办不属于当前产品。");
  if (parentId === taskId) throw new Error("待办不能成为自己的父待办。");
  const seen = new Set([taskId]);
  let cursor = parentId;
  while (cursor) {
    if (seen.has(cursor)) throw new Error("父待办关系不能形成循环。");
    seen.add(cursor);
    cursor = String(byId.get(cursor)?.father_id || "");
  }
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

function boundedValues(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean))].slice(0, 100);
}

function safeColor(value) {
  const text = String(value || "").trim();
  if (text && !/^[a-z0-9-]{1,32}$/i.test(text)) throw new TypeError("Workspace color token is invalid.");
  return text;
}
