'use strict';

const Docker = require('../src/Docker');
const serverlessMock = require('./serverlessMock');

jest.mock('../src/spawn');

const spawn = require('../src/spawn');

describe('Docker', () => {
  const config = {
    srcPath: '',
    rust: { version: '1.0', profile: 'release', cargoFlags: '', localBuild: false },
    docker: {
      repository: 'jammymalina/aws-lambda-rust-runtime',
      tag: 'nightly',
      autobuild: {
        enabled: false,
        githubUrl: 'https://github.com/jammymalina/aws-lambda-rust-runtime',
        buildArgs: 'doom boom room',
      },
      cli: 'docker',
      args: 'ba dum ts',
    },
  };

  beforeEach(() => {
    spawn.mockReturnValue({ status: 0 });
  });

  afterEach(() => {
    spawn.mockReset();
  });

  afterAll(() => {
    spawn.mockRestore();
  });

  it('should create Docker', () => {
    const docker = new Docker(serverlessMock, config);
    expect(docker).toBeTruthy();
  });

  it('should get the rust version, full semantic version', () => {
    const docker = new Docker(serverlessMock, config);
    expect(docker.getRustVersion()).toBe('1.0.0');
  });

  it('should get the rust version, nightly', () => {
    const nightlyConfig = {
      ...config,
      rust: {
        ...config.rust,
        version: 'nightly',
      },
    };
    const docker = new Docker(serverlessMock, nightlyConfig);
    expect(docker.getRustVersion()).toBe('nightly');
  });

  it('should check if docker daemon is running', () => {
    const docker = new Docker(serverlessMock, config);
    const isRunning = docker.isDockerDaemonRunning();
    expect(spawn).toHaveBeenCalled();
    expect(isRunning).toBeTruthy();
  });

  it('should get the image tag', () => {
    const docker = new Docker(serverlessMock, config);
    const tag = docker.getImageTag();
    expect(tag).toBe('nightly');
  });

  it('should get the image tag, from rust version', () => {
    const taglessRustConfig = {
      ...config,
      docker: {
        ...config.docker,
        tag: undefined,
      },
    };
    const docker = new Docker(serverlessMock, taglessRustConfig);
    const tag = docker.getImageTag();
    expect(tag).toBe('version-1.0.0');
  });

  it('should get the image tag, default tag', () => {
    const taglessConfig = {
      ...config,
      docker: {
        ...config.docker,
        repository: 'otherrepo',
        tag: undefined,
      },
    };
    const docker = new Docker(serverlessMock, taglessConfig);
    const tag = docker.getImageTag();
    expect(tag).toBe('latest');
  });

  it('should get the image repository', () => {
    const docker = new Docker(serverlessMock, config);
    const repo = docker.getImageRepository();
    expect(repo).toBe('jammymalina/aws-lambda-rust-runtime');
  });

  it('should get the image', () => {
    const docker = new Docker(serverlessMock, config);
    const image = docker.getImage();
    expect(image).toBe('jammymalina/aws-lambda-rust-runtime:nightly');
  });

  it('should check if the image is built', () => {
    const docker = new Docker(serverlessMock, config);
    const isImage = docker.isImageBuilt();
    expect(spawn).toHaveBeenCalled();
    expect(isImage).toBeTruthy();
  });

  it('should get the image build args', () => {
    const docker = new Docker(serverlessMock, config);
    const args = docker.getImageBuildArgs();
    expect(args).toEqual(['--build-arg', 'RUST_VERSION=1.0.0']);
  });

  it('should get the image build args, non-default github url', () => {
    const diffGithubConfig = {
      ...config,
      docker: {
        ...config.docker,
        autobuild: {
          ...config.docker.autobuild,
          githubUrl: 'https://github.com/jammymalina/chunk-it',
        },
      },
    };
    const docker = new Docker(serverlessMock, diffGithubConfig);
    const args = docker.getImageBuildArgs();
    expect(args).toEqual(['doom', 'boom', 'room']);
  });

  it('should not build the image, autobuild is disabled', () => {
    const docker = new Docker(serverlessMock, config);
    expect(() => docker.buildImage()).toThrow(
      new Error(
        'Docker image jammymalina/aws-lambda-rust-runtime:nightly cannot be found, make sure the configuration is' +
          ' correct or enable autobuild'
      )
    );
  });

  it('should build the image, autobuild is enabled', () => {
    const autobuildConfig = {
      ...config,
      docker: {
        ...config.docker,
        autobuild: {
          ...config.docker.autobuild,
          enabled: true,
        },
      },
    };
    const docker = new Docker(serverlessMock, autobuildConfig);
    docker.buildImage();
    expect(spawn).toHaveBeenCalledWith('docker', [
      'build',
      '--build-arg',
      'RUST_VERSION=1.0.0',
      '-t',
      'jammymalina/aws-lambda-rust-runtime:nightly',
      'https://github.com/jammymalina/aws-lambda-rust-runtime',
    ]);
  });

  it('should get the docker args', () => {
    const docker = new Docker(serverlessMock, config);
    const args = docker.getDockerArgs(['valhalla', 'doomhalla']);
    expect(args).toEqual(['valhalla', 'doomhalla', 'ba', 'dum', 'ts', 'jammymalina/aws-lambda-rust-runtime:nightly']);
  });

  it('should get build the rust app', () => {
    const docker = new Docker(serverlessMock, config);
    docker.build(['rum', 'voom']);
    expect(spawn).toHaveBeenCalledWith('docker', [
      'rum',
      'voom',
      'ba',
      'dum',
      'ts',
      'jammymalina/aws-lambda-rust-runtime:nightly',
    ]);
  });
});
