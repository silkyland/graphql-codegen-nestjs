import { DecoratorConfig } from './visitor';
import { TypeScriptPluginConfig } from '@graphql-codegen/typescript';

export interface NestJSGraphQLPluginConfig extends TypeScriptPluginConfig {
  decoratorName?: Partial<DecoratorConfig>;
}
