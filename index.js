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

function block_reduce_sum(array, elems = 2) {
  return array
    .map((val, i, ar) =>
      ar.slice(Math.max(i - elems + 1, 0), i + 1).reduce((x, y) => x + y)
    )
    .filter((val, i) => (i + 1) % elems == 0);
}

function block_reduce_average(array, elems = 2) {
  return block_reduce_sum(array, elems).map(i => i / elems);
}

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
  let probabilities = [];
  let endTime = 0;
  json.minutely.data.forEach(minute => {
    probabilities.push(minute.precipProbability);
    intensities.push(minute.precipIntensity);
    endTime = Math.max(endTime, minute.time);
  });
  endTime = new Date(endTime * 1000);
  probabilities = block_reduce_average(probabilities, 2);
  intensities = block_reduce_average(intensities, 2);

  let intensMax = Math.max.apply(Math, intensities);
  if (!intensMax) intensMax = 1;
  let probStr = "Prb|";
  probabilities.forEach(i => {
    probStr += blocks[Math.round(i * (blocks.length - 1))];
  });
  probStr += `|${endTime.getHours() % 12}:${endTime.getMinutes()}`;
  let intenStr = `${Math.round(intensMax * 10) / 10}|`.padStart(3);
  intensities.forEach(i => {
    intenStr += blocks[Math.round((i / intensMax) * (blocks.length - 1))];
  });
  intenStr += "|";

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
