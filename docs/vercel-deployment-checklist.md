# Vercel Deployment Checklist for StarrLign

Use this when GitHub shows a PR/commit but `starr-lign.vercel.app` still looks old.

## 1. Start on the failed Vercel deployment

1. Open Vercel.
2. Go to the `starr-lign` project.
3. Click **Deployments**.
4. Click the newest deployment with a red **Error** badge.
5. Confirm the deployment details:
   - **Source** branch should be the branch you expect, usually `main` for production.
   - **Commit** should match the latest GitHub commit/merge you expect.

If the failed deployment says something like `Source main b25e266`, then Vercel is building that exact commit. If GitHub has a newer merge commit, redeploy the newer one instead.

## 2. Find the useful build error

On Vercel Hobby, the Logs tab may look empty if the deployment is old and the time filter cannot go far enough back. Use this path instead:

1. Open the failed deployment.
2. Click **Build Logs** or **View Build Logs** if available.
3. Scroll upward until you see the first red error text above `Command "npm run build" exited with 1`.
4. Copy the first error block, not only the final `exited with 1` line.

The final `exited with 1` line only means “the build failed.” The useful part is the first TypeScript, module, or prerender error above it.

## 3. Force a fresh deployment after fixes

After a fix is merged to GitHub:

1. Open Vercel → `starr-lign` → **Deployments**.
2. Find the newest deployment from the latest GitHub commit.
3. If it is not already running, click the `...` menu and choose **Redeploy**.
4. Wait for the status to become **Ready**.
5. Open `starr-lign.vercel.app` in an incognito/private browser window.

## 4. Verify the newest UI is live

The latest feature-drop build has a yellow `V12 LIVE` badge in the topbar on wide desktop screens. If you do not see `V12 LIVE`, you are not viewing the latest build.

Also verify:

- Calendar has a **Project color legend** above the grid.
- Calendar task chips are colored by project.
- Money Lab shows **My Bank**, **Budget Buckets**, and **Fiscal Year Projection**.
- Project task cards have star dependency anchors.
- Project view has a bottom **+ ADD DOCUMENT** section.

## 5. If the live app still looks old

Try these in order:

1. Hard refresh desktop: `Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows.
2. Open an incognito/private window.
3. On phone, close the tab fully and reopen it.
4. If still old, check Vercel deployment commit SHA again. The live deployment is probably not the latest commit.
