export const byType = (collection, type) => collection.filter(i => i.type === type);

export function ensureTrackStates(item) {
  const states = item.system?.track?.states ?? [];
  const len = Number(item.system?.track?.length ?? 0);
  if (!Array.isArray(states) || states.length !== len) {
    return Array.from({length: len}, () => "empty");
  }
  return states.slice(0, len);
}

export const groupByTypes = (items, types) => {
  const groups = {}; for (const t of types) groups[t] = [];
  for (const it of items) if (groups.hasOwnProperty(it.type)) groups[it.type].push(it);
  return groups;
};
