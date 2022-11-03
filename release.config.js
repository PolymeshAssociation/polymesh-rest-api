module.exports = {
  repositoryUrl: 'https://github.com/PolymeshAssociation/polymesh-rest-api.git',
  branches: [
    'master',
    {
      name: 'alpha',
      prerelease: true,
    },
  ],

  // Note, the expectation is for Github plugin to create a tag that begins with `v`, which triggers a workflow that publishes a docker image
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
