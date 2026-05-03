const axios = require("axios");

async function fetchAdzunaJobs({
  country = "gb",
  page = 1,
  keyword = "developer",
  location = "",
} = {}) {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;

  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error("Missing Adzuna credentials");
  }

  const response = await axios.get(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
    {
      params: {
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        what: keyword,
        where: location,
        results_per_page: 10,
      },
    }
  );

  return response.data.results || [];
}

module.exports = fetchAdzunaJobs;
