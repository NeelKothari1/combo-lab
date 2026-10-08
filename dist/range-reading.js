export function gradeRangeSelection(scenario, selected) {
  if (!scenario.rangeTask || !Array.isArray(selected) || selected.some(id => typeof id !== 'string')) {
    throw new Error('Select hand groups for a range-reading drill.');
  }
  const options = scenario.rangeTask.groups;
  if (selected.some(id => !options.some(group => group.id === id))) throw new Error('Unknown hand group.');
  const ids = [...new Set(selected)];
  const expected = options.filter(group => group.include).map(group => group.id);
  const missing = expected.filter(id => !ids.includes(id));
  const extra = ids.filter(id => !expected.includes(id));
  return { correct: missing.length === 0 && extra.length === 0, selected: ids, expected, missing, extra };
}
