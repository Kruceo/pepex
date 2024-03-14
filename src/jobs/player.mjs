import { Client } from "discord.js";
import ChannelQueue from "../classes/ChannelQueue.mjs";
import fs from 'fs'
import { Readable, pipeline } from "stream";
if (!fs.existsSync("./src/external/yt-dlp")) {
    console.log("yt-dlp not exists...\nDownloading...")
    const downloadUrl = "https://github.com/yt-dlp/yt-dlp/releases/download/2024.03.10/yt-dlp_linux"
    const res = await fetch(downloadUrl)
    if (!res.ok) {
        console.error("Download fail")
        process.exit()
    }
    await new Promise(resolve=>{
        const fileWriter = fs.createWriteStream("./src/external/yt-dlp")
        Readable.fromWeb(res.body).pipe(fileWriter).on("finish",()=>{
            
            resolve()
        })

    })
}

if((fs.statSync("./src/external/yt-dlp").mode) != 33261){
    console.log("Adding execution permission to yt-dlp")
    fs.chmodSync("./src/external/yt-dlp",33261)
}

/**
 * @type {Map<string,ChannelQueue>}
 */
const usersMap = new Map()

/**
 * 
 * @param {Client<true>} client 
 */

export function initPlayer(client) {
    
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        const arg = message.content.toLowerCase().split(/ +/)
        const argString = sanitize(message.content.replace(/^.+? /, ''))
        const command = arg.shift().toLowerCase();

        if (command === '!play' || command == 'toca') {

            message.reply("Adicionado á fila meu rei!")

            const channelID = message.member.voice.channelId
            if (!usersMap.has(channelID)) usersMap.set(channelID, new ChannelQueue(message))

            const channelQueue = usersMap.get(channelID)

            channelQueue.onError = (err) => {
                message.channel.send("Deu ruim com essa dai.")
                console.log(err)
            }

            channelQueue.onDisconnect = () => {
                message.channel.send("Caindo fora!")
                clearTimeout(channelQueue.exitTimeout)
                channelQueue.kill()
                usersMap.delete(channelID)
            }

            channelQueue.onTrackStart = (music) => {
                message.channel.send(`Tocando \`${music.musicName}\``)
            }
            channelQueue.onAutoStop = () => message.channel.send("Não tem mais nada na fila parsa.")
            // configure disconnect timeout
            clearTimeout(channelQueue.exitTimeout)
            channelQueue.exitTimeout = setTimeout(() => {
                console.log("Disconnecting", channelID)
                channelQueue.kill()
                usersMap.delete(channelID)
            }, 1000 * 60 * 8)

            channelQueue.play(argString)
        }

        if (command === '!next' || command === 'proxima') {

            const channelID = message.member.voice.channelId
            if (!usersMap.has(channelID)) return

            message.reply("Bó pra proxima!")

            const channelQueue = usersMap.get(channelID)

            channelQueue.next()
        }
        if (command === '!stop' | command === 'para') {

            const channelID = message.member.voice.channelId
            if (!usersMap.has(channelID)) return

            message.reply("Parando meu chefe!")
            const channelQueue = usersMap.get(channelID)

            channelQueue.stop()
        }
        if (command === '!panic') {

            const channelID = message.member.voice.channelId
            if (!usersMap.has(channelID)) return

            message.reply(":)")
            usersMap.get(channelID).kill()
            clearInterval(usersMap.get(channelID).exitTimeout)
            usersMap.delete(channelID)
        }

        if (command === '!bigpanic') {

            process.exit(1)
        }
    })

    console.log("Audio Player initialized")
}



function sanitize(str) {
    return str.replace(/\$|\(|\)|\{|\}|\/bin|\-|"|\||\&/g, " ")
}