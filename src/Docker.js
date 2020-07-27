'use strict';

const spawn = require('./spawn');

class Docker {
  constructor(config) {
    this.dockerCommand = this.docker.config.cli || process.env.SLS_DOCKER_CLI || 'docker';
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
    const { status } = spawn(
      this.dockerCommand,
      `build --build-arg RUST_VERSION=${
        this.rust.version
      } -t ${this.getImage()} https://github.com/jammymalina/aws-lambda-rust-runtime.git`
    );
    if (status !== 0) {
      throw new Error('Autobuild of docker image failed');
    }
  }

  build(args) {
    if (!this.isDockerDaemonRunning()) {
      throw new Error('Docker daemon is not running');
    }
    if (!this.isImageBuilt()) {
      this.buildImage();
    }
  }
}

module.exports = Docker;
