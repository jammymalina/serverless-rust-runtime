'use strict';

const spawn = require('./spawn');

class Docker {
  constructor(serverless, config) {
    this.config = config;
    this.serverless = serverless;
    this.dockerCommand = this.config.docker.cli || process.env.SLS_DOCKER_CLI || 'docker';
  }

  isDockerDaemonRunning() {
    const { status } = spawn(this.dockerCommand, ['version']);
    return status === 0;
  }

  getImageTag() {
    if (this.config.docker.tag) {
      return this.config.docker.tag;
    }
    if (this.config.docker.repository === 'jammymalina/aws-lambda-rust-runtime') {
      return `version-${this.config.rust.version}`;
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

  buildImage() {
    if (!this.config.docker.autobuild.enabled) {
      throw new Error(
        `Docker image ${this.getImage()} cannot be found, make sure the configuration is correct or enable autobuild`
      );
    }
    const buildArgs = this.docker.autobuild.buildArgs.split(/\s+/);
    const { status } = spawn(this.dockerCommand, [
      'build',
      ...buildArgs,
      '-t',
      this.getImage(),
      this.docker.autobuild.githubUrl,
    ]);
    if (status !== 0) {
      throw new Error('Autobuild of docker image failed');
    }
  }

  getDockerArgs(buildArgs) {
    const customArgs = (this.config.docker.args || process.env.SLS_DOCKER_ARGS || '').split(' ') || [];
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
