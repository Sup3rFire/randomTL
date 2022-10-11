import { config } from "https://deno.land/x/dotenv/mod.ts";

function getRandomValue<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function getReplayIds(userId: string): Promise<string[]> {
  return (
    await fetch(
      `https://ch.tetr.io/api/streams/league_userrecent_${userId}`
    ).then((req) => req.json())
  ).data.records.map((record: { replayid: string }) => record.replayid);
}

const idList = Deno.readTextFileSync("players.csv")
  .split("\n")
  .map((player) => player.split(","));
if (idList[idList.length - 1][0] == "") idList.pop();

let randomId = getRandomValue(idList);

let [prevIds, replayIds] = await Promise.all([
  Deno.readTextFile("./previous.csv")
    .then((file) => file.split("\n"))
    .catch(() => [""]),
  getReplayIds(randomId[0]),
]);
if (prevIds[prevIds.length - 1] == "") prevIds.pop();

replayIds = replayIds.filter((id) => !prevIds.includes(`${randomId[0]},${id}`));

while (replayIds.length <= 0) {
  console.warn(
    `All replays from ${randomId[1]} (${randomId[0]}) already used up.`
  );
  randomId = getRandomValue(idList);
  replayIds = await getReplayIds(randomId[0]).then((replayIds) =>
    replayIds.filter((id) => !prevIds.includes(`${randomId[0]},${id}`))
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
  (x: { user: { username: string; _id: string } }) => x.user._id == randomId[0]
)[0].user.username;

data = JSON.stringify(data).replaceAll(username, "serichii");

Deno.writeTextFileSync("./replay.ttrm", data);
Deno.writeTextFileSync("./previous.csv", `${randomId[0]},${replayId}\n`, {
  append: true,
});
