import { createAudioResource } from "@discordjs/voice"
import path from 'path'
import cp from 'child_process'
import fs from 'fs'
import crypto from 'crypto'

const ytdlpPath = path.resolve("./src", "external", "yt-dlp")
const dataPath = path.resolve("./data")

if(!fs.existsSync("./data"))fs.mkdirSync("./data")

class Music {

    constructor(url) {
        this.url = url
        this.id = createIdByString(url.trim())
        this.searchIndex = 0
        this.filePath = path.resolve(dataPath, `${this.id}_%(title)s.%(ext)s`)
        this.musicName = null
        this.resource = null

        this.cmd = `"${ytdlpPath}" -f bestaudio --no-playlist --match-filter "!is_live & duration < ${10 * 60}" -o "${this.filePath}" "ytsearch${this.searchIndex == 0 ? "" : this.searchIndex}:${this.url}"`
        this.process = null

        this.addProcessListeners = (processP) => {
            processP.stdout.on("data", (d) => {
                console.log(d)
                if (d.trim().endsWith("skipping ..")) {
                    console.log("#### errored", this.searchIndex)
                    processP.kill(1)
                }
            })

            processP.stdout.on("error", (d) => {
                console.log(d)
            })

            processP.on("exit", (d) => {
                if (d != 0) {
                    this.searchIndex += 1
                    if (this.searchIndex > 10) {
                        this.cmd = `"${ytdlpPath}" -f bestaudio --no-playlist --match-filter "!is_live & duration < ${10 * 60}" -o "${this.filePath}" "ytsearch:5 segundos"`
                        this.process = cp.exec(this.cmd)
                        this.addProcessListeners(this.process)
                        return;
                    }
                    this.cmd = `"${ytdlpPath}" -f bestaudio --no-playlist --match-filter "!is_live & duration < ${10 * 60}" -o "${this.filePath}" --playlist-items ${this.searchIndex} "ytsearch${this.searchIndex}:${this.url}"`
                    this.process = cp.exec(this.cmd)
                    this.addProcessListeners(this.process)
                    return;
                }
                const selected = getMusicFileByID(this.id)

                if (!selected) return;

                const name = selected.replace(/(^.+?_)|(\.\w+$)/g, "")
                this.musicName = name

                this.resource = createAudioResource(path.resolve(dataPath, selected))
            })
        }

        //if file already exists, use the file that exists
        const aMusicFileTry = getMusicFileByID(this.id)
        if (aMusicFileTry) {
            console.log("Using cached for " + url)
            this.resource = createAudioResource(path.resolve(dataPath, aMusicFileTry))
            this.musicName = aMusicFileTry.replace(/(^.+?_)|(\.\w+$)/g, "")
            return;
        }
        console.log("Downloading " + url)
        this.process = cp.exec(this.cmd)
        this.addProcessListeners(this.process)

    }

}

function createIdByString(text) {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    const hashString = hash.digest('hex');
    return hashString;
}

function getMusicFileByID(id) {
    const files = fs.readdirSync(dataPath)

    const selected = files.filter(each => each.startsWith(id))[0]
    return selected
}

export default Music