const SchemaPropertyExtractor = require('./SchemaPropertyExtractor');

class SchemaErrorTransformer {
  constructor() {
    this.propertyExtractor = new SchemaPropertyExtractor();
  }

  transform(err, messagePrefix) {
    const paramName = this.propertyExtractor.extractPropertyFromSchemaError(err);
    const paramErrorType = this.propertyExtractor.extractStateFromSchemaError(err);
    return new Error(`${messagePrefix} ${paramName} is ${paramErrorType}`);
  }
}

module.exports = SchemaErrorTransformer;
