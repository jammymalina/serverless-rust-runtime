'use strict';

const SchemaErrorTransformer = require('../src/SchemaErrorTransformer');

describe('SchemaErrorTransformer', () => {
  const messagePrefix = 'Error occured';

  it('should transform error default prop name', () => {
    const err = {
      keyword: 'type',
      dataPath: '.',
      schemaPath: '#/properties/updatedAt/type',
      params: {
        type: 'string',
      },
      message: 'should be string',
    };

    const transformer = new SchemaErrorTransformer();
    const transformedErr = transformer.transform(err, messagePrefix);
    expect(transformedErr.message).toBe('Error occured root is invalid');
  });

  it('should transform error', () => {
    const err = {
      keyword: 'type',
      dataPath: '.updatedAt',
      schemaPath: '#/properties/updatedAt/type',
      params: {
        type: 'string',
      },
      message: 'should be string',
    };

    const transformer = new SchemaErrorTransformer();
    const transformedErr = transformer.transform(err, messagePrefix);
    expect(transformedErr.message).toBe('Error occured updatedAt is invalid');
  });

  it('should transform error, default prop name', () => {
    const err = {
      keyword: 'required',
      dataPath: '.',
      schemaPath: '#/properties/boom/required',
      params: {},
      message: 'is required',
    };

    const transformer = new SchemaErrorTransformer();
    const transformedErr = transformer.transform(err, messagePrefix);
    expect(transformedErr.message).toBe('Error occured property is missing');
  });

  it('should transform error', () => {
    const err = {
      keyword: 'required',
      dataPath: '.',
      schemaPath: '#/properties/boom/required',
      params: {
        missingProperty: 'boom',
      },
      message: 'is required',
    };

    const transformer = new SchemaErrorTransformer();
    const transformedErr = transformer.transform(err, messagePrefix);
    expect(transformedErr.message).toBe('Error occured boom is missing');
  });

  it('should transform error', () => {
    const err = {
      keyword: 'randomkeyword',
      dataPath: '.updatedAt',
      schemaPath: '#/properties/updatedAt/type',
      params: {
        type: 'string',
      },
      message: 'should be string',
    };

    const transformer = new SchemaErrorTransformer();
    const transformedErr = transformer.transform(err, messagePrefix);
    expect(transformedErr.message).toBe('Error occured updatedAt is invalid');
  });
});
