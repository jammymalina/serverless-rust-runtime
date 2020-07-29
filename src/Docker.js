'use strict';

const { semanticVersion } = require('@semantics/semantic-version');
const spawn = require('./spawn');

const DEFAULT_REPOSITORY = 'jammymalina/aws-lambda-rust-runtime';
const DEFAULT_GITHUB_URL = 'https://github.com/jammymalina/aws-lambda-rust-runtime';

class Docker {
  constructor(serverless, config) {
    this.config = config;
    this.serverless = serverless;
    this.dockerCommand = this.config.docker.cli || process.env.SLS_DOCKER_CLI || 'docker';
  }

  getRustVersion() {
    const rustVersion = this.config.rust.version;
    if (['stable', 'nightly'].includes(rustVersion)) {
      return rustVersion;
    }
    return semanticVersion(rustVersion).toString();
  }

  isDockerDaemonRunning() {
    const { status } = spawn(this.dockerCommand, ['version']);
    return status === 0;
  }

  getImageTag() {
    if (this.config.docker.tag) {
      return this.config.docker.tag;
    }
    if (this.config.docker.repository === DEFAULT_REPOSITORY) {
      return `version-${this.getRustVersion()}`;
    }
    return 'latest';
  }

  getImageRepository() {
    return this.config.docker.repository;
  }

  getImage() {
    return `${this.getImageRepository()}:${this.getImageTag()}`;
  }

  isImageBuilt() {
    const { status } = spawn(this.dockerCommand, ['image', 'inspect', this.getImage()]);
    return status === 0;
  }

  getImageBuildArgs() {
    const githubUrl = this.config.docker.autobuild.githubUrl;
    if (githubUrl.startsWith(DEFAULT_GITHUB_URL)) {
      return ['--build-arg', `RUST_VERSION=${this.getRustVersion()}`];
    }
    return this.config.docker.autobuild.buildArgs.split(/\s+/);
  }

  buildImage() {
    if (!this.config.docker.autobuild.enabled) {
      throw new Error(
        `Docker image ${this.getImage()} cannot be found, make sure the configuration is correct or enable autobuild`
      );
    }
    const buildArgs = this.getImageBuildArgs();
    const { status } = spawn(this.dockerCommand, [
      'build',
      ...buildArgs,
      '-t',
      this.getImage(),
      this.config.docker.autobuild.githubUrl,
    ]);
    if (status !== 0) {
      throw new Error('Autobuild of the docker image failed');
    }
  }

  getDockerArgs(buildArgs) {
    const customArgs = (this.config.docker.args || process.env.SLS_DOCKER_ARGS || '').split(/\s+/) || [];
    return [...buildArgs, ...customArgs, this.getImage()].filter((arg) => !!arg);
  }

  build(buildArgs) {
    if (!this.isDockerDaemonRunning()) {
      throw new Error('Docker daemon is not running');
    }
    if (!this.isImageBuilt()) {
      this.buildImage();
    }
    const args = this.getDockerArgs(buildArgs);

    return spawn(this.dockerCommand, args);
  }
}

module.exports = Docker;
