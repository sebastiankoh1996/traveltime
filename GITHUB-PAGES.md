# Publish Travel Time with GitHub Pages

1. Create a new GitHub repository. A private repository requires a GitHub plan that supports Pages; a public repository works with the free plan.
2. Upload this project and push the `main` branch.
3. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The workflow will publish the `public/planner` folder at `https://YOUR-NAME.github.io/YOUR-REPOSITORY/`.

The Supabase publishable key is used by `public/planner/cloud-sync.js`. The AMap and social-post server endpoints still need a separate server host; GitHub Pages only serves the static website files.
