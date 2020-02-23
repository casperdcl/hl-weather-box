const { Octokit } = require("@octokit/rest");
const fetch = require("node-fetch");

const {
  INPUT_GIST_ID: gistID,
  INPUT_GH_TOKEN: ghToken,
  INPUT_DARKSKY_KEY: dSKey,
  INPUT_LOCATION: loc,
  INPUT_UNITS: units
} = process.env;

const API_BASE = 'https://api.darksky.net/forecast/';

async function main() {
  if (!gistID || !ghToken || !dSKey || !loc)
    throw new Error('Must supply INPUT_(GIST_ID,GH_TOKEN,DARKSKY_KEY,LOCATION).');
  let u;
  if (!units) {
    u = 'si';
  } else {
    u = units;
  }
  const API = `${API_BASE}${dSKey}/${loc}?units=${u}&exclude=hourly,daily`;

  const json = await fetch(API).then((data) => data.json());
  // console.debug(json);  // N.B.: contains private location

  // TODO: use flags, offset, alerts, minutely.icon, currently.(
  //   summary icon precipIntensity precipIntensityError precipProbability
  //   precipType temperature apparentTemperature dewPoint humidity pressure
  //   windSpeed windGust windBearing cloudCover uvIndex visibility ozone)
  let intensities = [];
  let probabilities = [];
  json.minutely.data.forEach((minute) => {
    intensities.push(minute.precipIntensity);
    probabilities.push(minute.precipProbability);
  });

  let lines = [];
  lines.push(json.minutely.summary);
  lines.push("TODO: precipitation intensities & probabilities");
  lines.push("https://darksky.net/poweredby/");  // Powered by Dark Sky

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
          filename: `Hyperlocal Weather`,
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
