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

  it('should get function rust configuration', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getFuncRustConfig({ rust: { a: 1, b: 2 } })).toEqual({ a: 1, b: 2 });
  });

  it('should return empty rust function configuration, function does not have rust property', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.getFuncRustConfig({ a: 1, b: 2 })).toEqual({});
  });

  it('should determine that this is a release build', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.isReleaseBuild({})).toBeTruthy();
  });

  it('should determine that this is a development build', () => {
    const builder = new CargoBuilder(serverlessMock, config);
    expect(builder.isReleaseBuild({ rust: { profile: 'dev' } })).toBeFalsy();
  });

  it('should determine get artifact path', () => {});
});
