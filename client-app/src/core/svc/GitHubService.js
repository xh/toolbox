import {ApolloClient, gql, InMemoryCache} from '@apollo/client';
import {HoistService} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import moment from 'moment';

@HoistService
export class GitHubService {

    /** @member {ApolloClient} */
    client;

    async initAsync() {
        this.client = new ApolloClient({
            uri: 'https://api.github.com/graphql',
            cache: new InMemoryCache(),
            headers: {
                // TODO - this is a personal access token w/minimal read access to public repos.
                //      But will be better to do all of this on the server - burn this key when done.
                authorization: 'bearer 8301331a2ad88f66126f156174241dc4e6ec360b'
            }
        });
    }

    async getCommitsAsync(repoNames) {
        const loads = repoNames.map(repoName => {
            return this.client.query({
                query: gql`
                    query repoCommits {
                        repository(owner: "xh", name: "${repoName}") {
                            name
                            defaultBranchRef {
                                target {
                                    ... on Commit {
                                        id
                                        history {
                                            nodes {
                                                abbreviatedOid
                                                committedDate
                                                author {
                                                    email
                                                    user {
                                                        name
                                                        login
                                                    }
                                                }
                                                messageHeadline
                                                messageBody
                                                url
                                                changedFiles
                                                additions
                                                deletions
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `
            });
        });

        const ret = [],
            results = await Promise.allSettled(loads);

        results.forEach((it, idx) => {
            const repoName = repoNames[idx];
            it.value.data.repository.defaultBranchRef.target.history.nodes.forEach(it => {
                const committedDate = moment(it.committedDate).toDate();
                ret.push({
                    id: `${repoName}-${it.abbreviatedOid}`,
                    repo: repoName,
                    abbreviatedOid: it.abbreviatedOid,
                    authorName: it.author?.user?.name || it.author?.email,
                    authorEmail: it.author?.email ?? 'UNKNOWN',
                    committedDate,
                    committedDay: LocalDate.from(committedDate),
                    messageHeadline: it.messageHeadline,
                    changedFiles: it.changedFiles,
                    additions: it.additions,
                    deletions: it.deletions,
                    url: it.url,
                    isRelease: it.author?.email == 'techops@xh.io' && it.messageHeadline.startsWith('v')
                });
            });
        });

        return ret;
    }

}
