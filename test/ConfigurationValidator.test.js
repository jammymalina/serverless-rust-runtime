'use strict';

const ConfigurationValidator = require('../src/ConfigurationValidator');

describe('ConfigurationValidator', () => {
  it('should create ConfigurationValidator', () => {
    const validator = new ConfigurationValidator();
    expect(validator).toBeTruthy();
  });

  it('should validate configuration, config is valid', () => {
    const validator = new ConfigurationValidator();
    const config = {
      srcPath: '',
      rust: { version: 'stable', profile: 'release', cargoFlags: '', localBuild: false },
      docker: {
        repository: 'jammymalina/aws-lambda-rust-runtime',
        autobuild: {
          enabled: false,
          githubUrl: 'https://github.com/jammymalina/aws-lambda-rust-runtime',
          buildArgs: '',
        },
        cli: 'docker',
        args: '',
      },
    };
    expect(() => validator.validate(config)).not.toThrow();
  });

  it('should validate configuration, config is valid, semantic rust version', () => {
    const validator = new ConfigurationValidator();
    const config = {
      srcPath: '',
      rust: { version: '1.0', profile: 'release', cargoFlags: '', localBuild: false },
      docker: {
        repository: 'jammymalina/aws-lambda-rust-runtime',
        tag: 'nightly',
        autobuild: {
          enabled: false,
          githubUrl: 'https://github.com/jammymalina/aws-lambda-rust-runtime',
          buildArgs: '',
        },
        cli: 'docker',
        args: '',
      },
    };
    expect(() => validator.validate(config)).not.toThrow();
  });

  it('should validate configuration, rust version is invalid', () => {
    const validator = new ConfigurationValidator();
    const config = {
      srcPath: '',
      rust: { version: '-1.0.0', profile: 'release', cargoFlags: '', localBuild: false },
      docker: {
        repository: 'jammymalina/aws-lambda-rust-runtime',
        tag: undefined,
        autobuild: {
          enabled: false,
          githubUrl: 'https://github.com/jammymalina/aws-lambda-rust-runtime',
          buildArgs: '',
        },
        cli: 'docker',
        args: '',
      },
    };
    expect(() => validator.validate(config)).toThrow(new Error('Configuration is invalid: version is invalid'));
  });

  it('should validate configuration, profile is invalid', () => {
    const validator = new ConfigurationValidator();
    const config = {
      srcPath: '',
      rust: { version: '1.0.0', profile: 'deve', cargoFlags: '', localBuild: false },
      docker: {
        repository: 'jammymalina/aws-lambda-rust-runtime',
        tag: undefined,
        autobuild: {
          enabled: false,
          githubUrl: 'https://github.com/jammymalina/aws-lambda-rust-runtime',
          buildArgs: '',
        },
        cli: 'docker',
        args: '',
      },
    };
    expect(() => validator.validate(config)).toThrow(new Error('Configuration is invalid: profile is invalid'));
  });
});
