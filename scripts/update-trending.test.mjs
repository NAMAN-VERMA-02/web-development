import test from "node:test";
import assert from "node:assert/strict";
import { toItem, mergeByPopularity, pickForProvider } from "./update-trending.mjs";

test("maps a movie", () => {
  assert.deepEqual(toItem({ media_type: "movie", id: 27205, title: "Inception", release_date: "2010-07-15", poster_path: "/a.jpg", vote_average: 8.369, vote_count: 9 }), {
    title: "Inception", type: "Movie", year: "2010", score: 8.4, votes: 9,
    poster: "https://image.tmdb.org/t/p/w342/a.jpg", url: "https://www.themoviedb.org/movie/27205"
  });
});

test("Japanese animated TV is Anime, other TV is Series", () => {
  const base = { media_type: "tv", id: 1, name: "X", first_air_date: "2013-04-07", poster_path: "/p.jpg", vote_average: 8, vote_count: 1 };
  assert.equal(toItem({ ...base, genre_ids: [16], origin_country: ["JP"] }).type, "Anime");
  assert.equal(toItem({ ...base, genre_ids: [16], origin_country: ["US"] }).type, "Series");
});

test("skips people and titles without posters; no votes means no score", () => {
  assert.equal(toItem({ media_type: "person", id: 1, poster_path: "/p.jpg" }), null);
  assert.equal(toItem({ media_type: "movie", id: 1, title: "X", poster_path: null }), null);
  assert.equal(toItem({ media_type: "movie", id: 1, title: "X", poster_path: "/p.jpg", vote_average: 0, vote_count: 0 }).score, null);
});

test("merges discover results by popularity and tags media type", () => {
  const movies = [{ id: 1, title: "M low", poster_path: "/a.jpg", popularity: 10 }, { id: 2, title: "M high", poster_path: "/b.jpg", popularity: 90 }];
  const tv = [{ id: 3, name: "T mid", poster_path: "/c.jpg", popularity: 50 }, { id: 4, name: "No poster", poster_path: null, popularity: 99 }];
  const out = mergeByPopularity(movies, tv);
  assert.deepEqual(out.map((x) => x.title), ["M high", "T mid", "M low"]);
  assert.equal(out[1].url, "https://www.themoviedb.org/tv/3");
});

test("provider row: trending titles on that service first, then fallback, no duplicates", () => {
  const t = (n) => ({ title: n, url: "u/" + n });
  const trending = [t("A"), t("B"), t("C")];
  const providers = { "u/A": [8], "u/B": [119], "u/C": [8, 119] };
  assert.deepEqual(pickForProvider(trending, providers, 8, [t("C"), t("X")]).map((x) => x.title), ["A", "C", "X"]);
  assert.deepEqual(pickForProvider(trending, providers, 119, []).map((x) => x.title), ["B", "C"]);
});
