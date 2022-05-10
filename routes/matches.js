const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/', async (req, res) => {
  const matchId = req.query.matchId;
  const playerPlatform = req.query.platform;
  const playerName = req.query.playerName;

  const match_url = `https://api.pubg.com/shards/${playerPlatform}/matches/${matchId}`;
  const match_response = await fetch(match_url, options);
  const match_data = await match_response.json();
  const data = {};
  if (match_response.status === 200) {
    const datos = match_data.included;

    var playerList = [];
    //! Evaluate every player type that matches participant and get its ID if it matches the Main Player's roster ID;
    datos.forEach((player) => {
      if (player.type == 'participant') {
        if (player.attributes.stats.playerId.includes('ai')) {
          playerList.push({
            name: player.attributes.stats.name,
            placement: player.attributes.stats.winPlace,
            kills: player.attributes.stats.kills,
            assists: player.attributes.stats.assists,
            type: 'robot',
          });
        } else {
          playerList.push({
            name: player.attributes.stats.name,
            placement: player.attributes.stats.winPlace,
            kills: player.attributes.stats.kills,
            assists: player.attributes.stats.assists,
            type: 'user',
          });
        }
        if (player.attributes.stats.name == playerName) {
          data.playerData = {};

          data.playerData.Knocks = player.attributes.stats.DBNOs;
          data.playerData.Assists = player.attributes.stats.assists;
          data.playerData.Damage =
            player.attributes.stats.damageDealt.toFixed(1);
          data.playerData.Headshots = player.attributes.stats.headshotKills;
          data.playerData.Kills = player.attributes.stats.kills;
          data.playerData.LongestKill =
            player.attributes.stats.longestKill.toFixed(1);
          data.playerData.Placement = player.attributes.stats.winPlace;
          data.playerData.Revives = player.attributes.stats.revives;
          data.playerData.RideDistance =
            player.attributes.stats.rideDistance.toFixed(1);
          data.playerData.SurvivedTime = player.attributes.stats.timeSurvived;
        }
      }
    });
    let botAmount = 0;
    let totalPlayers = playerList.length;

    const sortedPlayerList = playerList.sort((a, b) => {
      return a.placement - b.placement;
    });

    playerList.forEach((player) => {
      if (player.type == 'robot') botAmount += 1;
    });

    data.playerData.Players = totalPlayers;
    data.playerData.Bots = botAmount;
    data.name = playerName;
    data.playerList = sortedPlayerList;
    res.render('match', { data: data });
  } else {
    console.log('Match Data not found');
  }
});

module.exports = router;
