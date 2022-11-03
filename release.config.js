module.exports = {
  repositoryUrl: 'https://github.com/PolymeshAssociation/polymesh-rest-api.git',
  branches: [
    'master',
    {
      name: 'alpha',
      prerelease: true,
    },
  ],
  /*
   * In this order the **prepare** step of @eclass/semantic-release-docker, will run first
   * followed by @semantic-release/github:
   *  - Update the package.json version and create the docker image
   *  - Push a release commit and tag, including configurable files
   */
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@eclass/semantic-release-docker',
      {
        baseImageName: 'polymesh-rest-api ',
        registries: [
          {
            url: 'hub.docker.com',
            imageName: 'polymeshassociation/polymesh-rest-api',
            user: 'DOCKER_USER',
            password: 'DOCKER_PASSWORD',
          },
        ],
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: ['CHANGELOG.md'],
      },
    ],
  ],
};
