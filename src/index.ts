import { importURLToString } from "./utils/functions/importURLToString";
import { enableRepl, isProd, shardingMode, shardsCount } from "./config";
import { RawonLogger } from "./utils/structures/RawonLogger";
import { ShardingManager } from "discord.js";
import { resolve } from "path";
import { start } from "repl";
import "dotenv/config";

const log = new RawonLogger({ prod: isProd });

const manager = new ShardingManager(resolve(importURLToString(import.meta.url), "bot.js"), {
    totalShards: shardsCount,
    respawn: true,
    token: process.env.DISCORD_TOKEN,
    mode: shardingMode
});

if (enableRepl) {
    const repl = start({
        prompt: "> "
    });

    repl.context.shardManager = manager;
    process.stdin.on("data", _ => {
        repl.displayPrompt(true);
    });
    repl.on("exit", () => {
        process.exit();
    });
}

manager.on("shardCreate", shard => {
    log.info(`[ShardManager] Shard #${shard.id} Spawned.`);
    shard.on("disconnect", () => {
        log.warn("SHARD_DISCONNECTED: ", { stack: `[ShardManager] Shard #${shard.id} has disconnected.` });
    }).on("reconnection", () => {
        log.info(`[ShardManager] Shard #${shard.id} has reconnected.`);
    });
    if (manager.shards.size === manager.totalShards) log.info("[ShardManager] All shards are spawned successfully.");
}).spawn().catch(e => log.error("SHARD_SPAWN_ERR: ", e));
