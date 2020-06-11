# graphql-codegen-nestjs

A plugin for [GraphQL Code Generator](https://github.com/dotansimha/graphql-code-generator) that produces
classes suitable for use with [@nestjs/graphql](https://github.com/nestjs/graphql) in "code first" mode.

This is based on the official [TypeGraphQL](https://graphql-code-generator.com/docs/plugins/typescript-type-graphql)
plugin but it uses decorators from @nestjs/graphql instead of type-graphql.

## Usage

Installation:

```bash
npm i -D @madsci/graphql-codegen-nestjs
```

Add the plugin to a Codegen output as `@madsci/graphql-codegen-nestjs`. Example:

```yaml
generates:
  './src/schema.ts':
    plugins:
      - '@madsci/graphql-codegen-nestjs'
      - 'typescript-operations'
```

## Configuration

Extends the `typescript` plugin so it supports all of the config parameters of that plugin, plus:

#### `decoratorName`

type: `Partial`

Allows the decorators for each type to be customised. Example:

```yaml
config:
  decoratorName:
    type: 'ObjectType'
    interface: 'InterfaceType'
    arguments: 'ArgsType'
    field: 'Field'
    input: 'InputType'
```
