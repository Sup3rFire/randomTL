const users = await Promise.all(
  Deno.args.map((username) =>
    fetch(`https://ch.tetr.io/api/users/${username}`).then((req) => req.json())
  )
);

for (const user of users) {
  Deno.writeTextFileSync(
    "players.csv",
    `${user.data.user._id},${user.data.user.username}`,
    { append: true }
  );
}
