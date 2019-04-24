/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { GraphQLScalarType, Kind } from 'graphql';

import { Events } from '../../lib/events';
import { AppResolverOf, ChildResolverOf } from '../../lib/framework';
import { createOptions } from '../../utils/build_query/create_options';
import { QuerySourceResolver } from '../sources/resolvers';
import { SourceResolvers } from '../types';

type QueryEventsResolver = ChildResolverOf<
  AppResolverOf<SourceResolvers.EventsResolver>,
  QuerySourceResolver
>;

type QueryTimelineResolver = ChildResolverOf<
  AppResolverOf<SourceResolvers.TimelineResolver>,
  QuerySourceResolver
>;

type QueryTimelineDetailsResolver = ChildResolverOf<
  AppResolverOf<SourceResolvers.TimelineDetailsResolver>,
  QuerySourceResolver
>;

export interface EventsResolversDeps {
  events: Events;
}

export const createEventsResolvers = (
  libs: EventsResolversDeps
): {
  Source: {
    Events: QueryEventsResolver;
    Timeline: QueryTimelineResolver;
    TimelineDetails: QueryTimelineDetailsResolver;
  };
} => ({
  Source: {
    async Events(source, args, { req }, info) {
      const options = createOptions(source, args, info);
      return libs.events.getEvents(req, options);
    },
    async Timeline(source, args, { req }, info) {
      const options = createOptions(source, args, info, 'edges.node.ecs.');
      return libs.events.getTimelineData(req, {
        ...options,
        fieldRequested: args.fieldRequested,
      });
    },
    async TimelineDetails(source, args, { req }, info) {
      return libs.events.getTimelineDetails(req, {
        indexName: args.indexName,
        eventId: args.eventId,
      });
    },
  },
});

/*
 *  serialize: gets invoked when serializing the result to send it back to a client.
 *
 *  parseValue: gets invoked to parse client input that was passed through variables.
 *
 *  parseLiteral: gets invoked to parse client input that was passed inline in the query.
 */

const esValueScalar = new GraphQLScalarType({
  name: 'DetailItemValue',
  description: 'Represents value in detail item from the timeline who wants to more than one type',
  serialize(value): string {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.STRING:
        return ast.value;
      case Kind.LIST:
        return ast.values;
      case Kind.OBJECT:
        return ast.fields;
    }
    return null;
  },
});

export const createEsValueResolvers = () => ({ EsValue: esValueScalar });