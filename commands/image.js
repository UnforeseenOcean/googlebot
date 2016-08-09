request = require("request");
var r = require('rethinkdb');

module.exports = {
    main: function(bot, msg, settings) {
        var args = msg.content;
        safe_map = {
            1: "off",
            2: "medium",
            3: "high"
        };
        bot.sendMessage(msg, "`Searching...`", function(err, message) {
            var key = settings.KEYS[settings.lastKey + 1];
            r.db('google').table('servers').get(msg.server.id).run(settings.dbconn, function(err, thing) {
                if (thing === null) {
                    safe_setting = 'medium'
                } else {
                    safe_setting = safe_map[parseInt(thing.nsfw)];
                }
                var safe = (msg.channel.name.includes("nsfw") ? "off" : safe_setting);
                console.log("Image: ", msg.server.name, msg.server.id, "|", args, "|", safe, "|", bot.options.shardId, "|", key, settings.lastKey + 1);
                r.db('google').table('images').get(args).run(settings.dbconn, function(err, result) {
                    switch (result) {
                        default: try {
                            if (new Date().getTime() - parseInt(result.time) < settings.cacheTime)
                                bot.updateMessage(message, result.result)
                            break;
                        } catch (err) {}
                        case null:
                                var url = "https://www.googleapis.com/customsearch/v1?key=" + key + "&cx=" + settings.config.cxImg + "&safe=" + safe + "&searchType=image&q=" + encodeURI(args);
                            request(url, function(error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    try {
                                        bot.updateMessage(message, JSON.parse(body)['items'][0]['link']);
                                        r.db('google').table('images').insert({
                                            id: args,
                                            result: JSON.parse(body)['items'][0]['link'],
                                            time: new Date().getTime()
                                        }).run(settings.dbconn);
                                    } catch (err) {
                                        bot.updateMessage(message, "`No results found!`");
                                    }
                                } else {
                                    bot.updateMessage(message, "`Internal API Error, Please try again.`");
                                }
                            });
                            settings.lastKey += 1;
                            if (settings.lastKey + 1 >= settings.KEYS.length) settings.lastKey = 0;
                            break;
                    }
                });
            });
        });
    },
    args: '<query>',
    help: 'google things'
};
