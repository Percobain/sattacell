/**
 * LMSR (Logarithmic Market Scoring Rule) Service
 * Implements the AMM formulas for prediction markets
 */

/**
 * Calculate weights for each outcome
 * weight_i = exp(q_i / b)
 */
function calculateWeights(q, b) {
  return q.map(qi => Math.exp(qi / b));
}

/**
 * Calculate probabilities (prices) for each outcome
 * P_i = weight_i / sum(weight_j)
 */
function calculateProbabilities(q, b) {
  const weights = calculateWeights(q, b);
  const sumWeights = weights.reduce((sum, w) => sum + w, 0);
  
  if (sumWeights === 0) {
    // Equal probability if all q are 0
    return new Array(q.length).fill(1 / q.length);
  }
  
  return weights.map(w => w / sumWeights);
}

/**
 * Calculate cost function
 * C(q) = b * ln(sum(exp(q_i / b)))
 */
function calculateCost(q, b) {
  const weights = calculateWeights(q, b);
  const sumWeights = weights.reduce((sum, w) => sum + w, 0);
  
  if (sumWeights === 0) {
    return 0;
  }
  
  return b * Math.log(sumWeights);
}

/**
 * Calculate trade cost
 * cost = C(q_after) - C(q_before)
 */
function calculateTradeCost(qBefore, qAfter, b) {
  const costBefore = calculateCost(qBefore, b);
  const costAfter = calculateCost(qAfter, b);
  return costAfter - costBefore;
}

/**
 * Get current price for a specific outcome
 */
function getPrice(q, b, outcomeIndex) {
  const probabilities = calculateProbabilities(q, b);
  return probabilities[outcomeIndex] || 0;
}

module.exports = {
  calculateWeights,
  calculateProbabilities,
  calculateCost,
  calculateTradeCost,
  getPrice,
};

