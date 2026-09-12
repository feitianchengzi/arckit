// Desktop distribution identities, not Kernel semantic routing.
export const CORE_SKILLS = ['using-arckit', 'arckit-development-ledger'];
export const RETIRED_CORE_SKILLS = ['arckit-state-driven-loop'];

export function migrateCoreSkillPreferences(state) {
  for (const scene of Object.values(state.scenes)) {
    const oldIds = RETIRED_CORE_SKILLS.map(name => `builtin:${name}`);
    const oldId = oldIds.find(id => Object.hasOwn(scene, id));
    for (const name of CORE_SKILLS) {
      const currentId = `builtin:${name}`;
      if (!Object.hasOwn(scene, currentId) && oldId) {
        scene[currentId] = scene[oldId];
      }
    }
    for (const id of oldIds) delete scene[id];
  }
  return state;
}
