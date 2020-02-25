```
5.6C 74% 12kt|🌧 Possible drizzle stopping in 4 min.
Prb|▇▄▁_                       ___|6:13
0.3|▆▄▃▃▃▁                  ▃▄▄▅▆█|
```

# 🌈 hl-weather-box

GitHub Action for injecting hyperlocal weather from Dark Sky into a gist.

---
> 📌✨ For more pinned-gist projects like this one, check out: https://github.com/matchai/awesome-pinned-gists

## ✨ Inspiration

[Powered by Dark Sky](https://darksky.net/poweredby)

## 🎒 Prep Work
1. Create a new public GitHub Gist (https://gist.github.com/)
1. Create a token with the `gist` scope and copy it. (https://github.com/settings/tokens/new)
1. Create a Dark Sky account (https://darksky.net/dev/register)
1. Copy the `Dark Sky API Secret Key`

## 🖥 Project Setup
1. Fork this repo
1. Go to your fork's `Settings` > `Secrets` > `Add a new secret` for each environment secret (below)

## 🤫 Environment Secrets
- **gist_id:** The ID portion from your gist url `https://gist.github.com/<github username>/`**`6d5f84419863089a167387da62dd7081`**.
- **gh_token:** The GitHub token generated above.
- **darksky_key:** The API secret key from Dark Sky from above.
- **location:** latitude,longitude (e.g.: **51.509865,-0.118092**).

## 💸 Donations

Feel free to use the GitHub Sponsor button to donate towards my work if you're feeling generous <3
