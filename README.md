# CineSedation

Quick, honest reviews of movies, TV series and anime. A fully static website: plain HTML, CSS and JavaScript, no build step and no dependencies.

**Live site:** https://naman-verma-02.github.io/web-development/

## Features

- **Home page** with editor's picks, live search (by title, genre or creator) and filters for Movies, Series and Anime. Search and filters stay in the URL, so results can be shared.
- **Review pages** with overview, themes, characters, final verdict, a score out of 10, the official trailer and where to watch.
- **Your rating and your reviews:** rate any title out of 5 and post your own review. Both are saved in your browser (`localStorage`). User text is always rendered as plain text, never as HTML.
- **More like this** recommendations based on shared genres.
- Responsive from phone to desktop, keyboard accessible, with a custom 404 page.

## Project structure

```
index.html        Home: hero, editor's picks, browse and search
review.html       One template for every review (review.html?id=naruto)
about.html        About the site and how we review
404.html          Not-found page
assets/
  css/style.css   All styles
  js/data.js      Every title and review lives here
  js/app.js       Search, filters, review rendering, ratings and user reviews
  img/            Optimised posters and backdrops
```

## Adding a review

Add one object to the `TITLES` array in `assets/js/data.js` and drop its image in `assets/img/`. The home grid, search, filters and review page all pick it up automatically.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

## Deploy

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.
