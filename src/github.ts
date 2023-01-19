// deno-lint-ignore-file camelcase
// @deno-types="https://raw.githubusercontent.com/greggman/unzipit/v1.3.6/dist/unzipit.module.d.ts"
import { unzip } from 'https://raw.githubusercontent.com/greggman/unzipit/v1.3.6/dist/unzipit.module.js';

import { Manifest } from './types.ts';

interface Owner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

interface License {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
}

interface Repo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: Owner;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: Date;
  updated_at: Date;
  pushed_at: Date;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url?: string;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: License;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  temp_clone_token?: string;
  network_count: number;
  subscribers_count: number;
}

const url = 'https://api.github.com/repositories';

async function get(url: string) {
  // try username/repo
  let array = /^([-_a-z0-9]+)\/([-_a-z0-9]+)$/.exec(
    url,
  );

  if (!array) {
    array = /^https:\/\/github.com\/([^\/:]+)\/(.+)$/.exec(
      url,
    );
  }

  if (!array) {
    throw new Error(`invalid git url: ${url}`);
  }

  const username = array[1];
  const reponame = array[2].endsWith('.git')
    ? array[2].substring(0, array[2].length - 4)
    : array[2];

  const api = `https://api.github.com/repos/${username}/${reponame}`;

  const response = await fetch(api);

  if (!response.ok) {
    throw new Error('failed to fetch repository');
  }

  const json = await response.json();

  if (json.message) {
    throw new Error(json.message);
  }

  return json as Repo;
}

async function manifest(
  { id, ref }: { id: number; ref?: string },
) {
  const { entries } = await unzip(
    `${url}/${id}/zipball/${ref ?? ''}`,
  );

  const manifests = Object.values(entries)
    .filter(({ name }) => name.endsWith('manifest.json'))
    .map((entry) => entry.json() as Promise<Manifest>);

  return Promise.all(manifests);
}

const github = {
  get,
  manifest,
};

export default github;