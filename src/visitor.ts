import { indent, DeclarationBlock, AvoidOptionalsConfig } from '@graphql-codegen/visitor-plugin-common';
import { NestJSGraphQLPluginConfig } from './config';
import autoBind from 'auto-bind';
import {
  FieldDefinitionNode,
  EnumTypeDefinitionNode,
  InputValueDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  TypeNode,
  GraphQLEnumType,
  InputObjectTypeDefinitionNode,
  StringValueNode,
  UnionTypeDefinitionNode,
} from 'graphql';
import {
  TypeScriptOperationVariablesToObject,
  TypeScriptPluginParsedConfig,
  TsVisitor,
} from '@graphql-codegen/typescript';

export type DecoratorConfig = {
  type: string;
  interface: string;
  field: string;
  input: string;
  arguments: string;
};

export interface NestJSGraphQLPluginParsedConfig extends TypeScriptPluginParsedConfig {
  avoidOptionals: AvoidOptionalsConfig;
  constEnums: boolean;
  enumsAsTypes: boolean;
  immutableTypes: boolean;
  maybeValue: string;
  decoratorName: DecoratorConfig;
}

const MAYBE_REGEX = /^Maybe<(.*?)>$/;
const ARRAY_REGEX = /^Array<(.*?)>$/;
const SCALAR_REGEX = /^Scalars\['(.*?)'\]$/;
const GRAPHQL_TYPES = ['Query', 'Mutation', 'Subscription'];
const SCALARS = ['ID', 'String', 'Boolean', 'Int', 'Float'];
const NESTJS_GRAPHQL_SCALARS = ['ID', 'Int', 'Float'];

interface Type {
  type: string;
  isNullable: boolean;
  isArray: boolean;
  isScalar: boolean;
}

export class NestJSGraphQLVisitor<
  TRawConfig extends NestJSGraphQLPluginConfig = NestJSGraphQLPluginConfig,
  TParsedConfig extends NestJSGraphQLPluginParsedConfig = NestJSGraphQLPluginParsedConfig
