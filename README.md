# Fable

<!-- User badges  -->

[![Discord Bot Invite](https://img.shields.io/badge/Add%20Fable%20to%20Your%20Server-blue?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/api/oauth2/authorize?client_id=1041970851559522304&scope=applications.commands)

[![Discord Support Server](https://img.shields.io/discord/992416714497212518?label=Official%20Discord%20Server&style=for-the-badge)][discord]

<!-- Development badges -->

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ker0olos/fable/deno.yml?branch=main&style=for-the-badge&label=tests)](https://github.com/ker0olos/fable/actions/workflows/deno.yml)
[![Codecov](https://img.shields.io/codecov/c/gh/ker0olos/fable/main?style=for-the-badge&token=3C7ZTHzGqC)](https://codecov.io/github/ker0olos/fable)

Fable is a free, open-source _anime_[^1] gacha bot — a simple, powerful Mudae
alternative. Like Mudae, you can roll anime characters. Unlike Mudae, there's no
premiums, and no pay-to-win bullshit.

> **Note** The bot is still experimental. Core features might be missing.

There's a intuitive system to manage and customize the characters in your
servers, you can install community-made packs that are full of new characters
with one single command (That's if our default anime[^1] library is not enough
for you!)

> **TODO** too much plain text (no one is gonna read all this) we need some
> images and animations
>
> **Note** This README only lists what is already stable, which is so far just
> the packs feature, the game modes and the rates are still being worked on.

<!-- You can also overwrite the builtin characters with your own images, aliases, and
descriptions, and fully personalize your characters, that's when you roll them,
of course. -->

Fable is actively developed with new game modes and features being releasing.

[^1]: Currently the default packs include anime/manga/manhwa/vtubers, but you
can add other packs, for example video game characters or real life celebrities.
You can also disable the anime packs entirety (Incase it's a sport server or
something, we try our best to keep the bot itself term naturel).

## Get involved

- Star this repo.
- Join us on [Discord][discord].
- [Contribute][contributing] — join us in building Fable, through writing code,
  [sharing your thoughts][discord], or telling others about us.

## FAQ

<!-- > How to add a new pack to my server? -->

<!-- > How to disable/remove a pack from my server? -->

<!-- > How are you create a pack from scratch? -->

> How are you keeping Fable free?

We're using serverless for the servers and the database, which is much cheaper
to maintain. If it ever starts hurting our wallet, we'll have to actively ask
for support, but no one is getting special rewards for donations, worst-case
we'll have to offer cosmetics; tl;dr Fable will always remain 100% free.

## Credits

Our core team who are responsible for reviewing code and making decisions on the
direction of the project:

- [@ker0olos](https://github.com/ker0olos) — Kerolos Zaki (aka. Wholesome) —
  Wholesome#6355

- This project wouldn't been possible without [Deno][deno]. Want to learn about
  running discord bots with low-cost? Check the official guide at
  <https://deno.com/deploy/docs/tutorial-discord-slash>

- Checkout our friends at <https://anilist.co>. Your support will mean a lot to
  them. Tracking your anime through their app might just help you rank up your
  favorite characters to 5 stars faster.

[discord]: https://discord.gg/ceKyEfhyPQ
[contributing]: ./CONTRIBUTING.md
[deno]: https://deno.land/
