'use strict';

const Ajv = require('ajv');
const { semanticVersion } = require('@semantics/semantic-version');
const SchemaErrorTransformer = require('./SchemaErrorTransformer');

const DEFAULT_MESSAGE_PREFIX = 'Configuration is invalid:';

class ConfigurationValidator {
  constructor() {
    this.ajv = new Ajv();

    this.addSchemaComponent('rustVersion', this.isRustVersionValid.bind(this));

    this.schemaValidateFunction = this.ajv.compile(this.getConfigurationSchema());
    this.errorTransformer = new SchemaErrorTransformer();
  }

  isRustVersionValid(rustVersion) {
    if (['stable', 'nightly'].includes(rustVersion)) {
      return true;
    }
    return semanticVersion(rustVersion).isValid();
  }

  isValid(config) {
    return this.schemaValidateFunction(config);
  }

  validate(config) {
    if (this.isValid(config)) {
      return;
    }
    const errors = this.schemaValidateFunction.errors;
    const error = this.errorTransformer.transform(errors[0], DEFAULT_MESSAGE_PREFIX);
    throw error;
  }

  addSchemaComponent(keyword, validate) {
    this.ajv.addKeyword(keyword, {
      schema: false,
      errors: true,
      validate,
    });
  }

  getRustConfigurationSchema() {
    return {
      type: 'object',
      additionalProperties: true,
      required: ['version', 'profile', 'cargoFlags', 'localBuild'],
      properties: {
        version: {
          type: 'string',
          minLength: 1,
          rustVersion: true,
        },
        profile: {
          type: 'string',
          enum: ['dev', 'release'],
        },
        cargoFlags: {
          type: 'string',
        },
        localBuild: {
          type: 'boolean',
        },
      },
    };
  }

  getDockerConfigurationSchema() {
    return {
      type: 'object',
      additionalProperties: true,
      required: ['repository', 'autobuild', 'cli', 'args'],
      properties: {
        repository: {
          type: 'string',
          minLength: 1,
        },
        tag: {
          type: 'string',
        },
        autobuild: {
          type: 'object',
          additionalProperties: true,
          required: ['enabled', 'githubUrl', 'buildArgs'],
          properties: {
            enabled: {
              type: 'boolean',
            },
            githubUrl: {
              type: 'string',
              minLength: 1,
            },
            buildArgs: {
              type: 'string',
            },
          },
        },
      },
    };
  }

  getConfigurationSchema() {
    return {
      type: 'object',
      additionalProperties: true,
      required: ['srcPath', 'rust', 'docker'],
      properties: {
        srcPath: {
          type: 'string',
        },
        rust: this.getRustConfigurationSchema(),
        docker: this.getDockerConfigurationSchema(),
      },
    };
  }
}

module.exports = ConfigurationValidator;
