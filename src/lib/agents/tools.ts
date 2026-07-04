interface WeatherResult {
  location: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface YouTubeVideo {
  title: string;
  videoId: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
  publishTime?: string;
  type?: "video" | "playlist";
}

function getWeatherCondition(code: number): string {
  const codes: Record<number, string> = {
    0: "Clear sky ☀️",
    1: "Mainly clear 🌤️",
    2: "Partly cloudy ⛅",
    3: "Overcast ☁️",
    45: "Foggy 🌫️",
    48: "Depositing rime fog 🌫️",
    51: "Light drizzle 🌧️",
    53: "Moderate drizzle 🌧️",
    55: "Dense drizzle 🌧️",
    61: "Slight rain 🌧️",
    63: "Moderate rain 🌧️",
    65: "Heavy rain 🌧️",
    71: "Slight snow fall ❄️",
    73: "Moderate snow fall ❄️",
    75: "Heavy snow fall ❄️",
    77: "Snow grains ❄️",
    80: "Slight rain showers 🌦️",
    81: "Moderate rain showers 🌦️",
    82: "Violent rain showers 🌦️",
    85: "Slight snow showers ❄️⛈️",
    86: "Heavy snow showers ❄️⛈️",
    95: "Thunderstorm ⛈️",
    96: "Thunderstorm with slight hail ⛈️",
    99: "Thunderstorm with heavy hail ⛈️",
  };
  return codes[code] || "Cloudy ☁️";
}

// weather tool
export async function getWeather(
  location: string,
): Promise<WeatherResult | { error: string }> {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location,
    )}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return { error: `Location '${location}' not found.` };
    }

    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (!weatherData.current) {
      return { error: `Failed to fetch weather for ${name}.` };
    }

    const curr = weatherData.current;
    return {
      location: `${name}, ${country}`,
      temperature: curr.temperature_2m,
      apparentTemperature: curr.apparent_temperature,
      humidity: curr.relative_humidity_2m,
      windSpeed: curr.wind_speed_10m,
      precipitation: curr.precipitation,
      condition: getWeatherCondition(curr.weather_code),
    };
  } catch (error: any) {
    console.error("Weather error:", error);
    return { error: `Failed to fetch weather: ${error.message}` };
  }
}

// web search tool
export async function webSearch(
  query: string,
): Promise<SearchResult[] | { error: string }> {
  const tavilyKey = process.env.TAVILY_API_KEY;

  if (tavilyKey) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          max_results: 5,
        }),
      });
      const data = await res.json();
      if (data.results) {
        return data.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
        }));
      }
    } catch (error: any) {
      console.error("Tavily Search Error, falling back...", error);
    }
  }

  // Fallback to duck duck go
  try {
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );
    const html = await res.text();
    const results: SearchResult[] = [];

    // Parse DDG HTML results manually
    const resultBlockRegex = /<div class="result__body">([\s\S]*?)<\/div>/g;
    let match;
    let count = 0;

    while ((match = resultBlockRegex.exec(html)) !== null && count < 5) {
      const content = match[1];

      // Extract URL & Title
      const urlTitleRegex =
        /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/;
      const urlTitleMatch = urlTitleRegex.exec(content);

      // Extract Snippet
      const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/;
      const snippetMatch = snippetRegex.exec(content);

      if (urlTitleMatch) {
        let rawUrl = urlTitleMatch[1];
        // Clean redirect URLs from DDG e.g., //duckduckgo.com/l/?uddg=https%3A%2F%2F...
        if (rawUrl.includes("uddg=")) {
          const matchUddg = /uddg=([^&]+)/.exec(rawUrl);
          if (matchUddg) {
            rawUrl = decodeURIComponent(matchUddg[1]);
          }
        }

        const title = urlTitleMatch[2].replace(/<[^>]*>/g, "").trim();
        const snippet = snippetMatch
          ? snippetMatch[1].replace(/<[^>]*>/g, "").trim()
          : "No description available.";

        results.push({
          title: title || "Web Page",
          url: rawUrl,
          snippet: snippet,
        });
        count++;
      }
    }

    if (results.length > 0) {
      return results;
    }

    return { error: "No search results found. (DuckDuckGo parsed empty list)" };
  } catch (error: any) {
    console.error("DDG search fallback error:", error);
    return { error: `Search failed: ${error.message}` };
  }
}

// Channel IDs for each educator
const CHANNELS = {
  chaiaurcode: "UCNQ6FEtztATuaVhZKCY28Yw", // @chaiaurcode
  hitesh: "UCXgGY0wkgOzynnHvSEVmE3A", // @HiteshCodeLab
  piyush: "UCf9T51_FmMlfhiGpoes0yFA", // @piyushgargdev
};

const CHANNEL_PRIORITY: Record<string, string[]> = {
  piyush: [CHANNELS.piyush, CHANNELS.chaiaurcode, CHANNELS.hitesh],

  default: [CHANNELS.chaiaurcode, CHANNELS.hitesh, CHANNELS.piyush],
};

// youtube tool
export async function searchYouTube(
  query: string,
  persona: string = "hitesh",
): Promise<YouTubeVideo[] | { error: string }> {
  const youtubeKey = process.env.YOUTUBE_API_KEY;

  if (!youtubeKey) {
    return {
      error:
        "YouTube API Key is missing. Please configure YOUTUBE_API_KEY in your .env.local file.",
    };
  }

  const channels = CHANNEL_PRIORITY[persona] ?? CHANNEL_PRIORITY.default;

  try {
    for (const channelId of channels) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query,
        )}&type=video,playlist&channelId=${channelId}&maxResults=4&key=${youtubeKey}`;
        console.log("Searching YouTube URL:", url);

        const res = await fetch(url);
        const data = await res.json();

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          return data.items.map((item: any) => {
            const isPlaylist = item.id.kind === "youtube#playlist";
            const id = isPlaylist ? item.id.playlistId : item.id.videoId;
            const url = isPlaylist
              ? `https://www.youtube.com/playlist?list=${id}`
              : `https://www.youtube.com/watch?v=${id}`;

            return {
              title: item.snippet.title,
              videoId: id,
              url: url,
              thumbnail:
                item.snippet.thumbnails.medium?.url ||
                item.snippet.thumbnails.default?.url ||
                "",
              channelTitle: item.snippet.channelTitle,
              publishTime: item.snippet.publishedAt || item.snippet.publishTime,
              type: isPlaylist ? ("playlist" as const) : ("video" as const),
            };
          });
        }
      } catch (err) {
        console.error(`Error searching YouTube for channel ${channelId}:`, err);
      }
    }

    return [];
  } catch (error: any) {
    console.error("YouTube search error:", error);
    return { error: `YouTube search failed: ${error.message}` };
  }
}
