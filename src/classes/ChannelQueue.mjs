import { createAudioPlayer, joinVoiceChannel } from "@discordjs/voice";
import Music from "./Music.mjs";

class ChannelQueue {
    /**
     * @type {Music[]}
     */
    queue = []
    index = 0
    /**
     * @type {"idle"|"playing"}
     */
    state = 'idle'
    constructor(message) {
        this.player = createAudioPlayer();
        this.connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        });

        this.connection.removeAllListeners()
        this.player.removeAllListeners()
        this.connection.subscribe(this.player)

        this.connection.on("stateChange", (o, n) => {
            if (n.status == "disconnected") this.onDisconnect()
        })

        this.onDisconnect = () => null
        this.onError = (err) => null

        /**
         * @param {Music} music 
         * @returns 
         */
        this.onTrackStart = (music) => null;
        this.onStop = () => null;
        this.onAutoStop = () => null

        this.player.on("stateChange", async (playerOldState, playerNewState) => {
            // Se o status antigo do player for "playing" e o novo for "idle", alem do estado da queue for "playing", sera usado o next()
            if (playerOldState.status != 'autopaused' && playerNewState.status == 'playing') {
                this.onTrackStart(this.queue[this.index])
                return
            }

            if (playerOldState.status == 'playing' && playerNewState.status == 'idle' && this.state == 'playing') {
                this.next()
            }
        })
    }

    async play(newMusic) {
        try {

        
        const music = new Music(newMusic)
        this.queue.push(music)

        if (this.state != "playing") {
            this.state = "playing"
            await waitForDownload(this.queue[this.index])
            let resource = this.queue.at(this.index)?.resource
            if (resource)
                this.player.play(this.queue[this.index].resource)
            else this.next()
        }
    }
        catch (error) {
            this.onError(error)
        }
    }

    stop(isAutomatic) {
        try {
            this.state = 'idle'
            this.player.stop()
            this.queue = []
            this.index = 0
            if (isAutomatic) {
                this.onAutoStop()
            }
            else {
                this.onStop()
            }
        } catch (error) {
            this.onError(error)
        }
    }

    async next() {
        try {
            if (this.queue.length - 1 === this.index) {
                this.stop(true)
                return;
            }
            await waitForDownload(this.queue[this.index])
            this.index++
            await waitForDownload(this.queue[this.index])
            this.player.play(this.queue[this.index].resource)
        } catch (error) {
            this.onError(error)
        }
    }

    kill() {
        this.connection.destroy()
        this.player.removeAllListeners()
        this.state = 'killed'
    }
}

async function waitForDownload(music) {
    let attempts = 0
    await new Promise((res, rej) => {
        if (music.resource) res(music.resource)

        const re_interv = setInterval(() => {
            if (music.resource) {
                clearInterval(re_interv)
                res(music.resource)
            }
            if (attempts > 20) {
                console.log("AUTOKILLWAIT")
                rej()
            }
        }, 1000)
    })
    return
}

export default ChannelQueue
