const Discord = require('discord.js');
const chalk = require('chalk');
const unirest = require('unirest');

const config = require('./config.json');

const manager = new Discord.ShardingManager('./googlebot.js');

manager.log = function () {
  console.log('⚠️ ', chalk.yellow('MASTER'), ...arguments);
}

manager.spawn(4);

const stats = {};

const backend = require('./google-util')(manager, stats);

manager.on('message', (shard, message) => {
  if (message.type) {
    switch(message.type) {
      case "fetchServerCount":
        updateCount();
        break;
      case "fetchUserCount":
        manager.fetchClientValues('users.size').then(results => {
          let total = results.reduce((prev, val) => prev + val, 0);
          manager.broadcast({type: 'userCount', content: total});
          stats.userCount = total;
        });
        break;
      case "fetchChannelCount":
        manager.fetchClientValues('channels.size').then(results => {
          let total = results.reduce((prev, val) => prev + val, 0);
          manager.broadcast({type: 'channelCount', content: total});
          stats.channelCount = total;
        });
        break;
      default:
        break;
    }
    if (message.type.includes('stats')) {
      manager.emit('stats', stats);
    }
  }
});

manager.on('launch', shard => {
  manager.log(`NEW SHARD ${shard.id}`);
  if (manager.totalShards === manager.shards.size) {
    updateCount();
    manager.log('ALL SHARDS RUNNING!');
  }
});

const updateCount = () => {
  manager.fetchClientValues('guilds.size').then(results => {
    let total = results.reduce((prev, val) => prev + val, 0);
    manager.broadcast({type: 'serverCount', content: total});
    stats.serverCount = total;
    updateCarbon(total);
    updateAbal(total);
  });
}

const updateCarbon = count => {
  console.log('updating carbon');
  unirest.post('https://www.carbonitex.net/discord/data/botdata.php')
  .headers({'Content-Type': 'multipart/form-data', 'cache-control': 'no-cache'})
  .field('key', config.carbon)
  .field('servercount', count)
  .end(res => {
    console.log(res.body);
  });
};

const updateAbal = count => {
  console.log('updating abal');
  unirest.post('https://bots.discord.pw/api/bots/187406062989606912/stats')
  .headers({
    'Content-Type': 'application/json',
    'Authorization': config.abal
  })
  .send({'server_count': count})
  .end(res => {
    console.log(res.body);
  })
};
