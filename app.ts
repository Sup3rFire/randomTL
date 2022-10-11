import { config } from "https://deno.land/x/dotenv/mod.ts";

function getRandomValue<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function getReplayIds(userId: string): Promise<string[]> {
  return (
    await (
      await fetch(`https://ch.tetr.io/api/streams/league_userrecent_${userId}`)
    ).json()
  ).data.records.map((record: { replayid: string }) => record.replayid);
}

const idList = [
  "5fb0b7183a6a8b21b897e660", // kez
  "5e7cbb652932b46c9c671ce4", // diao
  "5e844b0868270e617d52c990", // cz
  "5e436daf368a5d2489fbf848", // star
  "5eb11da1e47b643b5d12e5f1", // kazu
  "5f5dbcc4454e942b4fdfc5fa", // vonce
  "5e697bbf77aba60f95fb38da", // fs
  "5e3f6ebe3dacc16dbc4dd6aa", // doremy
  "6049c31e25f490b0cb7559c4", // feesh
  "5ed890931bba6a519bfd4db4", // frenZ
  "5f19118f03a6e76c187c9a69", // amka
  "5ed99d387dd5287740926a6d", // akrin
  "615fb20fe17beeef45104302", // ballrg
];

let randomId = getRandomValue(idList);

let [prevIds, replayIds] = await Promise.all([
  Deno.readTextFile("./previous.csv")
    .then((file) => file.split("\n"))
    .catch(() => [""]),
  getReplayIds(randomId),
]);

prevIds.pop();

replayIds = replayIds.filter((id) => !prevIds.includes(`${randomId},${id}`));

while (replayIds.length <= 0) {
  randomId = getRandomValue(idList);
  replayIds = await getReplayIds(randomId).then((replayIds) =>
    replayIds.filter((id) => !prevIds.includes(`${randomId},${id}`))
  );
}

const replayId = getRandomValue(replayIds);

let data = (
  await fetch(`https://tetr.io/api/games/${replayId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config().TOKEN}`,
    },
  }).then((req) => req.json())
).game;

const username = data.endcontext.filter(
  (x: { user: { username: string; _id: string } }) => x.user._id == randomId
)[0].user.username;

data = JSON.stringify(data).replaceAll(username, "serichii");

Deno.writeTextFileSync("./replay.ttrm", data);
Deno.writeTextFileSync("./previous.csv", `${randomId},${replayId}\n`, {
  append: true,
});
