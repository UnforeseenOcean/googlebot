request = require("request");

module.exports = {
    main: function(bot, msg, settings) {
        var args = msg.content;
        args = args.replace(/(who|what|when|where) (was|is|were|are) /gi, '');
        bot.sendMessage(msg, "`Searching...`", function(err, message) {
            console.log("KG: ", msg.server.name, msg.server.id, "|", args, "|", bot.options.shardId);
            var url = `https://kgsearch.googleapis.com/v1/entities:search?key=${settings.config.kgKey}&limit=1&indent=True&query=${args.split(' ').join('+')}`;
            try {
                request(url, function(error, response, body) {
                    try {
                        var kg = JSON.parse(body)['itemListElement'][0]['result'];
                        console.log()
                        let final = `**${kg.name} (${kg['@type'][0]})**
${kg.detailedDescription.articleBody}
<${kg.detailedDescription.url}>`;
                        bot.updateMessage(message, final);
                    } catch (err) {
                        //bot.updateMessage(message, '`No results found`');
                        message.delete();
                        settings.commands.search.main(bot, msg, settings);
                    }
                });
            } catch (err) {
                //bot.updateMessage(message, '`No results found`');
                message.delete();
                settings.commands.search.main(bot, msg, settings);
            }
        });
    },
    args: '<query>',
    help: 'knowledge graph'
};
