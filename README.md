# serverless-rust-runtime

[<img alt="github" src="https://img.shields.io/badge/github-jammymalina/serverless--rust--runtime-8da0cb?style=for-the-badge&labelColor=555555&logo=github">](https://github.com/jammymalina/serverless-rust-runtime)
[<img alt="npmjs.com" src="https://img.shields.io/npm/v/serverless-rust-runtime?logo=npm&style=for-the-badge&color=fc8d62&logo=npm">](https://www.npmjs.com/package/serverless-rust-runtime)
[<img alt="build status" src="https://img.shields.io/github/workflow/status/jammymalina/serverless-rust-runtime/CI?style=for-the-badge">](https://github.com/jammymalina/serverless-rust-runtime/actions?query=branch%3Amaster)
[<img alt="sonar status" src="https://img.shields.io/sonar/quality_gate/jammymalina_serverless-rust-runtime?logo=sonarcloud&server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge">](https://sonarcloud.io/dashboard?id=jammymalina_serverless-rust-runtime)

A serverless plugin to build and deploy Rust aws lambda functions. The plugin assumes you are targeting [custom AWS Lambda runtime](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html). It is **strongly** recommended to write your Rust lambda functions using [lambda-runtime](https://crates.io/crates/lambda_runtime) library. The library ensures that the code compiles to deployable Rust runtime.

The plugin fully manages compilation, packaging and deployment of the Rust Lambda function(s). You can just sit back, relax and concentrate on writing your function code. The artifact is built inside a Docker container. You can enable non-containerized build which is **not** advised.

## Prerequites

Installed and running Docker

## Configuration

You can adjust the default settings either on global or function level. The function configuration takes precedence over global configuration.

```yaml
service: book-management-api

custom:
  rust:
    version: stable
    profile: release

plugins:
  - serverless-rust-runtime

provider:
  name: aws
  runtime: rust
  httpApi:
    payload: '2.0'

package:
  individually: true

functions:
  apiBookHandlerFunction:
    handler: api_handler
    events:
      - httpApi:
          method: GET
          path: /book/{id}
```

### Minimal Configuration

```yaml
service: book-management-api

plugins:
  - serverless-rust-runtime

provider:
  name: aws
  runtime: rust
  httpApi:
    payload: '2.0'

package:
  individually: true

functions:
  apiBookHandlerFunction:
    handler: api_handler
    events:
      - httpApi:
          method: GET
          path: /book/{id}
```
