# Deploying Backend to Render

Follow these steps to deploy the `backend` service of the **Scheme Finder** project to Render.

## 1. Prerequisites
- A [Render](https://render.com) account.
- Your project pushed to a GitHub or GitLab repository.

## 2. Create a Web Service on Render
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your repository containing the project.
4. Configure the service settings:
   - **Name**: `scheme-finder-backend` (or your preferred name)
   - **Environment / Runtime**: `Node`
   - **Region**: Select the region closest to your users.
   - **Branch**: `main` (or your development branch)
   - **Root Directory**: `backend` (since the backend code resides in the `/backend` subfolder)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or any tier of your choice)

## 3. Environment Variables
In the **Environment** section of your Web Service configuration, add the following variables:

| Key | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | The connection string for your Supabase/Postgre database |
| `GNEWS_API_KEY` | `your_gnews_key` | Your API key for fetching real-time government news |
| `GEMINI_API_KEY` | `your_gemini_key` | Your Google Gemini API key (for news/headline analysis) |
| `OPENROUTER_API_KEY` | `your_openrouter_key` | (Optional fallback) Your OpenRouter API key |

> [!NOTE]
> The server will automatically use the default port assigned by Render via `process.env.PORT`.

## 4. Connecting the Frontend
Once deployed, Render will provide you with a public URL (e.g., `https://scheme-finder-backend.onrender.com`).
To point your frontend to the deployed backend:
1. You can update the API base URL in your frontend code or configuration.
2. In the future, you can configure the frontend to read from an environment variable (like `import.meta.env.VITE_API_URL`) instead of using hardcoded `http://localhost:5000` base URLs.
