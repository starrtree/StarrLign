# Cloud Setup

StarrLign is ready to run locally from `dev.db` today and switch to Turso cloud later without changing the application data model.

## Recommended stack

- Vercel for app hosting
- Turso for cloud database
- Optional basic auth for the personal MVP phase

## 1. Create a Turso database

Use the Turso CLI:

```bash
turso db create starrlign
turso db show --url starrlign
turso db tokens create starrlign
```

Save the resulting values as:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## 2. Migrate your current local data to Turso

With `DATABASE_URL`, `TURSO_DATABASE_URL`, and `TURSO_AUTH_TOKEN` set, run:

```bash
npm run db:migrate:cloud
```

This copies the current contents of `dev.db` to Turso.

## 3. Protect the personal MVP

Before full account auth exists, you can gate the deployed app with basic auth by setting:

- `APP_BASIC_AUTH_USERNAME`
- `APP_BASIC_AUTH_PASSWORD`

If these values are not set, the app remains public.

## 4. Deploy the app

Deploy the Next.js app to Vercel and add the same environment variables there.

Required on Vercel:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Optional on Vercel:

- `APP_BASIC_AUTH_USERNAME`
- `APP_BASIC_AUTH_PASSWORD`

## 5. Verify on phone

After deployment, open the Vercel URL on your phone. If basic auth is enabled, your browser will prompt for the username and password first.
