import '@graphql-codegen/testing';
import { Types } from '@graphql-codegen/plugin-helpers';
import { buildSchema } from 'graphql';
import { plugin } from '../src/index';

describe('nestjs-graphql', () => {
  it('should generate @nestjs/graphql import', async () => {
    const schema = buildSchema(/* GraphQL */ `
      scalar A
    `);
    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.prepend).toContainEqual(`import * as GQL from '@nestjs/graphql';`);
  });

  it('should generate @nestjs/graphql enums', async () => {
    const schema = buildSchema(/* GraphQL */ `
      "custom enum"
      enum MyEnum {
        "this is a"
        A
        "this is b"
        B
      }
    `);
    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
      /** custom enum */
      export enum MyEnum {
        /** this is a */
        A = 'A',
        /** this is b */
        B = 'B'
      }
      GQL.registerEnumType(MyEnum, { name: 'MyEnum' });`);
  });

  it('should generate @nestjs/graphql classes for object types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      "object A"
      type A {
        id: ID
        mandatoryId: ID!
        str: String
        mandatoryStr: String!
        bool: Boolean
        mandatoryBool: Boolean!
        int: Int
        mandatoryInt: Int!
        float: Float
        mandatoryFloat: Float!
        b: B
        mandatoryB: B!
        arr: [String!]
        mandatoryArr: [String!]!
      }
      type B {
        id: ID
      }
    `);

    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
      @GQL.ObjectType({ description: \`object A\` })
      export class A {
        __typename?: 'A';

        @GQL.Field(_type => GQL.ID, { nullable: true })
        id!: Maybe<Scalars['ID']>;

        @GQL.Field(_type => GQL.ID, { nullable: false })
        mandatoryId!: Scalars['ID'];

        @GQL.Field(_type => String, { nullable: true })
        str!: Maybe<Scalars['String']>;

        @GQL.Field(_type => String, { nullable: false })
        mandatoryStr!: Scalars['String'];

        @GQL.Field(_type => Boolean, { nullable: true })
        bool!: Maybe<Scalars['Boolean']>;

        @GQL.Field(_type => Boolean, { nullable: false })
        mandatoryBool!: Scalars['Boolean'];

        @GQL.Field(_type => GQL.Int, { nullable: true })
        int!: Maybe<Scalars['Int']>;

        @GQL.Field(_type => GQL.Int, { nullable: false })
        mandatoryInt!: Scalars['Int'];

        @GQL.Field(_type => GQL.Float, { nullable: true })
        float!: Maybe<Scalars['Float']>;

        @GQL.Field(_type => GQL.Float, { nullable: false })
        mandatoryFloat!: Scalars['Float'];

        @GQL.Field(_type => B, { nullable: true })
        b!: Maybe<B>;

        @GQL.Field(_type => B, { nullable: false })
        mandatoryB!: FixDecorator<B>;

        @GQL.Field(_type => [String], { nullable: true })
        arr!: Maybe<Array<Scalars['String']>>;

        @GQL.Field(_type => [String], { nullable: false })
        mandatoryArr!: Array<Scalars['String']>;
      }
    `);
  });

  it('should generate @nestjs/graphql classes implementing @nestjs/graphql interfaces for object types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Test implements ITest {
        id: ID
        mandatoryStr: String!
      }
      interface ITest {
        id: ID
      }
    `);

    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
      @GQL.ObjectType({ implements: ITest })
      export class Test implements ITest {
        __typename?: 'Test';

        @GQL.Field(_type => GQL.ID, { nullable: true })
        id!: Maybe<Scalars['ID']>;

        @GQL.Field(_type => String, { nullable: false })
        mandatoryStr!: Scalars['String'];
      }
    `);

    expect(result.content).toBeSimilarStringTo(`
      @GQL.InterfaceType()
      export abstract class ITest {

        @GQL.Field(_type => GQL.ID, { nullable: true })
        id!: Maybe<Scalars['ID']>;
      }
    `);
  });

  it('should generate @nestjs/graphql classes for input types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      "an input type for A"
      input A {
        id: ID
        mandatoryId: ID!
        str: String
        mandatoryStr: String!
        bool: Boolean
        mandatoryBool: Boolean!
        int: Int
        mandatoryInt: Int!
        float: Float
        mandatoryFloat: Float!
        b: B
        mandatoryB: B!
        arr: [String!]
        mandatoryArr: [String!]!
      }
      input B {
        id: ID
      }
    `);

    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
      @GQL.InputType({ description: \`an input type for A\` })
      export class A {

        @GQL.Field(_type => GQL.ID, { nullable: true })
        id!: Maybe<Scalars['ID']>;

        @GQL.Field(_type => GQL.ID, { nullable: false })
        mandatoryId!: Scalars['ID'];

        @GQL.Field(_type => String, { nullable: true })
        str!: Maybe<Scalars['String']>;

        @GQL.Field(_type => String, { nullable: false })
        mandatoryStr!: Scalars['String'];

        @GQL.Field(_type => Boolean, { nullable: true })
        bool!: Maybe<Scalars['Boolean']>;

        @GQL.Field(_type => Boolean, { nullable: false })
        mandatoryBool!: Scalars['Boolean'];

        @GQL.Field(_type => GQL.Int, { nullable: true })
        int!: Maybe<Scalars['Int']>;

        @GQL.Field(_type => GQL.Int, { nullable: false })
        mandatoryInt!: Scalars['Int'];

        @GQL.Field(_type => GQL.Float, { nullable: true })
        float!: Maybe<Scalars['Float']>;

        @GQL.Field(_type => GQL.Float, { nullable: false })
        mandatoryFloat!: Scalars['Float'];

        @GQL.Field(_type => B, { nullable: true })
        b!: Maybe<B>;

        @GQL.Field(_type => B, { nullable: false })
        mandatoryB!: FixDecorator<B>;

        @GQL.Field(_type => [String], { nullable: true })
        arr!: Maybe<Array<Scalars['String']>>;

        @GQL.Field(_type => [String], { nullable: false })
        mandatoryArr!: Array<Scalars['String']>;
      };

      @GQL.InputType({  })
      export class B {

        @GQL.Field(_type => GQL.ID, { nullable: true })
        id!: Maybe<Scalars['ID']>;
      };
    `);
  });

  it('should generate an args type', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Mutation {
        test(
          id: ID
          mandatoryId: ID!
          str: String
          mandatoryStr: String!
          bool: Boolean
          mandatoryBool: Boolean!
          int: Int
          mandatoryInt: Int!
          float: Float
          mandatoryFloat: Float!
          b: B
          mandatoryB: B!
          arr: [String!]
          mandatoryArr: [String!]!
        ): Boolean!
      }
      input B {
        id: ID
      }
    `);

    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
      @GQL.ArgsType()
      export class MutationTestArgs {
        @GQL.Field(_type => GQL.ID, { nullable: true })
        id!: Maybe<Scalars['ID']>;

        @GQL.Field(_type => GQL.ID, { nullable: false })
        mandatoryId!: Scalars['ID'];

        @GQL.Field(_type => String, { nullable: true })
        str!: Maybe<Scalars['String']>;

        @GQL.Field(_type => String, { nullable: false })
        mandatoryStr!: Scalars['String'];

        @GQL.Field(_type => Boolean, { nullable: true })
        bool!: Maybe<Scalars['Boolean']>;

        @GQL.Field(_type => Boolean, { nullable: false })
        mandatoryBool!: Scalars['Boolean'];

        @GQL.Field(_type => GQL.Int, { nullable: true })
        int!: Maybe<Scalars['Int']>;

        @GQL.Field(_type => GQL.Int, { nullable: false })
        mandatoryInt!: Scalars['Int'];

        @GQL.Field(_type => GQL.Float, { nullable: true })
        float!: Maybe<Scalars['Float']>;

        @GQL.Field(_type => GQL.Float, { nullable: false })
        mandatoryFloat!: Scalars['Float'];

        @GQL.Field(_type => B, { nullable: true })
        b!: Maybe<B>;

        @GQL.Field(_type => B, { nullable: false })
        mandatoryB!: FixDecorator<B>;

        @GQL.Field(_type => [String], { nullable: true })
        arr!: Maybe<Array<Scalars['String']>>;

        @GQL.Field(_type => [String], { nullable: false })
        mandatoryArr!: Array<Scalars['String']>;
      }
    `);
  });

  it('should generate @nestjs/graphql types as custom types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Test {
        id: ID
        mandatoryStr: String!
      }
      interface ITest {
        id: ID
      }
    `);

    const result = (await plugin(
      schema,
      [],
      { decoratorName: { type: 'Foo', field: 'Bar', interface: 'FooBar' } },
      { outputFile: '' },
    )) as Types.ComplexPluginOutput;

    expect(result.content).toBeSimilarStringTo(`
        @GQL.Foo({  })
        export class Test {
          __typename?: 'Test';

          @GQL.Bar(_type => GQL.ID, { nullable: true })
          id!: Maybe<Scalars['ID']>;

          @GQL.Bar(_type => String, { nullable: false })
          mandatoryStr!: Scalars['String'];
        }
      `);
    expect(result.content).toBeSimilarStringTo(`
        @GQL.FooBar()
        export abstract class ITest {

          @GQL.Bar(_type => GQL.ID, { nullable: true })
          id!: Maybe<Scalars['ID']>;
        }
      `);
  });

  it('should generate custom scalar types', async () => {
    const schema = buildSchema(/* GraphQL */ `
      scalar DateTime
      type A {
        date: DateTime
        mandatoryDate: DateTime!
      }
    `);

    const result = (await plugin(
      schema,
      [],
      { scalars: { DateTime: 'Date' } },
      { outputFile: '' },
    )) as Types.ComplexPluginOutput;

    expect(result.content).toBeSimilarStringTo(`
      @GQL.ObjectType({  })
      export class A {
        __typename?: 'A';

        @GQL.Field(_type => Date, { nullable: true })
        date!: Maybe<Scalars['DateTime']>;

        @GQL.Field(_type => Date, { nullable: false })
        mandatoryDate!: Scalars['DateTime'];
      }
    `);
  });

  it('should generate @nestjs/graphql types for unions', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type A {
        flavor: String!
      }
      type B {
        color: String!
      }
      union C = A | B
    `);

    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
      export type C = A | B;
    `);
    expect(result.content).toBeSimilarStringTo(`
      export const C = GQL.createUnionType({
        name: 'C',
        types: () => [A, B],
      });
    `);
  });

  it('should fix `Maybe` only refers to a type, but is being used as a value here for array return type', async () => {
    const schema = buildSchema(/* GraphQL */ `
      type Guest {
        id: ID!
        name: String!
        phone: String!
      }
      type Query {
        guests: [Guest]
      }
    `);

    const result = await plugin(schema, [], {}, { outputFile: '' });

    expect(result.content).toBeSimilarStringTo(`
  /** All built-in and custom scalars, mapped to their actual values */
  export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
  };

  @GQL.ObjectType({  })
  export class Guest {
    __typename?: 'Guest';

    @GQL.Field(_type => GQL.ID, { nullable: false })
    id!: Scalars['ID'];

    @GQL.Field(_type => String, { nullable: false })
    name!: Scalars['String'];

    @GQL.Field(_type => String, { nullable: false })
    phone!: Scalars['String'];
  };

  export class Query {
    __typename?: 'Query';

    @GQL.Field(_type => [Guest], { nullable: true })
    guests!: Maybe<Array<Maybe<Guest>>>;
  };
  `);
  });
});
