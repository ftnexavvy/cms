# Centralized Blog CMS

One local CMS for:

- `bhadrik-panchal`
- `nexavvy`
- `growth-catalyst`

It provides:

- secure admin login with signed session cookies
- one dashboard for all sites
- blog CRUD
- local image uploads
- MongoDB-backed storage
- public REST API for live frontend fetching
- SEO fields per post
- Sanity migration for the Bhadrik site

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy envs:

```bash
cp .env.example .env.local
```

3. Generate a password hash:

```bash
npm run hash-password -- "your-password"
```

4. Put that hash into `ADMIN_PASSWORD_HASH`, set `ADMIN_EMAIL`, and add a long `SESSION_SECRET`.

5. Start MongoDB locally and update `MONGODB_URI` if needed.

6. Start the CMS:

```bash
npm run dev
```

7. Open `http://localhost:3000/login`.

## Public API

- `GET /api/posts?siteId=bhadrik-panchal`
- `GET /api/posts?siteId=nexavvy`
- `GET /api/posts?siteId=growth-catalyst`
- `GET /api/posts/slug/:siteId/:slug`

Admin-only:

- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `POST /api/upload`

## Data model

Each post supports:

- `siteId`
- `status`
- `title`
- `slug`
- `description`
- `excerpt`
- `category`
- `tags`
- `author`
- `publishedAt`
- `featuredImage`
- `contentMode`
- `contentHtml`
- `portableText`
- `structuredContent`
- `seo`

`contentMode` allows one CMS to serve multiple frontends without redesigning their article layouts:

- `html`
- `portableText`
- `nexavvyStructured`

## Sanity migration

Bhadrik’s existing Sanity posts can be imported with:

```bash
npm run migrate:sanity
```

That script preserves slug, image, publish date, SEO keywords, and Portable Text body blocks.

## Frontend integration notes

### Bhadrik Panchal

- replace Sanity client fetching with `GET /api/posts?siteId=bhadrik-panchal`
- replace per-slug fetch with `GET /api/posts/slug/bhadrik-panchal/:slug`
- keep existing layout and animation wrappers intact
- render `portableText` when available

### FT Nexavvy

- replace `blogs.js` reads and existing localhost fetches with CMS API data
- continue using the same `Populararticlesection`, `bloglist`, `strategy`, and `relatedblog` components
- use `structuredContent`, `quote`, `authorImage`, and `authorBio` to preserve current detail page composition

### Keadigi

- point existing `Blog.tsx` and `BlogPost.tsx` to the CMS base URL from env instead of hardcoding `localhost:3004`
- keep card/detail markup unchanged
- continue rendering `contentHtml`

## Deployment

1. Deploy the CMS on a persistent Node host or VPS.
2. Provide a production MongoDB URI.
3. Set `NEXT_PUBLIC_CMS_URL` to the public CMS domain.
4. Configure `BHADRIK_SITE_URL`, `NEXAVVY_SITE_URL`, and `KEADIGI_SITE_URL`.
5. Point each frontend to the live CMS API.
6. Ensure CORS allows their domains if you later tighten it from `*`.

## Deployment (Vercel)

1. **Push to GitHub**: This project is now connected to `https://github.com/ftnexavvy/cms.git`.
2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Import the `cms` repository.
3. **Environment Variables**: Set the following in Vercel project settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `SESSION_SECRET`: A long random string for session encryption.
   - `ADMIN_EMAIL`: Your admin email.
   - `ADMIN_PASSWORD_HASH`: Use `npm run hash-password` locally to generate this.
   - `NEXT_PUBLIC_CMS_URL`: The production URL provided by Vercel (e.g., `https://your-cms.vercel.app`).
4. **Build & Deploy**: Vercel will automatically detect Next.js and deploy.

### Important: Image Uploads
Since Vercel's filesystem is ephemeral (read-only), local image uploads to `public/uploads` will not persist across deployments or server restarts. 
**Recommended**: Integrate a cloud storage provider like **Vercel Blob** or **Cloudinary**. 

## Current status

- Pushed to: `https://github.com/ftnexavvy/cms.git`
- Framework: Next.js 15
- Database: MongoDB
- Auth: Custom session-based (JWT-less)

## Current limitation

The three frontend projects live outside this writable workspace root, so they still need to be patched in their own directories to complete the integration step.
