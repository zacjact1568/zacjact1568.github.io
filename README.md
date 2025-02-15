# Code Website

<img src="src/app/favicon.ico" align="right" />

The repository of my Code website, using [Next.js](https://nextjs.org/) with Static Site Generation (SSG), GitHub Actions for Continuous Integration and Continuous Delivery (CI/CD), GitHub Pages for deployment.

Optimized for dark mode and devices with narrow screen (e.g. mobile phones).

Check it out: https://code.zackzhang.net

## Configurations

Make sure Node.js 22 has installed.

1. Install dependencies listed in `package.json`:
   ```sh
   npm i
   ```
2. Launch local server for development:
   ```sh
   npm run dev
   ```
   Open http://localhost:3000 in your browser to view.
3. Compile for production:
   ```sh
   npm run build
   ```
   Complied files will be put into `out`.
4. Launch local server to preview production:
   ```sh
   npm run serve
   ```
   Open http://localhost:3000 in your browser to view.
5. You're all set! Push source codes to GitHub and enjoy the convenience of CI/CD.

## Future Plans

- [ ] `en` language support (i18n), currently `zh-Hans` only.
- [ ] Divide posts into multiple pages.
- [ ] Add tags for posts.