const SchemaKeywords = {
  REQUIRED: 'required',
  ADDITIONAL_PROPERTIES: 'additionalProperties',
};

const DEFAULT_PROPERTY = 'property';

class SchemaPropertyExtractor {
  extractStateFromSchemaError(err) {
    switch (err.keyword) {
      case SchemaKeywords.REQUIRED:
        return 'missing';
      case SchemaKeywords.ADDITIONAL_PROPERTIES:
        return 'extra';
      default:
        return 'invalid';
    }
  }

  extractPropertyFromSchemaError(err) {
    switch (err.keyword) {
      case SchemaKeywords.REQUIRED:
        return this.extractRequiredProperty(err);
      case SchemaKeywords.ADDITIONAL_PROPERTIES:
        return this.extractAdditionalProp(err);
      default:
        return this.extractDefaultProperty(err);
    }
  }

  extractRequiredProperty(err) {
    const { params } = err;
    return params.missingProperty || DEFAULT_PROPERTY;
  }

  extractAdditionalProp(err) {
    const { params } = err;
    return params.additionalProperty || DEFAULT_PROPERTY;
  }

  extractDefaultProperty(err) {
    if (err.dataPath === '.') {
      return 'root';
    }
    return err.dataPath.substring(err.dataPath.lastIndexOf('.') + 1).trim() || DEFAULT_PROPERTY;
  }
}

module.exports = SchemaPropertyExtractor;
