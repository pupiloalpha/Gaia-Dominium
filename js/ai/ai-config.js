// ai-config.js - Configurações da IA
export const AI_DIFFICULTY_SETTINGS = {
  easy: {
    name: 'Fácil',
    reactionDelay: 2000,
    decisionAccuracy: 0.6,
    planningDepth: 1,
    memoryTurns: 2,
    aggressionLevel: 0.2,
    resourcePriority: ['madeira', 'agua', 'pedra', 'ouro'],
    avoidNegotiations: false,
    personalityWeights: {
      expansionist: 0.4,
      builder: 0.3,
      economist: 0.2,
      diplomat: 0.1
    }
  },
  medium: {
    name: 'Médio',
    reactionDelay: 1500,
    decisionAccuracy: 0.75,
    planningDepth: 2,
    memoryTurns: 3,
    aggressionLevel: 0.4,
    resourcePriority: ['ouro', 'madeira', 'pedra', 'agua'],
    avoidNegotiations: false,
    personalityWeights: {
      expansionist: 0.3,
      builder: 0.4,
      economist: 0.2,
      diplomat: 0.1
    }
  },
  hard: {
    name: 'Difícil',
    reactionDelay: 1000,
    decisionAccuracy: 0.85,
    planningDepth: 3,
    memoryTurns: 4,
    aggressionLevel: 0.6,
    resourcePriority: ['ouro', 'pedra', 'madeira', 'agua'],
    avoidNegotiations: true,
    personalityWeights: {
      expansionist: 0.3,
      builder: 0.3,
      economist: 0.3,
      diplomat: 0.1
    }
  },
  master: {
    name: 'Mestre',
    reactionDelay: 500,
    decisionAccuracy: 0.95,
    planningDepth: 4,
    memoryTurns: 5,
    aggressionLevel: 0.8,
    resourcePriority: ['ouro', 'pedra', 'agua', 'madeira'],
    avoidNegotiations: true,
    personalityWeights: {
      expansionist: 0.25,
      builder: 0.25,
      economist: 0.25,
      diplomat: 0.25
    },
    adaptiveLearning: true
  }
};

export const AI_PERSONALITIES = {
  expansionist: {
    name: 'Expansionista',
    description: 'Foco em controle territorial',
    priorities: [
      { action: 'assume_control', weight: 1.5 },
      { action: 'dispute', weight: 1.4 },
      { action: 'explore', weight: 1.2 },
      { action: 'build', weight: 0.8 },
      { action: 'collect', weight: 0.7 },
      { action: 'negotiate', weight: 0.3 }
    ],
    preferredBiomes: ['Floresta Tropical', 'Savana'],
    resourceTargets: { madeira: 15, pedra: 10, ouro: 8, agua: 12 },
    disputeAggression: 1.8
  },
  builder: {
    name: 'Construtor',
    description: 'Foco em estruturas',
    priorities: [
      { action: 'build', weight: 1.8 },
      { action: 'explore', weight: 1.3 },
      { action: 'collect', weight: 1.0 },
      { action: 'assume_control', weight: 0.7 },
      { action: 'dispute', weight: 0.4 },
      { action: 'negotiate', weight: 0.4 }
    ],
    preferredBiomes: ['Floresta Temperada', 'Pântano'],
    resourceTargets: { madeira: 20, pedra: 15, ouro: 5, agua: 10 },
    disputeAggression: 0.7
  },
  economist: {
    name: 'Economista',
    description: 'Foco em recursos',
    priorities: [
      { action: 'collect', weight: 1.6 },
      { action: 'negotiate', weight: 1.4 },
      { action: 'explore', weight: 1.1 },
      { action: 'assume_control', weight: 0.9 },
      { action: 'build', weight: 0.8 },
      { action: 'dispute', weight: 0.6 }
    ],
    preferredBiomes: ['Savana', 'Pântano'],
    resourceTargets: { madeira: 12, pedra: 12, ouro: 20, agua: 15 },
    disputeAggression: 1.0
  },
  diplomat: {
    name: 'Diplomata',
    description: 'Foco em negociações',
    priorities: [
      { action: 'negotiate', weight: 1.7 },
      { action: 'collect', weight: 1.2 },
      { action: 'explore', weight: 1.0 },
      { action: 'assume_control', weight: 0.6 },
      { action: 'build', weight: 0.9 },
      { action: 'dispute', weight: 0.3 }
    ],
    preferredBiomes: ['Floresta Tropical', 'Savana'],
    resourceTargets: { madeira: 10, pedra: 8, ouro: 25, agua: 10 },
    disputeAggression: 0.5
  }
};