> extends TsVisitor<TRawConfig, TParsedConfig> {
  constructor(schema: GraphQLSchema, pluginConfig: TRawConfig, additionalConfig: Partial<TParsedConfig> = {}) {
    super(schema, pluginConfig, {
      avoidOptionals: pluginConfig.avoidOptionals || false,
      maybeValue: pluginConfig.maybeValue || 'T | null',
      constEnums: pluginConfig.constEnums || false,
      enumsAsTypes: pluginConfig.enumsAsTypes || false,
      immutableTypes: pluginConfig.immutableTypes || false,
      declarationKind: {
        type: 'class',
        interface: 'abstract class',
        arguments: 'class',
        input: 'class',
        scalar: 'type',
      },
      decoratorName: {
        type: 'ObjectType',
        interface: 'InterfaceType',
        arguments: 'ArgsType',
        field: 'Field',
        input: 'InputType',
        ...(pluginConfig.decoratorName || {}),
      },
      ...(additionalConfig || {}),
    } as TParsedConfig);
    autoBind(this);

    const enumNames = Object.values(schema.getTypeMap())
      .map(type => (type instanceof GraphQLEnumType ? type.name : undefined))
      .filter((t): t is string => t !== undefined);
    this.setArgumentsTransformer(
      new TypeScriptOperationVariablesToObject(
        this.scalars,
        this.convertName,
        this.config.avoidOptionals.object || false,
        this.config.immutableTypes,
        null,
        enumNames,
        this.config.enumPrefix,
        this.config.enumValues,
      ),
    );
    this.setDeclarationBlockConfig({
      enumNameValueSeparator: ' =',
    });
  }

  ObjectTypeDefinition(node: ObjectTypeDefinitionNode, key: number | string, parent: any): string {
    const typeDecorator = this.config.decoratorName.type;
    const originalNode = parent[key] as ObjectTypeDefinitionNode;

    let declarationBlock = this.getObjectTypeDeclarationBlock(node, originalNode);
    if (!GRAPHQL_TYPES.includes((node.name as unknown) as string)) {
      // Add ObjectType decorator
      const decoratorOptions: string[] = [];
      const interfaces = originalNode.interfaces!.map(i => this.convertName(i));

      if (interfaces.length > 1) {
        decoratorOptions.push(`implements: [${interfaces.join(', ')}]`);
      } else if (interfaces.length === 1) {
        decoratorOptions.push(`implements: ${interfaces[0]}`);
      }

      if (node.description != null) {
        decoratorOptions.push('description: `' + this.formatDescription(node.description) + '`');
      }

      declarationBlock = declarationBlock.withComment('');
      declarationBlock = declarationBlock.withDecorator(`@GQL.${typeDecorator}({ ${decoratorOptions.join(', ')} })`);
    }

    return [
      // change "extends" to "implements", as JS only allows single-class inheritance
      declarationBlock.string.replace(/class ([^ ]+) extends /, 'class $1 implements '),
      this.buildArgumentsBlock(originalNode),
    ]
      .filter(f => f)
      .join('\n\n');
  }

  InputObjectTypeDefinition(node: InputObjectTypeDefinitionNode): string {
    const typeDecorator = this.config.decoratorName.input;
    const decoratorOptions: string[] = [];

    let declarationBlock = this.getInputObjectDeclarationBlock(node);

    if (node.description != null) {
      decoratorOptions.push('description: `' + this.formatDescription(node.description) + '`');
    }

    // Add InputType decorator
    declarationBlock = declarationBlock.withComment('');
    declarationBlock = declarationBlock.withDecorator(`@GQL.${typeDecorator}({ ${decoratorOptions.join(', ')} })`);

    return declarationBlock.string;
  }

  getArgumentsObjectDeclarationBlock(
    node: InterfaceTypeDefinitionNode | ObjectTypeDefinitionNode,
    name: string,
    field: FieldDefinitionNode,
  ): DeclarationBlock {
    return new DeclarationBlock(this._declarationBlockConfig)
      .export()
      .asKind(this._parsedConfig.declarationKind.arguments || 'type')
      .withName(this.convertName(name))
      .withComment(node.description ?? null)
      .withBlock((field.arguments ?? []).map(argument => this.InputValueDefinition(argument)).join('\n'));
  }

  getArgumentsObjectTypeDefinition(
    node: InterfaceTypeDefinitionNode | ObjectTypeDefinitionNode,
    name: string,
    field: FieldDefinitionNode,
  ): string {
    const typeDecorator = this.config.decoratorName.arguments;

    let declarationBlock = this.getArgumentsObjectDeclarationBlock(node, name, field);

    // Add Args decorator
    declarationBlock = declarationBlock.withDecorator(`@GQL.${typeDecorator}()`);

    return declarationBlock.string;
  }

  InterfaceTypeDefinition(node: InterfaceTypeDefinitionNode, key: number | string, parent: any): string {
    const interfaceDecorator = this.config.decoratorName.interface;
    const originalNode = parent[key] as InterfaceTypeDefinitionNode;

    const declarationBlock = this.getInterfaceTypeDeclarationBlock(node, originalNode).withDecorator(
      `@GQL.${interfaceDecorator}()`,
    );

    return [declarationBlock.string, this.buildArgumentsBlock(originalNode)].filter(f => f).join('\n\n');
  }

  buildTypeString(type: Type): string {
    if (type.isScalar) {
      type.type = `Scalars['${type.type}']`;
    }
    if (type.isArray) {
      type.type = `Array<${type.type}>`;
    }
    if (type.isNullable) {
      type.type = `Maybe<${type.type}>`;
    }

    return type.type;
  }

  parseType(rawType: TypeNode | string): Type {
    const typeNode = rawType as TypeNode;
    if (typeNode.kind === 'NamedType') {
      return {
        type: typeNode.name.value,
        isNullable: true,
        isArray: false,
        isScalar: SCALARS.includes(typeNode.name.value),
      };
    } else if (typeNode.kind === 'NonNullType') {
      return {
        ...this.parseType(typeNode.type),
        isNullable: false,
      };
    } else if (typeNode.kind === 'ListType') {
      return {
        ...this.parseType(typeNode.type),
        isArray: true,
        isNullable: true,
      };
    }

    const isNullable = !!(rawType as string).match(MAYBE_REGEX);
    const nonNullableType = (rawType as string).replace(MAYBE_REGEX, '$1');
    const isArray = !!nonNullableType.match(ARRAY_REGEX);
    const singularType = nonNullableType.replace(ARRAY_REGEX, '$1');
    const isScalar = !!singularType.match(SCALAR_REGEX);
    const type = singularType.replace(SCALAR_REGEX, (match, type) => {
      if (NESTJS_GRAPHQL_SCALARS.includes(type)) {
        // This is a NestJSGraphQL type
        return `GQL.${type}`;
      } else if (global[type]) {
        // This is a JS native type
        return type;
      } else if (this.scalars[type]) {
        // This is a type specified in the configuration
        return this.scalars[type];
      } else {
        throw new Error(`Unknown scalar type ${type}`);
      }
    });

    return { type, isNullable, isArray, isScalar };
  }

  FieldDefinition(node: FieldDefinitionNode, key?: number | string, parent?: any): string {
    const fieldDecorator = this.config.decoratorName.field;
    const typeString = (node.type as any) as string;

    const type = this.parseType(typeString);
    const maybeType = type.type.match(MAYBE_REGEX);
    const arrayType = `[${maybeType ? this.clearOptional(type.type) : type.type}]`;

    const decoratorOptions = [`nullable: ${type.isNullable ? 'true' : 'false'}`];

    if (node.description != null) {
      decoratorOptions.push('description: `' + this.formatDescription(node.description) + '`');
    }

    const decorator =
      '\n' +
      indent(
        `@GQL.${fieldDecorator}(_type => ${type.isArray ? arrayType : type.type}, { ${decoratorOptions.join(', ')} })`,
      ) +
      '\n';

    return decorator + indent(`${this.config.immutableTypes ? 'readonly ' : ''}${node.name}!: ${typeString};`);
  }

  InputValueDefinition(node: InputValueDefinitionNode, key?: number | string, parent?: any): string {
    const fieldDecorator = this.config.decoratorName.field;
    const rawType = node.type as TypeNode | string;

    const type = this.parseType(rawType);
    const nestJSGraphQLType =
      type.isScalar && NESTJS_GRAPHQL_SCALARS.includes(type.type) ? `GQL.${type.type}` : type.type;

    const decoratorOptions = [`nullable: ${type.isNullable ? 'true' : 'false'}`];

    if (node.description != null) {
      decoratorOptions.push('description: `' + this.formatDescription(node.description) + '`');
    }

    const decorator =
      '\n' +
      indent(
        `@GQL.${fieldDecorator}(_type => ${
          type.isArray ? `[${nestJSGraphQLType}]` : nestJSGraphQLType
        }, { ${decoratorOptions.join(', ')} })`,
      ) +
      '\n';

    const nameString = node.name.kind ? node.name.value : node.name;
    const typeString = (rawType as TypeNode).kind ? this.buildTypeString(type) : (rawType as string);

    return decorator + indent(`${this.config.immutableTypes ? 'readonly ' : ''}${nameString}!: ${typeString};`);
  }

  EnumTypeDefinition(node: EnumTypeDefinitionNode): string {
    return (
      super.EnumTypeDefinition(node) +
      `GQL.registerEnumType(${this.convertName(node)}, { name: '${this.convertName(node)}' });\n`
    );
  }

  UnionTypeDefinition(node: UnionTypeDefinitionNode, key: string | number | undefined, parent: any): string {
    return (
      super.UnionTypeDefinition(node, key, parent) +
      `export const ${this.convertName(node)} = GQL.createUnionType({
  name: '${this.convertName(node)}',
  types: () => [${node
    .types!.map(type => this.clearOptional(typeof type === 'string' ? ((type as unknown) as string) : type.name.value))
    .join(', ')}],
});\n`
    );
  }

  protected clearOptional(str: string): string {
    if (str.startsWith('Maybe')) {
      return str.replace(/Maybe<(.*?)>$/, '$1');
    }

    return str;
  }

  protected formatDescription(description: string | StringValueNode): string {
    if (typeof description !== 'string') {
      description = description.value;
    }

    return description.replace(/([\\$`])/g, '\\$1');
  }
}
