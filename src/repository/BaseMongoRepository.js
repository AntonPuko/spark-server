// @flow

import { ObjectId } from 'mongodb';

const deepToObjectIdCast = (node: any): any => {
  Object.keys(node).forEach((key: string) => {
    if (node[key] === Object(node[key])) {
      deepToObjectIdCast(node[key]);
    }
    if (key === '_id') {
      // eslint-disable-next-line
      node[key] = new ObjectId(node[key]);
    }
  });
  return node;
};

class BaseMongoRepository {
  insertOne = async (
    collectionName: string,
    entity: Object,
  ): Promise<*> => await this.__runForCollection(
    collectionName,
    async (collection: Object): Promise<*> => {
      const insertResult = await collection.insertOne(entity);
      return this.__translateResultItem(insertResult.ops[0]);
    },
  );

  find = async (
    collectionName: string,
    query: Object,
    ...args: Array<any>
  ): Promise<*> => await this.__runForCollection(
    collectionName,
    async (collection: Object): Promise<*> => {
      const resultItems = await collection.find(
        this.__translateQuery(query),
        ...args,
      ).toArray();

      return resultItems.map(this.__translateResultItem);
    },
  );

  findAndModify = async (
    collectionName: string,
    query: Object,
    sort: ?Array<any>,
    updateQuery: Object,
    ...args: Array<any>
  ): Promise<*> => await this.__runForCollection(
    collectionName,
    async (collection: Object): Promise<*> => {
      const modifyResult = await collection.findAndModify(
        this.__translateQuery(query),
        sort,
        this.__translateQuery(updateQuery),
        ...args,
      );
      return this.__translateResultItem(modifyResult.value);
    },
  );

  findOne = async (
    collectionName: string,
    query: Object,
    ...args: Array<any>
  ): Promise<*> => await this.__runForCollection(
    collectionName,
    async (collection: Object): Promise<*> => {
      const resultItem = await collection.findOne(
        this.__translateQuery(query),
        ...args,
      );
      return this.__translateResultItem(resultItem);
    },
  );

  remove = async (
    collectionName: string,
    id: string,
  ): Promise<*> => await this.__runForCollection(
    collectionName,
    async (collection: Object): Promise<*> =>
      await collection.remove(this.__translateQuery({ _id: id })),
  );

  __runForCollection = async (
    collectionName: string,
    callback: (collection: Object) => Promise<*>,
  ): Promise<*> => {
    throw new Error(`Not implemented ${callback.toString()}`);
  };

  __translateQuery = (query: Object): Object => deepToObjectIdCast(query);

  __translateResultItem = (item: ?Object): ?Object => {
    if (!item) {
      return null;
    }
    const { _id, ...otherProps } = item;
    return { ...otherProps, id: _id.toString() };
  };
}

export default BaseMongoRepository;