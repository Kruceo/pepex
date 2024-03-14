import { Client } from "discord.js";

/**
 * 
 * @param {Client<true>} client 
 */

export function initAutoDelete(client) {
    client.on("messageCreate", (message) => {

        if (message.content.startsWith("!") || message.author.bot) {
            setTimeout(async () => {
                const fetchedMsg = (await message.channel.messages.fetch()).get(message.id)
                // return;
                if (fetchedMsg)
                    message.delete()
            }, 12000)
        }
    })
}