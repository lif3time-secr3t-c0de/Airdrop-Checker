function sigmoid(z) {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
  return sum;
}

export class LogisticRegressionBinary {
  constructor({ learningRate = 0.08, epochs = 350, l2 = 0.0005 } = {}) {
    this.learningRate = learningRate;
    this.epochs = epochs;
    this.l2 = l2;
    this.weights = [];
  }

  fit(x, y) {
    if (!Array.isArray(x) || !x.length) {
      throw new Error("Training data is empty");
    }
    const featureCount = x[0].length;
    this.weights = new Array(featureCount).fill(0);
    const n = x.length;

    for (let epoch = 0; epoch < this.epochs; epoch += 1) {
      const gradients = new Array(featureCount).fill(0);
      for (let i = 0; i < n; i += 1) {
        const p = sigmoid(dot(this.weights, x[i]));
        const error = p - y[i];
        for (let j = 0; j < featureCount; j += 1) {
          gradients[j] += error * x[i][j];
        }
      }

      for (let j = 0; j < featureCount; j += 1) {
        gradients[j] = gradients[j] / n + this.l2 * this.weights[j];
        this.weights[j] -= this.learningRate * gradients[j];
      }
    }
  }

  predictProba(features) {
    if (!this.weights.length) return 0.5;
    return sigmoid(dot(this.weights, features));
  }
}
