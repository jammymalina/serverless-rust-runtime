'use strict';

const path = require('path');
const CargoBuilder = require('./src/CargoBuilder');

const RUST_RUNTIME = 'rust';

class ServerlessRustRuntimePlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:package:createDeploymentArtifacts': this.build.bind(this),
      'before:deploy:function:packageFunction': this.build.bind(this),
      'before:offline:start': this.build.bind(this),
      'before:offline:start:init': this.build.bind(this),
      'before:invoke:local:invoke': this.build.bind(this),
    };

    const custom = this.serverless.service.custom || {};
    this.config = {
      srcPath: path.resolve(this.serverless.config.servicePath || ''),
      rust: Object.assign(
        {
          version: 'stable',
          profile: 'release',
          cargoFlags: '',
          localBuild: false,
        },
        custom.rust
      ),
      docker: Object.assign(
        {
          repository: 'jammymalina/aws-lambda-rust-runtime',
          tag: undefined,
          autobuild: false,
          cli: 'docker',
        },
        custom.docker
      ),
    };

    this.cargoBuilder = new CargoBuilder(serverless, this.config);
  }

  getLambdaFunctions() {
    const { service } = this.serverless;
    const lambdaFunctions = this.options.function ? [this.options.function] : service.getAllFunctions();
    return lambdaFunctions
      .map((funcName) => service.getFunction(funcName))
      .filter((func) => {
        const runtime = func.runtime || service.provider.runtime;
        return runtime === RUST_RUNTIME;
      });
  }

  build() {
    const status = this.getLambdaFunctions().map((func) => {
      this.serverless.cli.log(`Building rust ${func.handler} lambda`);

      const buildStatus = this.cargoBuilder.build(func);
      if (buildStatus.error || buildStatus.status > 0) {
        this.serverless.cli.log(`Unable to build rust binary: ${buildStatus.error} ${buildStatus.status}.`);
        throw new Error(buildStatus.error);
      }

      const artifactPath = this.cargoBuilder.getArtifactPath(func);
      func.package = func.package || {};
      func.package.artifact = artifactPath;

      return func;
    });
    if (status.length === 0) {
      this.serverless.cli.warn('No functions with rust runtime found');
    }
  }
}

module.exports = ServerlessRustRuntimePlugin;
