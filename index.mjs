import { Client, GatewayIntentBits } from "discord.js";
import { initPlayer } from "./src/jobs/player.mjs";
import {Configurator} from  'roberta'
import { initAutoDelete } from "./src/jobs/autoDelete.mjs";

const cfg = new Configurator()
const client =  new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once("ready",(e)=>{
    console.log(e.user.username)
    initPlayer(client)
    // initAutoDelete(client)
})

client.login(cfg.get("dsc_token","teste"))