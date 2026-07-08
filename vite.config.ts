import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY_NAME;
const isUserSite = repositoryName?.endsWith(".github.io");
const githubPagesBase = repositoryName && !isUserSite ? `/${repositoryName}/` : "/";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS === "true" ? githubPagesBase : "/"),
  plugins: [react()],
});
