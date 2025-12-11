// compatibility.js
function migrateSaveData(data) {
  // Adicionar campos que podem faltar em saves antigos
  if (!data.gameState.selectedPlayerForSidebar) {
    data.gameState.selectedPlayerForSidebar = 0;
  }
  
  if (!data.gameState.eventModifiers) {
    data.gameState.eventModifiers = {};
  }
  
  if (!data.achievementsState) {
    data.achievementsState = {
      totalExplored: 0,
      totalBuilt: 0,
      totalNegotiations: 0,
      wins: 0,
      unlockedAchievements: [],
      playerAchievements: []
    };
  }
  
  return data;
}
