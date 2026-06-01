// lib/searchparams.ts
import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsIsoDateTime
} from 'nuqs/server';

// Create a custom date parser by extending parseAsIsoDateTime
const parseAsNullableIsoDate = {
  ...parseAsIsoDateTime,
  parse: (value: string) => {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  },
  serialize: (value: string | null) => value || '',
  eq: (a: string | null, b: string | null) => a === b
};

// Create parser with default null value
const parseAsNullableIsoDateWithDefault = {
  ...parseAsNullableIsoDate,
  defaultValue: null as string | null,
  parseServerSide: (value: string | string[] | undefined) =>
    value === undefined
      ? null
      : parseAsNullableIsoDate.parse(Array.isArray(value) ? value[0] : value)
};

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  search: parseAsString,
  email: parseAsString,
  q: parseAsString,
  roles: parseAsString,
  limit: parseAsInteger.withDefault(10),
  startDate: parseAsNullableIsoDateWithDefault,
  endDate: parseAsNullableIsoDateWithDefault,
  status: parseAsString,
  curtainStatus: parseAsString,
  paymentStatus: parseAsString
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
