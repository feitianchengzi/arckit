// Desktop distribution identities, not Kernel semantic routing.
export const CORE_SKILLS = ['arckit-state-driven-loop'];
export const RETIRED_CORE_SKILLS = ['using-arckit', 'arckit-development-ledger'];

export function migrateCoreSkillPreferences(state) {
  const currentId = `builtin:${CORE_SKILLS[0]}`;
  for (const scene of Object.values(state.scenes)) {
    const oldIds = RETIRED_CORE_SKILLS.map(name => `builtin:${name}`);
    if (!Object.hasOwn(scene, currentId) && oldIds.some(id => Object.hasOwn(scene, id))) {
      scene[currentId] = oldIds.some(id => scene[id] === true);
    }
    for (const id of oldIds) delete scene[id];
  }
  return state;
}
