'use strict';

const spawn = require('./spawn');

class Docker {
  constructor(serverless, config) {
    this.dockerCommand = this.docker.config.cli || process.env.SLS_DOCKER_CLI || 'docker';
    this.serverless = serverless;
    this.config = config;
  }

  isDockerDaemonRunning() {
    const { status } = spawn(this.dockerCommand, 'version');
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
    const { status } = spawn(this.dockerCommand, `image inspect ${this.getImage()}`);
    return status === 0;
  }

  buildImage() {
    if (!this.config.docker.autobuild) {
      throw new Error(
        `Docker image ${this.getImage()} cannot be found, make sure the configuration is correct or enable autobuild`
      );
    }
    this.serverless.cli.log(`Building docker image ${this.getImage()}, rust version: ${this.config.rust.version}`);
    const { status } = spawn(
      this.dockerCommand,
      `build --build-arg RUST_VERSION=${
        this.config.rust.version
      } -t ${this.getImage()} https://github.com/jammymalina/aws-lambda-rust-runtime.git`
    );
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
    this.serverless.cli.log(`Running containerized build with ${this.dockerCommand}`);

    return spawn(this.dockerCommand, args);
  }
}

module.exports = Docker;
