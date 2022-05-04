const { escapeRegExpChars } = require('ejs/lib/utils');
const fetch = require('node-fetch');
const { forEach } = require('underscore');
const express = require('express');
const router = express.Router();
require('dotenv').config();
const Datastore = require('nedb');

const api_key = process.env.API_KEY;
const database = new Datastore('database.db');
database.loadDatabase();

router.get('/', (req, res) => {
  res.send('Players Page');
});

router.post('/', (req, res) => {
  playerName = req.body.playerName;
  playerPlatform = req.body.platform;

  res.redirect(
    `/players/playerData?platform=${playerPlatform}&playerName=${playerName}`
  );
});

router.post('/matches', (req, res) => {
  console.log(req.query);
  console.log('Matches request!');
  res.render('matches');
});

router.get('/playerData', async (req, res) => {
  console.log('Request...');

  playerName = req.query.playerName;
  playerPlatform = req.query.platform;

  options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + api_key,
    },
  };
  try {
    const playerId_url = `https://api.pubg.com/shards/${playerPlatform}/players?filter[playerNames]=${playerName}`;
    const playerId_response = await fetch(playerId_url, options);
    console.log(playerId_response.status);
    if (playerId_response.status === 200) {
      console.log(`Fetch Success: ${playerName} ${playerPlatform}`);
      const timestamp = Date.now();
      const playerData = {
        user: playerName,
        platform: playerPlatform,
      };
      playerData.timestamp = timestamp;
      database.insert(playerData);
      let lastMatchId;
      const playerId_data = await playerId_response.json();
      const playerId = playerId_data.data[0].id;
      try {
        lastMatchId = playerId_data.data[0].relationships.matches.data[0].id;
      } catch (e) {}

      if (!lastMatchId) {
        console.log('No last match found');
      }
      const match_url = `https://api.pubg.com/shards/${playerPlatform}/matches/${lastMatchId}`;
      const match_response = await fetch(match_url, options);
      const match_data = await match_response.json();

      const lifetime_url = `https://api.pubg.com/shards/${playerPlatform}/players/${playerId}/seasons/lifetime`;
      const lifetime_response = await fetch(lifetime_url, options);
      const lifetime_data = await lifetime_response.json();

      const weapons_url = `https://api.pubg.com/shards/${playerPlatform}/players/${playerId}/weapon_mastery`;
      const weapons_response = await fetch(weapons_url, options);
      const weapons_data = await weapons_response.json();

      const survival_url = `https://api.pubg.com/shards/${playerPlatform}/players/${playerId}/survival_mastery`;
      const survival_response = await fetch(survival_url, options);
      const survival_data = await survival_response.json();

      //* -------------------- Getting last 10 Matches for Player ------------------------

      let playerRecentStats = [];
      let last10Query = playerId_data.data[0].relationships.matches.data;
      let last10Matches = [];
      last10Query.slice(0, 10).forEach((match) => {
        last10Matches.push(match);
      });

      const allPromises = Promise.allSettled(
        last10Matches.map(async (match) => {
          const matchurl = `https://api.pubg.com/shards/${playerPlatform}/matches/${match.id}`;
          const matchresponse = await fetch(matchurl, options);
          const matchdata = await matchresponse.json();

          await matchdata.included.map((player) => {
            if (
              player.type == 'participant' &&
              player.attributes.stats.name == playerName
            ) {
              playerRecentStats.push({
                kills: player.attributes.stats.kills,
                dmgDone: player.attributes.stats.damageDealt,
                knocks: player.attributes.stats.DBNOs,
                date: matchdata.data.attributes.createdAt,
              });
            }
          });

          return playerRecentStats;
        })
      );

      const recentData = await allPromises;

      //*----------------------------------------------------------------
      console.log(match_response.status);

      if (match_response.status === 200) {
        const datos = match_data.included;

        var rosterNames = [];
        var rosterIds = [];
        var rosterInfo = [];
        var rosterKills = [];
        var rosterAssists = [];
        var rosterDmgDealt = [];
        var rosterPlacement = [];

        var target_id;
        //! Evaluate every player type that matches participant and get its ID if it matches the Main Player's roster ID;
        datos.forEach((player) => {
          if (player.type == 'participant') {
            if (player.attributes.stats.name == playerName) {
              target_id = player.id;
            }
          }
        });

        //! Evaluate every player type that matches roster then make an array of IDS for every player
        //! in the roster and compare if atleast one of the ID matches the target_id and push the correct roster ids to an array.
        datos.forEach((player) => {
          if (player.type == 'roster') {
            const participants_id = player.relationships.participants.data;
            participants_id.forEach((id) => {
              if (id.id == target_id) {
                participants_id.forEach((player) => {
                  rosterIds.push(player.id);
                });
              }
            });
          }
        });

        //! Compare the roster IDS to all of the participants ID and if they  match
        //! push the right roster data to player data to the arrays.
        rosterIds.forEach((id) => {
          datos.forEach((player) => {
            if (player.type == 'participant' && player.id == id) {
              participantName = player.attributes.stats.name;
              rosterNames.push(participantName);
              rosterKills.push(player.attributes.stats.kills);
              rosterAssists.push(player.attributes.stats.assists);
              rosterPlacement.push(player.attributes.stats.winPlace);
              rosterDmgDealt.push(player.attributes.stats.damageDealt);
            }
          });
        });

        //! push every item in the arrays to an object.
        let i = 0;
        rosterNames.forEach((player) => {
          rosterInfo.push({
            name: player,
            id: rosterIds[i],
            kills: rosterKills[i],
            assists: rosterAssists[i],
            placement: rosterPlacement[i],
            dmg: rosterDmgDealt[i],
          });
          i++;
        });
        i = 0;
      } else {
        console.log('Match data not found');
      }
      //* ----------------Getting Last Match Data----------------------------

      function gatherLastMatchData() {
        const maps = [
          'Erangel',
          'Paramo',
          'Miramar',
          'Vikendi',
          'Erangel',
          'haven',
          'Camp Jackal',
          'Sanhok',
          'Karakin',
          'taego',
        ];
        const mapsKey = [
          'Baltic_Main',
          'Chimera_Main',
          'Desert_Main',
          'DihorOtok_Main',
          'Erangel_Main',
          'Heaven_Main',
          'Range_Main',
          'Savage_Main',
          'Summerland_Main',
          'Tiger_Main',
        ];

        const matchAttributtes = match_data.data.attributes;
        const matchDuration = matchAttributtes.duration;
        const matchGameMode = matchAttributtes.gameMode;
        let matchMap = matchAttributtes.mapName;
        const matchDate = matchAttributtes.createdAt;

        mapsKey.forEach((map) => {
          if (matchMap == map) {
            matchMap = maps[mapsKey.indexOf(map)];
          }
        });

        lastMatchData = {
          matchDuration: matchDuration,
          matchGameMode: matchGameMode,
          matchMap: matchMap,
          matchDate: matchDate,
          roster: rosterInfo,
        };
      }
      if (match_response.status == 200) {
        gatherLastMatchData();
      } else {
        console.log('Cant Gather last match data');
        lastMatchData = {
          matchDuration: 'Failed',
          matchGameMode: 'Failed',
          matchMap: 'Failed',
          matchDate: 'Failed',
          roster: 'Failed',
        };
      }

      //* ----------------Getting Player Lifetime Data---------------------------------

      function GatherLifetimePlayerData() {
        let totalKills = 0;
        let totalAssists = 0;
        let totalWins = 0;
        let totalLosses = 0;
        let totalRevives = 0;
        let distanceKills = [];
        let longestKill = [];
        let totalRoadKills = 0;
        let totalKnocks = 0;
        let totalDmg = 0;
        let TotalHeadshots = 0;
        const gameModekills = [];

        function playerTotalKills() {
          const gameModes = [
            'duo',
            'duo-fpp',
            'solo',
            'solo-fpp',
            'squad',
            'squad-fpp',
          ];
          const dataQuery = lifetime_data.data.attributes.gameModeStats;
          for (mode in gameModes) {
            totalKills += dataQuery[gameModes[mode]].kills;
            totalAssists += dataQuery[gameModes[mode]].assists;
            totalLosses += dataQuery[gameModes[mode]].losses;
            totalWins += dataQuery[gameModes[mode]].wins;
            totalRevives += dataQuery[gameModes[mode]].revives;
            totalRoadKills += dataQuery[gameModes[mode]].roadKills;
            totalKnocks += dataQuery[gameModes[mode]].dBNOs;
            TotalHeadshots += dataQuery[gameModes[mode]].headshotKills;
            totalDmg += dataQuery[gameModes[mode]].damageDealt;
            gameModekills.push([
              gameModes[mode],
              dataQuery[gameModes[mode]].kills,
            ]);
          }
          for (mode in gameModes) {
            distanceKills.push(dataQuery[gameModes[mode]].longestKill);
          }

          longestKill = distanceKills.sort((a, b) => {
            return b - a;
          });
        }
        playerTotalKills();

        let playerOverall = {
          longestkill: longestKill[0],
          kills: totalKills,
          assists: totalAssists,
          losses: totalLosses,
          wins: totalWins,
          revives: totalRevives,
          dmg: totalDmg,
          knocks: totalKnocks,
          roadkills: totalRoadKills,
          gameModekills: gameModekills,
          headshots: TotalHeadshots,
        };
        return playerOverall;
      }
      GatherLifetimePlayerData();
      playerOverallStats = GatherLifetimePlayerData();
      //*------------------------Getting Survival Player Data --------------------
      function GatherSurvivalPlayerData() {
        let playerOverview = {};
        let playerLevel = survival_data.data.attributes.level;
        let playerTop10s = survival_data.data.attributes.stats.top10;
        let playerTotalMatches =
          survival_data.data.attributes.totalMatchesPlayed;

        playerOverview = {
          level: playerLevel,
          top10: playerTop10s,
          totalmatches: playerTotalMatches,
          platform: playerPlatform,
          playernick: playerName,
        };
        return playerOverview;
      }
      GatherSurvivalPlayerData();
      playerOverviewData = GatherSurvivalPlayerData();
      //* -----------------------Gettings Player Weapon Stats ---------------------
      function playerWeaponStats() {
        let realWeaponNames = [
          'ACE32',
          'AKM',
          'AUG',
          'AWM',
          'Berreta686',
          'BerylM762',
          'BizonPP19',
          'Crossbow',
          'DP12',
          'DP28',
          'DesertEagle',
          'SLR',
          'G18',
          'G36C',
          'Groza',
          'M416',
          'K2',
          'Kar98k',
          'Lynx AMR',
          'M16A4',
          'M9',
          'M24',
          'M249',
          'M1911',
          'MG3',
          'MP5K',
          'Mini14',
          'Mk12',
          'Mk14',
          'Mk47Mutant',
          'Mosin-Nagant',
          'R1895',
          'P90',
          'QBU88',
          'QBZ95',
          'R45',
          'SCAR-L',
          'SKS',
          'Saiga12',
          'Sawed-off',
          'Thompson',
          'UMP',
          'UZI',
          'VSS',
          'Vector',
          'Win1894',
          'Winchester',
          'Skorpion',
        ];
        let weaponsData = weapons_data.data.attributes.weaponSummaries;
        let weaponStats = [];
        let top10Weapons = [];
        let weaponsObj = [];
        for (weapon in Object.values(weaponsData)) {
          weaponStats.push([
            Object.keys(weaponsData)[weapon],
            Object.values(weaponsData)[weapon].StatsTotal.Kills,
            Object.values(weaponsData)[weapon].StatsTotal.HeadShots,
            Object.values(weaponsData)[weapon].LevelCurrent,
            realWeaponNames[weapon],
          ]);
        }
        //! Sort weapons by most kills
        let sortedWeapons = weaponStats.sort((a, b) => {
          return b[1] - a[1];
        });

        for (let i = 0; i < 10; i++) {
          top10Weapons.push(sortedWeapons[i]);
        }

        top10Weapons.forEach((weapon) => {
          weaponsObj.push({
            name: weapon[4],
            weapon: weapon[0],
            kills: weapon[1],
            headShots: weapon[2],
            level: weapon[3],
          });
        });

        return weaponsObj;
      }
      playerWeaponStats();
      best10Weapons = playerWeaponStats();

      if (recentData.length > 0) {
        let mainData = {
          top10weapons: best10Weapons,
          overview_data: playerOverviewData,
          stats: playerOverallStats,
          lastmatch: lastMatchData,
          recentStats: recentData[0].value,
        };
        res.render('dash', { user: mainData });
      } else {
        let mainData = {
          top10weapons: best10Weapons,
          overview_data: playerOverviewData,
          stats: playerOverallStats,
          lastmatch: lastMatchData,
          recentStats: 'Failed',
        };
        res.render('dash', { user: mainData });
      }
      console.log('Rendering Page...');
    } else if (playerId_response.status === 429) {
      res.render('manyRequests', { error: playerId_response.status });
    } else if (
      playerId_response.status === 400 ||
      playerId_response.status === 404 ||
      playerId_response.status === 401
    ) {
      res.render('notfound', { error: playerId_response.status });
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
