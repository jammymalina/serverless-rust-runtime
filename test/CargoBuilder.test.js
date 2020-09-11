'use strict';

const CargoBuilder = require('../src/CargoBuilder');
const serverlessMock = require('./serverlessMock');

describe('CargoBuilder', () => {
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

  it('should create CargoBuilder', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder).toBeTruthy();
  });

  it('should get binary artifact information, default single binary in cargo package', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getBinaryInfo({ handler: 'our-binary-package' })).toEqual({
      binary: 'our-binary-package',
      cargoPackage: 'our-binary-package',
    });
  });

  it('should get binary artifact information, multiple binaries in the folder', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getBinaryInfo({ handler: 'our-binary-package.our-api-function' })).toEqual({
      binary: 'our-api-function',
      cargoPackage: 'our-binary-package',
    });
  });

  it('should get function rust configuration', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getFuncRustConfig({ rust: { a: 1, b: 2 } })).toEqual({ a: 1, b: 2 });
  });

  it('should return empty rust function configuration, function does not have rust property', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getFuncRustConfig({ a: 1, b: 2 })).toEqual({});
  });

  it('should return function rust profile', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getProfile({ rust: { profile: 'func' } })).toBe('func');
  });

  it('should return global configuration rust profile, function rust config is undefined', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getProfile({})).toBe('release');
  });

  it('should determine that this is a release build', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.isReleaseBuild({})).toBeTruthy();
  });

  it('should determine that this is a development build', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.isReleaseBuild({ rust: { profile: 'dev' } })).toBeFalsy();
  });

  it('should get artifact path, global rust profile', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getArtifactPath({ handler: 'our-binary-package.our-api-function' })).toBe(
      'target/lambda/release/our-api-function.zip'
    );
  });

  it('should get artifact path, function rust profile', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getArtifactPath({ rust: { profile: 'dev' }, handler: 'our-binary-package.our-api-function' })).toBe(
      'target/lambda/debug/our-api-function.zip'
    );
  });

  it('should determine that the build is local, local build is set in function rust config', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.isLocalBuild({ rust: { localBuild: true } })).toBeTruthy();
  });

  it('should determine that the build is local, global rust config', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.isLocalBuild({})).toBeFalsy();
  });

  it('should get cargo flags from function rust config', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getCargoFlags({ rust: { cargoFlags: 'bam dam' } })).toBe('bam dam');
  });

  it('should get cargo flags from global rust config', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getCargoFlags({})).toBe('');
  });

  it('should get local artifact dir, function rust config', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getLocalArtifactDir({ rust: { profile: 'dev' } })).toBe('target/lambda/debug');
  });

  it('should get local artifact dir, global rust config', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getLocalArtifactDir({})).toBe('target/lambda/release');
  });
});
