'use strict';

const AdmZip = require('adm-zip');
const { mkdirSync } = require('fs');
const os = require('os');
const path = require('path');
const ConfigurationValidator = require('./ConfigurationValidator');
const Docker = require('./Docker');
const spawn = require('./spawn');

class CargoBuilder {
  constructor(serverless, config) {
    this.serverless = serverless;
    this.config = {
      ...config,
    };
  }

  createLocalDir(targetDir) {
    try {
      mkdirSync(targetDir, { recursive: true });
    } catch {
      this.serverless.cli.log(`Directory ${targetDir} already exists`);
    }
  }

  isReleaseBuild(func) {
    return this.getProfile(func) === 'release';
  }

  getArtifactPath(func) {
    const { binary } = this.getBinaryInfo(func);
    return path.join(
      this.config.srcPath,
      `target/lambda/${this.isReleaseBuild(func) ? 'release' : 'debug'}`,
      `${binary}.zip`
    );
  }

  isMuslPlatform() {
    const platform = os.platform();
    const muslPlatforms = ['darwin', 'win32', 'linux'];
    return muslPlatforms.includes(platform);
  }

  getPlatformTarget() {
    if (this.isMuslPlatform()) {
      return 'x86_64-unknown-linux-musl';
    }
    return undefined;
  }

  getBinaryInfo(func) {
    const [cargoPackage, binary] = func.handler.split('.');
    return {
      cargoPackage,
      binary: binary || cargoPackage,
    };
  }

  getProfile(func) {
    return (func.rust || {}).profile || this.config.rust.profile;
  }

  isLocalBuild(func) {
    return (func.rust || {}).localBuild || this.config.rust.localBuild;
  }

  getFuncArgs(func) {
    return func.rust;
  }

  getCargoFlags(func) {
    const funcArgs = this.getFuncArgs(func);
    return (funcArgs || {}).cargoFlags || this.config.rust.cargoFlags;
  }

  // Local build
  getLocalBuildArgs(func) {
    const { cargoPackage } = this.getBinaryInfo(func);
    const defaultArgs = ['build', '-p', cargoPackage];
    const profileArgs = this.isReleaseBuild(func) ? ['--release'] : [];
    const cargoFlags = (this.getCargoFlags(func) || '').split(/\s+/);
    const targetArgs = this.getPlatformTarget() ? ['--target', this.getPlatformTarget()] : [];
    return [...defaultArgs, ...profileArgs, ...targetArgs, ...cargoFlags].filter((arg) => !!arg);
  }

  getLocalBuildEnv() {
    const defaultEnv = { ...process.env };
    const platform = os.platform();
    const platformEnvironments = {
      win32: {
        RUSTFLAGS: (defaultEnv.RUSTFLAGS || '') + ' -Clinker=rust-lld',
        TARGET_CC: 'rust-lld',
        CC_x86_64_unknown_linux_musl: 'rust-lld',
      },
      darwin: {
        RUSTFLAGS: (defaultEnv.RUSTFLAGS || '') + ' -Clinker=x86_64-linux-musl-gcc',
        TARGET_CC: 'x86_64-linux-musl-gcc',
        CC_x86_64_unknown_linux_musl: 'x86_64-linux-musl-gcc',
      },
    };
    const platformEnv = platformEnvironments[platform] || {};
    return {
      ...defaultEnv,
      ...platformEnv,
    };
  }

  getLocalSrcDir(func) {
    const executable = this.isMuslPlatform() ? path.join('target', 'x86_64-unknown-linux-musl') : 'target';
    return path.join(executable, this.isReleaseBuild(func) ? 'release' : 'debug');
  }

  getLocalArtifactDir(func) {
    return path.join('target', 'lambda', this.isReleaseBuild(func) ? 'release' : 'debug');
  }

  buildLocal(func) {
    const { binary } = this.getBinaryInfo(func);
    const args = this.getLocalBuildArgs(func);
    const env = this.getLocalBuildEnv();
    this.serverless.cli.log(`Running local cargo build on ${os.platform()}`);

    const buildStatus = spawn('cargo', args, { env });
    if (buildStatus.error || buildStatus.status > 0) {
      return buildStatus;
    }

    const srcDir = this.getLocalSrcDir(func);
    const zip = new AdmZip();
    zip.addFile('bootstrap', this.serverless.utils.readFileSync(path.join(srcDir, binary)), '', 755);

    const targetDir = this.getLocalArtifactDir(func);
    try {
      this.createLocalDir(targetDir);
      this.serverless.utils.writeFileSync(path.join(targetDir, `${binary}.zip`), zip.toBuffer());
      return {
        status: 0,
      };
    } catch (err) {
      this.serverless.cli.log(`Error zipping artifact ${err}`);
      return {
        err: err,
        status: 1,
      };
    }
  }

  // Docker build
  getDockerBuildArgs(func) {
    const { binary, cargoPackage } = this.getBinaryInfo(func);
    const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
    const cargoRegistry = path.join(cargoHome, 'registry');
    const cargoDownloads = path.join(cargoHome, 'git');

    const defaultArgs = [
      'run',
      '--rm',
      '-t',
      '-e',
      `BIN=${binary}`,
      `-v`,
      `${this.config.srcPath}:/code`,
      `-v`,
      `${cargoRegistry}:/root/.cargo/registry`,
      `-v`,
      `${cargoDownloads}:/root/.cargo/git`,
    ];

    const profile = this.getProfile(func);
    const rustArgs = [];
    rustArgs.push('-e', `PROFILE=${profile}`);
    const cargoFlags = this.getCargoFlags(func);
    const packageArgs = cargoFlags ? `${cargoFlags} -p ${cargoPackage}` : `-p ${cargoPackage}`;

    rustArgs.push('-e', `CARGO_FLAGS=${packageArgs}`);

    return [...defaultArgs, ...rustArgs];
  }

  buildDocker(func) {
    const args = this.getDockerBuildArgs(func);
    const docker = new Docker(this.serverless, this.config);

    return docker.build(args);
  }

  build(func) {
    const configurationValidator = new ConfigurationValidator();
    configurationValidator.validate(this.config);
    return this.isLocalBuild(func) ? this.buildLocal(func) : this.buildDocker(func);
  }
}

module.exports = CargoBuilder;
