const { CATEGORY_LIBRARY } = require('./catalogService');

function getRiskProfile(category) {
  return CATEGORY_LIBRARY.find((item) => item.category === category) || CATEGORY_LIBRARY[0];
}

function classifyReturnRisk(category) {
  const profile = getRiskProfile(category);
  const label = profile.returnRisk;
  const note =
    label === 'Low Risk'
      ? 'Lightweight, practical products usually create fewer sizing and expectation issues.'
      : label === 'Medium Risk'
        ? 'Track packaging quality and product variation carefully to reduce avoidable returns.'
        : 'This category can face sizing, compatibility, or expectation mismatch issues.';

  const score = label === 'Low Risk' ? 20 : label === 'Medium Risk' ? 55 : 85;

  return {
    label,
    note,
    score,
  };
}

module.exports = {
  classifyReturnRisk,
};
