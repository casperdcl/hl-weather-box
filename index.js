const { Octokit } = require("@octokit/rest");
const fetch = require("node-fetch");

const {
  INPUT_GIST_ID: gistID,
  INPUT_GH_TOKEN: ghToken,
  INPUT_DARKSKY_KEY: dSKey,
  INPUT_LOCATION: loc,
  INPUT_UNITS: units
} = process.env;

const blocks = " _▁▂▃▄▅▆▇█";
const icons = {
  rain: "🌧",
  snow: "❄",
  sleet: "🌨", // cloud snow
  wind: "🌬", // wind face
  fog: "🌫",
  cloudy: "☁",
  clear_day: "🌣",
  clear_night: "✨", // sparkles
  partly_cloudy_day: "🌥",
  partly_cloudy_night: "●", // black circle
  // maybe unused
  hail: "⛈", // cloud thunder rain
  thunderstorm: "🌩",
  tornado: "🌪",
  // unused
  cloud_snow: "🌨",
  cloud_sun_rain: "🌦",
  cloud_thunder: "🌩",
  cloud_thunder_rain: "⛈"
};

const API_BASE = "https://api.darksky.net/forecast/";

async function main() {
  if (!gistID || !ghToken || !dSKey || !loc)
    throw new Error(
      "Must supply INPUT_(GIST_ID,GH_TOKEN,DARKSKY_KEY,LOCATION)."
    );
  const u = units ? units : "si";
  const API = `${API_BASE}${dSKey}/${loc}?units=${u}&exclude=hourly,daily`;

  const json = await fetch(API).then(data => data.json());
  // console.debug(json);  // N.B.: contains private location

  // TODO: use flags, offset, alerts, currently.(
  //   summary icon precipIntensity precipIntensityError precipProbability
  //   precipType temperature apparentTemperature dewPoint humidity pressure
  //   windSpeed windGust windBearing cloudCover uvIndex visibility ozone)
  let icon = icons[json.minutely.icon.replace("-", "_")];
  if (!icon) icon = icons.sun;
  let intensities = [];
  let probStr = "";
  json.minutely.data.forEach(minute => {
    intensities.push(minute.precipIntensity);
    probStr +=
      blocks[Math.round(minute.precipProbability * (blocks.length - 1))];
  });
  let intensMax = Math.max.apply(Math, intensities);
  if (!intensMax) intensMax = 1;
  let intenStr = "";
  intensities.forEach(i => {
    intenStr += blocks[Math.round((i / intensMax) * (blocks.length - 1))];
  });

  let lines = [];
  let { temperature, humidity, windSpeed } = json.currently;
  temperature = Math.round(temperature * 10) / 10;
  humidity = Math.round(humidity * 100);
  windSpeed = Math.round(windSpeed * 1.943844); // knots
  lines.push(
    `${temperature}C ${humidity}% ${windSpeed}kt|${icon} ${json.minutely.summary}`
  );
  lines.push(probStr);
  lines.push(intenStr);

  console.log(lines.join("\n"));

  const octokit = new Octokit({
    auth: `token ${ghToken}`
  });
  let gist;
  try {
    gist = await octokit.gists.get({
      gist_id: gistID
    });
  } catch (error) {
    console.error(`Failed to get gist:\n${error}`);
  }

  try {
    const filename = Object.keys(gist.data.files)[0];
    await octokit.gists.update({
      gist_id: gistID,
      files: {
        [filename]: {
          filename: `${icon} Hyperlocal Weather`,
          content: lines.join("\n")
        }
      }
    });
  } catch (error) {
    console.error(`Unable to update gist\n${error}`);
  }
}

(async () => {
  await main();
})();
