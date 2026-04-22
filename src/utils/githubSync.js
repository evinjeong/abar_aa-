/**
 * GitHub API Synchronization Utility
 * Handles fetching and updating JSON data files in a GitHub repository.
 */

export class GitHubSync {
    constructor(token, owner, repo, branch = 'main') {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
        this.baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    }

    async getFile(path) {
        try {
            const response = await fetch(`${this.baseUrl}/${path}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) return { content: null, sha: null };
            if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);

            const data = await response.json();
            // Decode base64 array back to UTF-8 string safely
            const utf8Str = decodeURIComponent(escape(atob(data.content)));
            const content = JSON.parse(utf8Str);
            return { content, sha: data.sha };
        } catch (error) {
            console.error(`Error fetching ${path}:`, error);
            throw error;
        }
    }

    async updateFile(path, content, sha, message = 'Update data via Dashboard') {
        try {
            const body = {
                message,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
                branch: this.branch
            };
            if (sha) body.sha = sha;

            const response = await fetch(`${this.baseUrl}/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(`GitHub API error: ${errData.message || response.statusText}`);
            }

            const data = await response.json();
            return data.content.sha;
        } catch (error) {
            console.error(`Error updating ${path}:`, error);
            throw error;
        }
    }
}

export const saveSyncSettings = (settings) => {
    localStorage.setItem('abar_github_settings', JSON.stringify(settings));
};

export const getSyncSettings = () => {
    const saved = localStorage.getItem('abar_github_settings');
    return saved ? JSON.parse(saved) : null;
};
