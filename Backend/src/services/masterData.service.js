const masterData = require("../config/masterData");

async function getMasterData() {
  return masterData;
}

module.exports = { getMasterData };
