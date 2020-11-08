import { Octokit } from "@octokit/rest";

import getCommit from "./commit";
import getContent from "./content";

import { OWNER, REPOSITORY } from "../constants";

export default async function (path: string) {
  const octokit = new Octokit({
    auth: process.env.TOKEN || null
  });

  const response = await octokit.repos.listCommits({
    owner: OWNER,
    repo: REPOSITORY,
    path
  });

  return Promise.all(
    response.data.map(async (commit) => {
      const content = await getContent(path, commit.sha);
      const details = await getCommit(commit.sha);

      const stats = {
        tiles: 0,
        roads: 0,
        buffers: 0,
        notWithin: 0
      };
      content.forEach((s) => {
        stats.tiles++;
        stats.roads += s.roads;
        stats.buffers += s.buffers;
        stats.notWithin += s.notWithin;
      });

      const files = details.files.map((file) => file.filename.replace(/.*\//, ''));
      const processChange = (files.indexOf('filter.sql') !== -1 || files.indexOf('process.sh') !== -1);

      const dirname = path.match(/.*\//);
      const diff = `https://github.com/${OWNER}/${REPOSITORY}/blob/${commit.sha}/${dirname}diff.geojson`;

      const title = commit.commit.message.substring(0, commit.commit.message.indexOf("\n"));
      const message = commit.commit.message.substring(commit.commit.message.indexOf("\n"));

      return {
        path,
        diff,
        datetime: new Date(commit.commit.author.date),
        title,
        message,
        sha: commit.sha,
        url: commit.html_url,
        stats,
        status: processChange ? 'script' : 'data'
      };
    })
  );
}